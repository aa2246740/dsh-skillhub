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

test('every MCP panel layer renders the same gate the runtime enforces', () => {
  const dir = mkdtempSync(join(tmpdir(), 'skillhub-mcp-layers-'))
  try {
    const hub = new McpHub({ storeDir: dir })
    const servers = ['figma', 'github']
    const row = (query, name) => {
      const view = hub.catalog(query, [], servers).servers.find(server => server.name === name)
      return { gate: view.gate, source: view.source }
    }
    const runtime = (name, sessionId, folder) => {
      const state = hub.effectiveGate(name, sessionId, folder)
      return { gate: state.gate, source: state.source }
    }

    // The settings page shows the global default, and only this layer's own
    // decision is attributed to 'global'.
    hub.toggle({ layer: 'global', server: 'figma', on: false })
    assert.deepEqual(row({ layer: 'global' }, 'figma'), { gate: 'off', source: 'global' })

    // A project override decides the chat's value; the composer's session panel
    // has to show that, because it is what the model is actually allowed to call.
    hub.toggle({ layer: 'project', folder: '/test', server: 'figma', on: true })
    assert.deepEqual(row({ layer: 'project', folder: '/test' }, 'figma'), { gate: 'on', source: 'project' })
    assert.deepEqual(row({ layer: 'session', sessionId: 'one', folder: '/test' }, 'figma'),
      { gate: 'on', source: 'project' })
    assert.deepEqual(runtime('figma', 'one', '/test'), row({ layer: 'session', sessionId: 'one', folder: '/test' }, 'figma'))

    // A chat override beats the project, and inheriting hands the decision back.
    hub.toggle({ layer: 'session', sessionId: 'one', folder: '/test', server: 'figma', on: false })
    assert.deepEqual(row({ layer: 'session', sessionId: 'one', folder: '/test' }, 'figma'),
      { gate: 'off', source: 'session' })
    assert.deepEqual(runtime('figma', 'one', '/test'), { gate: 'off', source: 'session' })
    hub.inherit({ layer: 'session', sessionId: 'one', folder: '/test', server: 'figma' })
    assert.deepEqual(row({ layer: 'session', sessionId: 'one', folder: '/test' }, 'figma'),
      { gate: 'on', source: 'project' })

    // The hidden set used to deny tools must equal what the panel renders as off.
    assert.deepEqual([...hub.hiddenServers('one', '/test', servers)],
      hub.catalog({ layer: 'session', sessionId: 'one', folder: '/test' }, [], servers)
        .servers.filter(server => server.gate === 'off').map(server => server.name))
    // Another chat keeps following the project, and a global-only read ignores folders.
    assert.deepEqual(row({ layer: 'session', sessionId: 'two', folder: '/test' }, 'figma'),
      { gate: 'on', source: 'project' })
    assert.deepEqual(row({ layer: 'global' }, 'figma'), { gate: 'off', source: 'global' })
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
