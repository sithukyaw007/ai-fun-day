import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, BellRing, BookmarkCheck, Check, CheckCheck, CircleHelp, Fan, FileSearch, Lightbulb, LockKeyhole, MessageSquareQuote, MousePointer2, Pause, Play, RotateCcw, ShieldCheck, UsersRound, X } from 'lucide-react'
import { gameGuides } from '../data/guides'
import { gameNames } from '../types'
import type { GameId } from '../types'

export const GUIDE_STEP_MS = 2800

function PracticeDemo({ game, step }: { game: GameId; step: number }) {
  return <div className={`guide-demo guide-demo-${game} guide-step-${step}`} aria-hidden="true">
    <div className="guide-demo-label"><span className="live-dot" />PRACTICE ONLY<span>No score saved</span></div>
    {game === 'beat' && <>
      <div className="demo-tabs"><span className={step === 0 ? 'demo-selected' : ''}><Fan size={15} />Service map</span><span className={step > 0 ? 'demo-selected' : ''}><UsersRound size={15} />Tenant cards</span></div>
      <div className="demo-evidence">
        {step === 0 ? <><div className="demo-asset"><Fan size={29} /><strong>AHU-DEMO</strong></div><ArrowDown className="demo-arrow" size={18} /><div className="demo-unit"><span className="unit-window"><i /><i /><i /><i /></span>Demo unit</div></>
          : <><div className="demo-tenant"><span className="demo-avatar"><UsersRound size={24} /></span><div><strong>Demo Tenant</strong><small>Demo unit / Current</small></div></div><div className="demo-evidence-pin"><span className="demo-checkbox"><Check size={14} /></span><BookmarkCheck size={16} />Evidence pinned</div></>}
      </div>
      <div className={`demo-answer${step === 2 ? ' demo-answer-locked' : ''}`}><span className="demo-checkbox">{step === 2 && <Check size={14} />}</span>Demo Tenant<span className="demo-lock"><LockKeyhole size={14} />{step === 2 ? 'Locked in' : 'Your answer'}</span></div>
    </>}
    {game === 'drift' && <>
      <div className="demo-chart">
        <svg viewBox="0 0 480 160">
          <path className="demo-grid" d="M25 35H455M25 80H455M25 130H455" />
          <path className="demo-impact" d="M25 35H455" /><text x="452" y="27" textAnchor="end">TENANT IMPACT</text>
          <path className="demo-threshold" d="M25 80H455" /><text x="452" y="72" textAnchor="end">ALERT LINE</text>
          <path className={`demo-trace${step === 0 ? ' demo-trace-spike' : ''}`} d={step === 0
            ? 'M25 132L65 128L100 131L130 125L155 58L177 131L215 128L250 130L285 126L325 131L360 129L400 132L455 130'
            : 'M25 132L65 128L100 131L130 125L155 58L177 131L215 128L245 118L275 102L305 78L335 68L365 56L395 48L425 43L455 40'} />
          {step > 0 && <circle className="demo-catch" cx="335" cy="68" r="9" />}
        </svg>
      </div>
      <div className={`demo-alarm${step === 2 ? ' demo-selected' : ''}`}><BellRing size={22} />{step === 2 ? 'Alarm raised. Nice catch!' : step === 1 ? 'Sustained rise - get ready' : 'One blip - keep watching'}<kbd>space</kbd></div>
    </>}
    {game === 'quiz' && <>
      <div className="demo-quiz-claim"><ShieldCheck size={39} /><strong>"Check an AI answer's sources."</strong></div>
      <div className="demo-quiz-choices"><span className={step > 0 ? 'demo-selected' : ''}><Check size={24} /><strong>Can!</strong></span><span><X size={24} /><strong>Aiyoh!</strong></span></div>
      <div className={`demo-quiz-feedback${step === 2 ? ' demo-feedback-visible' : ''}`}><Lightbulb size={19} /><span><strong>Steady. You got it.</strong><small>Why? Evidence beats confidence.</small></span><span className="demo-next">Next claim<ArrowRight size={14} /></span></div>
    </>}
    {game === 'singlish' && <>
      <div className="demo-speech"><MessageSquareQuote size={22} /><span>"Pantry light not working lah, please check."</span></div>
      <div className={`demo-rewrite${step > 0 ? ' demo-selected' : ''}`}><span className="demo-letter">A</span><span>The pantry light is not working. Please investigate.</span>{step > 0 && <Check size={18} />}</div>
      <div className="demo-rewrite demo-unfaithful"><span className="demo-letter">B</span><span>The light has been repaired. All done!</span>{step === 2 && <X size={18} />}</div>
      <div className="demo-meaning-check">{step === 2 ? <><CheckCheck size={18} />Same facts. No made-up repair.</> : <><ArrowRight size={18} />Which version keeps the meaning?</>}</div>
    </>}
    <MousePointer2 className={`demo-cursor demo-cursor-${game}`} size={28} fill="var(--cp-surface)" />
  </div>
}

