import assert from 'node:assert/strict'
import { access, mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import test from 'node:test'
import { SkillHub } from '../lib/types/hub.js'
import { handleSkillHubHttp } from '../lib/types/http.js'

function request(path, body, method = 'POST') {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))])
  req.method = method
  req.url = path
  req.headers = { host: '127.0.0.1' }
  return req
}

function response() {
  const result = { status: 0, body: '' }
  return {
    result,
    writeHead(status) { result.status = status },
    end(body) { result.body = String(body) },
  }
}

test('the retired delete route cannot remove a Skill pack', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-http-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  const pack = join(agent, 'keep-me')
  await mkdir(pack, { recursive: true })
  await mkdir(dsh, { recursive: true })
  await writeFile(join(pack, 'SKILL.md'), '---\nname: keep-me\ndescription: keep me\n---\n')
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  let invalidations = 0
  const handle = handleSkillHubHttp(hub, () => { invalidations += 1 }, () => undefined)
  const res = response()

  await handle(request('/skillhub/delete', {
    home: 'agent',
    name: 'keep-me',
    confirmPath: pack,
  }), res)

  assert.equal(res.result.status, 404)
  assert.deepEqual(JSON.parse(res.result.body), { error: 'not found' })
  assert.equal(invalidations, 0)
  await access(join(pack, 'SKILL.md'))
})

test('an unauthenticated mutation is rejected before SkillHub changes state', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-http-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await mkdir(join(agent, 'keep-me'), { recursive: true })
  await mkdir(dsh, { recursive: true })
  await writeFile(join(agent, 'keep-me', 'SKILL.md'), '---\nname: keep-me\ndescription: keep me\n---\n')
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  let invalidations = 0
  const handle = handleSkillHubHttp(hub, () => { invalidations += 1 }, () => 401)
  const res = response()
  await handle(request('/skillhub/toggle', { layer: 'global', kind: 'all', on: false }), res)
  assert.equal(res.result.status, 401)
  assert.equal(invalidations, 0)
  assert.equal(hub.catalog({}).offered.length, 1)
})

test('the SkillHub catalog requires existing Host authentication', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-http-'))
  const agent = join(root, 'agent')
  const dsh = join(root, 'dsh')
  await mkdir(join(agent, 'keep-me'), { recursive: true })
  await mkdir(dsh, { recursive: true })
  await writeFile(join(agent, 'keep-me', 'SKILL.md'), '---\nname: keep-me\ndescription: keep me\n---\n')
  const hub = new SkillHub({ agentHome: agent, dshHome: dsh, storeDir: join(root, 'store') })
  const rejected = handleSkillHubHttp(hub, () => {}, () => 401)
  const rejectedRes = response()

  await rejected(request('/skillhub/catalog', undefined, 'GET'), rejectedRes)

  assert.equal(rejectedRes.result.status, 401)

  const allowed = handleSkillHubHttp(hub, () => {}, () => undefined)
  const allowedRes = response()
  await allowed(request('/skillhub/catalog', undefined, 'GET'), allowedRes)

  assert.equal(allowedRes.result.status, 200)
  assert.equal(JSON.parse(allowedRes.result.body).offered.length, 1)
})

test('MCP routes enforce authentication and validate writes before dispatch', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skillhub-mcp-http-'))
  const hub = new SkillHub({agentHome:join(root,'agent'),dshHome:join(root,'dsh'),storeDir:join(root,'store')})
  let writes=0
  const mcp={catalog:()=>({servers:[]}),mutate:()=>{writes++;return {servers:[]}}}
  let handle=handleSkillHubHttp(hub,()=>{},()=>401,mcp)
  let res=response()
  await handle(request('/skillhub/mcp/toggle',{layer:'global',server:'all',on:false}),res)
  assert.equal(res.result.status,401);assert.equal(writes,0)
  handle=handleSkillHubHttp(hub,()=>{},()=>undefined,mcp)
  res=response()
  await handle(request('/skillhub/mcp/toggle',{layer:'invalid',server:'all',on:false}),res)
  assert.equal(res.result.status,400);assert.equal(writes,0)
  res=response()
  await handle(request('/skillhub/mcp/toggle',{layer:'global',server:'all',on:false}),res)
  assert.equal(res.result.status,200);assert.equal(writes,1)
})
