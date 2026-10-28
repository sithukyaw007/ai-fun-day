import { describe, expect, it } from 'vitest'
import { bestResults, leaderboardUrl, nextGuestName, playerName, validateNickname } from '../../src/lib/players'
import { isGameResult } from '../../src/lib/scores'
import { challenges } from '../../src/data/challenges'
import type { GameResult } from '../../src/types'

const legacy: GameResult = { id: 'legacy', game: 'beat', variant: 'ahu', player: 'Player 001', playedAt: 1, score: 80, maxScore: 100, perfect: false, elapsedMs: 1000 }

describe('optional nickname profiles', () => {
  it('normalises names and accepts international letters without permitting markup or controls', () => {
    expect(validateNickname('  Chiller   Champ ')).toEqual({ value: 'Chiller Champ', error: '' })
    expect(validateNickname('冷气高手').error).toBe('')
    expect(validateNickname('')).toEqual({ value: '', error: '' })
    for (const nickname of ['<script>', 'x'.repeat(21), 'Hidden\u202eName']) expect(validateNickname(nickname).error).not.toBe('')
  })

  it('preserves legacy anonymous results and validates optional profile fields', () => {
    expect(isGameResult(legacy)).toBe(true)
    expect(playerName(legacy)).toBe('Player 001')
    const named = { ...legacy, nickname: 'DataDino', playerId: 'player-id' }
    expect(isGameResult(named)).toBe(true)
    expect(playerName(named)).toBe('DataDino')
    expect(isGameResult({ ...legacy, nickname: 'DataDino' })).toBe(false)
    expect(isGameResult({ ...named, nickname: 'x'.repeat(21) })).toBe(false)
    expect(isGameResult({ ...named, nickname: ' DataDino ' })).toBe(false)
  })

  it('keeps only each player’s best attempt without merging people who share a nickname', () => {
    const first = { ...legacy, id: 'first', playerId: 'one', nickname: 'DataDino' }
    const best = { ...first, id: 'best', score: 100, perfect: true, elapsedMs: 30_000 }
    const other = { ...first, id: 'other', playerId: 'two' }
    const differentCase = { ...best, id: 'bids', variant: 'bids' }
    expect(bestResults([first, best, other, differentCase, legacy], 'beat', 'ahu').map((entry) => entry.id)).toEqual(['best', 'other', 'legacy'])
  })

  it('provides collision-free guest labels and case-specific board links', () => {
    expect(nextGuestName([])).toBe('Guest 001')
    expect(nextGuestName([{ ...legacy, nickname: 'Guest 001', playerId: 'one' }])).toBe('Guest 002')
    expect(nextGuestName([{ ...legacy, nickname: 'Guest 99999999999999', playerId: 'one' }])).toBe('Guest 001')
    expect(leaderboardUrl('beat', 'ahu')).toBe('#/scores?game=beat&case=ahu')
  })
})

describe('visual evidence remains consistent with original source rows', () => {
  it('provides a visual summary for every file and every row without changing evidence IDs', () => {
    for (const challenge of challenges) for (const file of challenge.files) {
      expect(file.shortTitle).toBeTruthy()
      expect(file.presentation).toBeTruthy()
      for (const row of file.rows) {
        expect(row.visual).toBeTruthy()
        if (row.visual?.detail) expect(row.visual.detail.split(/\s+/).length).toBeLessThanOrEqual(14)
        if (row.visual?.units) expect(row.visual.units.join(', ')).toBe(row.cells[1])
        if (row.visual?.amount !== undefined) expect(`$${row.visual.amount.toLocaleString('en-SG')}`).toBe(row.cells[1])
        if (file.presentation === 'leases') expect(Number.isFinite(Date.parse(row.cells[1]!))).toBe(true)
      }
    }
  })
})
