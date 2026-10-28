import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'

const port = Number(process.env.PORT ?? 49741)
const prefix = '/ai-fun-day/'
const files = {
  'index.html': 'text/html; charset=utf-8',
  'booth-offline.html': 'text/html; charset=utf-8',
  'sw.js': 'application/javascript; charset=utf-8',
  'robots.txt': 'text/plain; charset=utf-8',
}
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405).end()
    return
  }
  const url = new URL(request.url, `http://127.0.0.1:${port}`)
  if (url.pathname === '/') {
    response.writeHead(302, { Location: prefix }).end()
    return
  }
  const file = url.pathname === prefix ? 'index.html' : url.pathname.slice(prefix.length)
  if (!url.pathname.startsWith(prefix) || !Object.hasOwn(files, file)) {
    response.writeHead(404).end('Not found')
    return
  }
  try {
    const content = await readFile(new URL(`../dist/${file}`, import.meta.url))
    response.writeHead(200, {
      'Content-Type': files[file],
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    }).end(request.method === 'HEAD' ? undefined : content)
  } catch (error) {
    console.error('Release file could not be served:', error.message)
    response.writeHead(500).end('Build the release with npm run build first.')
  }
})
server.listen(port, '127.0.0.1', () => console.log(`Release preview: http://127.0.0.1:${port}${prefix}`))
