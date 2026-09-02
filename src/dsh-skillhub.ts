import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import type { SkillProviderControl } from '@deepseek-ai/dsh-skill'
import z from '@deepseek-ai/schemastery'
import type { HostSkillNote } from './catalog.ts'
import { SkillHub } from './hub.ts'
import { handleSkillHubHttp } from './http.ts'
import { createSkillHubProvider } from './provider.ts'

export const name = 'dsh-skillhub'
export const inject = ['skills', 'webServer']

const NS = settingsNamespace('dsh-skillhub')

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
  installSettingsSection(ctx, NS, Config, config, {
    setSource: current => { source = current },
    onChange: () => { void source() },
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
  const invalidate = () => { control?.invalidate() }
  const notesFrom = (listed: Awaited<ReturnType<Context['skills']['list']>>): HostSkillNote[] => {
    const skip = new Set(['skillhub', 'filesystem', 'local'])
    const notes: HostSkillNote[] = []
    for (const skill of listed) {
      if (skip.has(skill.provider)) continue
      const directory = skill.resourceBase?.kind === 'directory' ? skill.resourceBase.path : ''
      const path = directory === '' ? '' : join(directory, 'SKILL.md')
      notes.push({
        name: skill.name,
        description: skill.description,
        provider: skill.provider,
        path,
        directory,
        ...skill.whenToUse !== undefined ? { whenToUse: skill.whenToUse } : {},
      })
    }
    return notes
  }
  const snapshotHost = async (): Promise<void> => {
    try {
      hub.noteHostSkills(notesFrom(await ctx.skills.list({})))
    } catch (error) {
      console.error('[dsh-skillhub] host skill snapshot failed', error)
    }
  }
  ctx.effect(() => {
    const timer = setTimeout(() => {
      void snapshotHost().then(() => invalidate())
    }, 0)
    return () => clearTimeout(timer)
  }, 'dsh-skillhub host snapshot')
  const handler = handleSkillHubHttp(hub, invalidate, snapshotHost)
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/skillhub',
    handler: (req, res) => { void handler(req, res) },
  }), 'dsh-skillhub http')
  ctx.effect(() => {
    const onCreated = ctx.on.bind(ctx) as (event: string, listener: (payload: unknown) => void) => () => void
    return onCreated('agent/created', payload => {
      attachAgentProvider(hub, payload, async listed => {
        hub.noteHostSkills(notesFrom(listed))
        invalidate()
      })
    })
  }, 'dsh-skillhub agent provider')
  console.log('[my-plugins/dsh-skillhub] http /skillhub')
}

function attachAgentProvider(
  hub: SkillHub,
  payload: unknown,
  onListed: (listed: Awaited<ReturnType<Context['skills']['list']>>) => Promise<void>,
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
    const cwd = agent.session?.header?.cwd
    void skills.list(cwd === undefined ? {} : { cwd }).then(onListed).catch(error => {
      console.error('[dsh-skillhub] agent skill snapshot failed', error)
    })
  } catch (error) {
    console.error('[dsh-skillhub] agent provider failed', error)
  }
}
