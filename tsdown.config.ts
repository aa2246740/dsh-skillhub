import { readFile } from 'node:fs/promises'
import { isBuiltin } from 'node:module'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'

const ID = 'dsh-skillhub'
const clientEntry = 'src/client/index.tsx'
const packageRoot = dirname(fileURLToPath(import.meta.url))

// Official dsh-v0.1.5-rc.2 packages/client/web/src/platform.ts
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
] as const

const INLINE_SAFE = /^@deepseek-ai\/dsh-(host-apiproxy|file-reference|session|llm|tools|brand|util-workspace-path)(\/|$)/
const VENDORED_LIBRARY = /^@deepseek-ai\/(cosmokit|schemastery)(\/|$)/
const GENERATED_REMOTE = /^@deepseek-ai\/dsh-[a-z0-9]+(?:-[a-z0-9]+)*\/remote$/
const CSS_MODULE_PREFIX = '\0css-module:'
const VIRTUAL_SUFFIX = '.mjs'
const ABSOLUTE_PATH = /(?:^|[\s"'`=(])(?:\/(?:Users|home|opt|var|tmp|private|agent)\/|[A-Za-z]:\\)/

type Manifest = {
  name?: string
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  dsh?: { client?: { inject?: string[]; platform?: string } }
}

const manifest = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8')) as Manifest
if (manifest.name !== ID) {
  throw new Error(`tsdown id ${JSON.stringify(ID)} does not match package name ${JSON.stringify(manifest.name)}`)
}
const inject = manifest.dsh?.client?.inject ?? []
const requested = new Set<string>([...PLATFORM_MODULES, ...inject])

function escapeSpecifier(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function packagePatterns(): RegExp[] {
  const names = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ])
  return [...names].sort().map(name => new RegExp(`^${escapeSpecifier(name)}(/|$)`))
}

function matches(patterns: RegExp[], specifier: string): boolean {
  return patterns.some(pattern => pattern.test(specifier))
}

function styleModule(path: string, css: string, classMap: Record<string, string>): string {
  const tagId = `${ID}/${basename(path)}`
  return [
    `const css = ${JSON.stringify(css)};`,
    `const tagId = ${JSON.stringify(tagId)};`,
    "if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {",
    "  const tag = document.createElement('style');",
    `  tag.dataset.plugin = ${JSON.stringify(ID)};`,
    '  tag.dataset.pluginCss = tagId;',
    '  tag.textContent = css;',
    '  document.head.appendChild(tag);',
    '}',
    `export default ${JSON.stringify(classMap)};`,
  ].join('\n')
}

const production = packagePatterns()

const plugins = [{
  name: 'client-bundle-purity',
  resolveId(source: string) {
    if (!source.startsWith('@deepseek-ai/')) return null
    if (requested.has(source)) return null
    if (VENDORED_LIBRARY.test(source) || INLINE_SAFE.test(source) || GENERATED_REMOTE.test(source)) return null
    throw new Error(
      `client bundle purity: ${JSON.stringify(source)} is not a shared baseline or dsh.client.inject request`,
    )
  },
}, {
  name: 'css-modules',
  resolveId(source: string, importer?: string) {
    if (!source.endsWith('.module.css')) return null
    return CSS_MODULE_PREFIX + resolve(importer === undefined ? packageRoot : dirname(importer), source) + VIRTUAL_SUFFIX
  },
  async load(virtualId: string) {
    if (!virtualId.startsWith(CSS_MODULE_PREFIX)) return null
    const path = virtualId.slice(CSS_MODULE_PREFIX.length, -VIRTUAL_SUFFIX.length)
    this.addWatchFile(path)
    const source = await readFile(path)
    const { code, exports: cssExports } = transform({
      filename: basename(path),
      code: source,
      cssModules: { pattern: '[hash]_[local]' },
      minify: true,
    })
    const classMap: Record<string, string> = {}
    for (const [local, value] of Object.entries(cssExports ?? {}).sort(([left], [right]) => left.localeCompare(right))) {
      classMap[local] = value.name
    }
    return styleModule(path, code.toString(), classMap)
  },
}, {
  name: 'portable-output',
  generateBundle(_options: unknown, output: Record<string, { type?: string; code?: string }>) {
    const client = output['client.js']
    if (client?.type !== 'chunk' || typeof client.code !== 'string') {
      throw new Error('client.js was not emitted')
    }
    client.code = client.code.replace(
      /^([ \t]*\/\/#region \\0css-module:).*[\\/]([^/\\\r\n]+\.module\.css\.mjs)(\r?)$/gmu,
      '$1$2$3',
    )
    if (ABSOLUTE_PATH.test(client.code)) {
      throw new Error('client.js contains a non-portable absolute path')
    }
  },
}]

export default [{
  name: ID,
  entry: ['lib/types/dsh-skillhub.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  deps: {
    neverBundle: (specifier: string) => matches(production, specifier),
    alwaysBundle: (specifier: string) => !isBuiltin(specifier) && !matches(production, specifier),
  },
}, {
  name: `${ID}/client`,
  entry: { client: clientEntry },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2024',
  dts: false,
  sourcemap: false,
  clean: false,
  deps: {
    neverBundle: (specifier: string) => requested.has(specifier),
    alwaysBundle: (specifier: string) => !requested.has(specifier),
  },
  define: {
    'process.env': '{}',
    'process.env.NODE_ENV': JSON.stringify('production'),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env': JSON.stringify({ MODE: 'production' }),
  },
  plugins,
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}]
