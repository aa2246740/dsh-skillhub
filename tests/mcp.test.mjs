import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { McpHub, attributeMcpTool } from '../lib/types/mcp.js'

test('MCP inheritance, literal all, prototype names, and session confinement', () => {
  const dir = mkdtempSync(join(tmpdir(), 'skillhub-mcp-'))
  try {
    const hub = new McpHub({ storeDir: dir })
    hub.toggle({layer:'global',server:'all',on:false})
    assert.equal(hub.effectiveGate('all').gate,'off')
    assert.equal(hub.effectiveGate('other').gate,'on')
    hub.toggle({layer:'project',folder:'/test',server:'all',on:true})
    hub.toggle({layer:'session',sessionId:'one',folder:'/test',server:'all',on:false})
    assert.equal(hub.effectiveGate('all','one','/test').gate,'off')
    assert.equal(hub.effectiveGate('all','two','/test').gate,'on')
    hub.inherit({layer:'session',sessionId:'one',folder:'/test',server:'all'})
    assert.equal(hub.effectiveGate('all','one','/test').gate,'on')
    hub.toggle({layer:'global',server:'__proto__',on:false})
    assert.equal(hub.effectiveGate('__proto__').gate,'off')
    assert.equal(hub.effectiveGate('constructor').gate,'on')
    assert.throws(()=>hub.toggle({layer:'session',sessionId:'../escape',server:'all',on:true}),/invalid sessionId/)
    assert.equal(new McpHub({storeDir:dir}).effectiveGate('all').gate,'off')
  } finally { rmSync(dir,{recursive:true,force:true}) }
})

test('MCP ownership uses configured identities and refuses ambiguous prefixes',()=>{
  assert.equal(attributeMcpTool('mcp__github__search__issues',['github']),'github')
  assert.equal(attributeMcpTool('mcp__a__b__tool',['a__b']),'a__b')
  assert.equal(attributeMcpTool('mcp__a__b__tool',['a','a__b']),undefined)
  assert.equal(attributeMcpTool('mcp__foreign__tool',['github']),undefined)
})
