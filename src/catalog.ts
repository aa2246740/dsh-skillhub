import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync } from 'node:fs'
import { basename, dirname, join, posix, relative, sep } from 'node:path'

const IGNORE = new Set(['.git', 'node_modules', '.system'])
const HOST_SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isHostSkillName(name: string): boolean {
  return HOST_SKILL_NAME.test(name)
}

export type HomeKind = 'agent' | 'dsh'
export type Gate = 'on' | 'off'
export type GroupGate = 'on' | 'off' | 'mixed'
export type AbsolutePath = string
export type SkillId = string & { readonly __brand: 'SkillId' }
export type PackId = string & { readonly __brand: 'PackId' }

export type VisibilityDocument = {
  readonly gates: Readonly<Record<string, Gate>>
}

export const VisibilityDocument = {
  empty(): VisibilityDocument {
    return { gates: {} }
  },
  off(ids: readonly SkillId[]): VisibilityDocument {
    const gates: Record<string, Gate> = {}
    for (const id of ids) gates[id] = 'off'
    return { gates }
  },
  on(ids: readonly SkillId[]): VisibilityDocument {
    const gates: Record<string, Gate> = {}
    for (const id of ids) gates[id] = 'on'
    return { gates }
  },
} as const

export function skillId(home: HomeKind, relPath: string): SkillId {
  return `${home}:${relPath.split(sep).join('/')}` as SkillId
}

export function packId(home: HomeKind, name: string): PackId {
  return `${home}:${name}` as PackId
}

export function parseSkillId(id: SkillId): { home: HomeKind; relPath: string } {
  const split = id.indexOf(':')
  const home = id.slice(0, split) as HomeKind
  return { home, relPath: id.slice(split + 1) }
}

export type BrokenReason =
  | { readonly kind: 'missing-symlink-target'; readonly target: string }
  | { readonly kind: 'unreadable-skill'; readonly message: string }
  | { readonly kind: 'invalid-frontmatter'; readonly message: string }
  | { readonly kind: 'invalid-name'; readonly raw: string }
  | { readonly kind: 'empty-pack' }

export interface BrokenEntry {
  readonly home: HomeKind
  readonly path: AbsolutePath
  readonly reason: BrokenReason
}

export interface OfferedSkill {
  readonly id: SkillId
  readonly name: string
  readonly description: string
  readonly whenToUse?: string
  readonly home: HomeKind
  readonly path: AbsolutePath
  readonly directory: AbsolutePath
  readonly invocation: { readonly modelInvocable: boolean; readonly userInvocable: boolean }
  readonly content: string
}

export interface ManagedSkill extends OfferedSkill {
  readonly gate: Gate
}

export interface Collision {
  readonly name: string
  readonly skills: readonly SkillId[]
}

export interface SkillNode {
  readonly kind: 'skill'
  readonly id: SkillId
  readonly name: string
  readonly description: string
  readonly home: HomeKind
  readonly path: AbsolutePath
  readonly gate: Gate
  readonly collision: boolean
}

export interface BrokenNode {
  readonly kind: 'broken'
  readonly home: HomeKind
  readonly name: string
  readonly path: AbsolutePath
  readonly reason: BrokenReason
}

export interface GroupNode {
  readonly kind: 'group'
  readonly home: HomeKind
  readonly name: string
  readonly rel: string
  readonly path: AbsolutePath
  readonly gate: GroupGate
  readonly skill: SkillNode | null
  readonly children: readonly FolderChild[]
}

export type FolderChild = GroupNode | BrokenNode

export interface PackNode {
  readonly kind: 'pack'
  readonly id: PackId
  readonly home: HomeKind
  readonly name: string
  readonly path: AbsolutePath
  readonly link: { kind: 'symlink'; target: string } | { kind: 'directory' } | { kind: 'broken-symlink'; target: string }
  readonly gate: GroupGate
  readonly skill: SkillNode | null
  readonly children: readonly FolderChild[]
}

export interface RootSkillNode {
  readonly kind: 'root-skill'
  readonly id: SkillId
  readonly name: string
  readonly description: string
  readonly home: HomeKind
  readonly path: AbsolutePath
  readonly gate: Gate
  readonly collision: boolean
}

export type CatalogNode = PackNode | RootSkillNode | BrokenNode

export interface HomeRoot {
  readonly kind: 'home'
  readonly home: HomeKind
  readonly path: AbsolutePath
  readonly children: readonly CatalogNode[]
}

