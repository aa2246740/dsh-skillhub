import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  Button,
  IconChevronRightOutline14,
  IconSearchOutline16,
  IconWarningOutline16,
  Input,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type {
  CatalogNode,
  CatalogPayload,
  Gate,
  GroupChild,
  GroupGate,
  HomeKind,
  LayerName,
  SkillRef,
} from './catalog-api.ts'
import { fetchCatalog, postCatalog } from './catalog-api.ts'
import type { SkillHubKey } from './locales.ts'
import css from './SkillHubPanel.module.css'

export type SkillHubSurface = 'page' | 'popover'

type Copy = Translate<SkillHubKey>

function layerHelp(t: Copy, layer: LayerName): string {
  if (layer === 'session') return t('help.session')
  if (layer === 'project') return t('help.project')
  return t('help.global')
}

function layerLabel(t: Copy, layer: LayerName): string {
  if (layer === 'session') return t('layer.session')
  if (layer === 'project') return t('layer.project')
  return t('layer.global')
}

function sourceLabel(t: Copy, source: LayerName): string {
  if (source === 'session') return t('source.session')
  if (source === 'project') return t('source.project')
  return t('source.global')
}

function gateWord(t: Copy, gate: Gate | GroupGate): string {
  if (gate === 'on') return t('gate.on')
  if (gate === 'off') return t('gate.off')
  return t('gate.mixed')
}

function brokenCopy(t: Copy, reason: { kind: string; target?: string; message?: string; raw?: string }): string {
  if (reason.kind === 'missing-symlink-target') {
    return reason.target === undefined ? t('broken.missing') : t('broken.missingNamed', { target: reason.target })
  }
  if (reason.kind === 'empty-pack') return t('broken.empty')
  if (reason.kind === 'invalid-name') return t('broken.name')
  if (reason.kind === 'unreadable-skill') return t('broken.unreadable')
  if (reason.kind === 'invalid-frontmatter') return t('broken.frontmatter')
  return reason.kind
}

function homeLabel(t: Copy, home: HomeKind): string {
  if (home === 'agent') return t('home.agent')
  if (home === 'host') return t('home.host')
  return t('home.dsh')
}

function countSkills(nodes: readonly (CatalogNode | GroupChild)[]): { on: number; off: number } {
  let on = 0
  let off = 0
  const visit = (list: readonly (CatalogNode | GroupChild)[]) => {
    for (const node of list) {
      if (node.kind === 'broken') continue
      if (node.kind === 'root-skill') {
        if (node.gate === 'on') on += 1
        else off += 1
        continue
      }
      if (node.skill !== null) {
        if (node.skill.gate === 'on') on += 1
        else off += 1
      }
      visit(node.children)
    }
  }
  visit(nodes)
  return { on, off }
}

function gateFromCounts(counts: { on: number; off: number }): GroupGate {
  if (counts.on > 0 && counts.off > 0) return 'mixed'
  return counts.on > 0 ? 'on' : 'off'
}

function collectSkillIds(nodes: readonly (CatalogNode | GroupChild)[]): string[] {
  const ids: string[] = []
  const visit = (list: readonly (CatalogNode | GroupChild)[]) => {
    for (const node of list) {
      if (node.kind === 'broken') continue
      if (node.kind === 'root-skill') {
        ids.push(node.id)
        continue
      }
      if (node.skill !== null) ids.push(node.skill.id)
      visit(node.children)
    }
  }
  visit(nodes)
  return ids
}

function collectSkills(nodes: readonly (CatalogNode | GroupChild)[]): SkillRef[] {
  const skills: SkillRef[] = []
  const visit = (list: readonly (CatalogNode | GroupChild)[]) => {
    for (const node of list) {
      if (node.kind === 'broken') continue
      if (node.kind === 'root-skill') {
        skills.push({
          id: node.id,
          name: node.name,
          ...node.description !== undefined ? { description: node.description } : {},
          gate: node.gate,
          source: node.source,
          collision: node.collision,
        })
        continue
      }
      if (node.skill !== null) skills.push(node.skill)
      visit(node.children)
    }
  }
  visit(nodes)
  return skills
}

function skillCountLabel(t: Copy, total: number): string {
  return t(total === 1 ? 'count.skillsOne' : 'count.skills', { n: total })
}