export default function GameplayGuide({ game, pendingRound, onContinue, onCancel }: {
  game: GameId
  pendingRound: boolean
  onContinue: () => void
  onCancel: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [autoPlay, setAutoPlay] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [step, setStep] = useState(0)
  const [replay, setReplay] = useState(0)
  const [visible, setVisible] = useState(() => !document.hidden)
  const guide = gameGuides[game]
  const last = step === guide.steps.length - 1
  const playing = autoPlay && !reducedMotion && visible && !last

  useEffect(() => {
    const element = dialog.current
    const helpButton = document.querySelector<HTMLButtonElement>('.how-to-play')
    element?.showModal()
    return () => {
      if (element?.open) element.close()
      requestAnimationFrame(() => {
        if (helpButton?.isConnected && !helpButton.disabled && !document.querySelector('dialog[open]')) helpButton.focus()
      })
    }
  }, [])
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReducedMotion(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    const change = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', change)
    return () => document.removeEventListener('visibilitychange', change)
  }, [])
  useEffect(() => {
    if (!playing) return
    const timeout = setTimeout(() => setStep((value) => value + 1), GUIDE_STEP_MS)
    return () => clearTimeout(timeout)
  }, [playing, step, replay])

  function chooseStep(index: number) {
    setAutoPlay(false)
    setStep(index)
  }
  function replayGuide() {
    setStep(0)
    setAutoPlay(!reducedMotion)
    setReplay((value) => value + 1)
  }
  return <dialog ref={dialog} className={`gameplay-guide${playing ? '' : ' guide-motion-paused'}`}
    aria-labelledby="guide-title" aria-describedby="guide-intro" onCancel={onCancel} data-game={game} data-step={step + 1}>
    <div className="guide-heading"><div><div className="eyebrow"><CircleHelp size={15} />WATCH. GET IT. PLAY.</div><h2 id="guide-title">How to play: {gameNames[game]}</h2></div>
      <button className="icon-button" autoFocus aria-label="Close gameplay guide" onClick={onCancel}><X size={19} /></button>
    </div>
    <p id="guide-intro" className="helper">{pendingRound ? 'A quick, silent practice demo. Your game has not started.' : 'A quick, silent practice demo. No clock or score changes.'}</p>
    <div key={replay} className="guide-practice"><PracticeDemo game={game} step={step} /></div>
    <div className="guide-story" aria-live="polite" aria-atomic="true"><span className="guide-step-number">0{step + 1}</span><div><h3>{guide.steps[step]!.title}</h3><p>{guide.steps[step]!.description}</p></div></div>
    <div className="guide-controls">
      <div className="guide-step-buttons" role="group" aria-label="Walkthrough steps">{guide.steps.map((item, index) => <button key={item.title}
        className={index === step ? 'selected' : ''} aria-current={index === step ? 'step' : undefined}
        aria-label={`Step ${index + 1}: ${item.title}`} onClick={() => chooseStep(index)}>{index + 1}</button>)}</div>
      {!reducedMotion && !last && <button className="text-button guide-pause" onClick={() => setAutoPlay(!autoPlay)}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? 'Pause demo' : 'Resume demo'}</button>}
      <button className="text-button" onClick={replayGuide}><RotateCcw size={15} />Replay</button>
      {!last && <button className="text-button" onClick={() => chooseStep(step + 1)}>Next step<ArrowRight size={15} /></button>}
    </div>
    <p className="guide-hint"><FileSearch size={16} />{guide.hint}</p>
    {reducedMotion && <p className="helper guide-reduced">Reduced motion is on. Use Next step to explore the still frames.</p>}
    <div className="guide-footer"><button className="text-button" onClick={onContinue}>Skip guide</button><button className="button button-primary" onClick={onContinue}>{pendingRound ? "Got it. Let's play!" : 'Got it. Back to game.'}<ArrowRight size={17} /></button></div>
  </dialog>
}