export interface Catalog {
  readonly offered: readonly OfferedSkill[]
  readonly inventory: readonly ManagedSkill[]
  readonly tree: readonly HomeRoot[]
  readonly collisions: readonly Collision[]
  readonly broken: readonly BrokenEntry[]
}

export interface ResolveInput {
  readonly agentHome: AbsolutePath
  readonly dshHome: AbsolutePath
  readonly global?: VisibilityDocument
  readonly project?: VisibilityDocument
  readonly session?: VisibilityDocument
}

type ParsedSkill = {
  name: string
  description: string
  whenToUse?: string
  modelInvocable: boolean
  userInvocable: boolean
  content: string
}

type Leaf = {
  id: SkillId
  home: HomeKind
  relPath: string
  path: AbsolutePath
  directory: AbsolutePath
  parsed: ParsedSkill
}

function posixRel(from: string, to: string): string {
  return relative(from, to).split(sep).join('/')
}

function parseFrontmatter(text: string): { fields: Record<string, string>; body: string } | undefined {
  if (!text.startsWith('---')) return undefined
  const end = text.indexOf('\n---', 3)
  if (end < 0) return undefined
  const raw = text.slice(3, end).replace(/^\r?\n/, '')
  const body = text.slice(end + 4).replace(/^\r?\n/, '')
  const fields: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (match === null || match[1] === undefined || match[2] === undefined) continue
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    fields[match[1]] = value
  }
  return { fields, body }
}

function parseSkillFile(path: string): ParsedSkill | { error: BrokenReason } {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch (error) {
    return { error: { kind: 'unreadable-skill', message: String(error) } }
  }
  const parsed = parseFrontmatter(text)
  if (parsed === undefined) {
    return { error: { kind: 'invalid-frontmatter', message: 'missing yaml frontmatter' } }
  }
  const name = parsed.fields['name'] ?? ''
  const description = parsed.fields['description'] ?? ''
  if (name === '' || description === '') {
    return { error: { kind: 'invalid-frontmatter', message: 'name and description are required' } }
  }
  const disableModel = parsed.fields['disable-model-invocation']
  const userInvocableField = parsed.fields['user-invocable']
  return {
    name,
    description,
    ...parsed.fields['whenToUse'] !== undefined ? { whenToUse: parsed.fields['whenToUse'] } : {},
    modelInvocable: disableModel !== 'true',
    userInvocable: userInvocableField !== 'false',
    content: parsed.body,
  }
}

