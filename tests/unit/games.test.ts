import { describe, expect, it } from 'vitest'
import { challenges } from '../../src/data/challenges'
import { phraseCards } from '../../src/data/phrases'
import { quizQuestions } from '../../src/data/quiz'
import { detectDrift, makeDriftRound, scoreDrift, sensors } from '../../src/lib/drift'
import { challengePrompt, singlishPrompt } from '../../src/lib/handoff'
import { compareResults, exactSet, findPhrase, ROUND_MS, scoreChallenge } from '../../src/lib/scoring'
import { quizUrl } from '../../src/lib/sharing'
import { speechError } from '../../src/lib/speech'
import { isGameResult } from '../../src/lib/scores'
import type { GameResult } from '../../src/types'

describe('source-backed estate challenges', () => {
  it('has four complete, internally consistent cases', () => {
    expect(challenges).toHaveLength(4)
    expect(new Set(challenges.map((item) => item.id)).size).toBe(4)
    for (const challenge of challenges) {
      const sourceIds = challenge.files.flatMap((file) => file.rows.map((row) => {
        expect(row.cells).toHaveLength(file.columns.length)
        return `${file.id}:${row.id}`
      }))
      expect(new Set(sourceIds).size).toBe(sourceIds.length)
      expect(challenge.requiredEvidence.every((id) => sourceIds.includes(id))).toBe(true)
      expect(challenge.correctIds.every((id) => challenge.options.some((option) => option.id === id))).toBe(true)
      expect(scoreChallenge(challenge, challenge.correctIds, challenge.requiredEvidence, 12_000)).toMatchObject({ score: 100, perfect: true })
      const prompt = challengePrompt(challenge)
      for (const id of sourceIds) expect(prompt).toContain(`[${id}]`)
      expect(prompt).toContain('synthetic')
      expect(prompt).toContain('Do not approve')
    }
  })

  it('requires the current tenants, not historical or neighbouring units', () => {
    const challenge = challenges[0]!
    expect(challenge.correctIds).toEqual(['A', 'B', 'C'])
    expect(scoreChallenge(challenge, ['A', 'B', 'C', 'D'], challenge.requiredEvidence, 5000).perfect).toBe(false)
    expect(scoreChallenge(challenge, ['A', 'B', 'C', 'D', 'E'], challenge.requiredEvidence, 5000).score).toBeLessThan(100)
  })

  it('requires proof and rejects made-up evidence IDs', () => {
    const challenge = challenges[0]!
    expect(scoreChallenge(challenge, challenge.correctIds, [], 5000)).toMatchObject({ score: 80, perfect: false, citedCount: 0 })
    expect(scoreChallenge(challenge, challenge.correctIds, ['made-up:source'], 5000).citedCount).toBe(0)
    expect(scoreChallenge(challenge, [], challenge.requiredEvidence, 5000).score).toBe(20)
  })

  it('keeps timeouts and invalid elapsed times out of complete results', () => {
    const challenge = challenges[1]!
    for (const elapsed of [-1, ROUND_MS, ROUND_MS + 1000]) {
      expect(scoreChallenge(challenge, challenge.correctIds, challenge.requiredEvidence, elapsed).perfect).toBe(false)
    }
    expect(scoreChallenge(challenge, challenge.correctIds, challenge.requiredEvidence, 5000, true).perfect).toBe(false)
    expect(exactSet(['A', 'A'], ['A', 'B'])).toBe(false)
  })
})

