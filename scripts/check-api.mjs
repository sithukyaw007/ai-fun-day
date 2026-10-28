import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const { apiUrl, publicUrl } = JSON.parse(await readFile('site.config.json', 'utf8'))
assert.ok(apiUrl?.startsWith('https://'), 'Configure the verified HTTPS API URL first.')
const origin = new URL(publicUrl).origin
const preflight = await fetch(`${apiUrl}/scores`, {
  method: 'OPTIONS',
  headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,authorization' },
  signal: AbortSignal.timeout(30_000),
})
assert.equal(preflight.status, 204, 'Functions host must accept preflight.')
assert.equal(preflight.headers.get('access-control-allow-origin'), origin, 'Configure CORS on the Functions host as well as in app code.')
assert.ok(preflight.headers.get('access-control-allow-headers')?.toLowerCase().includes('authorization'), 'Player-token headers must be allowed.')
for (const path of ['health', 'scores']) {
  const response = await fetch(`${apiUrl}/${path}`, { headers: { Origin: origin }, signal: AbortSignal.timeout(30_000) })
  assert.equal(response.status, 200, `${path} must be accessible.`)
  assert.equal(response.headers.get('access-control-allow-origin'), origin)
  const body = await response.json()
  assert.ok(path === 'health' ? body.status === 'ok' : Array.isArray(body.results))
}
console.log('Shared API health, storage reads and browser preflight passed. No player or score records were created.')