function listEntries(dir: string): string[] {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

function gateOf(
  id: SkillId,
  input: ResolveInput,
): Gate {
  if (input.session !== undefined) {
    return input.session.gates[id] ?? 'on'
  }
  const global = input.global?.gates[id] ?? 'on'
  if (input.project === undefined) return global
  return input.project.gates[id] ?? global
}

function combineGates(gates: Gate[]): GroupGate {
  if (gates.length === 0) return 'off'
  const hasOn = gates.some(gate => gate === 'on')
  const hasOff = gates.some(gate => gate === 'off')
  if (hasOn && hasOff) return 'mixed'
  return hasOn ? 'on' : 'off'
}

function collectGates(node: FolderChild | PackNode): Gate[] {
  const own = node.kind === 'broken' ? [] : node.skill === null ? [] : [node.skill.gate]
  const nested = node.kind === 'broken' ? [] : node.children.flatMap(collectGates)
  return [...own, ...nested]
}

function walkGroup(
  home: HomeKind,
  homeRoot: string,
  dir: string,
  leaves: Leaf[],
  broken: BrokenEntry[],
): FolderChild {
  const rel = posixRel(homeRoot, dir)
  const skillPath = join(dir, 'SKILL.md')
  let skill: SkillNode | null = null
  if (existsSync(skillPath) && lstatSync(skillPath).isFile()) {
    const parsed = parseSkillFile(skillPath)
    if ('error' in parsed) {
      broken.push({ home, path: skillPath, reason: parsed.error })
    } else {
      const id = skillId(home, posix.join(rel, 'SKILL.md'))
      leaves.push({
        id,
        home,
        relPath: posix.join(rel, 'SKILL.md'),
        path: skillPath,
        directory: dir,
        parsed,
      })
      skill = {
        kind: 'skill',
        id,
        name: parsed.name,
        description: parsed.description,
        home,
        path: skillPath,
        gate: 'on',
        collision: false,
      }
    }
  }
  const children: FolderChild[] = []
  for (const name of listEntries(dir).sort()) {
    if (IGNORE.has(name) || name === 'SKILL.md') continue
    const child = join(dir, name)
    let stat
    try {
      stat = lstatSync(child)
    } catch (error) {
      broken.push({ home, path: child, reason: { kind: 'unreadable-skill', message: String(error) } })
      children.push({
        kind: 'broken',
        home,
        name,
        path: child,
        reason: { kind: 'unreadable-skill', message: String(error) },
      })
      continue
    }
    if (stat.isDirectory() || stat.isSymbolicLink()) {
      if (stat.isSymbolicLink() && !existsSync(child)) {
        let target = ''
        try { target = readlinkSync(child) } catch { target = child }
        const reason: BrokenReason = { kind: 'missing-symlink-target', target }
        broken.push({ home, path: child, reason })
        children.push({ kind: 'broken', home, name, path: child, reason })
        continue
      }
      if (!lstatSync(child).isDirectory() && !existsSync(join(child, 'SKILL.md'))) continue
      children.push(walkGroup(home, homeRoot, child, leaves, broken))
    }
  }
  const node: GroupNode = {
    kind: 'group',
    home,
    name: basename(dir),
    rel,
    path: dir,
    gate: 'off',
    skill,
    children,
  }
  return { ...node, gate: combineGates(collectGates(node)) }
}

function walkHome(home: HomeKind, homeRoot: string, leaves: Leaf[], broken: BrokenEntry[]): CatalogNode[] {
  if (!existsSync(homeRoot)) {
    return []
  }
  const children: CatalogNode[] = []
  for (const name of listEntries(homeRoot).sort()) {
    if (IGNORE.has(name)) continue
    const path = join(homeRoot, name)
    let stat
    try {
      stat = lstatSync(path)
    } catch (error) {
      const reason: BrokenReason = { kind: 'unreadable-skill', message: String(error) }
      broken.push({ home, path, reason })
      children.push({ kind: 'broken', home, name, path, reason })
      continue
    }
    if (stat.isFile() && name.endsWith('.md')) {
      const parsed = parseSkillFile(path)
      if ('error' in parsed) {
        broken.push({ home, path, reason: parsed.error })
        children.push({ kind: 'broken', home, name, path, reason: parsed.error })
        continue
      }
      const id = skillId(home, name)
      leaves.push({
        id,
        home,
        relPath: name,
        path,
        directory: homeRoot,
        parsed,
      })
      children.push({
        kind: 'root-skill',
        id,
        name: parsed.name,
        description: parsed.description,
        home,
        path,
        gate: 'on',
        collision: false,
      })
      continue
    }
    if (stat.isDirectory() || stat.isSymbolicLink()) {
      if (stat.isSymbolicLink() && !existsSync(path)) {
        let target = ''
        try { target = readlinkSync(path) } catch { target = path }
        const reason: BrokenReason = { kind: 'missing-symlink-target', target }
        broken.push({ home, path, reason })
        children.push({
          kind: 'broken',
          home,
          name,
          path,
          reason,
        })
        continue
      }
      let link: PackNode['link'] = { kind: 'directory' }
      if (stat.isSymbolicLink()) {
        let target = path
        try { target = readlinkSync(path) } catch { /* keep path */ }
        link = { kind: 'symlink', target }
      }
      const walked = walkGroup(home, homeRoot, path, leaves, broken)
      if (walked.kind === 'broken') {
        children.push(walked)
        continue
      }
      const pruned = pruneGroup(walked)
      if (pruned === null) {
        const skillPath = join(path, 'SKILL.md')
        const parseFail = broken.find(entry => entry.path === skillPath)
        const reason: BrokenReason = parseFail?.reason ?? { kind: 'empty-pack' }
        if (parseFail === undefined) broken.push({ home, path, reason })
        children.push({ kind: 'broken', home, name, path, reason })
        continue
      }
      const pack: PackNode = {
        kind: 'pack',
        id: packId(home, name),
        home,
        name,
        path,
        link,
        gate: pruned.gate,
        skill: pruned.skill,
        children: pruned.children,
      }
      children.push(pack)
    }
  }
  return regroupByOrigin(children, homeRoot)
}

function applyGatesToTree(
  nodes: readonly CatalogNode[],
  collisions: ReadonlySet<string>,
  input: ResolveInput,
): CatalogNode[] {
  return nodes.map(node => applyGatesToNode(node, collisions, input))
}

function applyGatesToNode(node: CatalogNode, collisions: ReadonlySet<string>, input: ResolveInput): CatalogNode {
  if (node.kind === 'broken') return node
  if (node.kind === 'root-skill') {
    return {
      ...node,
      gate: gateOf(node.id, input),
      collision: collisions.has(node.id),
    }
  }
  const skill = node.skill === null
    ? null
    : {
        ...node.skill,
        gate: gateOf(node.skill.id, input),
        collision: collisions.has(node.skill.id),
      }
  const children = node.children.map(child => {
    if (child.kind === 'broken') return child
    const next = applyGatesToNode(
      { ...child, kind: 'pack', id: packId(child.home, child.name), link: { kind: 'directory' } },
      collisions,
      input,
    )
    if (next.kind !== 'pack') return child
    const group: GroupNode = {
      kind: 'group',
      home: next.home,
      name: next.name,
      rel: child.kind === 'group' ? child.rel : posixRel(dirname(node.path), next.path),
      path: next.path,
      gate: next.gate,
      skill: next.skill,
      children: next.children,
    }
    return group
  })
  const pack: PackNode = {
    ...node,
    skill,
    children,
    gate: 'off',
  }
  return { ...pack, gate: combineGates(collectGates(pack)) }
}

export function resolveCatalog(input: ResolveInput): Catalog {
  const leaves: Leaf[] = []
  const broken: BrokenEntry[] = []
  const agentChildren = walkHome('agent', input.agentHome, leaves, broken)
  const dshChildren = walkHome('dsh', input.dshHome, leaves, broken)

  const byName = new Map<string, SkillId[]>()
  for (const leaf of leaves) {
    const list = byName.get(leaf.parsed.name) ?? []
    list.push(leaf.id)
    byName.set(leaf.parsed.name, list)
  }
  const collisions: Collision[] = []
  const collisionIds = new Set<string>()
  for (const [name, skills] of byName) {
    if (skills.length < 2) continue
    collisions.push({ name, skills })
    for (const id of skills) collisionIds.add(id)
  }

  const tree: HomeRoot[] = [
    {
      kind: 'home',
      home: 'agent',
      path: input.agentHome,
      children: applyGatesToTree(agentChildren, collisionIds, input),
    },
    {
      kind: 'home',
      home: 'dsh',
      path: input.dshHome,
      children: applyGatesToTree(dshChildren, collisionIds, input),
    },
  ]

  const inventory: ManagedSkill[] = []
  for (const leaf of leaves) {
    if (!isHostSkillName(leaf.parsed.name)) continue
    const gate = gateOf(leaf.id, input)
    const invocable = gate === 'on'
    inventory.push({
      id: leaf.id,
      name: leaf.parsed.name,
      description: leaf.parsed.description,
      ...leaf.parsed.whenToUse !== undefined ? { whenToUse: leaf.parsed.whenToUse } : {},
      home: leaf.home,
      path: leaf.path,
      directory: leaf.directory,
      invocation: {
        modelInvocable: invocable && leaf.parsed.modelInvocable,
        userInvocable: invocable && leaf.parsed.userInvocable,
      },
      content: leaf.parsed.content,
      gate,
    })
  }

  return {
    offered: inventory.filter(skill => skill.gate === 'on'),
    inventory,
    tree,
    collisions,
    broken,
  }
}

function resolvedPath(path: string): string | undefined {
  try {
    if (!existsSync(path)) return undefined
    return realpathSync(path)
  } catch {
    return undefined
  }
}

function originLayout(
  packPath: string,
  homeRoot: string,
): { originName: string; originPath: string; segments: string[] } | undefined {
  const real = resolvedPath(packPath)
  if (real === undefined) return undefined
  const parts = real.split(sep).filter(part => part !== '')
  const skillsAt = parts.lastIndexOf('skills')
  if (skillsAt <= 0 || skillsAt >= parts.length - 1) return undefined
  const skillsPath = `${sep}${parts.slice(0, skillsAt + 1).join(sep)}`
  const homeReal = resolvedPath(homeRoot)
  if (homeReal !== undefined && skillsPath === homeReal) return undefined
  const originName = parts[skillsAt - 1]
  if (originName === undefined || originName.startsWith('.')) return undefined
  const originPath = `${sep}${parts.slice(0, skillsAt).join(sep)}`
  const segments = parts.slice(skillsAt + 1)
  if (segments.length === 0) return undefined
  return { originName, originPath, segments }
}

function packAsGroup(pack: PackNode, rel: string, name: string): GroupNode {
  return {
    kind: 'group',
    home: pack.home,
    name,
    rel,
    path: pack.path,
    gate: pack.gate,
    skill: pack.skill,
    children: pack.children,
  }
}

function insertOriginSkill(
  origin: { children: FolderChild[]; path: string },
  segments: string[],
  pack: PackNode,
): void {
  let parent: { children: FolderChild[]; path: string } = origin
  let prefix = ''
  for (let i = 0; i < segments.length; i += 1) {
    const name = segments[i]
    if (name === undefined) return
    const rel = prefix === '' ? name : `${prefix}/${name}`
    if (i === segments.length - 1) {
      parent.children.push(packAsGroup(pack, rel, name))
      return
    }
    let group = parent.children.find((child): child is GroupNode => child.kind === 'group' && child.rel === rel)
    if (group === undefined) {
      group = {
        kind: 'group',
        home: pack.home,
        name,
        rel,
        path: join(parent.path, name),
        gate: 'off',
        skill: null,
        children: [],
      }
      parent.children.push(group)
    }
    parent = { children: group.children as FolderChild[], path: group.path }
    prefix = rel
  }
}

function compareByName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name)
}

