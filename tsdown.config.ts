import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageRoot = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))

const localAdapter = join(packageRoot, 'tools/client-build.js')
const configured = process.env.DSHX_HARNESS?.trim()
const harnessAdapter = configured ? join(resolve(configured), 'tools/dshx/src/client-build.js') : undefined
const adapter = harnessAdapter && existsSync(harnessAdapter) ? harnessAdapter : localAdapter
if (!existsSync(adapter)) throw new Error(`DSHX client build adapter not found: ${adapter}`)
const { externalClientBundle } = await import(pathToFileURL(adapter).href)
const builds = externalClientBundle(manifest.name, ['lib/types/dsh-skillhub.js'], {
  packageRoot,
  clientEntry: 'src/client/index.tsx',
})

// Published clients do not contain source maps or local build-directory names.
const client = builds[1]
client.sourcemap = false
client.plugins.push({
  name: 'portable-output',
  generateBundle(_options: unknown, output: Record<string, { type?: string; code?: string }>) {
    const bundle = output['client.js']
    if (bundle?.type !== 'chunk' || typeof bundle.code !== 'string') {
      throw new Error('client.js was not emitted')
    }
    bundle.code = bundle.code.replace(
      /^([ \t]*\/\/#region \\0dshx-css-module:).*[\\/]([^/\\\r\n]+\.module\.css\.mjs)(\r?)$/gmu,
      '$1$2$3',
    )
    if (/(?:^|[\s"'`=(])(?:\/(?:Users|home|opt|var|tmp|private|agent)\/|[A-Za-z]:\\)/.test(bundle.code)) {
      throw new Error('client.js contains a non-portable absolute path')
    }
  },
})

export default builds
