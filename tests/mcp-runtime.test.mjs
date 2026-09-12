import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { McpHub } from '../lib/types/mcp.js'
import { installMcpVisibility, liveMcpServers } from '../lib/types/mcp-runtime.js'
const harness = process.env.DSHX_HARNESS
const skipHarness = !harness
const req = skipHarness ? undefined : createRequire(join(harness, 'apps/cli/package.json'))
const { Context } = skipHarness ? { Context: undefined } : await import(pathToFileURL(req.resolve('@deepseek-ai/cordis')))
const load = path => import(pathToFileURL(join(harness, 'packages', path, 'lib/index.js')))
const SystemPrompt = skipHarness ? undefined : (await load('core/system-prompt')).default
const ToolRuntime = skipHarness ? undefined : (await load('core/tools')).default
const createScope = skipHarness ? undefined : (await load('core/scope')).createScope
const tool = name => ({name,description:name,parameters:{type:'object',properties:{}},output:{schema:{type:'string'},render:(_,v)=>[{type:'text',text:v}]},async execute(){return 'ok'}})

test('actual Cordis hides, restores, handles late tools/reconnect and cleans up HMR', { skip: skipHarness }, async()=>{
 const ctx=new Context(); const dir=mkdtempSync(join(tmpdir(),'skillhub-cordis-'))
 try {
  await ctx.plugin(SystemPrompt,{}); await ctx.plugin(ToolRuntime)
  const hub=new McpHub({storeDir:dir})
  const agents=[]
  for(const id of ['one','two']) {
   const agent={id,session:{id,header:{cwd:'/test'}}}
   await ctx.plugin(Object.assign(inner=>{agent.ctx=createScope(inner,agent).ctx},{inject:['tools','systemPrompt']}))
   agents.push(agent)
  }
  await ctx.plugin({name:'mcp-client',apply(){}},{serverName:'demo'})
  assert.deepEqual(liveMcpServers(ctx),['demo'])
  let disposeTool=ctx.tools.register(tool('mcp__demo__first'))
  let runtime
  const plugin=await ctx.plugin({inject:['tools'],apply(inner){runtime=installMcpVisibility(inner,hub)}})
  agents.forEach(a=>runtime.attach(a))
  runtime.mutate({layer:'session',sessionId:'one',folder:'/test'},'demo',false)
  assert.equal(ctx.tools.get('mcp__demo__first',agents[0]),undefined)
  assert.ok(ctx.tools.get('mcp__demo__first',agents[1]))
  ctx.tools.register(tool('mcp__demo__late'))
  assert.equal(ctx.tools.get('mcp__demo__late',agents[0]),undefined)
  disposeTool(); disposeTool=ctx.tools.register(tool('mcp__demo__first'))
  assert.equal(ctx.tools.get('mcp__demo__first',agents[0]),undefined)
  runtime.mutate({layer:'session',sessionId:'one',folder:'/test'},'demo',true)
  assert.ok(ctx.tools.get('mcp__demo__first',agents[0]))
  runtime.mutate({layer:'global'},'demo',false)
  assert.equal(ctx.tools.get('mcp__demo__late',agents[1]),undefined)
  runtime.mutate({layer:'session',sessionId:'one',folder:'/test'},'demo')
  assert.equal(ctx.tools.get('mcp__demo__first',agents[0]),undefined)
  await plugin.dispose()
  assert.ok(ctx.tools.get('mcp__demo__first',agents[0]))
  const second=await ctx.plugin({inject:['tools'],apply(inner){runtime=installMcpVisibility(inner,hub)}})
  agents.forEach(a=>runtime.attach(a))
  assert.equal(ctx.tools.get('mcp__demo__first',agents[0]),undefined)
  agents[0].ctx.tools.register(tool('mcp__demo__local'))
  assert.equal(runtime.catalog({layer:'global'}).servers[0].supported,false)
  assert.throws(()=>runtime.mutate({layer:'global'},'demo',false),/Cannot fully hide/)
  await second.dispose()
 } finally { await ctx.fiber.dispose(); rmSync(dir,{recursive:true,force:true}) }
})

test('real stdio MCP connection remains live while one session hides its tools', { skip: skipHarness }, async()=>{
 const ctx=new Context(); const dir=mkdtempSync(join(tmpdir(),'skillhub-mcp-wire-'))
 try {
  await ctx.plugin(SystemPrompt,{}); await ctx.plugin(ToolRuntime)
  const MCP=await load('mcp/mcp-client')
  await ctx.plugin(MCP, {serverName:'fixture',transport:'stdio',command:process.execPath,args:[join(harness,'packages/mcp/mcp-client/tests/fixture-server.ts')],failOnStartupError:true})
  const agent={id:'wire',session:{id:'wire',header:{cwd:'/test'}}}
  await ctx.plugin(Object.assign(inner=>{agent.ctx=createScope(inner,agent).ctx},{inject:['tools','systemPrompt']}))
  let runtime
  await ctx.plugin({inject:['tools'],apply(inner){runtime=installMcpVisibility(inner,new McpHub({storeDir:dir}))}})
  runtime.attach(agent)
  assert.ok(liveMcpServers(ctx).includes('fixture'))
  const definition=ctx.tools.get('mcp__fixture__add')
  assert.ok(definition)
  const execute=()=>ctx.tools.execute({name:'mcp__fixture__add',arguments:{a:2,b:3},agent,signal:new AbortController().signal,callId:'mcp-wire-test'})
  const first=await execute()
  assert.ok(JSON.stringify(first).includes('5'))
  runtime.mutate({layer:'session',sessionId:'wire',folder:'/test'},'fixture',false)
  assert.equal(ctx.tools.get('mcp__fixture__add',agent),undefined)
  assert.equal(ctx.tools.get('mcp__fixture__add'),definition,'global registration and connection were preserved')
  const hidden=await execute()
  assert.equal(hidden.isError,true)
  runtime.mutate({layer:'session',sessionId:'wire',folder:'/test'},'fixture',true)
  assert.ok(JSON.stringify(await execute()).includes('5'))
 } finally { await ctx.fiber.dispose(); rmSync(dir,{recursive:true,force:true}) }
})
