import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  resolveCatalog,
  skillId,
  VisibilityDocument,
} from '../lib/types/catalog.js'

async function skillFile(dir, name, description = `${name} desc`) {
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: ${description}\n---\n\nBody for ${name}.\n`)
}

test('nested pack and home-root skill', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'writing', 'essays'), 'essays')
  await mkdir(agent, { recursive: true })
  await writeFile(join(agent, 'legacy.md'), '---\nname: legacy\ndescription: flat\n---\n\nFlat.\n')
  await mkdir(dsh, { recursive: true })
  const catalog = resolveCatalog({ agentHome: agent, dshHome: dsh })
  const names = catalog.offered.map(skill => skill.name).sort()
  assert.deepEqual(names, ['essays', 'legacy'])
  const agentHome = catalog.tree.find(home => home.home === 'agent')
  assert.ok(agentHome.children.some(node => node.kind === 'pack' && node.name === 'writing'))
  assert.ok(agentHome.children.some(node => node.kind === 'root-skill' && node.name === 'legacy'))
})

test('group off hides descendants from offered and keeps tree rows', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'writing', 'essays'), 'essays')
  await skillFile(join(agent, 'writing', 'blog'), 'blog')
  await skillFile(join(agent, 'code', 'tdd'), 'tdd')
  await mkdir(dsh, { recursive: true })
  const essayId = skillId('agent', 'writing/essays/SKILL.md')
  const blogId = skillId('agent', 'writing/blog/SKILL.md')
  const catalog = resolveCatalog({
    agentHome: agent,
    dshHome: dsh,
    session: VisibilityDocument.off([essayId, blogId]),
  })
  assert.deepEqual(catalog.offered.map(skill => skill.name), ['tdd'])
  const writing = catalog.tree[0].children.find(node => node.kind === 'pack' && node.name === 'writing')
  assert.equal(writing.gate, 'off')
  assert.equal(writing.children.length, 2)
  const hidden = catalog.inventory.filter(skill => skill.gate === 'off')
  assert.deepEqual(hidden.map(skill => skill.name).sort(), ['blog', 'essays'])
  assert.ok(hidden.every(skill => skill.invocation.modelInvocable === false && skill.invocation.userInvocable === false))
})

test('leaf off and all on', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'writing', 'essays'), 'essays')
  await skillFile(join(agent, 'writing', 'blog'), 'blog')
  await mkdir(dsh, { recursive: true })
  const essayId = skillId('agent', 'writing/essays/SKILL.md')
  const offOne = resolveCatalog({
    agentHome: agent,
    dshHome: dsh,
    project: VisibilityDocument.off([essayId]),
  })
  assert.deepEqual(offOne.offered.map(skill => skill.name).sort(), ['blog'])
  const writing = offOne.tree[0].children.find(node => node.kind === 'pack' && node.name === 'writing')
  assert.equal(writing.gate, 'mixed')
  const allOn = resolveCatalog({ agentHome: agent, dshHome: dsh })
  assert.equal(allOn.offered.length, 2)
})

test('Chat overrides win while untouched Skills inherit Project and Global', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'writing', 'essays'), 'essays')
  await skillFile(join(agent, 'code', 'tdd'), 'tdd')
  await mkdir(dsh, { recursive: true })
  const essayId = skillId('agent', 'writing/essays/SKILL.md')
  const chat = VisibilityDocument.off([essayId])
  const resolved = resolveCatalog({
    agentHome: agent,
    dshHome: dsh,
    global: VisibilityDocument.global('off'),
    project: VisibilityDocument.on([essayId]),
    session: chat,
  })
  assert.deepEqual(resolved.offered, [])
  assert.equal(resolved.inventory.find(skill => skill.name === 'essays').source, 'session')
  assert.equal(resolved.inventory.find(skill => skill.name === 'tdd').source, 'global')
})

test('collision lists both homes and keeps both offered', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'pack-a', 'tdd'), 'tdd', 'agent tdd')
  await skillFile(join(dsh, 'pack-b', 'tdd'), 'tdd', 'dsh tdd')
  const catalog = resolveCatalog({ agentHome: agent, dshHome: dsh })
  assert.equal(catalog.offered.length, 2)
  assert.equal(catalog.collisions.length, 1)
  assert.equal(catalog.collisions[0].name, 'tdd')
  assert.equal(catalog.collisions[0].skills.length, 2)
})

test('dangling pack symlink is broken', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await mkdir(agent, { recursive: true })
  await mkdir(dsh, { recursive: true })
  await symlink(join(root, 'missing-pack'), join(agent, 'gone'))
  const catalog = resolveCatalog({ agentHome: agent, dshHome: dsh })
  assert.equal(catalog.offered.length, 0)
  assert.ok(catalog.broken.some(entry => entry.reason.kind === 'missing-symlink-target'))
})

test('keeps a pack whose SKILL.md name is not kebab-case', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await mkdir(join(agent, 'pstack-poteto-mode', 'playbooks'), { recursive: true })
  await writeFile(
    join(agent, 'pstack-poteto-mode', 'SKILL.md'),
    '---\nname: Poteto Mode\ndescription: poteto style\ndisable-model-invocation: true\n---\n\nBody.\n',
  )
  await writeFile(join(agent, 'pstack-poteto-mode', 'playbooks', 'feature.md'), '# feature\n')
  await mkdir(dsh, { recursive: true })
  const catalog = resolveCatalog({ agentHome: agent, dshHome: dsh })
  const pack = catalog.tree[0].children.find(node => node.kind === 'pack' && node.name === 'pstack-poteto-mode')
  assert.equal(pack.kind, 'pack')
  assert.equal(pack.skill.name, 'Poteto Mode')
  assert.equal(pack.skill.gate, 'on')
  assert.equal(catalog.offered.some(skill => skill.name === 'Poteto Mode'), false)
  assert.equal(catalog.broken.some(entry => entry.path.includes('pstack-poteto-mode')), false)
})

test('prunes folders that do not contain a SKILL.md', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'ask-matt'), 'ask-matt')
  await mkdir(join(agent, 'ask-matt', 'agents'), { recursive: true })
  await writeFile(join(agent, 'ask-matt', 'agents', 'openai.yaml'), 'model: x\n')
  await mkdir(dsh, { recursive: true })
  const catalog = resolveCatalog({ agentHome: agent, dshHome: dsh })
  const pack = catalog.tree[0].children.find(node => node.kind === 'pack' && node.name === 'ask-matt')
  assert.equal(pack.children.length, 0)
  assert.equal(pack.skill.name, 'ask-matt')
})

test('regroups symlink packs by author skills folders', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const vendor = join(root, 'mattpocock-skills', 'skills')
  await skillFile(join(vendor, 'engineering', 'ask-matt'), 'ask-matt')
  await skillFile(join(vendor, 'productivity', 'grill-me'), 'grill-me')
  await skillFile(join(root, 'pstack', 'skills', 'how'), 'how')
  await mkdir(agent, { recursive: true })
  await mkdir(dsh, { recursive: true })
  await symlink(join(vendor, 'engineering', 'ask-matt'), join(agent, 'ask-matt'))
  await symlink(join(vendor, 'productivity', 'grill-me'), join(agent, 'grill-me'))
  await symlink(join(root, 'pstack', 'skills', 'how'), join(agent, 'pstack-how'))
  await skillFile(join(agent, 'orca-cli'), 'orca-cli')
  const catalog = resolveCatalog({ agentHome: agent, dshHome: dsh })
  const names = catalog.tree[0].children.map(node => node.name)
  assert.deepEqual(names, ['mattpocock-skills', 'orca-cli', 'pstack'])
  const matt = catalog.tree[0].children.find(node => node.kind === 'pack' && node.name === 'mattpocock-skills')
  const cats = matt.children.filter(child => child.kind === 'group').map(child => child.name).sort()
  assert.deepEqual(cats, ['engineering', 'productivity'])
  const engineering = matt.children.find(child => child.kind === 'group' && child.name === 'engineering')
  assert.equal(engineering.children[0].name, 'ask-matt')
  assert.equal(engineering.children[0].rel, 'engineering/ask-matt')
  const pstack = catalog.tree[0].children.find(node => node.kind === 'pack' && node.name === 'pstack')
  assert.equal(pstack.children[0].name, 'how')
  const orca = catalog.tree[0].children.find(node => node.kind === 'pack' && node.name === 'orca-cli')
  assert.equal(orca.skill.name, 'orca-cli')
})

test('keeps nested skill folders as groups', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'writing', 'essays'), 'essays')
  await skillFile(join(agent, 'writing', 'notes', 'drafts'), 'drafts')
  await mkdir(join(agent, 'writing', 'assets'), { recursive: true })
  await writeFile(join(agent, 'writing', 'assets', 'logo.png'), 'x')
  await mkdir(dsh, { recursive: true })
  const catalog = resolveCatalog({ agentHome: agent, dshHome: dsh })
  const writing = catalog.tree[0].children.find(node => node.kind === 'pack' && node.name === 'writing')
  const names = writing.children.filter(child => child.kind === 'group').map(child => child.name).sort()
  assert.deepEqual(names, ['essays', 'notes'])
  const notes = writing.children.find(child => child.kind === 'group' && child.name === 'notes')
  assert.equal(notes.children[0].name, 'drafts')
})

test('ignores .git and node_modules and does not scan a sibling project skills dir', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const project = join(root, 'workspace', '.agents', 'skills', 'sneaky')
  await skillFile(join(agent, 'ok', 'visible'), 'visible')
  await skillFile(join(agent, '.git', 'hidden'), 'hidden-git')
  await skillFile(join(agent, 'node_modules', 'hidden'), 'hidden-nm')
  await skillFile(project, 'sneaky')
  await mkdir(dsh, { recursive: true })
  const catalog = resolveCatalog({ agentHome: agent, dshHome: dsh })
  assert.deepEqual(catalog.offered.map(skill => skill.name), ['visible'])
})
