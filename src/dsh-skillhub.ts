import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-settings'
import type { SkillProviderControl } from '@deepseek-ai/dsh-skill'
import z from '@deepseek-ai/schemastery'
import { McpHub } from './mcp.ts'
import { installMcpVisibility } from './mcp-runtime.ts'
import { SkillHub } from './hub.ts'
import { handleSkillHubHttp } from './http.ts'
import { createSkillHubProvider } from './provider.ts'

export const name = 'dsh-skillhub'
export const inject = ['skills', 'webServer', 'connection', 'tools', 'agents']

const NS = 'dsh-skillhub'

export interface Config {
  enabled?: boolean
}

export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
})

function env(name: string): string | undefined {
  const value = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name]
  return value
}

function defaultAgentHome(): string {
  return join(env('DSH_AGENTS_HOME') ?? join(homedir(), '.agents'), 'skills')
}

function defaultDshHome(): string {
  return join(env('DSH_HOME') ?? join(homedir(), '.dsh'), 'skills')
}

function defaultStoreDir(): string {
  return join(env('DSH_HOME') ?? join(homedir(), '.dsh'), 'skillhub')
}

export function apply(ctx: Context, config: Config) {
  console.log('[my-plugins/dsh-skillhub] loaded')
  let source = () => config
  ctx.inject(['settings'], settingsCtx => {
    settingsCtx.settings.installSection(ctx, NS, Config, config, {
      setSource: current => { source = current },
      onChange: () => { void source() },
    })
  })
  const hub = new SkillHub({
    agentHome: defaultAgentHome(),
    dshHome: defaultDshHome(),
    storeDir: defaultStoreDir(),
  })
  let control: SkillProviderControl | undefined
  ctx.skills.registerProvider((next) => {
    control = next
    return createSkillHubProvider(hub)
  })
  const mcp = installMcpVisibility(ctx, new McpHub({ storeDir: defaultStoreDir() }))
  const invalidate = () => { control?.invalidate() }
  const connection = ctx.get('connection') as {
    requestRejection: (request: Parameters<ReturnType<typeof handleSkillHubHttp>>[0]) => 401 | 403 | undefined
  } | undefined
  const handler = handleSkillHubHttp(
    hub,
    invalidate,
    request => connection === undefined ? 401 : connection.requestRejection(request),
    mcp,
  )
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/skillhub',
    handler: (req, res) => { void handler(req, res) },
  }), 'dsh-skillhub http')
  ctx.effect(() => {
    const onCreated = ctx.on.bind(ctx) as (event: string, listener: (payload: unknown) => void) => () => void
    return onCreated('agent/created', payload => {
      attachAgentProvider(hub, payload)
    })
  }, 'dsh-skillhub agent provider')
  console.log('[my-plugins/dsh-skillhub] http /skillhub')
}

function attachAgentProvider(
  hub: SkillHub,
  payload: unknown,
): void {
  if (typeof payload !== 'object' || payload === null) return
  const agent = (payload as { agent?: { ctx?: Context; session?: { header?: { cwd?: string } } } }).agent
  if (agent === undefined) return
  const agentCtx = agent.ctx
  if (agentCtx === undefined) return
  try {
    const skills = agentCtx.get('skills') as Context['skills'] | undefined
    if (skills === undefined || typeof skills.registerProvider !== 'function') return
    agentCtx.effect(
      () => skills.registerProvider(() => createSkillHubProvider(hub)),
      'dsh-skillhub agent provider',
    )
  } catch (error) {
    console.error('[dsh-skillhub] agent provider failed', error)
  }
}
