import { useState } from 'react'
import { ArrowRight, Medal, Trash2, Trophy } from 'lucide-react'
import { GameHeading, Tag } from './Common'
import { challenges } from '../data/challenges'
import { phraseCards } from '../data/phrases'
import { compareResults, formatTime } from '../lib/scoring'
import type { GameId, GameResult } from '../types'
import { gameNames } from '../types'

function variantName(id: string) {
  return challenges.find((item) => item.id === id)?.shortTitle
    ?? phraseCards.find((item) => item.id === id)?.title
    ?? ({ chiller: 'Chiller CH-2', co2: 'Meeting Room 7', 'eight-questions': 'Eight-question quiz' } as Record<string, string>)[id]
    ?? 'Game round'
}

export default function LocalScores({ results, onClear }: { results: GameResult[]; onClear: () => void }) {
  const [game, setGame] = useState<GameId>('beat')
  const [confirm, setConfirm] = useState(false)
  const filtered = results.filter((result) => result.game === game)
  const variants = [...new Set(filtered.map((result) => result.variant))]
  return <section aria-label="Local scores">
    <GameHeading number="BEST" title="A little local glory." description="Friendly competition. On this device only.">
      <Tag><Trophy size={14} />{results.length} saved attempts</Tag>
    </GameHeading>
    <div className="score-filter" aria-label="Filter scores by game">{(Object.keys(gameNames) as GameId[]).map((id) => <button key={id} className={game === id ? 'selected' : ''} onClick={() => setGame(id)} aria-pressed={game === id}>{gameNames[id]}</button>)}</div>
    <div className="score-explainer"><Medal size={22} /><p>Complete answers rank first, then score, then time within the same case or phrase. Different challenges are kept separate. These are informal, replayable booth scores, not verified competition entries.</p></div>
    {variants.length === 0 ? <div className="panel empty-state"><Trophy size={44} strokeWidth={1.2} /><h2>The board is yours to start.</h2><p>No {gameNames[game]} attempts saved on this browser yet.</p><a className="button button-primary" href={`#/${game}`}>Set the first score<ArrowRight size={17} /></a></div>
      : variants.map((variant) => <div className="panel score-group" key={variant}><div className="section-label"><span>{gameNames[game]}</span><span>TOP 10 / THIS DEVICE</span></div><h2>{variantName(variant)}</h2>
        <div className="table-scroll"><table className="score-table"><thead><tr><th>Rank</th><th>Player</th><th>Score</th><th>Result</th><th>Time</th></tr></thead><tbody>
          {filtered.filter((result) => result.variant === variant).sort(compareResults).slice(0, 10).map((result, index) => <tr key={result.id}><td className="score-rank">{String(index + 1).padStart(2, '0')}</td><td>{result.player}</td><td><strong>{result.score}</strong> / {result.maxScore}</td><td>{result.perfect ? 'Complete' : 'Practice'}</td><td>{result.elapsedMs === undefined ? '-' : formatTime(result.elapsedMs)}</td></tr>)}
        </tbody></table></div>
      </div>)}
    <div className="score-actions"><p className="helper">No real names are requested. The latest 200 attempts are retained locally. Phone scores never appear here automatically.</p>
      {!confirm ? <button className="button button-secondary" onClick={() => setConfirm(true)} disabled={results.length === 0}><Trash2 size={16} />Clear this device's scores</button>
        : <div className="clear-confirm notice notice-warning" role="alert"><p>Clear all {results.length} local attempts on this device? This cannot be undone.</p><button className="button button-secondary" onClick={() => setConfirm(false)}>Keep scores</button><button className="button button-danger" onClick={() => { onClear(); setConfirm(false) }}>Yes, clear local scores</button></div>}
    </div>
  </section>
}
