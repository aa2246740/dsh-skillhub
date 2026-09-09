export type LayerName = 'global' | 'project' | 'session'
export type GateSource = LayerName
export type HomeKind = 'agent' | 'dsh'
export type Gate = 'on' | 'off'
export type GroupGate = 'on' | 'off' | 'mixed'

export type PackLink =
  | { kind: 'symlink'; target: string }
  | { kind: 'directory' }
  | { kind: 'broken-symlink'; target: string }

export type BrokenReason = {
  kind: 'missing-symlink-target' | 'unreadable-skill' | 'invalid-frontmatter' | 'invalid-name' | 'empty-pack'
  target?: string
  message?: string
  raw?: string
}

export type CatalogPayload = {
  offered: { id: string; name: string; home: HomeKind }[]
  tree: HomeRoot[]
  collisions: { name: string; skills: string[] }[]
  broken: { path: string; reason: BrokenReason }[]
  layer?: LayerName
  legacySessionSnapshot: boolean
}

export type HomeRoot = {
  kind: 'home'
  home: HomeKind
  path: string
  children: CatalogNode[]
}

export type SkillRef = {
  id: string
  name: string
  description?: string
  gate: Gate
  source: GateSource
  collision: boolean
}

export type CatalogNode =
  | {
    kind: 'pack'
    id: string
    name: string
    home: HomeKind
    path: string
    link: PackLink
    gate: GroupGate
    skill: SkillRef | null
    children: GroupChild[]
  }
  | {
    kind: 'root-skill'
    id: string
    name: string
    description?: string
    home: HomeKind
    path: string
    gate: Gate
    source: GateSource
    collision: boolean
  }
  | {
    kind: 'broken'
    name: string
    path: string
    home: HomeKind
    reason: BrokenReason
  }

export type GroupChild =
  | {
    kind: 'group'
    name: string
    rel: string
    home: HomeKind
    path: string
    gate: GroupGate
    skill: SkillRef | null
    children: GroupChild[]
  }
  | {
    kind: 'broken'
    name: string
    path: string
    home: HomeKind
    reason: BrokenReason
  }

const BASE = '/skillhub'

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  const trimmed = text.trimStart().toLowerCase()
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
    throw new Error('The SkillHub host API is not on this Web session yet. Retry after DSH reloads the SkillHub server plugin.')
  }
  if (!response.ok) {
    try {
      const parsed: unknown = JSON.parse(text)
      if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
        const error = (parsed as { error: unknown }).error
        if (typeof error === 'string' && error !== '') throw new Error(error)
      }
    } catch (caught) {
      if (caught instanceof Error && caught.message !== text) throw caught
    }
    throw new Error(text === '' ? `HTTP ${String(response.status)}` : text)
  }
  return JSON.parse(text) as unknown
}

export async function fetchCatalog(
  sessionId?: string,
  folder?: string,
  layer?: LayerName,
): Promise<CatalogPayload> {
  const query = new URLSearchParams()
  if (sessionId !== undefined && sessionId !== '') query.set('sessionId', sessionId)
  if (folder !== undefined && folder !== '') query.set('folder', folder)
  if (layer !== undefined) query.set('layer', layer)
  const response = await fetch(`${BASE}/catalog?${query.toString()}`)
  return await readJson(response) as CatalogPayload
}

export async function postCatalog(path: string, body: Record<string, unknown>): Promise<CatalogPayload> {
  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await readJson(response)
  if (typeof payload === 'object' && payload !== null && 'offered' in payload) {
    return payload as CatalogPayload
  }
  if (
    typeof payload === 'object'
    && payload !== null
    && 'catalog' in payload
    && typeof (payload as { catalog: unknown }).catalog === 'object'
    && (payload as { catalog: object }).catalog !== null
  ) {
    return (payload as { catalog: CatalogPayload }).catalog
  }
  throw new Error('SkillHub returned an unexpected response')
}
