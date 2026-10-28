import type { QuizQuestion } from '../types'

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'confidence', topic: 'Confidence is not evidence',
    claim: '"The AI sounds very sure. Can skip checking already."',
    correct: false,
    explanation: 'Aiyoh. A confident answer can still be wrong. Check important claims against the actual source, especially numbers, dates and decisions.',
  },
  {
    id: 'connections', topic: 'Connected data',
    claim: '"To find affected tenants, follow the air handler to units, leases, then tenants."',
    correct: true,
    explanation: 'Can! Connected estate data turns an asset alert into a useful list of people to notify. The link still needs to be current and correct.',
  },
  {
    id: 'freshness', topic: 'Data freshness',
    claim: '"The dashboard looks new, so the data must be live."',
    correct: false,
    explanation: "Aiyoh. A beautiful screen can show yesterday's data. Check refresh times, source dates and whether the stream is actually connected.",
  },
  {
    id: 'noise', topic: 'Signals, not panic',
    claim: '"One sensor spike always means open an urgent fault case."',
    correct: false,
    explanation: 'Aiyoh. It might be noise or a short-lived change. Use context and an appropriate detection rule; avoid turning every blip into an alarm.',
  },
  {
    id: 'oversight', topic: 'The officer decides',
    claim: '"Copilot drafts the tenant notice. The officer reviews it and chooses whether to send."',
    correct: true,
    explanation: 'Can! Drafting is helpful legwork, not permission to promise a repair time or send an unchecked notice.',
  },
  {
    id: 'access', topic: 'Permissions still matter',
    claim: '"Same prompt, same access: every officer should see every tenant record."',
    correct: false,
    explanation: 'Aiyoh. Access depends on permissions and responsibilities, not the wording of a prompt. AI does not remove access-control obligations.',
  },
  {
    id: 'voice', topic: 'Microphone consent',
    claim: '"Browser speech recognition may send audio to its provider, even if this game saves no recording."',
    correct: true,
    explanation: 'Can. No recording in the app does not guarantee on-device processing. Read the voice notice and use a preset or type if you prefer.',
  },
  {
    id: 'unknown', topic: 'Useful honesty',
    claim: '"When evidence is missing, saying I do not know yet can be the best AI answer."',
    correct: true,
    explanation: 'Can! A useful assistant makes uncertainty visible and asks for evidence instead of inventing facts. Better a clear gap than a polished guess.',
  },
]