function folderChildren(node: CatalogNode | GroupChild): GroupChild[] {
  if (node.kind === 'broken' || node.kind === 'root-skill') return []
  return node.children.filter(child => {
    if (child.kind === 'broken') return true
    return collectSkillIds([child]).length > 0
  })
}

function packPrefix(name: string): string | undefined {
  const split = name.indexOf('-')
  if (split < 2) return undefined
  return name.slice(0, split)
}

function soleSkill(node: CatalogNode | GroupChild): SkillRef | null {
  if (node.kind === 'broken') return null
  if (node.kind === 'root-skill') {
    return {
      id: node.id,
      name: node.name,
      ...node.description !== undefined ? { description: node.description } : {},
      gate: node.gate,
      source: node.source,
      collision: node.collision,
    }
  }
  if (node.skill !== null && folderChildren(node).length === 0) return node.skill
  return null
}

function clusterFlatPacks(nodes: readonly CatalogNode[]): CatalogNode[] {
  type Member = Extract<CatalogNode, { kind: 'pack' | 'broken' }>
  const existing = new Set(nodes.map(node => node.name))
  const counts = new Map<string, number>()
  for (const node of nodes) {
    if (node.kind !== 'pack' && node.kind !== 'broken') continue
    const prefix = packPrefix(node.name)
    if (prefix === undefined || existing.has(prefix)) continue
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1)
  }
  const cluster = new Set<string>()
  for (const [prefix, count] of counts) {
    if (count >= 3) cluster.add(prefix)
  }
  if (cluster.size === 0) return [...nodes]
  const buckets = new Map<string, Member[]>()
  const out: Array<CatalogNode | { kind: 'cluster'; prefix: string }> = []
  for (const node of nodes) {
    if (node.kind !== 'pack' && node.kind !== 'broken') {
      out.push(node)
      continue
    }
    const prefix = packPrefix(node.name)
    if (prefix === undefined || !cluster.has(prefix)) {
      out.push(node)
      continue
    }
    const list = buckets.get(prefix)
    if (list === undefined) {
      buckets.set(prefix, [node])
      out.push({ kind: 'cluster', prefix })
      continue
    }
    list.push(node)
  }
  const result: CatalogNode[] = []
  for (const node of out) {
    if (node.kind !== 'cluster') {
      result.push(node)
      continue
    }
    const members = buckets.get(node.prefix)
    const first = members?.[0]
    if (members === undefined || first === undefined) continue
    const children = members.map(member => {
      if (member.kind === 'broken') {
        return {
          ...member,
          name: member.name.startsWith(`${node.prefix}-`) ? member.name.slice(node.prefix.length + 1) : member.name,
        }
      }
      return {
        kind: 'group' as const,
        name: member.name.startsWith(`${node.prefix}-`) ? member.name.slice(node.prefix.length + 1) : member.name,
        rel: member.name,
        home: member.home,
        path: member.path,
        gate: member.gate,
        skill: member.skill,
        children: member.children,
      }
    })
    const home = first.home
    result.push({
      kind: 'pack',
      id: `${home}:${node.prefix}`,
      name: node.prefix,
      home,
      path: first.path,
      link: { kind: 'directory' },
      gate: gateFromCounts(countSkills(members)),
      skill: null,
      children,
    })
  }
  return result
}

function textOf(node: CatalogNode | GroupChild): string {
  if (node.kind === 'broken') return `${node.name} ${node.reason.kind}`
  if (node.kind === 'root-skill') return `${node.name} ${node.description ?? ''}`
  const skill = node.skill
  return `${node.name} ${skill?.name ?? ''} ${skill?.description ?? ''}`
}

function nodeMatches(node: CatalogNode | GroupChild, needle: string): boolean {
  if (textOf(node).toLowerCase().includes(needle)) return true
  if (node.kind === 'broken' || node.kind === 'root-skill') return false
  return node.children.some(child => nodeMatches(child, needle))
}

