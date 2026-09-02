import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import {
  AGENT_HOME_DELETE_WARNING,
  collectSkillGates,
  descendantSkillIds,
  findGroupByRel,
  resolveCatalog,
  type Catalog,
  type HomeKind,
  type HostSkillNote,
  type LayerGate,
  type PackNode,
  type SkillId,
  type VisibilityDocument,
  type VisibilityLayer,
} from './catalog.ts'

export type LayerName = VisibilityLayer

export type CatalogQuery = {
  readonly sessionId?: string
  readonly folder?: string
  readonly layer?: LayerName
}

export interface HubPaths {
  readonly agentHome: string
  readonly dshHome: string
  readonly storeDir: string
}

export type VisibilityTarget =
  | { readonly kind: 'skill'; readonly id: SkillId }
  | { readonly kind: 'group'; readonly packHome: HomeKind; readonly packName: string; readonly rel: string }
  | { readonly kind: 'home'; readonly home: HomeKind }
  | { readonly kind: 'ids'; readonly ids: readonly SkillId[] }
  | { readonly kind: 'all' }

export type ToggleTarget = VisibilityTarget & { readonly on: boolean }

function emptyDocument(layer: LayerName): VisibilityDocument {
  return {
    version: 2,
    default: layer === 'global' ? 'on' : 'inherit',
    gates: {},
  }
}

function parsedGates(value: unknown, layer: LayerName, path: string): Record<string, LayerGate> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid SkillHub visibility document: ${path}`)
  }
  const gates: Record<string, LayerGate> = {}
  for (const [id, gate] of Object.entries(value)) {
    if (gate !== 'on' && gate !== 'off' && !(layer !== 'global' && gate === 'inherit')) {
      throw new Error(`Invalid SkillHub visibility document: ${path}`)
    }
    gates[id] = gate
  }
  return gates
}

function legacyDefault(layer: LayerName): LayerGate {
  // Version 1 used different missing-key semantics at each layer. Preserve
  // those semantics exactly instead of trying to infer a bulk default from
  // the gates that happened to be present in the file.
  return layer === 'project' ? 'inherit' : 'on'
}

function readDoc(path: string, layer: LayerName): VisibilityDocument {
  if (!existsSync(path)) return emptyDocument(layer)
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(path, 'utf8')) as unknown
  } catch {
    throw new Error(`Invalid SkillHub visibility document: ${path}`)
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`Invalid SkillHub visibility document: ${path}`)
  }
  const object = raw as {
    version?: unknown
    default?: unknown
    gates?: unknown
    legacySnapshot?: unknown
  }
  const gates = parsedGates(object.gates, layer, path)
  if (object.version === undefined) {
    return {
      version: 2,
      default: legacyDefault(layer),
      gates,
      ...layer === 'session' ? { legacySnapshot: true } : {},
    }
  }
  if (object.version !== 2) {
    throw new Error(`Unsupported SkillHub visibility document version: ${path}`)
  }
  const defaultGate = object.default
  if (
    defaultGate !== 'on'
    && defaultGate !== 'off'
    && !(layer !== 'global' && defaultGate === 'inherit')
  ) {
    throw new Error(`Invalid SkillHub visibility document: ${path}`)
  }
  if (object.legacySnapshot !== undefined && typeof object.legacySnapshot !== 'boolean') {
    throw new Error(`Invalid SkillHub visibility document: ${path}`)
  }
  return {
    version: 2,
    default: defaultGate,
    gates,
    ...object.legacySnapshot === true ? { legacySnapshot: true } : {},
  }
}

function writeDoc(path: string, doc: VisibilityDocument): void {
  mkdirSync(dirnameSafe(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify({
    version: 2,
    default: doc.default,
    gates: doc.gates,
    ...doc.legacySnapshot === true ? { legacySnapshot: true } : {},
  }, null, 2)}\n`)
}

function dirnameSafe(path: string): string {
  const split = path.lastIndexOf('/')
  return split <= 0 ? '.' : path.slice(0, split)
}

function folderKey(folder: string): string {
  return createHash('sha256').update(folder).digest('hex').slice(0, 24)
}

function normalizeFolder(folder: string): string {
  return resolve(folder)
}

function optionalFolder(folder: string | undefined): string | undefined {
  if (folder === undefined || folder.trim() === '') return undefined
  return normalizeFolder(folder)
}

