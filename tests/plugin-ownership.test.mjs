import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { resolveCatalog } from '../lib/types/catalog.js'

test('plugin registrations never enter the disk-skill catalog, even with legacy host notes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-ownership-'))
  const agentHome = join(root, 'agent')
  const dshHome = join(root, 'dsh')
  await mkdir(agentHome)
  await mkdir(dshHome)
  const catalog = resolveCatalog({ agentHome, dshHome,
    global: { version: 2, default: 'off', gates: {} },
    hostSkills: [{ name: 'resume-codex', description: 'Resume', provider: 'dsh-resume', path: '', directory: '' }],
  })
  assert.deepEqual(catalog.inventory, [])
  assert.deepEqual(catalog.tree.map(home => home.home), ['agent', 'dsh'])
})

test('one disabled disk skill does not override the explicit default for other skills', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-default-'))
  const agentHome = join(root, 'agent')
  const dshHome = join(root, 'dsh')
  await mkdir(dshHome)
  for (const name of ['disabled', 'untouched']) {
    await mkdir(join(agentHome, name), { recursive: true })
    await writeFile(join(agentHome, name, 'SKILL.md'), `---\nname: ${name}\ndescription: Test\n---\nBody.`)
  }
  const catalog = resolveCatalog({ agentHome, dshHome,
    global: { version: 2, default: 'on', gates: { 'agent:disabled/SKILL.md': 'off' } },
  })
  assert.deepEqual(catalog.offered.map(skill => skill.name), ['untouched'])
})