function finalizeFolderChild(node: FolderChild): FolderChild {
  if (node.kind === 'broken') return node
  const children = node.children.map(finalizeFolderChild).sort(compareByName)
  const next: GroupNode = { ...node, children, gate: 'off' }
  return { ...next, gate: combineGates(collectGates(next)) }
}

function regroupByOrigin(nodes: readonly CatalogNode[], homeRoot: string): CatalogNode[] {
  const leftover: CatalogNode[] = []
  const origins = new Map<string, { originName: string; originPath: string; home: HomeKind; children: FolderChild[] }>()
  for (const node of nodes) {
    if (node.kind !== 'pack') {
      leftover.push(node)
      continue
    }
    const layout = originLayout(node.path, homeRoot)
    if (layout === undefined) {
      leftover.push(node)
      continue
    }
    const key = `${node.home}:${layout.originPath}`
    let origin = origins.get(key)
    if (origin === undefined) {
      origin = {
        originName: layout.originName,
        originPath: layout.originPath,
        home: node.home,
        children: [],
      }
      origins.set(key, origin)
    }
    insertOriginSkill({ children: origin.children, path: origin.originPath }, layout.segments, node)
  }
  const originPacks: PackNode[] = []
  for (const origin of origins.values()) {
    const children = origin.children.map(finalizeFolderChild).sort(compareByName)
    const pack: PackNode = {
      kind: 'pack',
      id: packId(origin.home, origin.originName),
      home: origin.home,
      name: origin.originName,
      path: origin.originPath,
      link: { kind: 'directory' },
      gate: 'off',
      skill: null,
      children,
    }
    originPacks.push({ ...pack, gate: combineGates(collectGates(pack)) })
  }
  return [...originPacks, ...leftover].sort(compareByName)
}