describe('the queue quiz and phrase bank', () => {
  it('contains eight unique questions with useful explanations', () => {
    expect(quizQuestions).toHaveLength(8)
    expect(new Set(quizQuestions.map((item) => item.id)).size).toBe(8)
    expect(quizQuestions.every((item) => typeof item.correct === 'boolean' && item.explanation.length > 50)).toBe(true)
    expect(quizQuestions.filter((item) => item.correct)).toHaveLength(4)
  })

  it('matches only authored phrases, with harmless text normalisation', () => {
    expect(phraseCards).toHaveLength(8)
    for (const card of phraseCards) {
      expect(card.choices).toHaveLength(3)
      expect(card.choices[card.correctIndex]).toBeTruthy()
      expect(findPhrase(`  ${card.line.toUpperCase()}  `, phraseCards)?.id).toBe(card.id)
    }
    expect(findPhrase('', phraseCards)).toBeUndefined()
    expect(findPhrase('My completely new fictional request', phraseCards)).toBeUndefined()
    expect(singlishPrompt('A fictional line')).toContain('Do not send anything')
  })

  it('provides explicit speech failure guidance', () => {
    expect(speechError('not-allowed')).toContain('denied')
    expect(speechError('network')).toContain('internet')
    expect(speechError('no-speech')).toContain('No speech')
    expect(speechError('unknown')).toContain('could not complete')
  })
})

describe('seeded sensor rounds', () => {
  for (const sensor of sensors) {
    it(`is deterministic and separates blips, drift and impact for ${sensor.id}`, () => {
      for (let seed = 1; seed <= 30; seed++) {
        const round = makeDriftRound(sensor, seed, false)
        expect(round).toEqual(makeDriftRound(sensor, seed, false))
        expect(round.onset).not.toBeNull()
        expect(round.impactAt!).toBeGreaterThan(round.onset!)
        expect(round.detectorAt).toBe(round.onset! + 2)
        expect(detectDrift(round.samples.filter((sample) => sample.second < round.detectorAt!), sensor.threshold)).toBeNull()
        expect(scoreDrift(round, round.onset! - 0.1).outcome).toBe('false-alarm')
        expect(scoreDrift(round, round.onset! + 0.1)).toMatchObject({ outcome: 'caught', perfect: true })
        expect(scoreDrift(round, round.onset! + 0.1).title).toContain('beat')
        expect(scoreDrift(round, round.impactAt!).outcome).toBe('late')
        expect(scoreDrift(round, null).outcome).toBe('missed')
      }
    })
    it(`does not alert for a healthy ${sensor.id} round with one spike`, () => {
      const round = makeDriftRound(sensor, 42, true)
      expect(round.onset).toBeNull()
      expect(round.detectorAt).toBeNull()
      expect(round.samples.some((sample) => sample.value >= sensor.threshold)).toBe(true)
      expect(scoreDrift(round, null)).toMatchObject({ score: 1000, outcome: 'all-clear' })
      expect(scoreDrift(round, 4).outcome).toBe('false-alarm')
    })
  }
})

describe('sharing and anonymous results', () => {
  it('preserves project paths and never shares local preview URLs', () => {
    expect(quizUrl('https://example.test/ai-fun-day/', '')).toBe('https://example.test/ai-fun-day/#/quiz')
    expect(quizUrl('', 'https://example.test/ai-fun-day/index.html?scoutTheme=dark#/join')).toBe('https://example.test/ai-fun-day/#/quiz')
    for (const url of ['http://localhost:5173', 'https://localhost', 'https://127.0.0.1', 'https://192.168.1.1', 'file:///tmp/bundle.html', 'https://user:password@example.test', 'not a url']) {
      expect(quizUrl(url, '')).toBeUndefined()
    }
  })

  it('ranks complete, correct results before fast guesses', () => {
    const complete: GameResult = { id: 'one', game: 'beat', variant: 'ahu', score: 100, maxScore: 100, perfect: true, elapsedMs: 40_000, player: 'Player 001', playedAt: 1 }
    const fast = { ...complete, id: 'two', perfect: false, score: 80, elapsedMs: 500 }
    expect([fast, complete].sort(compareResults)[0]).toBe(complete)
    expect(isGameResult(complete)).toBe(true)
    expect(isGameResult({ ...complete, score: Infinity })).toBe(false)
    expect(isGameResult({ ...complete, player: 'A real person' })).toBe(false)
    expect(isGameResult({ ...complete, maxScore: 0 })).toBe(false)
  })
})
