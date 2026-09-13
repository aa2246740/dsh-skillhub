import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (name) => readFileSync(join(root, name), 'utf8')

test('declares dsh.bundle.patch so add joins the profile layer stack', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.match(read('cordis.patch.yml'), /name:\s*dsh-skillhub/)
  assert.doesNotMatch(read('cordis.patch.yml'), /name:\s*['"]?\.\//)
})

test('points the Host at committed JS, not TypeScript source', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.main, 'lib/dsh-skillhub.js')
  assert.equal(pkg.exports['.'].default, './lib/dsh-skillhub.js')
  assert.equal(pkg.exports['./client'].default, './lib/client.js')
  assert.equal(pkg.dsh.client.entry, './lib/client.js')
  assert.equal(pkg.scripts.prepare, undefined)
  assert.ok(pkg.files.includes('lib/*.js') || pkg.files.includes('lib/dsh-skillhub.js'))
  assert.ok(pkg.files.includes('cordis.patch.yml'))
})

test('ships a loadable Host entry with named apply / name / inject', () => {
  const host = read('lib/dsh-skillhub.js')
  assert.match(host, /\bexport\b[\s\S]*\bapply\b/)
  assert.match(host, /\bexport\b[\s\S]*\bname\b/)
  assert.match(host, /\bexport\b[\s\S]*\binject\b/)
  assert.match(host, /\[my-plugins\/dsh-skillhub\] loaded/)
  assert.doesNotMatch(host, /from ['"]\.\/.*\.ts['"]/)
})

test('ships the prebuilt web client without machine paths', () => {
  const client = read('lib/client.js')
  assert.match(client, /dsh-skillhub/)
  assert.match(client, /__ModuleLoader__/)
  assert.doesNotMatch(client, /(?:^|[\s"'`=(])(?:\/(?:Users|home|opt|var|tmp|private|agent)\/|[A-Za-z]:\\)/)
})

test('leads the README with the official one-liner', () => {
  const lead = read('README.md').slice(0, 600)
  assert.match(lead, /dsh plugin --profile web add github:aa2246740\/dsh-skillhub/)
  assert.match(lead, /pnpm/)
  assert.doesNotMatch(lead, /dshx|my-plugins|DSHX|activate-new-client/)
})

test('pnpm pack stages the stock bundle files', () => {
  const packed = spawnSync('pnpm', ['pack', '--dry-run'], {
    cwd: root,
    encoding: 'utf8',
  })
  assert.equal(packed.status, 0, packed.stderr || packed.stdout)
  const listing = `${packed.stdout}\n${packed.stderr}`
  assert.match(listing, /lib\/dsh-skillhub\.js/)
  assert.match(listing, /lib\/client\.js/)
  assert.match(listing, /cordis\.patch\.yml/)
})