function assertSessionId(sessionId: string): void {
  if (
    sessionId.trim() === ''
    || sessionId === '.'
    || sessionId === '..'
    || sessionId.includes('/')
    || sessionId.includes('\\')
    || sessionId.includes('\0')
  ) {
    throw new Error('invalid sessionId for Session visibility')
  }
}

function resolvedLayer(query: CatalogQuery): LayerName {
  if (query.layer !== undefined) return query.layer
  if (query.sessionId !== undefined) return 'session'
  if (query.folder !== undefined) return 'project'
  return 'global'
}

function findPack(catalog: Catalog, home: HomeKind, name: string): PackNode | undefined {
  const root = catalog.tree.find(node => node.home === home)
  if (root === undefined) return undefined
  return root.children.find((node): node is PackNode => node.kind === 'pack' && node.name === name)
}

function targetIds(catalog: Catalog, target: VisibilityTarget): SkillId[] {
  if (target.kind === 'skill') return [target.id]
  if (target.kind === 'ids') return [...target.ids]
  if (target.kind === 'all') return collectSkillGates(catalog.tree).map(row => row.id)
  if (target.kind === 'home') {
    return collectSkillGates(catalog.tree.filter(node => node.home === target.home)).map(row => row.id)
  }
  const pack = findPack(catalog, target.packHome, target.packName)
  if (pack === undefined) return []
  const group = findGroupByRel(pack, target.rel)
  return group === undefined ? [] : descendantSkillIds(group)
}

export class SkillHub {
  private hostSkills: readonly HostSkillNote[] = []

  constructor(readonly paths: HubPaths) {
    mkdirSync(this.paths.agentHome, { recursive: true })
    mkdirSync(this.paths.dshHome, { recursive: true })
    mkdirSync(this.paths.storeDir, { recursive: true })
  }

  noteHostSkills(notes: readonly HostSkillNote[]): void {
    const byName = new Map(this.hostSkills.map(note => [note.name, note]))
    for (const note of notes) byName.set(note.name, note)
    this.hostSkills = [...byName.values()]
  }

  private globalPath(): string {
    return join(this.paths.storeDir, 'global.json')
  }

  private projectPath(folder: string): string {
    return join(this.paths.storeDir, 'projects', `${folderKey(normalizeFolder(folder))}.json`)
  }

  private sessionPath(sessionId: string): string {
    assertSessionId(sessionId)
    return join(this.paths.storeDir, 'sessions', `${sessionId}.json`)
  }

  private documentPath(layer: LayerName, sessionId?: string, folder?: string): string {
    if (layer === 'global') return this.globalPath()
    if (layer === 'project') {
      if (folder === undefined || folder === '') throw new Error('folder required for Project visibility')
      return this.projectPath(folder)
    }
    if (sessionId === undefined || sessionId === '') throw new Error('sessionId required for Session visibility')
    return this.sessionPath(sessionId)
  }

  catalog(query: CatalogQuery = {}): Catalog {
    const layer = resolvedLayer(query)
    const folder = optionalFolder(query.folder)
    if (layer === 'project' && folder === undefined) throw new Error('folder required for Project visibility')
    if (layer === 'session' && query.sessionId === undefined) {
      throw new Error('sessionId required for Session visibility')
    }
    const global = readDoc(this.globalPath(), 'global')
    const project = layer === 'global' || folder === undefined
      ? undefined
      : readDoc(this.projectPath(folder), 'project')
    const session = layer !== 'session' || query.sessionId === undefined
      ? undefined
      : readDoc(this.sessionPath(query.sessionId), 'session')
    const catalog = resolveCatalog({
      agentHome: this.paths.agentHome,
      dshHome: this.paths.dshHome,
      global,
      ...layer !== 'global' && project !== undefined ? { project } : {},
      ...layer === 'session' && session !== undefined ? { session } : {},
      ...this.hostSkills.length > 0 ? { hostSkills: this.hostSkills } : {},
    })
    return {
      ...catalog,
      layer,
      ...layer === 'session' && session?.legacySnapshot === true
        ? { legacySessionSnapshot: true }
        : {},
    }
  }

