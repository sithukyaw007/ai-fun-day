import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const { publicUrl } = JSON.parse(await readFile('site.config.json', 'utf8'))
if (publicUrl) {
  const url = new URL(publicUrl)
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('The public site URL must be an HTTPS URL without credentials.')
  }
}

execFileSync(path.join(root, 'node_modules/.bin/parcel'), [
  'build', 'index.html', '--dist-dir', '.artifact-build', '--no-source-maps', '--public-url', './',
], { stdio: 'inherit', env: { ...process.env, CI: 'true', COLUMNS: '120', LINES: '40' } })
const inline = execFileSync(path.join(root, 'node_modules/.bin/html-inline'), [
  '.artifact-build/index.html',
], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
const release = createHash('sha256').update(inline).update(publicUrl).digest('hex').slice(0, 12)
const html = inline
  .replace(/\bdata-release=(?:"dev"|'dev'|dev)(?=[\s>])/, `data-release="${release}"`)
  .replace('__PUBLIC_URL__', publicUrl.replaceAll('&', '&amp;').replaceAll('"', '&quot;'))

if (!html.includes(`data-release="${release}"`)) throw new Error('The HTML release identifier was not injected.')
for (const tag of html.match(/<(?:script|link)\b[^>]*>/gi) ?? []) {
  const attribute = tag.match(/\b(?:src|href)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)
  const value = attribute?.[1] ?? attribute?.[2] ?? attribute?.[3]
  if (value && !value.startsWith('data:')) {
    throw new Error('Release contains a non-inlined script or stylesheet. Offline export would be incomplete.')
  }
}
await rm(path.join(root, 'dist'), { recursive: true, force: true })
await mkdir('dist', { recursive: true })
await writeFile('bundle.html', html)
await writeFile('dist/index.html', html)
await writeFile('dist/booth-offline.html', html)
const worker = (await readFile('public/sw.js', 'utf8')).replaceAll('__RELEASE__', release)
await writeFile('dist/sw.js', worker)
await writeFile('dist/.nojekyll', '')
await copyFile('public/robots.txt', 'dist/robots.txt')
console.log(`Release ${release}: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB, all gameplay assets inlined.`)
