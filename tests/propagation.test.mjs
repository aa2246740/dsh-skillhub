import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
import test from 'node:test'
import { SkillHub } from '../lib/types/hub.js'
import { McpHub } from '../lib/types/mcp.js'
import { resolveCatalog } from '../lib/types/catalog.js'
import { handleSkillHubHttp } from '../lib/types/http.js'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'skillhub-propagation-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const paths = { agentHome: join(root, 'agent'), dshHome: join(root, 'dsh'), storeDir: join(root, 'store') }
  for (const name of ['alpha', 'beta', 'other/gamma']) {
    const dir = join(paths.agentHome, name)
    mkdirSync(dir, { recursive: true })
    const skill = name.split('/').at(-1)
    writeFileSync(join(dir, 'SKILL.md'), `---\nname: ${skill}\ndescription: Test ${skill}\n---\nBody\n`)
  }
  return { paths, root, hub: new SkillHub(paths), mcp: new McpHub(paths), a: join(root, 'project-a'), b: join(root, 'project-b') }
}
const id = 'agent:alpha/SKILL.md'
const beta = 'agent:beta/SKILL.md'
const gamma = 'agent:other/gamma/SKILL.md'
const state = (hub, folder, sessionId, skill = id) => hub.catalog({ folder, sessionId, resolved: true }).inventory.find(row => row.id === skill).gate
const set = (hub, scope, on, skill = id) => hub.toggle({ ...scope, target: { kind: 'skill', id: skill, on } })

test('global reapply reaches existing, unread, future and locally changed conversations', t => {
  const { hub, a, b, paths } = fixture(t)
  set(hub, { layer: 'project', folder: a }, false)
  set(hub, { layer: 'session', folder: a, sessionId: 'a1' }, false)
  set(hub, { layer: 'session', folder: b, sessionId: 'b1' }, false)
  set(hub, { layer: 'session', folder: a, sessionId: 'a1' }, false, beta)
  // Reapply an unchanged global ON: it must still be a new cascading operation.
  set(hub, { layer: 'global' }, true)
  for (const [folder, sessionId] of [[a, 'a1'], [a, 'a2'], [b, 'b1'], [b, 'new-b'], [join(a, 'new-project'), 'new']]) {
    assert.equal(state(hub, folder, sessionId), 'on')
  }
  assert.equal(state(hub, a, 'a1', beta), 'off', 'unrelated skills remain unchanged')
  set(hub, { layer: 'session', folder: a, sessionId: 'a1' }, false)
  assert.equal(state(hub, a, 'a1'), 'off')
  assert.equal(state(hub, a, 'a2'), 'on')
  set(hub, { layer: 'global' }, true)
  assert.equal(state(new SkillHub(paths), a, 'a1'), 'on', 'survives hub recreation')
})

test('project propagates only inside its scope, including after global synchronization', t => {
  const { hub, a, b } = fixture(t)
  for (const [folder, sessionId] of [[a, 'a1'], [a, 'a2'], [b, 'b1']]) set(hub, { layer: 'session', folder, sessionId }, false)
  set(hub, { layer: 'project', folder: a }, true)
  assert.equal(state(hub, a, 'a1'), 'on')
  assert.equal(state(hub, a, 'a2'), 'on')
  assert.equal(state(hub, a, 'new'), 'on')
  assert.equal(state(hub, b, 'b1'), 'off')
  set(hub, { layer: 'global' }, false)
  set(hub, { layer: 'project', folder: a }, true)
  assert.equal(state(hub, a, 'a1'), 'on')
  assert.equal(state(hub, b, 'b1'), 'off')
  assert.equal(hub.catalog().inventory.find(row => row.id === id).gate, 'off', 'no upward propagation')
})

test('directory, ids and all operations supersede older descendant values without changing siblings', t => {
  const { hub, a, b, paths } = fixture(t)
  hub.toggle({ layer: 'session', folder: a, sessionId: 'a1', target: { kind: 'all', on: false } })
  hub.toggle({ layer: 'project', folder: a, target: { kind: 'ids', ids: [id, beta], on: true } })
  assert.equal(state(hub, a, 'a1'), 'on')
  assert.equal(state(hub, a, 'a1', beta), 'on')
  assert.equal(state(hub, a, 'a1', gamma), 'off')
  hub.toggle({ layer: 'global', target: { kind: 'group', packHome: 'agent', packName: 'other', rel: 'other', on: true } })
  assert.equal(state(hub, a, 'a1', gamma), 'on')
  hub.toggle({ layer: 'global', target: { kind: 'all', on: false } })
  for (const folder of [a, b]) assert.deepEqual(hub.catalog({ folder, sessionId: folder === a ? 'a1' : 'b1' }).offered, [])
  const later = join(paths.agentHome, 'later')
  mkdirSync(later)
  writeFileSync(join(later, 'SKILL.md'), '---\nname: later\ndescription: Later\n---\n')
  assert.equal(state(hub, a, 'new-chat', 'agent:later/SKILL.md'), 'off')
  hub.toggle({ layer: 'project', folder: a, target: { kind: 'home', home: 'agent', on: true } })
  assert.equal(state(hub, a, 'a1'), 'on')
  assert.equal(state(hub, b, 'b1'), 'off')
})

test('legacy snapshots are preserved at install but do not block the next ancestor action', t => {
  const { hub, paths, a } = fixture(t)
  mkdirSync(join(paths.storeDir, 'sessions'))
  writeFileSync(join(paths.storeDir, 'sessions', 'legacy.json'), JSON.stringify({ gates: { [id]: 'off' } }))
  assert.equal(state(hub, a, 'legacy'), 'off')
  set(hub, { layer: 'global' }, true)
  assert.equal(state(hub, a, 'legacy'), 'on')
  hub.toggle({ layer: 'global', target: { kind: 'all', on: false } })
  assert.deepEqual(hub.catalog({ folder: a, sessionId: 'legacy' }).offered, [])
})

