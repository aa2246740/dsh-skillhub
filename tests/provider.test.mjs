import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { skillId } from '../lib/types/catalog.js'
import { SkillHub } from '../lib/types/hub.js'
import { createSkillHubProvider, providerSkillsFromCatalog } from '../lib/types/provider.js'

async function skillFile(dir, name, description = `${name} desc`) {
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: ${description}\n---\n\nBody.\n`)
}

test('off skills stay listed as not invocable so another provider cannot refill them', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-provider-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'ask-matt'), 'ask-matt')
  await mkdir(dsh, { recursive: true })
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  hub.toggle({
    layer: 'session',
    sessionId: 's1',
    target: { kind: 'skill', id: skillId('agent', 'ask-matt/SKILL.md'), on: false },
  })
  const provider = createSkillHubProvider(hub)
  const listed = await provider.list({
    cwd: root,
    scope: { session: { id: 's1' } },
  })
  assert.equal(listed.length, 1)
  assert.equal(listed[0].name, 'ask-matt')
  assert.deepEqual(listed[0].invocation, { modelInvocable: false, userInvocable: false })
  assert.equal(listed[0].provider, 'skillhub')
})

test('an on sibling wins the name when the other home is off', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-provider-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await skillFile(join(agent, 'tdd'), 'tdd', 'agent tdd')
  await skillFile(join(dsh, 'tdd'), 'tdd', 'dsh tdd')
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  const catalog = hub.toggle({
    layer: 'global',
    target: { kind: 'skill', id: skillId('dsh', 'tdd/SKILL.md'), on: false },
  })
  const selected = providerSkillsFromCatalog(catalog)
  assert.equal(selected.length, 1)
  assert.equal(selected[0].home, 'agent')
  assert.equal(selected[0].gate, 'on')
  assert.equal(selected[0].invocation.userInvocable, true)
})