function SkillLeaf(props: {
  depth: number
  skill: SkillRef
  label: string
  disabled: boolean
  layer: LayerName
  t: Copy
  onToggle: (kind: 'skill' | 'group', payload: Record<string, unknown>, on: boolean) => void
  onInherit: (kind: 'skill' | 'group', payload: Record<string, unknown>) => void
}) {
  const skill = props.skill
  return (
    <div className={`${css.row} ${css.leaf}`} style={{ '--depth': String(props.depth) } as CSSProperties}>
      <span className={css.chevronGhost} />
      <GateSwitch
        gate={skill.gate}
        label={props.t('switch.skill', { name: props.label, state: gateWord(props.t, skill.gate) })}
        disabled={props.disabled}
        onChange={on => props.onToggle('skill', { id: skill.id }, on)}
      />
      <div className={css.name} {...skill.description !== undefined && skill.description !== '' ? { title: skill.description } : {}}>
        <span className={css.nameText}>{props.label}</span>
        {skill.collision ? <span className={css.collision}>{props.t('badge.collision')}</span> : null}
        {props.layer === 'global' ? null : <span className={css.source}>{sourceLabel(props.t, skill.source)}</span>}
      </div>
      {props.layer !== 'global' && skill.source === props.layer
        ? (
          <button
            type="button"
            className={css.inherit}
            disabled={props.disabled}
            aria-label={props.t('inherit.skill', { name: props.label })}
            onClick={() => props.onInherit('skill', { id: skill.id })}
          >
            {props.t('inherit.action')}
          </button>
        )
        : null}
    </div>
  )
}

function GateSwitch(props: {
  gate: Gate | GroupGate
  label: string
  disabled: boolean
  onChange: (on: boolean) => void
}) {
  return (
    <button
      type="button"
      className={css.switch}
      role="switch"
      aria-checked={props.gate === 'mixed' ? 'mixed' : props.gate === 'on'}
      aria-label={props.label}
      data-state={props.gate}
      disabled={props.disabled}
      onClick={() => props.onChange(props.gate !== 'on')}
    >
      <span className={css.thumb} />
    </button>
  )
}

