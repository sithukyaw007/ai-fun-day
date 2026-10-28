import { useEffect, useState } from 'react'
import { ArrowRight, Crown, Medal, Trash2, UsersRound } from 'lucide-react'
import { GameHeading, Tag } from './Common'
import { challenges } from '../data/challenges'
import { phraseCards } from '../data/phrases'
import { formatTime } from '../lib/scoring'
import { bestResults, playerName } from '../lib/players'
import type { GameId, GameResult } from '../types'
import { gameNames } from '../types'
import type { SharedBoard } from '../lib/sharedScores'

const variants: Record<GameId, { id: string; label: string }[]> = {
  beat: challenges.map((item) => ({ id: item.id, label: item.shortTitle })),
  drift: [{ id: 'chiller', label: 'Chiller CH-2' }, { id: 'co2', label: 'Meeting Room 7' }],
  quiz: [{ id: 'eight-questions', label: 'Eight-question quiz' }],
  singlish: phraseCards.map((item) => ({ id: item.id, label: item.title })),
}

function readSelection(): { game: GameId; variant: string } {
  const params = new URLSearchParams(location.hash.split('?')[1])
  const game = (Object.keys(gameNames) as GameId[]).find((id) => id === params.get('game')) ?? 'beat'
  return { game, variant: variants[game].find((item) => item.id === params.get('case'))?.id ?? variants[game][0]!.id }
}

export default function LocalScores({ results: localResults, onClear, shared }: { results: GameResult[]; onClear: () => void; shared?: SharedBoard }) {
  const [selection, setSelection] = useState(readSelection)
  const [confirm, setConfirm] = useState(false)
  const [localView, setLocalView] = useState(false)
  const sharedView = shared?.enabled && !localView
  const results = sharedView ? shared.results : localResults
  useEffect(() => {
    const change = () => setSelection(readSelection())
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  const { game, variant } = selection
  const board = bestResults(results, game, variant).slice(0, 10)
  const label = variants[game].find((item) => item.id === variant)!.label
  return <section aria-label="Leaderboard">
    <GameHeading number="BEST" title="Booth leaderboard." description="Your nickname. Your best shot. A little local glory.">
      <Tag><UsersRound size={14} />{sharedView ? 'Shared across devices' : 'This device only'}</Tag>
    </GameHeading>
    {shared?.enabled && <div className="score-filter board-source" aria-label="Scoreboard source"><button aria-pressed={!localView} className={!localView ? 'selected' : ''} onClick={() => setLocalView(false)}>Shared board</button><button aria-pressed={localView} className={localView ? 'selected' : ''} onClick={() => setLocalView(true)}>This device</button></div>}
    <div className="score-filter" aria-label="Filter scores by game">{(Object.keys(gameNames) as GameId[]).map((id) => <button key={id} className={game === id ? 'selected' : ''} onClick={() => setSelection({ game: id, variant: variants[id][0]!.id })} aria-pressed={game === id}>{gameNames[id]}</button>)}</div>
    <div className="variant-filter" aria-label="Choose leaderboard case">{variants[game].map((item) => <button key={item.id} className={variant === item.id ? 'selected' : ''} onClick={() => setSelection({ game, variant: item.id })} aria-pressed={variant === item.id}>{item.label}</button>)}</div>
    <div className="leaderboard-stage panel">
      <div className="section-label"><span>{gameNames[game]}</span><span>BEST ATTEMPT PER PLAYER</span></div><div className="leaderboard-stage-title"><h2>{label}</h2><a className="text-link" href={`#/${game}`}>Take a turn<ArrowRight size={16} /></a></div>
      <div className="podium" aria-label="Top three players">
        {[0, 1, 2].map((index) => {
          const result = board[index]
          const name = result ? playerName(result) : 'Open spot'
          return <article key={index} className={`podium-place podium-place-${index + 1}${result ? '' : ' podium-empty'}`} aria-label={`Rank ${index + 1}: ${name}`}>
            <div className="podium-medal">{index === 0 ? <Crown size={24} /> : <Medal size={20} />}</div>
            <div className="podium-avatar" aria-hidden="true">{result ? [...name][0]?.toUpperCase() : '?'}</div>
            <strong className="podium-name">{name}</strong>
            <span className="podium-score">{result ? <>{result.score}<small> / {result.maxScore}</small></> : 'Your move'}</span>
            <div className="podium-step"><span>0{index + 1}</span></div>
          </article>
        })}
      </div>
      {board.length === 0 && <p className="empty-board-invite">{sharedView && shared.status !== 'online'
        ? shared.status === 'loading' ? 'Loading the shared board...' : 'Shared scores could not be loaded. Reconnect or view this device’s history.'
        : 'No scores yet. Put your nickname on the board.'}<a className="text-link" href={`#/${game}`}>Take the first turn<ArrowRight size={16} /></a></p>}
    </div>
    {board.length > 0 && <div className="panel score-group"><div className="section-label"><span>THE TOP TEN</span><span>{sharedView ? 'SHARED / BEST PER PLAYER' : `${results.filter((result) => result.game === game && result.variant === variant).length} attempts played`}</span></div>
        <div className="table-scroll"><table className="score-table"><thead><tr><th>Rank</th><th>Player</th><th>Score</th><th>Result</th><th>Time</th></tr></thead><tbody>
          {board.map((result, index) => <tr key={result.id}><td className="score-rank">{String(index + 1).padStart(2, '0')}</td><td className="leaderboard-player"><span className="leaderboard-avatar" aria-hidden="true">{[...playerName(result)][0]?.toUpperCase()}</span><strong>{playerName(result)}</strong></td><td><strong>{result.score}</strong> / {result.maxScore}</td><td>{result.perfect ? 'Complete' : 'Practice'}</td><td>{result.elapsedMs === undefined ? '-' : formatTime(result.elapsedMs)}</td></tr>)}
        </tbody></table></div>
      </div>}
    <details className="board-rules"><summary><Medal size={16} />How the board works</summary><p>Best attempt per player and case. Complete answers first, then score, then time. Different cases are not mixed. {sharedView ? 'Online nicknames and best scores are publicly shared and refresh automatically. Identical nicknames remain separate player sessions. Local-only and older results are not uploaded.' : 'The latest 200 attempts stay in this browser.'} This is friendly, informal competition.</p></details>
    <div className="score-actions"><p className="helper">Use a nickname, not personal details. Clear local history after the event. {shared?.enabled && 'This does not delete the public shared board or any score already submitted.'}</p>
      {!confirm ? <button className="button button-secondary" onClick={() => setConfirm(true)} disabled={localResults.length === 0}><Trash2 size={16} />Clear this device's scores</button>
        : <div className="clear-confirm notice notice-warning" role="alert"><p>Clear all {localResults.length} local attempts on this device? This cannot be undone.{shared?.enabled && ' Shared scores are not deleted.'}</p><button className="button button-secondary" onClick={() => setConfirm(false)}>Keep scores</button><button className="button button-danger" onClick={() => { onClear(); setConfirm(false) }}>Yes, clear local scores</button></div>}
    </div>
  </section>
}
