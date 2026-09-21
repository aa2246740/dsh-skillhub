import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface PropagationMetadata {
  readonly defaultRevision?: number
  readonly gateRevisions?: Readonly<Record<string, number>>
}

type Layer = 'global' | 'project' | 'session'
type Gate = 'on' | 'off'
type Document = PropagationMetadata & {
  readonly default: Gate | 'inherit'
  readonly gates: Readonly<Record<string, Gate | 'inherit'>>
}

/** Legacy documents retain their current values until the next relevant write. */
export function readPropagationMetadata(raw: object, path: string): PropagationMetadata {
  const object = raw as { defaultRevision?: unknown; gateRevisions?: unknown }
  const valid = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0
  if (object.defaultRevision !== undefined && !valid(object.defaultRevision)) {
    throw new Error(`Invalid SkillHub visibility document revision: ${path}`)
  }
  const revisions: Record<string, number> = Object.create(null) as Record<string, number>
  if (object.gateRevisions !== undefined) {
    if (typeof object.gateRevisions !== 'object' || object.gateRevisions === null || Array.isArray(object.gateRevisions)) {
      throw new Error(`Invalid SkillHub visibility document revisions: ${path}`)
    }
    for (const [id, revision] of Object.entries(object.gateRevisions)) {
      if (!valid(revision)) throw new Error(`Invalid SkillHub visibility document revision: ${path}`)
      revisions[id] = revision
    }
  }
  return {
    ...(object.defaultRevision !== undefined ? { defaultRevision: object.defaultRevision as number } : {}),
    ...(object.gateRevisions !== undefined ? { gateRevisions: revisions } : {}),
  }
}

/** Synchronous Host mutations share a durable clock, including across hot reloads. */
export function nextPropagationRevision(storeDir: string): number {
  mkdirSync(storeDir, { recursive: true })
  const path = join(storeDir, 'propagation-clock.json')
  const previous: unknown = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : 0
  if (!Number.isSafeInteger(previous) || (previous as number) < 0) {
    throw new Error('Invalid SkillHub visibility document propagation clock')
  }
  const revision = Math.max(Date.now(), (previous as number) + 1)
  if (!Number.isSafeInteger(revision)) throw new Error('SkillHub propagation clock exhausted')
  const temp = `${path}.${randomUUID()}.tmp`
  writeFileSync(temp, `${revision}\n`, { mode: 0o600 })
  renameSync(temp, path)
  return revision
}

/**
 * Newer ancestor operations replace older local values, without copying or
 * enumerating sessions. A later local operation changes only that scope.
 * Only the queried project's chain participates; siblings can never win.
 */
export function propagatedGate(
  id: string | undefined,
  layers: readonly (readonly [Layer, Document | undefined])[],
): { gate: Gate; source: Layer } {
  let gate: Gate = 'on'
  let source: Layer = 'global'
  let latest = -1
  for (const [layer, doc] of layers) {
    if (doc === undefined) continue
    const explicit = id !== undefined && Object.hasOwn(doc.gates, id)
    const value = explicit ? doc.gates[id] : doc.default
    if (value === undefined || value === 'inherit') continue
    const revision = explicit ? (doc.gateRevisions?.[id] ?? 0) : (doc.defaultRevision ?? 0)
    // Equal legacy revisions preserve the existing deeper-layer setting.
    if (revision >= latest) {
      gate = value
      source = layer
      latest = revision
    }
  }
  return { gate, source }
}