export function SkillHubPanel(props: {
  sessionId?: string
  folder?: string
  defaultLayer: LayerName
  layers: readonly LayerName[]
  surface: SkillHubSurface
  t: Copy
}) {
  const sessionId = props.sessionId
  const t = props.t
  const folder = props.folder ?? ''
  const [layer, setLayer] = useState<LayerName>(props.defaultLayer)
  const [catalog, setCatalog] = useState<CatalogPayload | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const canWriteSession = sessionId !== undefined && sessionId !== ''
  const canWriteProject = folder !== ''
  const layerReady =
    (layer === 'global')
    || (layer === 'session' && canWriteSession)
    || (layer === 'project' && canWriteProject)

  const load = useCallback(async () => {
    try {
      setError(undefined)
      setCatalog(await fetchCatalog(sessionId, folder === '' ? undefined : folder, layer))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }, [sessionId, folder, layer])

  useEffect(() => { void load() }, [load])

  const mutate = async (path: string, body: Record<string, unknown>) => {
    setBusy(true)
    try {
      setError(undefined)
      const next = await postCatalog(path, body)
      setCatalog(next)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  const toggleBody = (extra: Record<string, unknown>) => {
    const body: Record<string, unknown> = { layer, ...extra }
    if (sessionId !== undefined && sessionId !== '') body['sessionId'] = sessionId
    if (folder !== '') body['folder'] = folder
    return body
  }

  const toggleIds = async (ids: readonly string[], on: boolean) => {
    if (ids.length === 0) return
    setBusy(true)
    try {
      setError(undefined)
      try {
        setCatalog(await postCatalog('/toggle', toggleBody({ kind: 'ids', ids, on })))
        return
      } catch {
        let next: CatalogPayload | undefined
        for (const id of ids) {
          next = await postCatalog('/toggle', toggleBody({ kind: 'skill', id, on }))
        }
        if (next !== undefined) setCatalog(next)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  const inheritIds = async (ids: readonly string[]) => {
    if (ids.length === 0) return
    await mutate('/inherit', toggleBody({ kind: 'ids', ids }))
  }

  const needle = query.trim().toLowerCase()
  const counts = useMemo(() => {
    if (catalog === undefined) return { on: 0, off: 0 }
    return countSkills(catalog.tree.flatMap(home => home.children))
  }, [catalog])

  return (
    <div
      className={css.root}
      data-surface={props.surface}
      data-skillhub-panel=""
      aria-busy={busy}
    >
      <header className={css.header} data-ud-check="skillhub-header" data-ud-role="nav">
        <div className={css.titleRow}>
          <div className={css.titleBlock}>
            <div className={css.eyebrow}>{t('nav')}</div>
            <h2 className={css.title}>{t(props.surface === 'page' ? 'title.global' : 'title.context')}</h2>
            <p className={css.lede}>{t(props.surface === 'page' ? 'lede.global' : 'lede.context')}</p>
          </div>
          <div className={css.headerActions}>
            <Button
              variant="ghost"
              size="sm"
              disabled={!layerReady || busy || catalog === undefined}
              onClick={() => void mutate('/toggle', toggleBody({ kind: 'all', on: false }))}
            >
              {t('allOff')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!layerReady || busy || catalog === undefined}
              onClick={() => void mutate('/toggle', toggleBody({ kind: 'all', on: true }))}
            >
              {t('allOn')}
            </Button>
            {layer === 'global'
              ? null
              : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!layerReady || busy || catalog === undefined}
                  onClick={() => void mutate('/inherit', toggleBody({ kind: 'all' }))}
                >
                  {t('allInherit')}
                </Button>
              )}
          </div>
        </div>
        {catalog !== undefined
          ? (
            <div className={css.counts} aria-live="polite">
              <span>{t('count.on', { n: counts.on })}</span>
              <span>{t('count.off', { n: counts.off })}</span>
              {catalog.collisions.length > 0
                ? <span>{t('count.collisions', { n: catalog.collisions.length })}</span>
                : null}
            </div>
          )
          : null}
      </header>

      <div className={css.layer} data-ud-check="skillhub-layer">
        {props.layers.length === 1
          ? <div className={css.scope}>{layerLabel(t, layer)}</div>
          : (
            <div className={css.segment} role="radiogroup" aria-label={t('layer.aria')}>
              {props.layers.map(name => {
            const disabled = (name === 'session' && !canWriteSession) || (name === 'project' && !canWriteProject)
            return (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={layer === name}
                data-active={layer === name ? '' : undefined}
                disabled={disabled}
                {...((name === 'session' && !canWriteSession)
                  ? { title: t('session.needsChat') }
                  : (name === 'project' && !canWriteProject)
                    ? { title: t('project.needsWorkspace') }
                    : {})}
                onClick={() => setLayer(name)}
              >
                {layerLabel(t, name)}
              </button>
            )
              })}
            </div>
          )}
        <p className={css.helper} id="skillhub-layer-help">{layerHelp(t, layer)}</p>
        {layer === 'project' && folder !== ''
          ? <p className={css.path} title={folder}>{folder}</p>
          : null}
      </div>

      <label className={css.search}>
        <span className={css.helper}>{t('search')}</span>
        <Input
          className={css.field ?? ''}
          icon={<IconSearchOutline16 size={16} />}
          value={query}
          placeholder={t('search.placeholder')}
          onChange={event => setQuery(event.currentTarget.value)}
        />
      </label>

      <div className={css.body} data-ud-check="skillhub-tree" data-ud-role="panel">
        {error !== undefined
          ? (
            <div className={css.bannerRow}>
              <p className={css.error} role="alert">{t('error.load', { error })}</p>
              <Button variant="outline" size="sm" onClick={() => void load()}>{t('error.retry')}</Button>
            </div>
          )
          : null}
        {catalog !== undefined && catalog.collisions.length > 0
          ? (
            <p className={css.warn} role="status">
              {t('collision.warn')}
              {' '}
              {catalog.collisions.map(row => row.name).join(', ')}
            </p>
          )
          : null}
        {catalog?.legacySessionSnapshot === true
          ? <p className={css.warn} role="status">{t('legacy.snapshot')}</p>
          : null}
        {catalog === undefined && error === undefined
          ? (
            <div className={css.skeleton} aria-label={t('loading')}>
              <div className={css.skel} />
              <div className={css.skel} />
              <div className={css.skel} />
            </div>
          )
          : null}
        {catalog !== undefined
          ? catalog.tree.map(home => {
            const clustered = clusterFlatPacks(home.children)
            const children = needle === ''
              ? clustered
              : clustered.filter(node => nodeMatches(node, needle))
            const populatedHomes = catalog.tree.filter(row => row.children.length > 0).length
            const hideHomeChrome = props.surface === 'popover' && populatedHomes <= 1
            const homeKey = `home:${home.home}`
            const homeOpen = hideHomeChrome || needle !== '' || (expanded[homeKey] ?? true)
            const homeCounts = countSkills(home.children)
            const homeIds = collectSkillIds(home.children)
            const homeHasOverride = layer !== 'global' && collectSkills(home.children).some(skill => skill.source === layer)
            const homeTotal = homeCounts.on + homeCounts.off
            const label = homeLabel(t, home.home)
            const tree = children.length === 0
              ? (
                <p className={css.empty}>
                  {needle === '' ? t('empty.home') : t('empty.search')}
                </p>
              )
              : children.map(node => (
                <TreeNode
                  key={node.kind === 'pack' ? node.path : node.kind === 'root-skill' ? node.id : node.path}
                  node={node}
                  packHome={home.home}
                  packName={node.kind === 'pack' ? node.name : ''}
                  depth={hideHomeChrome ? 0 : 1}
                  needle={needle}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  disabled={!layerReady || busy}
                  layer={layer}
                  t={t}
                  onToggle={(kind, payload, on) => {
                    if (kind === 'group') {
                      const ids = Array.isArray(payload['ids'])
                        ? payload['ids'].filter((id): id is string => typeof id === 'string')
                        : collectSkillIds([node])
                      void toggleIds(ids, on)
                      return
                    }
                    void mutate('/toggle', toggleBody({ kind, on, ...payload }))
                  }}
                  onInherit={(kind, payload) => {
                    if (kind === 'group') {
                      const ids = Array.isArray(payload['ids'])
                        ? payload['ids'].filter((id): id is string => typeof id === 'string')
                        : collectSkillIds([node])
                      void inheritIds(ids)
                      return
                    }
                    void mutate('/inherit', toggleBody({ kind, ...payload }))
                  }}
                />
              ))
            if (hideHomeChrome) {
              return (
                <section key={home.home} className={css.home} aria-label={label}>
                  {tree}
                </section>
              )
            }
            return (
              <section key={home.home} className={css.home} aria-label={label}>
                <div className={css.row} style={{ '--depth': '0' } as CSSProperties} data-folder="">
                  <button
                    type="button"
                    className={css.chevron}
                    aria-expanded={homeOpen}
                    aria-label={t(homeOpen ? 'collapse' : 'expand', { name: label })}
                    onClick={() => setExpanded(current => ({
                      ...current,
                      [homeKey]: !(current[homeKey] ?? true),
                    }))}
                  >
                    <IconChevronRightOutline14 size={14} />
                  </button>
                  <GateSwitch
                    gate={gateFromCounts(homeCounts)}
                    label={t('switch.folder', { name: label, state: gateWord(t, gateFromCounts(homeCounts)) })}
                    disabled={!layerReady || busy || homeIds.length === 0}
                    onChange={on => void toggleIds(homeIds, on)}
                  />
                  <button
                    type="button"
                    className={css.nameBtn}
                    title={home.path}
                    onClick={() => setExpanded(current => ({
                      ...current,
                      [homeKey]: !(current[homeKey] ?? true),
                    }))}
                  >
                    <span className={css.name}>
                      <span className={css.nameText}>{label}</span>
                      {homeTotal > 1 ? <span className={css.badge}>{skillCountLabel(t, homeTotal)}</span> : null}
                    </span>
                  </button>
                  {homeHasOverride
                    ? (
                      <button
                        type="button"
                        className={css.inherit}
                        disabled={!layerReady || busy}
                        aria-label={t('inherit.folder', { name: label })}
                        onClick={() => void inheritIds(homeIds)}
                      >
                        {t('inherit.action')}
                      </button>
                    )
                    : null}
                </div>
                <p className={css.homePath} title={home.path}>{home.path}</p>
                {homeOpen ? tree : null}
              </section>
            )
          })
          : null}
      </div>
    </div>
  )
}

function TreeNode(props: {
  node: CatalogNode | GroupChild
  packHome: HomeKind
  packName: string
  depth: number
  needle: string
  expanded: Record<string, boolean>
  setExpanded: (next: Record<string, boolean> | ((current: Record<string, boolean>) => Record<string, boolean>)) => void
  disabled: boolean
  layer: LayerName
  t: Copy
  onToggle: (kind: 'skill' | 'group', payload: Record<string, unknown>, on: boolean) => void
  onInherit: (kind: 'skill' | 'group', payload: Record<string, unknown>) => void
}) {
  const { node } = props
  const style = { '--depth': String(props.depth) } as CSSProperties

  if (node.kind === 'broken') {
    return (
      <div className={css.row} data-broken="" style={style}>
        <span className={css.chevronGhost} />
        <div className={css.name}>
          <IconWarningOutline16 size={14} />
          <span className={css.nameText}>{node.name}</span>
          <span className={css.brokenMark}>{brokenCopy(props.t, node.reason)}</span>
        </div>
      </div>
    )
  }

  if (node.kind === 'root-skill') {
    return (
      <SkillLeaf
        depth={props.depth}
        skill={{
          id: node.id,
          name: node.name,
          ...node.description !== undefined ? { description: node.description } : {},
          gate: node.gate,
          source: node.source,
          collision: node.collision,
        }}
        label={node.name}
        disabled={props.disabled}
        layer={props.layer}
        t={props.t}
        onToggle={props.onToggle}
        onInherit={props.onInherit}
      />
    )
  }

  const leaf = soleSkill(node)
  if (leaf !== null) {
    return (
      <SkillLeaf
        depth={props.depth}
        skill={leaf}
        label={node.name}
        disabled={props.disabled}
        layer={props.layer}
        t={props.t}
        onToggle={props.onToggle}
        onInherit={props.onInherit}
      />
    )
  }

  const packName = node.kind === 'pack' ? node.name : props.packName
  const packHome = node.kind === 'pack' ? node.home : props.packHome
  const rel = node.kind === 'group' ? node.rel : node.name
  const key = node.kind === 'pack' ? node.path : `${packHome}:${rel}`
  const children = folderChildren(node)
  const nested = children.length > 0
  const expandable = nested
  const counts = countSkills([node])
  const total = counts.on + counts.off
  const ids = collectSkillIds([node])
  const hasOverride = props.layer !== 'global' && collectSkills([node]).some(skill => skill.source === props.layer)
  const defaultOpen = false
  const open = props.needle !== '' || (props.expanded[key] ?? defaultOpen)
  const visibleChildren = props.needle === ''
    ? children
    : children.filter(child => nodeMatches(child, props.needle))
  const toggleOpen = () => {
    if (!expandable) return
    props.setExpanded(current => ({
      ...current,
      [key]: !(current[key] ?? defaultOpen),
    }))
  }
  const showOwnSkill = open && node.skill !== null && nested

  return (
    <div>
      <div className={css.row} style={style} data-folder={expandable ? '' : undefined}>
        {expandable
          ? (
            <button
              type="button"
              className={css.chevron}
              aria-expanded={open}
              aria-label={props.t(open ? 'collapse' : 'expand', { name: node.name })}
              onClick={toggleOpen}
            >
              <IconChevronRightOutline14 size={14} />
            </button>
          )
          : <span className={css.chevronGhost} />}
        <GateSwitch
          gate={node.gate}
          label={props.t('switch.folder', { name: node.name, state: gateWord(props.t, node.gate) })}
          disabled={props.disabled || ids.length === 0}
          onChange={on => props.onToggle('group', { packHome, packName, rel, ids }, on)}
        />
        <button type="button" className={css.nameBtn} onClick={toggleOpen} disabled={!expandable}>
          <span className={css.name}>
            <span className={css.nameText}>{node.name}</span>
            {total > 1 ? <span className={css.badge}>{skillCountLabel(props.t, total)}</span> : null}
          </span>
        </button>
        {hasOverride
          ? (
            <button
              type="button"
              className={css.inherit}
              disabled={props.disabled}
              aria-label={props.t('inherit.folder', { name: node.name })}
              onClick={() => props.onInherit('group', { packHome, packName, rel, ids })}
            >
              {props.t('inherit.action')}
            </button>
          )
          : null}
      </div>
      {open
        ? (
          <>
            {showOwnSkill && node.skill !== null
              ? (
                <SkillLeaf
                  depth={props.depth + 1}
                  skill={node.skill}
                  label={node.skill.name}
                  disabled={props.disabled}
                  layer={props.layer}
                  t={props.t}
                  onToggle={props.onToggle}
                  onInherit={props.onInherit}
                />
              )
              : null}
            {visibleChildren.map(child => (
              <TreeNode
                key={child.kind === 'broken' ? child.path : child.rel}
                node={child}
                packHome={packHome}
                packName={packName}
                depth={props.depth + 1}
                needle={props.needle}
                expanded={props.expanded}
                setExpanded={props.setExpanded}
                disabled={props.disabled}
                layer={props.layer}
                t={props.t}
                onToggle={props.onToggle}
                onInherit={props.onInherit}
              />
            ))}
          </>
        )
          : null}
    </div>
  )
}
