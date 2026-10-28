import { useCallback, useRef, useState } from 'react'
import type { GameResult, PlayerProfile, ResultInput } from '../types'
import { validateNickname } from './players'

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
    && ((value.nickname === undefined && value.playerId === undefined)
      || (typeof value.nickname === 'string' && value.nickname.length > 0
        && validateNickname(value.nickname).value === value.nickname && !validateNickname(value.nickname).error
        && typeof value.playerId === 'string' && value.playerId.length > 0 && value.playerId.length <= 128))
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
      results: parsed.slice(-200).map(({ id, game, variant, player, score, maxScore, perfect, playedAt, elapsedMs, nickname, playerId }) => ({
        id, game, variant, player, score, maxScore, perfect, playedAt, elapsedMs, nickname, playerId,
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
  const persist = useCallback((next: GameResult[], action: 'save' | 'clear' = 'save') => {
    current.current = next
    setResults(next)
    try {
      localStorage.setItem(SCORE_KEY, JSON.stringify(next))
      setWarning('')
    } catch {
      setWarning(action === 'clear'
        ? 'Saved nicknames and scores could not be cleared from this browser. Check browser storage settings; old saved results may remain.'
        : 'Scores could not be saved in this browser. They last only for this open session.')
    }
  }, [])

  const record = useCallback((input: ResultInput, profile?: PlayerProfile) => {
    const previous = current.current
    if (previous.some((entry) => entry.id === input.id)) return
    const lastPlayer = previous.reduce((max, entry) => Math.max(max, Number(entry.player.slice(7))), 0)
    const result: GameResult = {
      id: input.id, game: input.game, variant: input.variant,
      score: input.score, maxScore: input.maxScore, perfect: input.perfect,
      elapsedMs: input.elapsedMs,
      player: `Player ${String(lastPlayer + 1).padStart(3, '0')}`,
      playedAt: Date.now(),
      ...(profile ? { nickname: profile.nickname, playerId: profile.id } : {}),
    }
    persist([...previous, result].slice(-200))
  }, [persist])

  const clear = useCallback(() => {
    persist([], 'clear')
  }, [persist])

  return { results, record, clear, warning }
}
