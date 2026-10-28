import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameResult, PlayerProfile, ResultInput } from '../types'
import { isGameResult } from './scores'

export interface SharedBoard {
  enabled: boolean
  results: GameResult[]
  status: 'loading' | 'online' | 'error'
  error: string
  refreshedAt: number
  pending: number
  submissionError: string
  refresh: () => void
  retry: () => void
}

function apiUrl(): string {
  if (location.protocol !== 'https:') return ''
  const value = document.querySelector<HTMLMetaElement>('meta[name="booth-api-url"]')?.content ?? ''
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href.replace(/\/$/, '') : ''
  } catch { return '' }
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

export function useSharedScores() {
  const [base] = useState(apiUrl)
  const [results, setResults] = useState<GameResult[]>([])
  const [status, setStatus] = useState<SharedBoard['status']>('loading')
  const [error, setError] = useState('')
  const [refreshedAt, setRefreshedAt] = useState(0)
  const [pending, setPending] = useState(0)
  const [submissionError, setSubmissionError] = useState('')
  const sessions = useRef(new Map<string, string>())
  const outbox = useRef(new Map<string, { input: ResultInput; token: string }>())
  const sending = useRef(new Set<string>())
  const reading = useRef(false)
  const revision = useRef(0)

  const request = useCallback(async (path: string, method = 'GET', body?: unknown, token?: string): Promise<unknown> => {
    const response = await fetch(`${base}/${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    })
    const json: unknown = await response.json()
    if (!response.ok) throw new Error(object(json) && typeof json.error === 'string' ? json.error : 'Shared scoreboard request failed.')
    return json
  }, [base])

  const refresh = useCallback(async () => {
    if (!base || reading.current) return
    reading.current = true
    const version = revision.current
    try {
      const json = await request('scores')
      if (!object(json) || !Array.isArray(json.results) || !json.results.every(isGameResult)
        || typeof json.refreshedAt !== 'number') throw new Error('The shared board returned an invalid response.')
      if (revision.current === version) {
        setResults(json.results)
        setRefreshedAt(json.refreshedAt)
      }
      setStatus('online')
      setError('')
    } catch (reason) {
      setStatus('error')
      setError(reason instanceof Error ? reason.message : 'Shared board could not be refreshed.')
    } finally { reading.current = false }
  }, [base, request])

  const join = useCallback(async (nickname: string): Promise<PlayerProfile> => {
    const json = await request('players', 'POST', { nickname })
    if (!object(json) || !object(json.profile) || typeof json.profile.id !== 'string'
      || typeof json.profile.nickname !== 'string' || typeof json.token !== 'string') {
      throw new Error('Player check-in returned an invalid response.')
    }
    const profile = { id: json.profile.id, nickname: json.profile.nickname }
    sessions.current.set(profile.id, json.token)
    if (!outbox.current.size) setSubmissionError('')
    return profile
  }, [request])

  const send = useCallback(async (id: string) => {
    const item = outbox.current.get(id)
    if (!item || sending.current.has(id)) return
    sending.current.add(id)
    try {
      const json = await request('scores', 'POST', item.input, item.token)
      if (!object(json) || !isGameResult(json.result)) throw new Error('Score confirmation was invalid. Retry to confirm it.')
      const confirmed = json.result
      revision.current++
      setResults((previous) => [...previous.filter((result) => !(result.playerId === confirmed.playerId
        && result.game === confirmed.game && result.variant === confirmed.variant)), confirmed])
      outbox.current.delete(id)
      setPending(outbox.current.size)
      if (!outbox.current.size) setSubmissionError('')
      setStatus('online')
      setError('')
    } catch (reason) {
      setSubmissionError(reason instanceof Error ? reason.message : 'Score upload failed.')
    } finally { sending.current.delete(id) }
  }, [request])

  const publish = useCallback((input: ResultInput, player: PlayerProfile) => {
    if (!base) return
    const token = sessions.current.get(player.id)
    if (!token) {
      setSubmissionError('This player chose local-only play. Their scores are not uploaded. Use Next player for shared check-in.')
      return
    }
    outbox.current.set(input.id, { input, token })
    setPending(outbox.current.size)
    void send(input.id)
  }, [base, send])
  const retry = useCallback(() => {
    for (const id of outbox.current.keys()) void send(id)
    void refresh()
  }, [refresh, send])

  useEffect(() => {
    if (!base) return
    const startup = setTimeout(() => void refresh(), 0)
    const timer = setInterval(() => { if (!document.hidden) void refresh() }, 10_000)
    const resume = () => { if (!document.hidden) retry() }
    const offline = () => { setStatus('error'); setError('You are offline. Shared results may be stale; games still work locally.') }
    window.addEventListener('online', resume)
    window.addEventListener('offline', offline)
    document.addEventListener('visibilitychange', resume)
    return () => {
      clearInterval(timer)
      clearTimeout(startup)
      window.removeEventListener('online', resume)
      window.removeEventListener('offline', offline)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [base, refresh, retry])

  return { enabled: !!base, results, status, error, refreshedAt, pending, submissionError, refresh, retry, join, publish }
}
