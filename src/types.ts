export type GameId = 'beat' | 'drift' | 'quiz' | 'singlish'
export type Route = GameId | 'home' | 'join' | 'scores' | 'host'

export interface SourceRow {
  id: string
  cells: string[]
  visual?: {
    detail?: string
    status?: string
    icon?: 'tenant' | 'fan' | 'calendar' | 'cash' | 'check' | 'alert' | 'power' | 'solar' | 'mail' | 'shield' | 'map'
    tone?: 'neutral' | 'muted' | 'attention' | 'positive'
    units?: string[]
    amount?: number
  }
}

export interface EvidenceFile {
  id: string
  title: string
  kind: 'register' | 'email' | 'plan' | 'policy'
  caption: string
  columns: string[]
  rows: SourceRow[]
  shortTitle?: string
  presentation?: 'map' | 'tenants' | 'checks' | 'bids' | 'leases' | 'messages'
}

export interface AnswerOption {
  id: string
  label: string
}

export interface Challenge {
  id: string
  title: string
  shortTitle: string
  persona: string
  question: string
  context: string
  answerLabel: string
  files: EvidenceFile[]
  options: AnswerOption[]
  correctIds: string[]
  requiredEvidence: string[]
  reference: string
}

export interface QuizQuestion {
  id: string
  topic: string
  claim: string
  correct: boolean
  explanation: string
}

export interface PhraseCard {
  id: string
  title: string
  line: string
  choices: [string, string, string]
  correctIndex: number
  explanation: string
}

export interface ResultInput {
  id: string
  game: GameId
  variant: string
  score: number
  maxScore: number
  perfect: boolean
  elapsedMs?: number
}

export interface GameResult extends ResultInput {
  player: string
  playedAt: number
  nickname?: string
  playerId?: string
}

export interface PlayerProfile {
  id: string
  nickname: string
}

export const gameNames: Record<GameId, string> = {
  beat: 'Beat the Agent',
  drift: 'Spot the Drift',
  quiz: 'AI or Aiyoh?',
  singlish: 'Singlish to Boardroom',
}
