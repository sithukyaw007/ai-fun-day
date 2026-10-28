import { app } from '@azure/functions'
import { createService, RequestError } from './service.js'
import { tableStore } from './store.js'

app.setup({ enableHttpStream: false })
let service
const buckets = new Map()

app.http('scoreboard', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'scoreboard/{action}',
  handler: async (request, context) => {
    const origin = request.headers.get('origin')
    const allowed = (process.env.ALLOWED_ORIGINS ?? 'https://sithukyaw007.github.io').split(',')
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' }
    if (origin && allowed.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin
      headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    } else if (origin) return { status: 403, headers, jsonBody: { error: 'This origin is not allowed.' } }
    if (request.method === 'OPTIONS') return { status: 204, headers }
    try {
      // A soft per-instance throttle supplements bounded input and short-lived player tokens.
      const key = request.headers.get('x-forwarded-for') ?? 'unknown'
      const now = Date.now()
      if (buckets.size > 2000) for (const [id, bucket] of buckets) if (bucket.until < now) buckets.delete(id)
      const bucket = buckets.get(key)
      if (!bucket && buckets.size >= 5000) throw new RequestError(429, 'The board is busy. Please retry shortly.')
      if (bucket?.until > now && bucket.count >= 180) throw new RequestError(429, 'Please wait a minute before retrying.')
      buckets.set(key, bucket?.until > now ? { ...bucket, count: bucket.count + 1 } : { until: now + 60_000, count: 1 })
      if (request.params.action === 'health' && request.method === 'GET') return { headers, jsonBody: { status: 'ok' } }
      service ??= createService(tableStore())
      if (request.params.action === 'scores' && request.method === 'GET') return { headers, jsonBody: await service.list() }
      if (request.method !== 'POST') throw new RequestError(404, 'Endpoint not found.')
      const text = await request.text()
      if (Buffer.byteLength(text) > 4096) throw new RequestError(413, 'Request is too large.')
      let body
      try { body = JSON.parse(text) } catch { throw new RequestError(400, 'Request must be JSON.') }
      if (request.params.action === 'players') return { status: 201, headers, jsonBody: await service.join(body) }
      if (request.params.action === 'scores') return { headers, jsonBody: await service.submit(body, request.headers.get('authorization')) }
      throw new RequestError(404, 'Endpoint not found.')
    } catch (error) {
      if (error instanceof RequestError) return { status: error.status, headers, jsonBody: { error: error.message } }
      context.error('Shared scoreboard storage request failed.', { status: error.statusCode ?? 500 })
      return { status: 503, headers, jsonBody: { error: 'Shared scoreboard is temporarily unavailable. Your game can continue locally.' } }
    }
  },
})
