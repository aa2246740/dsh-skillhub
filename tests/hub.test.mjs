import assert from 'node:assert/strict'
import { mkdtemp, mkdir, symlink, writeFile } from 'node:fs/promises'
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

test('project toggle is visible on the project layer and leaves the session snapshot on', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const folder = join(root, 'project')
  await skillFile(join(agent, 'ask-matt'), 'ask-matt')
  await mkdir(dsh, { recursive: true })
  await mkdir(folder, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  const sessionId = 'session-project-toggle'
  hub.catalog({ sessionId, folder, layer: 'session' })
  const after = hub.toggle({
    layer: 'project',
    sessionId,
    folder,
    target: { kind: 'skill', id: skillId('agent', 'ask-matt/SKILL.md'), on: false },
  })
  assert.deepEqual(after.offered, [])
  const pack = after.tree[0].children.find(node => node.kind === 'pack' && node.name === 'ask-matt')
  assert.equal(pack.skill.gate, 'off')
  const sessionView = hub.catalog({ sessionId, folder, layer: 'session' })
  assert.deepEqual(sessionView.offered.map(skill => skill.name), ['ask-matt'])
  const globalView = hub.catalog({ sessionId, folder, layer: 'global' })
  assert.deepEqual(globalView.offered.map(skill => skill.name), ['ask-matt'])
})

test('global toggle is visible on the global layer and leaves the session snapshot on', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-hub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const folder = join(root, 'project')
  await skillFile(join(agent, 'ask-matt'), 'ask-matt')
  await mkdir(dsh, { recursive: true })
  await mkdir(folder, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  const sessionId = 'session-global-toggle'
  hub.catalog({ sessionId, folder, layer: 'session' })
  const after = hub.toggle({
    layer: 'global',
    sessionId,
    folder,
    target: { kind: 'skill', id: skillId('agent', 'ask-matt/SKILL.md'), on: false },
  })
  assert.deepEqual(after.offered, [])
  const sessionView = hub.catalog({ sessionId, folder, layer: 'session' })
  assert.deepEqual(sessionView.offered.map(skill => skill.name), ['ask-matt'])
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
