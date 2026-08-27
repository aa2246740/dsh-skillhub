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
  type Gate,
  type HomeKind,
  type PackNode,
  type SkillId,
  type VisibilityDocument,
} from './catalog.ts'

export type LayerName = 'global' | 'project' | 'session'

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

export type ToggleTarget =
  | { kind: 'skill'; id: SkillId; on: boolean }
  | { kind: 'group'; packHome: HomeKind; packName: string; rel: string; on: boolean }
  | { kind: 'home'; home: HomeKind; on: boolean }
  | { kind: 'ids'; ids: readonly SkillId[]; on: boolean }
  | { kind: 'all'; on: boolean }

function readDoc(path: string): VisibilityDocument {
  if (!existsSync(path)) return { gates: {} }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as { gates?: Record<string, Gate> }
    if (raw === null || typeof raw !== 'object' || raw.gates === undefined) return { gates: {} }
    return { gates: raw.gates }
  } catch {
    return { gates: {} }
  }
}

function writeDoc(path: string, doc: VisibilityDocument): void {
  mkdirSync(dirnameSafe(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify({ gates: doc.gates }, null, 2)}\n`)
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

export class SkillHub {
  constructor(readonly paths: HubPaths) {
    mkdirSync(this.paths.agentHome, { recursive: true })
    mkdirSync(this.paths.dshHome, { recursive: true })
    mkdirSync(this.paths.storeDir, { recursive: true })
  }

  private globalPath(): string {
    return join(this.paths.storeDir, 'global.json')
  }

  private projectPath(folder: string): string {
    return join(this.paths.storeDir, 'projects', `${folderKey(normalizeFolder(folder))}.json`)
  }

  private sessionPath(sessionId: string): string {
    return join(this.paths.storeDir, 'sessions', `${sessionId}.json`)
  }

  catalog(query: CatalogQuery = {}): Catalog {
    const global = readDoc(this.globalPath())
    const folder = query.folder === undefined ? undefined : normalizeFolder(query.folder)
    const project = folder === undefined ? undefined : readDoc(this.projectPath(folder))
    const layer = resolvedLayer(query)
    if (layer === 'global') {
      return resolveCatalog({
        agentHome: this.paths.agentHome,
        dshHome: this.paths.dshHome,
        global,
      })
    }
    if (layer === 'project') {
      return resolveCatalog({
        agentHome: this.paths.agentHome,
        dshHome: this.paths.dshHome,
        global,
        ...project !== undefined ? { project } : {},
      })
    }
    let session: VisibilityDocument | undefined
    if (query.sessionId !== undefined) {
      const path = this.sessionPath(query.sessionId)
      if (!existsSync(path)) {
        const preview = resolveCatalog({
          agentHome: this.paths.agentHome,
          dshHome: this.paths.dshHome,
          global,
          ...project !== undefined ? { project } : {},
        })
        const gates: Record<string, Gate> = {}
        for (const row of collectSkillGates(preview.tree)) gates[row.id] = row.gate
        writeDoc(path, { gates })
      }
      session = readDoc(path)
    }
    return resolveCatalog({
      agentHome: this.paths.agentHome,
      dshHome: this.paths.dshHome,
      global,
      ...project !== undefined ? { project } : {},
      ...session !== undefined ? { session } : {},
    })
  }

  toggle(query: { layer: LayerName; sessionId?: string; folder?: string; target: ToggleTarget }): Catalog {
    const folder = query.folder === undefined ? undefined : normalizeFolder(query.folder)
    const view: CatalogQuery = {
      layer: query.layer,
      ...query.layer === 'session' && query.sessionId !== undefined ? { sessionId: query.sessionId } : {},
      ...folder !== undefined ? { folder } : {},
    }
    const catalog = this.catalog(view)
    const target = query.target
    const ids: SkillId[] = []
    if (target.kind === 'skill') ids.push(target.id)
    else if (target.kind === 'ids') ids.push(...target.ids)
    else if (target.kind === 'all') {
      ids.push(...collectSkillGates(catalog.tree).map(row => row.id))
    } else if (target.kind === 'home') {
      const home = catalog.tree.filter(node => node.home === target.home)
      ids.push(...collectSkillGates(home).map(row => row.id))
    } else {
      const pack = findPack(catalog, target.packHome, target.packName)
      if (pack !== undefined) {
        const group = findGroupByRel(pack, target.rel)
        if (group !== undefined) ids.push(...descendantSkillIds(group))
      }
    }
    const path = query.layer === 'global'
      ? this.globalPath()
      : query.layer === 'project' && folder !== undefined
        ? this.projectPath(folder)
        : query.sessionId !== undefined
          ? this.sessionPath(query.sessionId)
          : this.globalPath()
    const current = readDoc(path)
    const gates = { ...current.gates }
    for (const id of ids) gates[id] = query.target.on ? 'on' : 'off'
    writeDoc(path, { gates })
    const next: CatalogQuery = {
      layer: query.layer,
      ...query.layer === 'session' && query.sessionId !== undefined ? { sessionId: query.sessionId } : {},
      ...folder !== undefined ? { folder } : {},
    }
    return this.catalog(next)
  }

  resetSession(sessionId: string, folder?: string): Catalog {
    const path = this.sessionPath(sessionId)
    if (existsSync(path)) unlinkSync(path)
    const next: { sessionId: string; folder?: string } = { sessionId }
    if (folder !== undefined) next.folder = folder
    return this.catalog(next)
  }

  promoteSession(sessionId: string, folder: string): Catalog {
    const session = readDoc(this.sessionPath(sessionId))
    writeDoc(this.projectPath(folder), session)
    return this.catalog({ sessionId, folder })
  }

  install(sourceDir: string, home: HomeKind): Catalog {
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
