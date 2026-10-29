import type { Challenge, GameResult, PhraseCard } from '../types'

export function exactSet(actual: string[], expected: string[]): boolean {
  const set = new Set(actual)
  return set.size === expected.length && expected.every((value) => set.has(value))
}

export function scoreChallenge(challenge: Challenge, answers: string[], evidence: string[]) {
  const allowedEvidence = new Set(challenge.files.flatMap((file) => file.rows.map((row) => `${file.id}:${row.id}`)))
  const selected = new Set(answers)
  const correctCount = challenge.correctIds.filter((id) => selected.has(id)).length
  const wrongCount = [...selected].filter((id) => !challenge.correctIds.includes(id)).length
  const answerFraction = Math.max(0, (correctCount - wrongCount) / challenge.correctIds.length)
  const citedCount = challenge.requiredEvidence.filter((id) => allowedEvidence.has(id) && evidence.includes(id)).length
  const evidenceFraction = citedCount / challenge.requiredEvidence.length
  const perfect = exactSet(answers, challenge.correctIds) && evidenceFraction === 1
  return {
    score: Math.round(answerFraction * 80 + evidenceFraction * 20),
    perfect, correctCount, wrongCount, citedCount,
  }
}

export function normalisePhrase(input: string): string {
  return input.toLocaleLowerCase('en-SG').replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()
}

export function findPhrase(input: string, cards: PhraseCard[]): PhraseCard | undefined {
  const normalised = normalisePhrase(input)
  return normalised ? cards.find((card) => normalisePhrase(card.line) === normalised) : undefined
}

export function compareResults(a: GameResult, b: GameResult): number {
  return Number(b.perfect) - Number(a.perfect)
    || b.score / b.maxScore - a.score / a.maxScore
    || (a.elapsedMs ?? Infinity) - (b.elapsedMs ?? Infinity)
    || a.playedAt - b.playedAt
}

export function formatTime(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(1)}s`
}

export function formatElapsed(ms: number): string {
  const seconds = Math.floor(Math.max(0, ms) / 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  const minutes = Math.floor(seconds / 60)
  return seconds >= 3600
    ? `${Math.floor(seconds / 3600)}:${pad(minutes % 60)}:${pad(seconds % 60)}`
    : `${pad(minutes)}:${pad(seconds % 60)}`
}

export function attemptId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `round-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
