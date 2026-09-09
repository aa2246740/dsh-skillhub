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
  layerLabel,
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

function mcpLayerHelp(t: Translate<SkillHubKey>, layer: LayerName): string {
  if (layer === 'session') return t('mcp.help.session')
  if (layer === 'project') return t('mcp.help.project')
  return t('mcp.help.global')
}

export interface McpPanelProps {
  surface: SkillHubSurface
  layer: LayerName
  layers: readonly LayerName[]
  sessionId?: string | undefined
  folder?: string | undefined
  canWriteSession: boolean
  canWriteProject: boolean
  layerReady: boolean
  onLayerChange: (layer: LayerName) => void
  onServerCountChange?: ((count: number) => void) | undefined
  t: Translate<SkillHubKey>
}

export function McpPanel(props: McpPanelProps) {
  const { t, layer, sessionId, folder, layerReady } = props
  const [catalog, setCatalog] = useState<Catalog>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const generation = useRef(0)

  const query = {
    layer,
    ...(sessionId ? { sessionId } : {}),
    ...(folder ? { folder } : {}),
  }
  const key = JSON.stringify(query)

  const request = useCallback(async (path: string, body?: object, signal?: AbortSignal) => {
    const response = await fetch(`/skillhub/mcp/${path}`, body === undefined
      ? { ...(signal ? { signal } : {}) }
      : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error(t('mcp.unavailable'))
    }
    const data = await response.json() as Catalog & { error?: string }
    if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
    if (!Array.isArray(data.servers)) throw new Error(t('mcp.unavailable'))
    return data
  }, [t])

  const load = useCallback(() => {
    const current = ++generation.current
    const controller = new AbortController()
    setCatalog(undefined)
    setError(undefined)
    setBusy(false)
    void request(`catalog?${new URLSearchParams(JSON.parse(key) as Record<string, string>)}`, undefined, controller.signal)
      .then(data => {
        if (current === generation.current) {
          setCatalog(data)
          props.onServerCountChange?.(data.servers.length)
        }
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
  }, [key, request, props])

  useEffect(() => {
    return load()
  }, [load])

  const update = async (server: string, on?: boolean) => {
    const current = generation.current
    setBusy(true)
    setError(undefined)
    try {
      const data = await request(
        on === undefined ? 'inherit' : 'toggle',
        { ...query, server, ...(on === undefined ? {} : { on }) },
      )
      if (current === generation.current) {
        setCatalog(data)
        props.onServerCountChange?.(data.servers.length)
      }
    } catch (caught) {
      if (current === generation.current) setError(String(caught))
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  const servers = catalog?.servers ?? []
  const onCount = servers.filter(s => s.gate === 'on').length
  const offCount = servers.filter(s => s.gate === 'off').length

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
        </div>
        {servers.length > 0 ? (
          <div className={css.counts} aria-live="polite">
            <span>{t('count.on', { n: onCount })}</span>
            <span>{t('count.off', { n: offCount })}</span>
          </div>
        ) : null}
      </header>

      <div className={css.layer} data-ud-check="skillhub-mcp-layer">
        {props.layers.length === 1 ? (
          <div className={css.scope}>{layerLabel(t, layer)}</div>
        ) : (
          <div className={css.segment} role="radiogroup" aria-label={t('layer.aria')}>
            {props.layers.map(name => {
              const disabled = (name === 'session' && !props.canWriteSession)
                || (name === 'project' && !props.canWriteProject)
              return (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={layer === name}
                  data-active={layer === name ? '' : undefined}
                  disabled={disabled}
                  {...(name === 'session' && !props.canWriteSession
                    ? { title: t('session.needsChat') }
                    : name === 'project' && !props.canWriteProject
                      ? { title: t('project.needsWorkspace') }
                      : {})}
                  onClick={() => props.onLayerChange(name)}
                >
                  {layerLabel(t, name)}
                </button>
              )
            })}
          </div>
        )}
        <p className={css.helper} id="skillhub-mcp-layer-help">
          {mcpLayerHelp(t, layer)}
        </p>
        {layer === 'project' && folder !== undefined && folder !== '' ? (
          <p className={css.path} title={folder}>{folder}</p>
        ) : null}
      </div>

      <div className={css.body} data-ud-check="skillhub-mcp-body">
        {error !== undefined ? (
          <div className={css.bannerRow}>
            <p className={css.error} role="alert">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              {t('error.retry')}
            </Button>
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
            <p className={css.emptyNote}>{t('mcp.empty.note')}</p>
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
                  {layer !== 'global' ? (
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
