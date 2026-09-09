import type { Context } from '@deepseek-ai/cordis'
import { McpHub, attributeMcpTool, computeDenyList, type McpCatalogQuery } from './mcp.ts'

interface Tools {
  schemas(scope?: unknown): { name: string }[]
  get(name: string, scope?: unknown): unknown
  restrict(filter: { deny: string[] }): () => void
  guard(fn: (exec: { name: string }) => string | undefined): () => void
}
interface Agent {
  id: string
  ctx: Context
  session?: { id?: string; header?: { id?: string; cwd?: string } }
}

/** Uses public Cordis fiber configuration; only serverName leaves this function. */
export function liveMcpServers(ctx: Context): string[] {
  const names = new Set<string>()
  for (const runtime of ctx.registry.values()) {
    if (runtime.name !== 'mcp-client') continue
    for (const fiber of runtime.fibers) {
      if (fiber.uid === null) continue
      const name: unknown = fiber.config?.serverName
      if (typeof name === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(name)) names.add(name)
    }
  }
  return [...names].sort()
}

export function installMcpVisibility(ctx: Context, hub: McpHub, discover = () => liveMcpServers(ctx)) {
  const tools = ctx.get('tools') as Tools | undefined
  if (!tools) throw new Error('SkillHub MCP requires tools service')
  const agents = new Map<Agent, { lift: () => void; guard: () => void; signature: string; dispose: () => void }>()
  let refreshing = false
  let disposed = false
  const names = () => tools.schemas().map(t => t.name)
  const identity = (agent: Agent) => ({ sessionId: agent.session?.id ?? agent.session?.header?.id ?? agent.id, folder: agent.session?.header?.cwd })
  const problematic = (server: string, servers: string[]) => {
    if (servers.some(other => other !== server && (server.startsWith(`${other}__`) || other.startsWith(`${server}__`)))) return true
    for (const agent of agents.keys()) {
      for (const tool of (agent.ctx.get('tools') as Tools).schemas(agent)) {
        if (tool.name.startsWith(`mcp__${server}__`) && tools.get(tool.name) !== tools.get(tool.name, agent)) return true
      }
    }
    return false
  }
  const refresh = () => {
    if (refreshing || disposed) return
    refreshing = true
    try {
      const servers = discover()
      const all = names()
      for (const [agent, state] of agents) {
        const id = identity(agent)
        const denied = computeDenyList(all, hub.hiddenServers(id.sessionId, id.folder, servers), servers).sort()
        const signature = JSON.stringify(denied)
        if (signature === state.signature) continue
        const scoped = agent.ctx.get('tools') as Tools
        const next = denied.length ? scoped.restrict({ deny: denied }) : () => {}
        const previous = state.lift
        state.lift = next
        state.signature = signature
        previous()
      }
    } finally { refreshing = false }
  }
  const attach = (agent: Agent) => {
    if (disposed || !agent?.ctx || agents.has(agent)) return
    const scoped = agent.ctx.get('tools') as Tools | undefined
    if (!scoped) return
    const state = { lift: () => {}, guard: () => {}, signature: '[]', dispose: () => {} }
    agents.set(agent, state)
    state.guard = scoped.guard(exec => {
      const owner = attributeMcpTool(exec.name, discover())
      const id = identity(agent)
      return owner && hub.effectiveGate(owner, id.sessionId, id.folder).gate === 'off'
        ? 'This MCP service is hidden by SkillHub for this session.' : undefined
    })
    state.dispose = agent.ctx.effect(() => () => { agents.delete(agent); state.lift(); state.guard() }, 'skillhub MCP agent cleanup')
    refresh()
  }
  const on = ctx.on.bind(ctx) as (event: string, fn: (...args: any[]) => void) => () => void
  const offChange = on('tools/change', refresh)
  const offCreated = on('agent/created', ({ agent }: { agent: Agent }) => attach(agent))
  const registry = ctx.get('agents') as { list(): Agent[] } | undefined
  for (const agent of registry?.list() ?? []) attach(agent)
  ctx.effect(() => () => {
    disposed = true
    offChange(); offCreated()
    for (const state of agents.values()) { state.dispose(); state.lift(); state.guard() }
    agents.clear()
  }, 'skillhub MCP visibility')
  return {
    attach, refresh,
    catalog(query: McpCatalogQuery = {}) {
      const servers = discover()
      const result = hub.catalog(query, names(), servers)
      return { ...result, servers: result.servers.map(server => ({ ...server, supported: !problematic(server.name, servers) })) }
    },
    mutate(query: McpCatalogQuery, server: string, onValue?: boolean) {
      const servers = discover()
      if (!servers.includes(server)) throw new Error('MCP service is no longer registered; refresh the list')
      if (onValue === false && problematic(server, servers)) throw new Error('Cannot fully hide this service: ambiguous namespace or scope-local tools')
      const request = { ...query, layer: query.layer ?? 'global', server }
      if (onValue === undefined) hub.inherit(request)
      else hub.toggle({ ...request, on: onValue })
      refresh()
      return this.catalog(query)
    },
  }
}
