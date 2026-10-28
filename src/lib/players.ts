import type { GameId, GameResult } from '../types'
import { compareResults } from './scoring'

export function validateNickname(raw: string): { value: string; error: string } {
  const value = raw.normalize('NFC').replace(/\s+/g, ' ').trim()
  if ([...value].length > 20) return { value, error: 'Keep your nickname to 20 characters or fewer.' }
  if (value && !/^[\p{L}\p{M}\p{N} _.'-]+$/u.test(value)) {
    return { value, error: "Use letters, numbers, spaces, or . _ ' - in your nickname." }
  }
  return { value, error: '' }
}

export function bestResults(results: GameResult[], game: GameId, variant: string): GameResult[] {
  const best = new Map<string, GameResult>()
  for (const result of results) {
    if (result.game !== game || result.variant !== variant) continue
    const key = result.playerId ?? result.id
    const previous = best.get(key)
    if (!previous || compareResults(result, previous) < 0) best.set(key, result)
  }
  return [...best.values()].sort(compareResults)
}

export function playerName(result: GameResult): string {
  return result.nickname ?? result.player
}

export function nextGuestName(results: GameResult[]): string {
  const used = new Set(results.map((result) => result.nickname))
  let number = 1
  while (used.has(`Guest ${String(number).padStart(3, '0')}`)) number += 1
  return `Guest ${String(number).padStart(3, '0')}`
}

export function leaderboardUrl(game?: string, variant?: string): string {
  const params = new URLSearchParams()
  if (game) params.set('game', game)
  if (variant) params.set('case', variant)
  return `#/scores${params.size ? `?${params}` : ''}`
}
