import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  Button,
  IconCordisPluginOutline14,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { LayerName } from './catalog-api.ts'
import type { SkillHubKey } from './locales.ts'
import {
  GateSwitch,
  gateWord,
  sourceLabel,
  type SkillHubSurface,
} from './SkillHubPanel.tsx'
import css from './SkillHubPanel.module.css'

type Catalog = {
  servers: {
    name: string
    tools: number
    gate: 'on' | 'off'
    source: LayerName
    supported: boolean
  }[]
}

export interface McpPanelProps {
  surface: SkillHubSurface
  layer: LayerName
  sessionId?: string | undefined
  folder?: string | undefined
  canWriteSession: boolean
  canWriteProject: boolean
  layerReady: boolean
  onServerCountChange?: ((count: number) => void) | undefined
  t: Translate<SkillHubKey>
}

export function McpPanel(props: McpPanelProps) {
  const { t, layer, sessionId, folder, layerReady } = props
  const [catalog, setCatalog] = useState<Catalog>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const generation = useRef(0)
  const tRef = useRef(t)
  tRef.current = t
  const onCountRef = useRef(props.onServerCountChange)
  onCountRef.current = props.onServerCountChange

  const query = {
    layer,
    ...(sessionId ? { sessionId } : {}),
    ...(folder ? { folder } : {}),
  }
  const key = JSON.stringify(query)

  const request = useCallback(async (path: string, body?: object, signal?: AbortSignal) => {
    const copy = tRef.current
    const response = await fetch(`/skillhub/mcp/${path}`, body === undefined
      ? { ...(signal ? { signal } : {}) }
      : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error(copy('mcp.unavailable'))
    }
    const data = await response.json() as Catalog & { error?: string }
    if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
    if (!Array.isArray(data.servers)) throw new Error(copy('mcp.unavailable'))
    return data
  }, [])

  const applyCatalog = (data: Catalog) => {
    setCatalog(data)
    onCountRef.current?.(data.servers.length)
  }

  const load = useCallback((clear: boolean) => {
    const current = ++generation.current
    const controller = new AbortController()
    if (clear) setCatalog(undefined)
    setError(undefined)
    void request(`catalog?${new URLSearchParams(JSON.parse(key) as Record<string, string>)}`, undefined, controller.signal)
      .then(data => {
        if (current === generation.current) applyCatalog(data)
      })
      .catch((caught: Error) => {
        if (!controller.signal.aborted && current === generation.current) {
          setError(caught.message)
        }
      })
    return () => {
      ++generation.current
      controller.abort()
    }
  }, [key, request])

  useEffect(() => {
    return load(catalog === undefined)
    // Reload only when the query key changes, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- catalog is the first-paint gate, not a fetch input
  }, [key, load])

  const update = async (server: string, on?: boolean) => {
    const current = generation.current
    setBusy(true)
    setError(undefined)
    try {
      const data = await request(
        on === undefined ? 'inherit' : 'toggle',
        { ...query, server, ...(on === undefined ? {} : { on }) },
      )
      if (current === generation.current) applyCatalog(data)
    } catch (caught) {
      if (current === generation.current) setError(String(caught))
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  const bulkUpdate = async (on?: boolean) => {
    if (!catalog?.servers) return
    const current = generation.current
    setBusy(true)
    setError(undefined)
    try {
      let latest: Catalog | undefined
      for (const server of catalog.servers) {
        latest = await request(
          on === undefined ? 'inherit' : 'toggle',
          { ...query, server: server.name, ...(on === undefined ? {} : { on }) },
        )
      }
      if (latest && current === generation.current) applyCatalog(latest)
    } catch (caught) {
      if (current === generation.current) setError(String(caught))
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  const servers = catalog?.servers ?? []
  const onCount = servers.filter(s => s.gate === 'on').length
  const offCount = servers.filter(s => s.gate === 'off').length
  const hasOverrides = layer !== 'global' && servers.some(s => s.source === layer)

  return (
    <div className={css.mcpContainer} data-ud-check="skillhub-mcp-container">
      <header className={css.header} data-ud-check="skillhub-mcp-header">
        <div className={css.titleRow}>
          <div className={css.titleBlock}>
            <h2 className={css.title}>
              {t(props.surface === 'page' ? 'mcp.title.global' : 'mcp.title.context')}
            </h2>
            <p className={css.lede}>
              {t(props.surface === 'page' ? 'mcp.lede.global' : 'mcp.lede.context')}
            </p>
          </div>
          {servers.length > 0 ? (
            <div className={css.headerActions}>
              <Button
                variant="ghost"
                size="sm"
                disabled={!layerReady || busy}
                onClick={() => void bulkUpdate(false)}
              >
                {t('allOff')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!layerReady || busy}
                onClick={() => void bulkUpdate(true)}
              >
                {t('allOn')}
              </Button>
              {hasOverrides ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!layerReady || busy}
                  onClick={() => void bulkUpdate(undefined)}
                >
                  {t('allInherit')}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        {servers.length > 0 ? (
          <div className={css.counts} aria-live="polite">
            <span>{t('count.on', { n: onCount })}</span>
            <span>{t('count.off', { n: offCount })}</span>
          </div>
        ) : null}
      </header>

      <div className={css.body} data-ud-check="skillhub-mcp-body">
        {error !== undefined ? (
          <div className={css.bannerRow}>
            <p className={css.error} role="alert">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load(false)}>{t('error.retry')}</Button>
          </div>
        ) : null}

        {catalog === undefined && error === undefined ? (
          <div className={css.skeleton} aria-label={t('loading')}>
            <div className={css.skel} />
            <div className={css.skel} />
          </div>
        ) : null}

        {catalog !== undefined && servers.length === 0 ? (
          <div className={css.emptyCard} data-ud-check="skillhub-mcp-empty">
            <div className={css.emptyIcon}>
              <IconCordisPluginOutline14 size={28} />
            </div>
            <h3 className={css.emptyTitle}>{t('mcp.empty.title')}</h3>
            <p className={css.emptyDesc}>{t('mcp.empty.desc')}</p>
          </div>
        ) : null}

        {catalog !== undefined && servers.length > 0 ? (
          <div className={css.mcpList}>
            {servers.map(server => (
              <div
                key={server.name}
                className={`${css.row} ${css.leaf}`}
                style={{ '--depth': '0' } as CSSProperties}
              >
                <span className={css.chevronGhost} />
                <GateSwitch
                  gate={server.gate}
                  label={t('switch.mcp', {
                    name: server.name,
                    state: gateWord(t, server.gate),
                  })}
                  disabled={!layerReady || busy || (!server.supported && server.gate === 'on')}
                  onChange={on => void update(server.name, on)}
                />
                <div className={css.name}>
                  <span className={css.nameText}>{server.name}</span>
                  <span className={css.badge}>{t('mcp.tools', { n: server.tools })}</span>
                  {layer !== 'global' && server.source === layer ? (
                    <span className={css.source}>{sourceLabel(t, server.source)}</span>
                  ) : null}
                  {!server.supported ? (
                    <span className={css.unsupported}>{t('mcp.unsupported')}</span>
                  ) : null}
                </div>
                {layer !== 'global' && server.source === layer && server.supported ? (
                  <button
                    type="button"
                    className={css.inherit}
                    disabled={busy}
                    aria-label={t('mcp.inherit.server', { name: server.name })}
                    onClick={() => void update(server.name, undefined)}
                  >
                    {t('inherit.action')}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
