import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { SkillCandidate, SkillDefinition, SkillLookupOptions, SkillProvider, SkillViewOptions } from '@deepseek-ai/dsh-skill'
import type { Catalog, ManagedSkill } from './catalog.ts'
import type { SkillHub } from './hub.ts'

const PROVIDER = 'skillhub'
const USER_DSH_RANK = 350
const USER_AGENTS_RANK = 351
const HOST_OCCUPY_RANK = 340

export function sessionIdFromScope(scope: unknown): string | undefined {
  if (typeof scope !== 'object' || scope === null) return undefined
  const agent = scope as { session?: { id?: string; header?: { id?: string } } }
  if (typeof agent.session?.id === 'string') return agent.session.id
  if (typeof agent.session?.header?.id === 'string') return agent.session.header.id
  return undefined
}

function toCandidate(skill: ManagedSkill): SkillCandidate {
  const source = skill.home === 'dsh' ? 'user-dsh' : skill.home === 'host' ? 'bundled' : 'user-agents'
  const rank = skill.home === 'dsh'
    ? USER_DSH_RANK
    : skill.home === 'host'
      ? HOST_OCCUPY_RANK
      : USER_AGENTS_RANK
  return {
    name: skill.name,
    description: skill.description,
    ...skill.whenToUse !== undefined ? { whenToUse: skill.whenToUse } : {},
    invocation: skill.invocation,
    source,
    provider: PROVIDER,
    rank,
    locator: { path: skill.path, directory: skill.directory },
    path: skill.path,
    resourceBase: { kind: 'directory', path: skill.directory },
  }
}

export function providerSkillsFromCatalog(catalog: Catalog): ManagedSkill[] {
  const byName = new Map<string, ManagedSkill[]>()
  for (const skill of catalog.inventory) {
    const list = byName.get(skill.name) ?? []
    list.push(skill)
    byName.set(skill.name, list)
  }
  const selected: ManagedSkill[] = []
  for (const group of byName.values()) {
    const on = group.filter(skill => skill.gate === 'on')
    const pool = on.length > 0 ? on : group
    pool.sort((left, right) => Number(left.home !== 'dsh') - Number(right.home !== 'dsh'))
    const pick = pool[0]
    if (pick === undefined) continue
    selected.push(pick)
  }
  return selected
}

export function createSkillHubProvider(hub: SkillHub): SkillProvider {
  return {
    name: PROVIDER,
    async list(options: SkillLookupOptions): Promise<SkillCandidate[]> {
      try {
        const view = options as SkillViewOptions
        const sessionId = sessionIdFromScope(view.scope)
        const query: { sessionId?: string; folder?: string } = {}
        if (sessionId !== undefined) query.sessionId = sessionId
        if (options.cwd !== undefined) query.folder = resolve(options.cwd)
        return providerSkillsFromCatalog(hub.catalog(query)).map(toCandidate)
      } catch (error) {
        console.error('[dsh-skillhub] list failed', error)
        return []
      }
    },
    async get(candidate: SkillCandidate): Promise<SkillDefinition | undefined> {
      const locator = candidate.locator as { path?: string; directory?: string }
      if (typeof locator.path !== 'string') return undefined
      let content: string
      try {
        content = readFileSync(locator.path, 'utf8')
      } catch {
        return undefined
      }
      const split = content.startsWith('---') ? content.indexOf('\n---', 3) : -1
      const body = split >= 0 ? content.slice(split + 4).replace(/^\r?\n/, '') : content
      return {
        name: candidate.name,
        description: candidate.description,
        ...candidate.whenToUse !== undefined ? { whenToUse: candidate.whenToUse } : {},
        invocation: candidate.invocation,
        source: candidate.source,
        provider: PROVIDER,
        resourceBase: { kind: 'directory', path: locator.directory ?? dirname(locator.path) },
        path: locator.path,
        content: body,
      }
    },
  }
}
