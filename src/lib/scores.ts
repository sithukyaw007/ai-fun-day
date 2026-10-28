import { useCallback, useRef, useState } from 'react'
import type { GameResult, ResultInput } from '../types'

export const SCORE_KEY = 'jtc-playground-results-v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isGameResult(value: unknown): value is GameResult {
  return isRecord(value)
    && typeof value.id === 'string' && value.id.length <= 128
    && typeof value.game === 'string' && ['beat', 'drift', 'quiz', 'singlish'].includes(value.game)
    && typeof value.variant === 'string' && value.variant.length <= 64
    && typeof value.player === 'string' && /^Player \d{3,}$/.test(value.player)
    && typeof value.perfect === 'boolean'
    && typeof value.score === 'number' && Number.isFinite(value.score) && value.score >= 0
    && typeof value.maxScore === 'number' && Number.isFinite(value.maxScore)
    && value.maxScore > 0 && value.score <= value.maxScore
    && typeof value.playedAt === 'number' && Number.isFinite(value.playedAt)
    && (value.elapsedMs === undefined || (typeof value.elapsedMs === 'number'
      && Number.isFinite(value.elapsedMs) && value.elapsedMs >= 0))
}

function loadResults(): { results: GameResult[]; warning: string } {
  try {
    const raw = localStorage.getItem(SCORE_KEY)
    if (!raw) return { results: [], warning: '' }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every(isGameResult)) {
      return { results: [], warning: 'Saved scores could not be read. New scores start fresh on this device.' }
    }
    return {
      results: parsed.slice(-200).map(({ id, game, variant, player, score, maxScore, perfect, playedAt, elapsedMs }) => ({
        id, game, variant, player, score, maxScore, perfect, playedAt, elapsedMs,
      })),
      warning: '',
    }
  } catch {
    return { results: [], warning: 'Browser storage is unavailable. Scores will last only for this open session.' }
  }
}

export function useScores() {
  const [initial] = useState(loadResults)
  const [results, setResults] = useState(initial.results)
  const [warning, setWarning] = useState(initial.warning)
  const current = useRef(initial.results)
  const persist = useCallback((next: GameResult[]) => {
    current.current = next
    setResults(next)
    try {
      localStorage.setItem(SCORE_KEY, JSON.stringify(next))
      setWarning('')
    } catch {
      setWarning('Scores could not be saved in this browser. They last only for this open session.')
    }
  }, [])

  const record = useCallback((input: ResultInput) => {
    const previous = current.current
    if (previous.some((entry) => entry.id === input.id)) return
    const lastPlayer = previous.reduce((max, entry) => Math.max(max, Number(entry.player.slice(7))), 0)
    const result: GameResult = {
      id: input.id, game: input.game, variant: input.variant,
      score: input.score, maxScore: input.maxScore, perfect: input.perfect,
      elapsedMs: input.elapsedMs,
      player: `Player ${String(lastPlayer + 1).padStart(3, '0')}`,
      playedAt: Date.now(),
    }
    persist([...previous, result].slice(-200))
  }, [persist])

  const clear = useCallback(() => {
    persist([])
  }, [persist])

  return { results, record, clear, warning }
}
