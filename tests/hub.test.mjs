import assert from 'node:assert/strict'
import { access, mkdtemp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { SkillHub } from '../lib/types/hub.js'
import { skillId } from '../lib/types/catalog.js'

async function skillFile(dir, name) {
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: ${name} desc\n---\n\nBody.\n`)
}

test('nested folder toggle turns off only that branch', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'writing', 'essays'), 'essays')
  await skillFile(join(agent, 'writing', 'notes', 'drafts'), 'drafts')
  await mkdir(dsh, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  const after = hub.toggle({
    layer: 'global',
    target: { kind: 'group', packHome: 'agent', packName: 'writing', rel: 'writing/notes', on: false },
  })
  const names = after.offered.map(skill => skill.name).sort()
  assert.deepEqual(names, ['essays'])
  const writing = after.tree[0].children.find(node => node.kind === 'pack' && node.name === 'writing')
  assert.equal(writing.gate, 'mixed')
  const notes = writing.children.find(child => child.kind === 'group' && child.name === 'notes')
  assert.equal(notes.gate, 'off')
  const essays = writing.children.find(child => child.kind === 'group' && child.name === 'essays')
  assert.equal(essays.gate, 'on')
})

test('pack toggle turns off every nested skill', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'writing', 'essays'), 'essays')
  await skillFile(join(agent, 'writing', 'notes', 'drafts'), 'drafts')
  await mkdir(dsh, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  const after = hub.toggle({
    layer: 'global',
    target: { kind: 'group', packHome: 'agent', packName: 'writing', rel: 'writing', on: false },
  })
  assert.deepEqual(after.offered, [])
  const writing = after.tree[0].children.find(node => node.kind === 'pack' && node.name === 'writing')
  assert.equal(writing.gate, 'off')
})

test('author folder toggle turns off that category only', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const vendor = join(root, 'mattpocock-skills', 'skills')
  await skillFile(join(vendor, 'engineering', 'ask-matt'), 'ask-matt')
  await skillFile(join(vendor, 'productivity', 'grill-me'), 'grill-me')
  await mkdir(agent, { recursive: true })
  await mkdir(dsh, { recursive: true })
  await symlink(join(vendor, 'engineering', 'ask-matt'), join(agent, 'ask-matt'))
  await symlink(join(vendor, 'productivity', 'grill-me'), join(agent, 'grill-me'))
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  const after = hub.toggle({
    layer: 'global',
    target: { kind: 'group', packHome: 'agent', packName: 'mattpocock-skills', rel: 'engineering', on: false },
  })
  assert.deepEqual(after.offered.map(skill => skill.name), ['grill-me'])
  const matt = after.tree[0].children.find(node => node.kind === 'pack' && node.name === 'mattpocock-skills')
  assert.equal(matt.gate, 'mixed')
  const engineering = matt.children.find(child => child.kind === 'group' && child.name === 'engineering')
  assert.equal(engineering.gate, 'off')
})

test('pack with only its own SKILL.md toggles that skill', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'ask-matt'), 'ask-matt')
  await mkdir(join(agent, 'ask-matt', 'agents'), { recursive: true })
  await mkdir(dsh, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  const after = hub.toggle({
    layer: 'global',
    target: { kind: 'group', packHome: 'agent', packName: 'ask-matt', rel: 'ask-matt', on: false },
  })
  assert.deepEqual(after.offered, [])
  const pack = after.tree[0].children.find(node => node.kind === 'pack' && node.name === 'ask-matt')
  assert.equal(pack.gate, 'off')
  assert.equal(pack.skill.gate, 'off')
})

test('ids toggle turns off listed skills only', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'writing', 'essays'), 'essays')
  await skillFile(join(agent, 'writing', 'notes', 'drafts'), 'drafts')
  await mkdir(dsh, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  const after = hub.toggle({
    layer: 'global',
    target: {
      kind: 'ids',
      ids: [skillId('agent', 'writing/notes/drafts/SKILL.md')],
      on: false,
    },
  })
  assert.deepEqual(after.offered.map(skill => skill.name), ['essays'])
})

test('a pack added after a sparse global off stays off', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'tdd'), 'tdd')
  await mkdir(dsh, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  hub.toggle({
    layer: 'global',
    target: { kind: 'skill', id: skillId('agent', 'tdd/SKILL.md'), on: false },
  })
  await skillFile(join(agent, 'write-natural-chinese'), 'write-natural-chinese')
  const later = hub.catalog()
  assert.equal(later.offered.some(skill => skill.name === 'write-natural-chinese'), false)
  assert.equal(later.inventory.find(skill => skill.name === 'write-natural-chinese').gate, 'off')
})

test('home toggle turns off every skill in that home', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'ask-matt'), 'ask-matt')
  await skillFile(join(dsh, 'only-dsh'), 'only-dsh')
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  const after = hub.toggle({
    layer: 'global',
    target: { kind: 'home', home: 'agent', on: false },
  })
  assert.deepEqual(after.offered.map(skill => skill.name), ['only-dsh'])
})

test('Global, Project, and Chat form an inheritance chain with explicit overrides', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const folder = join(root, 'project')
  await skillFile(join(agent, 'ask-matt'), 'ask-matt')
  await mkdir(dsh, { recursive: true })
  await mkdir(folder, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  const sessionId = 'session-inheritance'
  const id = skillId('agent', 'ask-matt/SKILL.md')

  hub.toggle({
    layer: 'global',
    target: { kind: 'skill', id, on: false },
  })
  let session = hub.catalog({ sessionId, folder, layer: 'session' })
  assert.deepEqual(session.offered, [])
  assert.equal(session.inventory[0].source, 'global')

  hub.toggle({
    layer: 'project',
    folder,
    target: { kind: 'skill', id, on: true },
  })
  session = hub.catalog({ sessionId, folder, layer: 'session' })
  assert.deepEqual(session.offered.map(skill => skill.name), ['ask-matt'])
  assert.equal(session.inventory[0].source, 'project')

  hub.toggle({
    layer: 'session',
    sessionId,
    folder,
    target: { kind: 'skill', id, on: false },
  })
  session = hub.catalog({ sessionId, folder, layer: 'session' })
  assert.deepEqual(session.offered, [])
  assert.equal(session.inventory[0].source, 'session')

  session = hub.inherit({
    layer: 'session',
    sessionId,
    folder,
    target: { kind: 'skill', id },
  })
  assert.deepEqual(session.offered.map(skill => skill.name), ['ask-matt'])
  assert.equal(session.inventory[0].source, 'project')

  session = hub.inherit({
    layer: 'project',
    folder,
    target: { kind: 'skill', id },
  })
  assert.deepEqual(session.offered, [])
  assert.equal(session.inventory[0].source, 'global')
})

test('Global All off also covers Skills added later', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const store = join(root, 'store')
  await skillFile(join(agent, 'first'), 'first')
  await mkdir(dsh, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: store })
  hub.toggle({ layer: 'global', target: { kind: 'all', on: false } })
  await skillFile(join(agent, 'later'), 'later')
  assert.deepEqual(hub.catalog({ layer: 'global' }).offered, [])
  const saved = JSON.parse(await readFile(join(store, 'global.json'), 'utf8'))
  assert.equal(saved.version, 2)
  assert.equal(saved.default, 'off')
  assert.deepEqual(saved.gates, {})
})

test('Project All off covers future Skills and one Skill can resume following Global', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const folder = join(root, 'project')
  await skillFile(join(agent, 'first'), 'first')
  await mkdir(dsh, { recursive: true })
  await mkdir(folder, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  hub.toggle({ layer: 'project', folder, target: { kind: 'all', on: false } })
  await skillFile(join(agent, 'later'), 'later')
  let project = hub.catalog({ layer: 'project', folder })
  assert.deepEqual(project.offered, [])
  const later = skillId('agent', 'later/SKILL.md')
  project = hub.inherit({ layer: 'project', folder, target: { kind: 'skill', id: later } })
  assert.deepEqual(project.offered.map(skill => skill.name), ['later'])
  assert.equal(project.inventory.find(skill => skill.id === later).source, 'global')
})

test('a new Chat follows parent changes without creating a snapshot document', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const store = join(root, 'store')
  const folder = join(root, 'project')
  const sessionId = 'new-following-chat'
  await skillFile(join(agent, 'ask-matt'), 'ask-matt')
  await mkdir(dsh, { recursive: true })
  await mkdir(folder, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: store })
  assert.equal(hub.catalog({ layer: 'session', sessionId, folder }).offered.length, 1)
  await assert.rejects(access(join(store, 'sessions', `${sessionId}.json`)))
  hub.toggle({ layer: 'global', target: { kind: 'all', on: false } })
  assert.deepEqual(hub.catalog({ layer: 'session', sessionId, folder }).offered, [])
})

test('a legacy Chat snapshot stays explicit until the user restores inheritance', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const store = join(root, 'store')
  const folder = join(root, 'project')
  const sessionId = 'legacy-chat'
  const id = skillId('agent', 'ask-matt/SKILL.md')
  await skillFile(join(agent, 'ask-matt'), 'ask-matt')
  await skillFile(join(agent, 'later'), 'later')
  await mkdir(dsh, { recursive: true })
  await mkdir(folder, { recursive: true })
  await mkdir(join(store, 'sessions'), { recursive: true })
  await writeFile(join(store, 'global.json'), JSON.stringify({ gates: { [id]: 'off' } }))
  await writeFile(join(store, 'sessions', `${sessionId}.json`), JSON.stringify({ gates: { [id]: 'on' } }))
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: store })
  let session = hub.catalog({ layer: 'session', sessionId, folder })
  assert.equal(session.legacySessionSnapshot, true)
  assert.equal(session.inventory.find(skill => skill.id === id).source, 'session')
  assert.equal(session.inventory.find(skill => skill.name === 'later').source, 'session')
  assert.deepEqual(session.offered.map(skill => skill.name).sort(), ['ask-matt', 'later'])
  session = hub.resetSession(sessionId, folder)
  assert.equal(session.legacySessionSnapshot, undefined)
  assert.deepEqual(session.offered.map(skill => skill.name), [])
  assert.equal(session.inventory.find(skill => skill.id === id).source, 'global')
  assert.equal(session.inventory.find(skill => skill.name === 'later').source, 'global')
  assert.equal(session.inventory.find(skill => skill.name === 'later').gate, 'off')
})

test('a sparse Global document turns unlisted Skills off', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const store = join(root, 'store')
  const off = skillId('agent', 'off/SKILL.md')
  await skillFile(join(agent, 'off'), 'off')
  await skillFile(join(agent, 'untouched'), 'untouched')
  await mkdir(dsh, { recursive: true })
  await mkdir(store, { recursive: true })
  await writeFile(join(store, 'global.json'), JSON.stringify({ gates: { [off]: 'off' } }))
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: store })
  const global = hub.catalog({ layer: 'global' })
  assert.deepEqual(global.offered.map(skill => skill.name), [])
  assert.equal(global.inventory.find(skill => skill.name === 'untouched').gate, 'off')
})

test('invalid scope requests fail instead of writing another layer', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const store = join(root, 'store')
  await skillFile(join(agent, 'ask-matt'), 'ask-matt')
  await mkdir(dsh, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: store })
  assert.throws(() => hub.toggle({
    layer: 'project',
    target: { kind: 'all', on: false },
  }), /folder required/)
  assert.throws(() => hub.toggle({
    layer: 'project',
    folder: '   ',
    target: { kind: 'all', on: false },
  }), /folder required/)
  assert.throws(() => hub.toggle({
    layer: 'session',
    target: { kind: 'all', on: false },
  }), /sessionId required/)
  assert.throws(() => hub.toggle({
    layer: 'session',
    sessionId: '../escape',
    target: { kind: 'all', on: false },
  }), /invalid sessionId/)
  await assert.rejects(access(join(store, 'global.json')))
  await assert.rejects(access(join(store, 'escape.json')))
})

test('a malformed visibility document fails closed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const store = join(root, 'store')
  await skillFile(join(agent, 'ask-matt'), 'ask-matt')
  await mkdir(dsh, { recursive: true })
  await mkdir(store, { recursive: true })
  await writeFile(join(store, 'global.json'), '{broken')
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: store })
  assert.throws(() => hub.catalog({ layer: 'global' }), /Invalid SkillHub visibility document/)
})

test('leaf toggle does not turn off siblings', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'writing', 'essays'), 'essays')
  await skillFile(join(agent, 'writing', 'notes', 'drafts'), 'drafts')
  await mkdir(dsh, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  const after = hub.toggle({
    layer: 'global',
    target: { kind: 'skill', id: skillId('agent', 'writing/essays/SKILL.md'), on: false },
  })
  assert.deepEqual(after.offered.map(skill => skill.name), ['drafts'])
})
