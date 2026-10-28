import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, ArrowRight, BellRing, Hand, Keyboard, RotateCcw } from 'lucide-react'
import { GameHeading, PersonaNote, ResultBadge, Tag } from '../components/Common'
import SensorChart from '../components/SensorChart'
import GameScene from '../components/GameScene'
import { makeDriftRound, scoreDrift, sensors } from '../lib/drift'
import type { SensorId } from '../lib/drift'
import { attemptId } from '../lib/scoring'
import { useRoundActivity } from '../lib/hooks'
import type { GameProps } from '../lib/hooks'

export default function SpotDrift({ onResult, onActive, onStart }: GameProps) {
  const [sensorId, setSensorId] = useState<SensorId>('chiller')
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(() => makeDriftRound(sensors[0]!, 21))
  const [elapsed, setElapsed] = useState(0)
  const [pressedAt, setPressedAt] = useState<number | null>(null)
  const [result, setResult] = useState<ReturnType<typeof scoreDrift> | null>(null)
  const [notice, setNotice] = useState('')
  const started = useRef(0)
  const finished = useRef(false)
  const rounds = useRef(0)
  const attempt = useRef('')
  const sensorPanel = useRef<HTMLDivElement>(null)
  const sensor = sensors.find((item) => item.id === sensorId)!
  useRoundActivity(onActive, phase === 'playing')

  useEffect(() => {
    if (phase !== 'playing') return
    sensorPanel.current?.focus({ preventScroll: true })
    sensorPanel.current?.scrollIntoView({ block: 'start' })
  }, [phase])

  const finish = useCallback((at: number | null) => {
    if (finished.current || phase !== 'playing') return
    finished.current = true
    const outcome = scoreDrift(round, at)
    setPressedAt(at)
    setElapsed(at ?? round.duration)
    setResult(outcome)
    setPhase('done')
    onResult({
      id: attempt.current, game: 'drift', variant: round.sensor.id,
      score: outcome.score, maxScore: 1000, perfect: outcome.perfect,
      elapsedMs: (at ?? round.duration) * 1000,
    })
  }, [phase, round, onResult])

  const raiseAlarm = useCallback(() => {
    const time = (performance.now() - started.current) / 1000
    finish(time >= round.duration ? null : time)
  }, [finish, round.duration])

  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setInterval(() => {
      const time = (performance.now() - started.current) / 1000
      setElapsed(Math.min(time, round.duration))
      if (time >= round.duration) finish(null)
    }, 80)
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, button, a, summary'))) return
      event.preventDefault()
      raiseAlarm()
    }
    const onVisibility = () => {
      if (document.hidden) {
        finished.current = true
        setPhase('ready')
        setNotice('Round cancelled because the tab was hidden. No score was saved. Start a fresh round when you are ready.')
      }
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(timer)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [phase, round.duration, finish, raiseAlarm])

  function start() {
    rounds.current += 1
    const seed = Math.floor(Math.random() * 1_000_000)
    setRound(makeDriftRound(sensor, seed, rounds.current % 4 === 0))
    setElapsed(0)
    setPressedAt(null)
    setResult(null)
    setNotice('')
    finished.current = false
    attempt.current = attemptId()
    started.current = performance.now()
    setPhase('playing')
  }
  const lastSample = round.samples[Math.min(Math.floor(elapsed), round.samples.length - 1)]!

  return <section className="drift-game" data-phase={phase} aria-label="Spot the Drift">
    <GameHeading number="02" title="Spot the Drift" description="A blip, or the beginning of a bad day?">
      <Tag><Hand size={14} />Touchscreen ready. No keyboard needed.</Tag>
    </GameHeading>
    {notice && <p className="notice" role="status">{notice}</p>}
    {phase === 'ready' ? <div className="drift-intro">
      <div className="panel drift-instructions"><div className="eyebrow">CHLOE'S EARLY-WARNING CHALLENGE</div><h2>Catch it before<br /><span>the tenant calls.</span></h2>
        <p>Watch for a sustained rise above the alert line. Tap the large alarm pad with your finger when it drifts. No keyboard needed.</p>
        <div className="reaction-rules"><span><Activity size={21} />Watch the trend</span><span><BellRing size={21} />Ignore lone spikes</span><span><Hand size={21} />Tap the alarm pad</span></div>
        <div className="sensor-choices">{sensors.map((item) => <button key={item.id} className={`sensor-choice${sensorId === item.id ? ' selected' : ''}`} onClick={() => setSensorId(item.id)} aria-pressed={sensorId === item.id}><Activity size={19} /><span><strong>{item.id === 'chiller' ? 'Chiller CH-2' : 'Meeting Room 7'}</strong><small>{item.id === 'chiller' ? 'Approach temperature' : 'CO2 level'}</small></span><span className="selection-dot" /></button>)}</div>
        <button className="button button-primary" onClick={() => onStart(start)}>Watch the sensor<ArrowRight size={18} /></button>
        <p className="helper">24-second rounds. Some rounds stay healthy: wait to earn an all-clear. No actual building systems are connected.</p>
      </div>
      <div className="drift-preview panel" aria-hidden="true"><div className="mini-chart-title"><span className="live-dot" />CH-2 / SYNTHETIC FEED</div><svg viewBox="0 0 400 180"><path className="preview-grid" d="M0 40H400M0 90H400M0 140H400" /><path className="preview-trace" d="M0 145L25 138L50 144L75 130L100 139L125 80L150 140L175 135L200 128L225 110L250 106L275 85L300 79L325 60L350 44L380 30" /><circle cx="380" cy="30" r="6" /></svg><div className="preview-caption"><BellRing size={24} /><span>A single spike is gossip.<br /><strong>A sustained trend is a story.</strong></span></div></div>
    </div> : <>
      {phase === 'done' && result && <ResultBadge score={result.score} max={1000} title={result.title} perfect={result.perfect}>
        <p>{result.outcome === 'false-alarm' ? 'The early spike was harmless. Wait for a sustained crossing of the alert line.'
          : result.outcome === 'all-clear' ? 'No sustained drift occurred. You avoided turning noise into a case.'
          : result.outcome === 'missed' ? 'A sustained drift occurred, but no alert was raised before the round ended.'
          : `Your alert: ${pressedAt!.toFixed(1)}s. ${round.detectorAt !== null ? `Simulated detector: ${round.detectorAt.toFixed(1)}s.` : 'The detector did not alert.'}`}</p>
      </ResultBadge>}
      <div className="sensor-panel panel" ref={sensorPanel} tabIndex={-1} role="region" aria-label="Sensor chart and alarm controls">
        <div className="sensor-top"><div><div className="eyebrow">SYNTHETIC TELEMETRY / {phase === 'done' ? 'ROUND REPLAY' : 'WATCHING'}</div><h2>{round.sensor.title}</h2></div>
          <div className="sensor-reading"><strong>{lastSample.value}</strong><span>{round.sensor.unit}</span></div></div>
        <div className="chart-legend"><span><i className="line-key" />Sensor</span><span><i className="line-key threshold-key" />Alert {round.sensor.threshold} {round.sensor.unit}</span><span><i className="line-key impact-key" />Fictional impact {round.sensor.impact} {round.sensor.unit}</span><span>{Math.floor(elapsed)} / {round.duration}s</span></div>
        <div className="live-sensor-visual"><div className="sensor-illustration"><GameScene scene={round.sensor.id} /><span>{round.sensor.id === 'chiller' ? 'COOLING PLANT' : 'MEETING ROOM 7'}</span><div className="sensor-value-track"><span style={{ transform: `scaleX(${Math.min(1, Math.max(0, (lastSample.value - round.sensor.min) / (round.sensor.max - round.sensor.min)))})` }} /></div></div><SensorChart round={round} elapsed={elapsed} revealed={phase === 'done'} pressedAt={pressedAt} /></div>
        {phase === 'playing' ? <div className="alarm-controls">
          <button type="button" className="button button-primary alarm-button" aria-label="Raise the alarm" aria-describedby="drift-touch-help" onClick={raiseAlarm}>
            <Hand size={34} aria-hidden="true" /><span className="alarm-pad-label"><small>Tap here with your finger</small><strong>Raise the alarm</strong></span><BellRing size={28} aria-hidden="true" />
          </button>
          <p className="helper" id="drift-touch-help">Tap the pad above—not the chart. One tap is enough. Healthy all the way? Wait for the round to end.</p>
          <p className="keyboard-alternative"><Keyboard size={14} aria-hidden="true" />Optional keyboard shortcut: <kbd>space</kbd></p>
        </div>
          : <div className="round-explanation"><details><summary>How the simulated detector works</summary><p>It alerts after three consecutive readings meet the threshold, using only samples seen so far. Not a live AI or Fabric connection. Thresholds are fictional game rules.</p></details><button className="button button-primary" onClick={() => onStart(start)}><RotateCcw size={17} />Another round</button><button className="button button-secondary" onClick={() => setPhase('ready')}>Change sensor</button></div>}
      </div>
    </>}
    <PersonaNote name="Chloe">An early signal becomes useful when it leads to an investigation and a heads-up to affected tenants. The facilities team still makes the call.</PersonaNote>
  </section>
}
