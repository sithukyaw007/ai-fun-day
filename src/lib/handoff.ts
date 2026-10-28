import type { Challenge } from '../types'

export function challengePrompt(challenge: Challenge): string {
  const sources = challenge.files.map((file) => [
    `SOURCE ${file.id}: ${file.title}`,
    file.columns.join(' | '),
    ...file.rows.map((row) => `[${file.id}:${row.id}] ${row.cells.join(' | ')}`),
  ].join('\n')).join('\n\n')
  return `Fictional booth exercise. All data below is synthetic, not live JTC data.\n\nQuestion: ${challenge.question}\nContext: ${challenge.context}\n\n${sources}\n\nAnswer only from these sources. Cite the source and row IDs for every material claim. State uncertainty. Do not approve, award, send, or promise anything. The officer decides. Do not invent a response time.`
}

export function singlishPrompt(input: string): string {
  return `Fictional booth exercise; no real tenant data.\nRewrite the following Singlish message as a clear, respectful professional draft for human review:\n\n${input}\n\nPreserve meaning and uncertainty. Do not invent a diagnosis, completed work, approval, repair deadline, or a promise. Do not send anything. If information is missing, say what needs confirmation.`
}