test('MCP actual hiddenServers and catalog use the same cascading rule', t => {
  const { mcp, paths, a, b } = fixture(t)
  const server = 'demo'
  mcp.toggle({ layer: 'session', folder: a, sessionId: 'a1', server, on: false })
  mcp.toggle({ layer: 'session', folder: b, sessionId: 'b1', server, on: false })
  mcp.toggle({ layer: 'project', folder: a, server, on: true })
  assert.equal(mcp.hiddenServers('a1', a, [server]).has(server), false)
  assert.equal(mcp.hiddenServers('b1', b, [server]).has(server), true)
  mcp.toggle({ layer: 'global', server, on: true })
  assert.equal(mcp.hiddenServers('b1', b, [server]).has(server), false)
  mcp.toggle({ layer: 'session', folder: a, sessionId: 'a1', server, on: false })
  assert.equal(mcp.effectiveGate(server, 'a1', a).gate, 'off')
  mcp.toggle({ layer: 'global', server, on: true })
  const fresh = new McpHub(paths)
  assert.equal(fresh.catalog({ folder: a, sessionId: 'a1' }, ['mcp__demo__read'], [server]).servers[0].gate, 'on')
  assert.equal(fresh.hiddenServers('a1', a, [server]).has(server), false)
})

test('composed and direct catalog agree for dated defaults, explicit entries and inherit compatibility', t => {
  const { paths } = fixture(t)
  const input = { ...paths,
    global: { version: 2, default: 'on', gates: { [id]: 'off' }, gateRevisions: { [id]: 10 } },
    project: { version: 2, default: 'on', defaultRevision: 11, gates: { [id]: 'inherit' } },
    session: { version: 2, default: 'inherit', gates: { [id]: 'on' }, gateRevisions: { [id]: 9 } },
  }
  const select = result => result.inventory.map(({ id, gate, source }) => ({ id, gate, source }))
  assert.deepEqual(select(resolveCatalog({ ...input, composeChain: true })), select(resolveCatalog(input)))
  assert.equal(resolveCatalog(input).inventory.find(row => row.id === id).gate, 'off')
})

test('deterministic operation sequences match a simple top-down broadcast oracle', t => {
  const { hub, a, b } = fixture(t)
  const chats = [{ folder: a, sessionId: 'a1' }, { folder: a, sessionId: 'a2' }, { folder: b, sessionId: 'b1' }]
  const ids = [id, beta, gamma]
  const log = []
  let seed = 142
  for (let n = 0; n < 80; n++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const scope = seed % 3
    const chat = chats[(seed >>> 3) % chats.length]
    const layer = ['global', 'project', 'session'][scope]
    const skill = ids[(seed >>> 7) % ids.length]
    const on = (seed & 512) !== 0
    const all = n % 13 === 0
    const request = { layer, ...chat, target: all ? { kind: 'all', on } : { kind: 'skill', id: skill, on } }
    hub.toggle(request)
    log.push({ layer, ...chat, skill, on, all })
    for (const target of chats) for (const skill of ids) {
      const last = log.findLast(event => (event.all || event.skill === skill) &&
        (event.layer === 'global' || (event.folder === target.folder &&
          (event.layer === 'project' || event.sessionId === target.sessionId))))
      assert.equal(state(hub, target.folder, target.sessionId, skill), last?.on === false ? 'off' : 'on')
    }
  }
})

test('HTTP writes and subsequent chat reads agree after an ancestor update', async t => {
  const { hub, a } = fixture(t)
  let invalidations = 0
  const handler = handleSkillHubHttp(hub, () => invalidations++, () => undefined)
  const server = createServer((req, res) => void handler(req, res))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}/skillhub`
  const post = async body => {
    const response = await fetch(`${base}/toggle`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    assert.equal(response.status, 200)
    return response.json()
  }
  const target = on => ({ kind: 'skill', id, on })
  await post({ layer: 'session', folder: a, sessionId: 'http-chat', target: undefined, ...target(false) })
  await post({ layer: 'global', ...target(true) })
  const view = await (await fetch(`${base}/catalog?${new URLSearchParams({ folder: a, sessionId: 'http-chat' })}`)).json()
  assert.equal(view.offered.some(skill => skill.id === id), true)
  assert.equal(invalidations, 2)
})

test('revision metadata is persisted per skill and malformed metadata fails closed', t => {
  const { hub, paths } = fixture(t)
  set(hub, { layer: 'global' }, false)
  const path = join(paths.storeDir, 'global.json')
  const first = JSON.parse(readFileSync(path, 'utf8'))
  set(hub, { layer: 'global' }, false)
  const second = JSON.parse(readFileSync(path, 'utf8'))
  assert.ok(second.gateRevisions[id] > first.gateRevisions[id])
  writeFileSync(path, JSON.stringify({ ...second, gateRevisions: { [id]: 'not-a-number' } }))
  assert.throws(() => hub.catalog(), /visibility document revision/)
})

test('client exposes only switches and on/off bulk actions, not inheritance controls', () => {
  for (const file of ['SkillHubPanel.tsx', 'McpPanel.tsx']) {
    const source = readFileSync(new URL(`../src/client/${file}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /onInherit|allInherit|inherit\.(?:action|resetHint|thisLayerHint)|override\.(?:badge|here)|legacy\.snapshot/)
    assert.match(source, /GateSwitch/)
  }
})
