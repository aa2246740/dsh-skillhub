import type { Fiber } from '@deepseek-ai/cordis'

export const SKILL_CLIENT = '@deepseek-ai/dsh-client-ui-skill'
const REFRESH_EVENT = 'dsh-skillhub:refresh-autocomplete'

/** Public Loader/Fiber lifecycle only; no access to another plugin's cache. */
export interface SkillClientLoader {
  entries(): Iterable<{ options: { name: string }; disabled?: boolean; fiber?: Fiber }>
}

export function createSlashRefresh(loader: SkillClientLoader) {
  let disposed = false
  let dirty = false
  let running: Promise<void> | undefined
  const refresh = (): Promise<void> => {
    if (disposed) return Promise.reject(new Error('SkillHub autocomplete refresher is disposed'))
    dirty = true
    if (running) return running
    running = Promise.resolve().then(async () => {
      while (dirty && !disposed) {
        dirty = false
        const targets = [...loader.entries()].filter(entry => entry.options.name === SKILL_CLIENT)
        if (targets.length !== 1 || targets[0].disabled || !targets[0].fiber) {
          throw new Error('The official skill autocomplete plugin is not active')
        }
        const entry = targets[0]
        const fiber = entry.fiber!
        await fiber.await()
        if (disposed) return
        // A concurrent graph update may have removed/replaced the target while awaiting it.
        if (![...loader.entries()].includes(entry) || entry.fiber !== fiber || entry.disabled) {
          dirty = true
          continue
        }
        // ACTIVE is Cordis's public FiberState value; the enum is compile-time only.
        if (fiber.state !== 2) throw new Error('The official skill autocomplete plugin is not active')
        await fiber.restart()
      }
    }).finally(() => { running = undefined })
    return running
  }
  return { refresh, dispose: () => { disposed = true; dirty = false } }
}

interface RefreshRequest { waitUntil(promise: Promise<void>): void }

/** Notify other windows and wait for this window's lifecycle refresh to finish. */
export async function refreshSkillAutocomplete(): Promise<void> {
  const pending: Promise<void>[] = []
  window.dispatchEvent(new CustomEvent<RefreshRequest>(REFRESH_EVENT, {
    detail: { waitUntil: promise => { pending.push(promise) } },
  }))
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(REFRESH_EVENT)
    channel.postMessage('refresh')
    channel.close()
  }
  if (pending.length !== 1) throw new Error('SkillHub autocomplete refresher is unavailable')
  await Promise.all(pending)
}

/** All listeners belong to SkillHub's client fiber and leave on HMR/disposal. */
export function connectSlashRefresh(loader: SkillClientLoader, report: (error: unknown) => void): () => void {
  const refresher = createSlashRefresh(loader)
  const changed = (event: Event) => {
    const request = (event as CustomEvent<RefreshRequest>).detail
    request.waitUntil(refresher.refresh())
  }
  const channel = typeof BroadcastChannel === 'undefined' ? undefined : new BroadcastChannel(REFRESH_EVENT)
  if (channel) channel.onmessage = () => { void refresher.refresh().catch(report) }
  window.addEventListener(REFRESH_EVENT, changed)
  // Clear catalogs cached before this client was installed or hot-replaced.
  void refresher.refresh().catch(report)
  return () => {
    window.removeEventListener(REFRESH_EVENT, changed)
    channel?.close()
    refresher.dispose()
  }
}
