function publicBase(candidate: string): URL | undefined {
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' || url.username || url.password) return undefined
    if (url.hostname === 'localhost' || url.hostname === '::1' || url.hostname === '[::1]' || /^[\d.]+$/.test(url.hostname) || url.hostname.endsWith('.local')) return undefined
    url.search = ''
    url.hash = ''
    if (url.pathname.endsWith('.html')) url.pathname = url.pathname.slice(0, url.pathname.lastIndexOf('/') + 1)
    if (!url.pathname.endsWith('/')) url.pathname += '/'
    return url
  } catch {
    return undefined
  }
}

export function quizUrl(configured: string, current: string): string | undefined {
  const base = publicBase(configured) ?? publicBase(current)
  if (!base) return undefined
  base.hash = '/quiz'
  return base.href
}

export function configuredSiteUrl(): string {
  return document.querySelector<HTMLMetaElement>('meta[name="booth-public-url"]')?.content ?? ''
}
