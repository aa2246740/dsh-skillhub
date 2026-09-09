import { useEffect, useRef, useState } from 'react'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { SkillHubKey } from './locales.ts'
import type { LayerName } from './catalog-api.ts'
import css from './McpPanel.module.css'

type Catalog = { servers: { name: string; tools: number; gate: 'on' | 'off'; source: LayerName; supported: boolean }[] }
export function McpPanel(props: { layer: LayerName; sessionId?: string; folder?: string; t: Translate<SkillHubKey> }) {
  const { t, layer, sessionId, folder } = props
  const [catalog, setCatalog] = useState<Catalog>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const generation = useRef(0)
  const query = { layer, ...(sessionId ? { sessionId } : {}), ...(folder ? { folder } : {}) }
  const key = JSON.stringify(query)
  async function request(path: string, body?: object, signal?: AbortSignal) {
    const response = await fetch(`/skillhub/mcp/${path}`, body === undefined
      ? { ...(signal ? { signal } : {}) }
      : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error(t('mcp.unavailable'))
    const data = await response.json() as Catalog & { error?: string }
    if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
    if (!Array.isArray(data.servers)) throw new Error(t('mcp.unavailable'))
    return data
  }
  useEffect(() => {
    const current = ++generation.current
    const controller = new AbortController()
    setCatalog(undefined); setError(''); setBusy(false)
    void request(`catalog?${new URLSearchParams(JSON.parse(key) as Record<string, string>)}`, undefined, controller.signal)
      .then(data => { if (current === generation.current) setCatalog(data) })
      .catch((e: Error) => { if (!controller.signal.aborted && current === generation.current) setError(e.message) })
    return () => { ++generation.current; controller.abort() }
  }, [key])
  async function update(server: string, on?: boolean) {
    const current = generation.current
    setBusy(true); setError('')
    try {
      const data = await request(on === undefined ? 'inherit' : 'toggle', { ...query, server, ...(on === undefined ? {} : { on }) })
      if (current === generation.current) setCatalog(data)
    } catch (e) { if (current === generation.current) setError(String(e)) }
    finally { if (current === generation.current) setBusy(false) }
  }
  return <section className={css.section} aria-label={t('mcp.title')}>
    <h3>{t('mcp.title')}</h3>
    <p className={css.help}>{t('mcp.help')}</p>
    {error && <p role="alert" className={css.error}>{error}</p>}
    {!catalog && !error && <p>{t('loading')}</p>}
    {catalog?.servers.length === 0 && <p className={css.help}>{t('mcp.empty')}</p>}
    {catalog?.servers.map(server => <div key={server.name} className={css.row}>
      <label className={css.label}>
        <input type="checkbox" role="switch" checked={server.gate === 'on'} disabled={busy || (!server.supported && server.gate === 'on')} onChange={event => void update(server.name, event.currentTarget.checked)} />
        <span><strong>{server.name}</strong><small>{t('mcp.tools', { n: server.tools })} · {t(`layer.${server.source}`)}</small></span>
      </label>
      {server.supported ? <button disabled={busy} onClick={() => void update(server.name)}>{t('mcp.inherit')}</button> : <small>{t('mcp.unsupported')}</small>}
    </div>)}
  </section>
}