function pruneGroup(node: GroupNode): GroupNode | null {
  const children: FolderChild[] = []
  for (const child of node.children) {
    if (child.kind === 'broken') {
      children.push(child)
      continue
    }
    const next = pruneGroup(child)
    if (next !== null) children.push(next)
  }
  if (node.skill === null && children.length === 0) return null
  const pruned: GroupNode = { ...node, children, gate: 'off' }
  return { ...pruned, gate: combineGates(collectGates(pruned)) }
}

export function findGroupByRel(node: PackNode | GroupNode, rel: string): PackNode | GroupNode | undefined {
  if (node.kind === 'pack' && rel === node.name) return node
  if (node.kind === 'group' && node.rel === rel) return node
  for (const child of node.children) {
    if (child.kind !== 'group') continue
    const found = findGroupByRel(child, rel)
    if (found !== undefined) return found
  }
  return undefined
}

export function descendantSkillIds(node: PackNode | GroupNode): SkillId[] {
  const ids: SkillId[] = []
  if (node.skill !== null) ids.push(node.skill.id)
  for (const child of node.children) {
    if (child.kind === 'group') ids.push(...descendantSkillIds(child))
  }
  return ids
}

export function collectSkillGates(tree: readonly HomeRoot[]): { id: SkillId; gate: Gate }[] {
  const rows: { id: SkillId; gate: Gate }[] = []
  const walk = (nodes: readonly CatalogNode[] | readonly FolderChild[]): void => {
    for (const node of nodes) {
      if (node.kind === 'root-skill') {
        rows.push({ id: node.id, gate: node.gate })
        continue
      }
      if (node.kind === 'broken') continue
      if (node.skill !== null) rows.push({ id: node.skill.id, gate: node.skill.gate })
      walk(node.children)
    }
  }
  for (const home of tree) walk(home.children)
  return rows
}

export const AGENT_HOME_DELETE_WARNING =
  'Deleting from Agent home removes this Pack for every agent on this machine, including Grok and Codex.'
