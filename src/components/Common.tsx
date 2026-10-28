import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Clipboard, FileCheck2, Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatTime } from '../lib/scoring'

export function Tag({ children, subtle = false }: { children: ReactNode; subtle?: boolean }) {
  return <span className={`tag${subtle ? ' tag-subtle' : ''}`}>{children}</span>
}

export function GameHeading({ number, title, description, children }: {
  number: string; title: string; description: string; children?: ReactNode
}) {
  return <div className="game-heading">
    <div><div className="eyebrow"><span>{number}</span> THE ESTATE PLAYGROUND</div><h1>{title}</h1><p>{description}</p></div>
    {children}
  </div>
}

export function PersonaNote({ name, children }: { name: string; children: ReactNode }) {
  return <div className="persona-note"><span className="avatar" aria-hidden="true">{name.slice(0, 1)}</span><div><strong>{name}'s world</strong><p>{children}</p></div></div>
}

export function CopyPrompt({ text, label = 'Copy prompt + sources', successMessage = 'Copied. Switch to your approved Copilot session and paste it there.' }: { text: string; label?: string; successMessage?: string }) {
  const [message, setMessage] = useState('')
  const [manual, setManual] = useState(false)
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) {
        setManual(true)
        setMessage('Clipboard is unavailable here. Select and copy the prompt below.')
        return
      }
      await navigator.clipboard.writeText(text)
      setMessage(successMessage)
    } catch {
      setManual(true)
      setMessage('Clipboard permission was blocked. Select and copy the prompt below.')
    }
  }
  return <div className="copy-prompt">
    <button className="button button-secondary" onClick={copy}><Clipboard size={17} />{label}</button>
    {message && <p className="helper" role="status">{message}</p>}
    {manual && <textarea className="prompt-text" aria-label="Text to copy manually" readOnly value={text} onFocus={(event) => event.currentTarget.select()} />}
  </div>
}

export function LiveHandoff({ prompt, stopwatch = false }: { prompt: string; stopwatch?: boolean }) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const started = useRef(0)
  const saved = useRef(0)
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setElapsed(saved.current + performance.now() - started.current), 100)
    return () => clearInterval(timer)
  }, [running])
  function toggle() {
    if (running) {
      saved.current += performance.now() - started.current
      setElapsed(saved.current)
    } else {
      started.current = performance.now()
    }
    setRunning(!running)
  }
  return <details className="live-handoff">
    <summary><Sparkles size={18} /><span>Try a genuinely live Copilot comparison</span><ArrowRight size={17} /></summary>
    <div className="details-body">
      <p>The host can copy this fictional exercise into an existing, approved Copilot session. No AI service is connected to this hub. Review the response and its sources; nothing is sent to tenants.</p>
      <CopyPrompt text={prompt} />
      {stopwatch && <div className="manual-timer">
        <div><span className="eyebrow">OPERATOR-TIMED, NOT A BENCHMARK</span><strong aria-live="off">{formatTime(elapsed)}</strong></div>
        <button className="button button-secondary" onClick={toggle}>{running ? <Pause size={16} /> : <Play size={16} />}{running ? 'Stop comparison' : 'Start comparison'}</button>
        <button className="icon-button" aria-label="Reset comparison timer" onClick={() => { setRunning(false); setElapsed(0); saved.current = 0 }}><RotateCcw size={17} /></button>
        <p className="helper">Includes your copy/paste handoff. Compare correctness and citations too. This time is not added to local scores.</p>
      </div>}
    </div>
  </details>
}

export function ResultBadge({ score, max, title, children, perfect }: {
  score: number; max: number; title: string; children?: ReactNode; perfect: boolean
}) {
  const banner = useRef<HTMLDivElement>(null)
  useEffect(() => { banner.current?.scrollIntoView({ block: 'nearest' }) }, [])
  return <div ref={banner} className={`result-banner${perfect ? ' result-perfect' : ''}`} role="status">
    <div className="result-symbol">{perfect ? <Check size={26} /> : <FileCheck2 size={26} />}</div>
    <div className="result-copy"><span className="eyebrow">YOUR RESULT</span><h2>{title}</h2>{children}</div>
    <div className="big-score">{score}<span>/{max}</span></div>
  </div>
}
