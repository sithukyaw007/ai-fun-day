import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCheck, Clock3, Files, RotateCcw, Search, ShieldCheck } from 'lucide-react'
import { challenges } from '../data/challenges'
import { GameHeading, LiveHandoff, PersonaNote, ResultBadge, Tag } from '../components/Common'
import { EvidenceBrowser } from '../components/Evidence'
import GameScene from '../components/GameScene'
import { challengePrompt } from '../lib/handoff'
import { useRoundActivity } from '../lib/hooks'
import type { GameProps } from '../lib/hooks'
import { attemptId, formatTime, ROUND_MS, scoreChallenge } from '../lib/scoring'

type BeatResult = ReturnType<typeof scoreChallenge> & { elapsedMs: number }

export default function BeatAgent({ onResult, onActive, onStart }: GameProps) {
  const [challengeIndex, setChallengeIndex] = useState(0)
  const challenge = challenges[challengeIndex] ?? challenges[0]!
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [answers, setAnswers] = useState<string[]>([])
  const [evidence, setEvidence] = useState<string[]>([])
  const [activeFile, setActiveFile] = useState(challenge.files[0]!.id)
  const [highlighted, setHighlighted] = useState<string[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState<BeatResult | null>(null)
  const started = useRef(0)
  const finished = useRef(false)
  const attempt = useRef('')
  useRoundActivity(onActive, phase === 'playing')

  const finish = useCallback((expired = false) => {
    if (finished.current || phase !== 'playing') return
    finished.current = true
    const elapsedMs = performance.now() - started.current
    const outcome = scoreChallenge(challenge, answers, evidence, elapsedMs, expired)
    setElapsed(elapsedMs)
    setResult({ ...outcome, elapsedMs })
    setPhase('done')
    onResult({
      id: attempt.current, game: 'beat', variant: challenge.id,
      score: outcome.score, maxScore: 100, perfect: outcome.perfect, elapsedMs,
    })
  }, [phase, challenge, answers, evidence, onResult])

  useEffect(() => {
    if (phase !== 'playing') return
    const tick = () => {
      const time = performance.now() - started.current
      setElapsed(time)
      if (time >= ROUND_MS) finish(true)
    }
    const timer = window.setInterval(tick, 100)
    return () => clearInterval(timer)
  }, [phase, finish])

  useEffect(() => {
    const ref = highlighted[0]
    if (ref) document.getElementById(`source-${ref}`)?.scrollIntoView({ block: 'nearest' })
  }, [highlighted, activeFile])

  function start() {
    started.current = performance.now()
    finished.current = false
    attempt.current = attemptId()
    setAnswers([])
    setEvidence([])
    setHighlighted([])
    setResult(null)
    setElapsed(0)
    setActiveFile(challenge.files[0]!.id)
    setPhase('playing')
  }
  function toggle(value: string, values: string[], setter: (next: string[]) => void) {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }
  const remaining = Math.max(0, Math.ceil((ROUND_MS - elapsed) / 1000))

  return <section aria-label="Beat the Agent">
    <GameHeading number="01" title="Beat the Agent" description="Sixty seconds. One messy estate. Your move.">
      <Tag><Clock3 size={14} />60-second evidence hunt</Tag>
    </GameHeading>

    {phase === 'ready' ? <>
      <div className="beat-intro">
        <div className="mission-card">
          <div className="eyebrow"><span className="live-dot" />THE HEADLINE CHALLENGE</div>
          <GameScene scene={challenge.id} />
          <h2>Find the facts.<br /><span>Back your call.</span></h2>
          <p>Explore the estate. Pin the proof. Make your move.</p>
          <div className="mission-steps">
            <span><Search size={17} />Find the facts</span><ArrowRight size={14} /><span><CheckCheck size={17} />Make the call</span><ArrowRight size={14} /><span><ShieldCheck size={17} />Cite your proof</span>
          </div>
          <div className="mission-bottom"><span className="giant-number">60<span>seconds</span></span><div><strong>Correct beats quick.</strong><p>A well-sourced answer wins.<br />No rigged AI speed record here.</p></div></div>
        </div>
        <div className="challenge-picker panel">
          <div className="section-label"><span>CHOOSE YOUR CASE</span><span>4 fictional challenges</span></div>
          {challenges.map((item, index) => <button key={item.id} className={`challenge-option${index === challengeIndex ? ' selected' : ''}`} onClick={() => setChallengeIndex(index)} aria-pressed={index === challengeIndex}>
            <span className="case-number">0{index + 1}</span><span><strong>{item.title}</strong><small>{item.shortTitle}</small></span><span className="selection-dot" aria-hidden="true" />
          </button>)}
          <button className="button button-primary button-wide" onClick={() => onStart(start)}>Open the case. Start the clock.<ArrowRight size={18} /></button>
          <p className="helper">Prepared reference answers, not live AI. Optional live Copilot handoff after your round.</p>
        </div>
      </div>
      <PersonaNote name="Mei">A lease question can mean chasing records across systems. Here, you feel the friction before seeing a source-backed answer.</PersonaNote>
    </> : <>
      <div className="case-bar">
        <div className="mission-thumbnail"><GameScene scene={challenge.id} /></div>
        <div><span className="eyebrow">{challenge.persona}</span><h2>{challenge.question}</h2>
          <div className="mission-hint">{challenge.id === 'ahu' ? 'Asset > units > current tenants' : challenge.id === 'transfer' ? '3 missing items + 1 confirmation' : challenge.id === 'bids' ? 'Eligible + not withdrawn + by 12:00' : '1 Nov 2026 - 30 Apr 2027 / rent owed > $0'}</div>
          <details className="brief-details"><summary>Full mission brief</summary><p>{challenge.context}</p></details>
        </div>
        <div className={`countdown${remaining <= 10 && phase === 'playing' ? ' urgent' : ''}`}>
          <Clock3 size={20} /><strong aria-live="off">{phase === 'playing' ? `${remaining}s` : formatTime(elapsed)}</strong><small>{phase === 'playing' ? 'left on the clock' : 'your attempt'}</small>
        </div>
      </div>
      {phase === 'done' && result && <ResultBadge score={result.score} max={100} perfect={result.perfect}
        title={result.perfect ? 'Case cracked. Evidence and all.' : !result.withinTime ? 'Time up. Let the evidence talk.' : 'Good hunt. A few clues got away.'}>
        <p>{result.correctCount}/{challenge.correctIds.length} correct selections{result.wrongCount ? `, ${result.wrongCount} extra` : ''} · {result.citedCount}/{challenge.requiredEvidence.length} required source rows cited.</p>
        <p>{result.perfect ? 'Complete and on time. Saved to this device’s leaderboard.' : 'Practice score saved. Complete, on-time answers rank first.'}</p>
      </ResultBadge>}
      <div className="case-workspace">
        <EvidenceBrowser files={challenge.files} activeId={activeFile} onFile={setActiveFile} selected={evidence}
          onToggle={(value) => toggle(value, evidence, setEvidence)} editable={phase === 'playing'} highlighted={highlighted} />
        <aside className="answer-panel panel">
          <div className="section-label"><span>YOUR CALL</span><Files size={16} /></div>
          <h3>{challenge.answerLabel}</h3>
          <p className="helper">Pick your answer. Pin the evidence. Answer: 80 / proof: 20.</p>
          <div className="answer-options">{challenge.options.map((option) => <label key={option.id} className={`answer-option${answers.includes(option.id) ? ' checked' : ''}`}>
            <input type="checkbox" checked={answers.includes(option.id)} disabled={phase !== 'playing'} onChange={() => toggle(option.id, answers, setAnswers)} />
            <span>{option.label}</span>
          </label>)}</div>
          <p className="evidence-count"><ShieldCheck size={15} />{evidence.length} source row{evidence.length === 1 ? '' : 's'} cited</p>
          {phase === 'playing' ? <button className="button button-primary button-wide" onClick={() => finish()}>Lock in my answer<ArrowRight size={17} /></button>
            : <button className="button button-secondary button-wide" onClick={() => setPhase('ready')}><RotateCcw size={17} />Choose another case</button>}
        </aside>
      </div>
      {phase === 'done' && <div className="reference-panel panel">
        <div className="section-label"><span>PREPARED REFERENCE ANSWER</span><Tag subtle>Not live AI</Tag></div>
        <h3>The answer, with the legwork attached.</h3>
        <div className="reference-answer-chips">{challenge.options.filter((option) => challenge.correctIds.includes(option.id)).map((option) => <span key={option.id}><CheckCheck size={16} />{option.label}</span>)}</div>
        <details className="full-reference"><summary>Read the reasoning</summary><p>{challenge.reference}</p></details>
        <div className="source-chips">{challenge.requiredEvidence.map((ref) => <button key={ref} className="source-chip" onClick={() => {
          setActiveFile(ref.split(':')[0]!)
          setHighlighted([ref])
        }}><ShieldCheck size={13} />{ref}</button>)}</div>
        <p className="helper">Click a citation to reveal its actual supporting row. This is authored demo content; no response time is attributed to an agent.</p>
      </div>}
      {phase === 'done' && <LiveHandoff prompt={challengePrompt(challenge)} stopwatch />}
    </>}
  </section>
}
