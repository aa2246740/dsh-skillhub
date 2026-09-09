import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const harness = process.env.DSHX_HARNESS
if (harness === undefined) throw new Error('Set DSHX_HARNESS to the checkout used for this build.')
const adapter = resolve(harness, 'tools/dshx/src/client-build.js')
if (!existsSync(adapter)) throw new Error('DSHX externalClientBundle adapter is missing.')
const { externalClientBundle } = await import(pathToFileURL(adapter).href)

export default externalClientBundle('dsh-skillhub', ['lib/types/dsh-skillhub.js'], {
  clientEntry: 'src/client/index.tsx',
})
