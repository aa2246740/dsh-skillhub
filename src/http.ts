import type { IncomingMessage, ServerResponse } from 'node:http'
import { AGENT_HOME_DELETE_WARNING } from './catalog.ts'
import type { Catalog, HomeKind, SkillId } from './catalog.ts'
import type { LayerName, SkillHub, ToggleTarget } from './hub.ts'

const PREFIX = '/skillhub'

function clientCatalog(catalog: Catalog) {
  return {
    offered: catalog.offered.map(skill => ({
      id: skill.id,
      name: skill.name,
      home: skill.home,
    })),
    tree: catalog.tree,
    collisions: catalog.collisions,
    broken: catalog.broken,
    agentHomeDeleteWarning: AGENT_HOME_DELETE_WARNING,
  }
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(text)
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return {}
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
  return parsed as Record<string, unknown>
}

function isLayerName(value: string | null): value is LayerName {
  return value === 'global' || value === 'project' || value === 'session'
}

function query(url: URL): { sessionId?: string; folder?: string; layer?: LayerName } {
  const sessionId = url.searchParams.get('sessionId') ?? undefined
  const folder = url.searchParams.get('folder') ?? undefined
  const layer = url.searchParams.get('layer')
  return {
    ...sessionId !== undefined && sessionId !== '' ? { sessionId } : {},
    ...folder !== undefined && folder !== '' ? { folder } : {},
    ...isLayerName(layer) ? { layer } : {},
  }
}

function isSkillIdList(value: unknown): value is SkillId[] {
  return Array.isArray(value) && value.every(id => typeof id === 'string' && id !== '')
}

function toggleTarget(body: Record<string, unknown>): ToggleTarget {
  const kind = body['kind']
  const on = body['on'] === true
  if (kind === 'all') return { kind: 'all', on }
  if (kind === 'skill' && typeof body['id'] === 'string') {
    return { kind: 'skill', id: body['id'] as SkillId, on }
  }
  if (kind === 'ids' && isSkillIdList(body['ids'])) {
    return { kind: 'ids', ids: body['ids'], on }
  }
  if (kind === 'home' && (body['home'] === 'agent' || body['home'] === 'dsh')) {
    return { kind: 'home', home: body['home'], on }
  }
  if (
    kind === 'group'
    && (body['packHome'] === 'agent' || body['packHome'] === 'dsh')
    && typeof body['packName'] === 'string'
    && typeof body['rel'] === 'string'
  ) {
    return {
      kind: 'group',
      packHome: body['packHome'],
      packName: body['packName'],
      rel: body['rel'],
      on,
    }
  }
  throw new Error('invalid toggle target')
}

export function handleSkillHubHttp(hub: SkillHub, invalidate: () => void) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try {
      const host = req.headers.host ?? '127.0.0.1'
      const url = new URL(req.url ?? '/', `http://${host}`)
      const path = url.pathname.slice(PREFIX.length) || '/'
      if (req.method === 'GET' && (path === '/catalog' || path === '/')) {
        send(res, 200, clientCatalog(hub.catalog(query(url))))
        return
      }
      if (req.method !== 'POST') {
        send(res, 405, { error: 'method not allowed' })
        return
      }
      const body = await readJson(req)
      if (path === '/toggle') {
        const layer = body['layer']
        if (layer !== 'global' && layer !== 'project' && layer !== 'session') {
          send(res, 400, { error: 'invalid layer' })
          return
        }
        const toggle: {
          layer: 'global' | 'project' | 'session'
          sessionId?: string
          folder?: string
          target: ToggleTarget
        } = { layer, target: toggleTarget(body) }
        if (typeof body['sessionId'] === 'string') toggle.sessionId = body['sessionId']
        if (typeof body['folder'] === 'string') toggle.folder = body['folder']
        const catalog = hub.toggle(toggle)
        invalidate()
        send(res, 200, clientCatalog(catalog))
        return
      }
      if (path === '/reset') {
        if (typeof body['sessionId'] !== 'string') {
          send(res, 400, { error: 'sessionId required' })
          return
        }
        const catalog = hub.resetSession(
          body['sessionId'],
          typeof body['folder'] === 'string' ? body['folder'] : undefined,
        )
        invalidate()
        send(res, 200, clientCatalog(catalog))
        return
      }
      if (path === '/promote') {
        if (typeof body['sessionId'] !== 'string' || typeof body['folder'] !== 'string') {
          send(res, 400, { error: 'sessionId and folder required' })
          return
        }
        const catalog = hub.promoteSession(body['sessionId'], body['folder'])
        invalidate()
        send(res, 200, clientCatalog(catalog))
        return
      }
      if (path === '/install') {
        if (typeof body['sourceDir'] !== 'string' || (body['home'] !== 'agent' && body['home'] !== 'dsh')) {
          send(res, 400, { error: 'sourceDir and home required' })
          return
        }
        const catalog = hub.install(body['sourceDir'], body['home'] as HomeKind)
        invalidate()
        send(res, 200, clientCatalog(catalog))
        return
      }
      if (path === '/delete') {
        if ((body['home'] !== 'agent' && body['home'] !== 'dsh') || typeof body['name'] !== 'string') {
          send(res, 400, { error: 'home and name required' })
          return
        }
        const result = hub.deletePack(
          body['home'],
          body['name'],
          typeof body['confirmPath'] === 'string' ? body['confirmPath'] : undefined,
        )
        invalidate()
        send(res, 200, { ...result, catalog: clientCatalog(result.catalog) })
        return
      }
      send(res, 404, { error: 'not found' })
    } catch (error) {
      send(res, 400, { error: String(error) })
    }
  }
}
