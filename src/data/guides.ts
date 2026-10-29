import type { GameId } from '../types'

export interface GuideStep {
  title: string
  description: string
}

export const gameGuides: Record<GameId, { hint: string; steps: GuideStep[] }> = {
  beat: {
    hint: 'No time limit. The counter counts up only after you enter the case. Correct answers and pinned proof determine your score.',
    steps: [
      { title: 'Explore the evidence.', description: 'Open the file tabs. Follow the service map and check the current tenant cards.' },
      { title: 'Pin your proof.', description: 'Tick Pin evidence on the cards that support your answer. You can pin cards from different files.' },
      { title: 'Make your call.', description: 'Select all matching answers, then Lock in my answer. Correct answers and supporting evidence earn points.' },
    ],
  },
  drift: {
    hint: 'Some rounds stay healthy. Wait until the end for an all-clear. No real sensors are connected.',
    steps: [
      { title: 'A spike? Stay cool.', description: 'Watch the line. One short spike above the alert line is not a sustained drift.' },
      { title: 'Spot a sustained rise.', description: 'Look for readings that keep rising above the alert line. Do not wait for the tenant-impact line.' },
      { title: 'Tap before the tenant calls.', description: 'Use your finger to tap the large Raise the alarm pad, not the chart. No keyboard needed; space is an optional shortcut.' },
    ],
  },
  quiz: {
    hint: 'Eight claims. No countdown. Show your result to the host. Online shared check-ins also publish to the shared board.',
    steps: [
      { title: 'Read one quick claim.', description: 'Look at the illustration and claim. Decide whether it is sound advice or an AI misconception.' },
      { title: 'Can, or Aiyoh?', description: 'Tap Can! if the claim checks out, or Aiyoh! if it does not. One answer per claim.' },
      { title: 'Learn, then move on.', description: 'Open Why? for the explanation, then tap Next claim. After eight claims, reveal your score.' },
    ],
  },
  singlish: {
    hint: 'Prepared phrase cards, not live AI. Voice is optional and needs consent; unfamiliar text can use the live Copilot handoff.',
    steps: [
      { title: 'Borrow a line.', description: 'Choose a phrase card, or type or say a matching phrase. Review your text, then find the boardroom match.' },
      { title: 'Keep the meaning.', description: 'Choose the professional rewrite that keeps the original facts and uncertainty.' },
      { title: 'No invented promises.', description: 'A good rewrite does not invent a diagnosis, completed repair or deadline. Review the feedback, then try another phrase.' },
    ],
  },
}