  toggle(query: {
    layer: LayerName
    sessionId?: string
    folder?: string
    target: ToggleTarget
  }): Catalog {
    const folder = optionalFolder(query.folder)
    const path = this.documentPath(query.layer, query.sessionId, folder)
    const catalog = this.catalog({
      layer: query.layer,
      ...query.layer === 'session' && query.sessionId !== undefined ? { sessionId: query.sessionId } : {},
      ...folder !== undefined ? { folder } : {},
    })
    const current = readDoc(path, query.layer)
    if (query.target.kind === 'all') {
      writeDoc(path, {
        version: 2,
        default: query.target.on ? 'on' : 'off',
        gates: {},
      })
    } else {
      const ids = targetIds(catalog, query.target)
      const nextGate: LayerGate = query.target.on ? 'on' : 'off'
      const gates = { ...current.gates }
      for (const id of ids) gates[id] = nextGate
      let nextDefault = current.default
      if (query.layer === 'global' && current.default === 'on' && nextGate === 'off') {
        nextDefault = 'off'
        const turningOff = new Set(ids)
        for (const skill of catalog.inventory) {
          if (skill.home === 'host') continue
          if (turningOff.has(skill.id) || gates[skill.id] !== undefined) continue
          if (skill.gate === 'on') gates[skill.id] = 'on'
        }
      }
      writeDoc(path, { ...current, default: nextDefault, gates })
    }
    return this.catalog({
      layer: query.layer,
      ...query.layer === 'session' && query.sessionId !== undefined ? { sessionId: query.sessionId } : {},
      ...folder !== undefined ? { folder } : {},
    })
  }

  inherit(query: {
    layer: LayerName
    sessionId?: string
    folder?: string
    target: VisibilityTarget
  }): Catalog {
    const folder = optionalFolder(query.folder)
    const path = this.documentPath(query.layer, query.sessionId, folder)
    const catalog = this.catalog({
      layer: query.layer,
      ...query.layer === 'session' && query.sessionId !== undefined ? { sessionId: query.sessionId } : {},
      ...folder !== undefined ? { folder } : {},
    })
    const current = readDoc(path, query.layer)
    if (query.target.kind === 'all') {
      writeDoc(path, query.layer === 'global'
        ? { version: 2, default: current.default, gates: {} }
        : emptyDocument(query.layer))
    } else {
      const gates = { ...current.gates }
      for (const id of targetIds(catalog, query.target)) {
        if (query.layer === 'global' || current.default === 'inherit') delete gates[id]
        else gates[id] = 'inherit'
      }
      writeDoc(path, { ...current, gates })
    }
    return this.catalog({
      layer: query.layer,
      ...query.layer === 'session' && query.sessionId !== undefined ? { sessionId: query.sessionId } : {},
      ...folder !== undefined ? { folder } : {},
    })
  }

  resetSession(sessionId: string, folder?: string): Catalog {
    return this.inherit({
      layer: 'session',
      sessionId,
      ...folder !== undefined ? { folder } : {},
      target: { kind: 'all' },
    })
  }

  resetProject(folder: string): Catalog {
    return this.inherit({ layer: 'project', folder, target: { kind: 'all' } })
  }

  install(sourceDir: string, home: HomeKind): Catalog {
    if (home === 'host') throw new Error('host skills cannot be installed into a home')
    const destHome = home === 'agent' ? this.paths.agentHome : this.paths.dshHome
    mkdirSync(destHome, { recursive: true })
    const name = basename(sourceDir)
    const dest = join(destHome, name)
    if (existsSync(dest)) {
      throw new Error(`Pack "${name}" already exists in ${home} home`)
    }
    symlinkSync(sourceDir, dest)
    return this.catalog({})
  }

  deletePack(home: HomeKind, name: string, confirmPath?: string): { warning?: string; catalog: Catalog } {
    if (home === 'host') throw new Error('host skills cannot be deleted from a home')
    const destHome = home === 'agent' ? this.paths.agentHome : this.paths.dshHome
    const dest = join(destHome, name)
    if (!existsSync(dest) && !lstatExists(dest)) {
      throw new Error(`Pack "${name}" is not in ${home} home`)
    }
    const warning = home === 'agent' ? AGENT_HOME_DELETE_WARNING : undefined
    const stat = lstatSync(dest)
    if (stat.isSymbolicLink()) {
      unlinkSync(dest)
    } else {
      if (confirmPath !== dest) {
        throw new Error(`Confirm the path ${dest} to delete this directory`)
      }
      rmSync(dest, { recursive: true, force: true })
    }
    const catalog = this.catalog({})
    if (warning === undefined) return { catalog }
    return { warning, catalog }
  }
}

function lstatExists(path: string): boolean {
  try {
    lstatSync(path)
    return true
  } catch {
    return false
  }
}
