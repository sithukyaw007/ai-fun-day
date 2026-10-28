import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, MessageSquareQuote, Mic, MicOff, RotateCcw } from 'lucide-react'
import { GameHeading, LiveHandoff, PersonaNote, Tag } from '../components/Common'
import { phraseCards } from '../data/phrases'
import { attemptId, findPhrase } from '../lib/scoring'
import { singlishPrompt } from '../lib/handoff'
import { speechConstructor, speechError } from '../lib/speech'
import type { SpeechRecognitionLike } from '../lib/speech'
import { useRoundActivity } from '../lib/hooks'
import type { GameProps } from '../lib/hooks'
import type { PhraseCard } from '../types'

export default function Singlish({ onResult, onActive }: GameProps) {
  const [input, setInput] = useState(phraseCards[0]!.line)
  const [card, setCard] = useState<PhraseCard | null>(null)
  const [choice, setChoice] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const [unmatched, setUnmatched] = useState(false)
  const [consent, setConsent] = useState(false)
  const [listening, setListening] = useState(false)
  const [Recognition] = useState(speechConstructor)
  const recognition = useRef<SpeechRecognitionLike | null>(null)
  const rewritePanel = useRef<HTMLDivElement>(null)
  const received = useRef(false)
  const failed = useRef(false)
  const attempt = useRef('')
  const answered = useRef(false)
  useRoundActivity(onActive, listening || (card !== null && choice === null))

  function detachVoice() {
    const current = recognition.current
    if (current) {
      current.onresult = null
      current.onerror = null
      current.onend = null
      current.abort()
      recognition.current = null
    }
  }
  function stopVoice() {
    detachVoice()
    setListening(false)
  }
  useEffect(() => () => detachVoice(), [])
  useEffect(() => {
    if (card) {
      rewritePanel.current?.focus({ preventScroll: true })
      rewritePanel.current?.scrollIntoView({ block: 'start' })
    }
  }, [card])
  useEffect(() => {
    if (!listening) return
    const timeout = setTimeout(() => {
      detachVoice()
      setListening(false)
      setStatus('Voice input paused after 30 seconds. Review your text, or try a preset.')
    }, 30_000)
    return () => clearTimeout(timeout)
  }, [listening])

  function edit(value: string) {
    setInput(value)
    setCard(null)
    setChoice(null)
    setUnmatched(false)
    setStatus('')
  }
  function startVoice() {
    if (!Recognition || !consent || listening) return
    detachVoice()
    setCard(null)
    setChoice(null)
    setUnmatched(false)
    const instance = new Recognition()
    recognition.current = instance
    received.current = false
    failed.current = false
    instance.lang = 'en-SG'
    instance.continuous = false
    instance.interimResults = false
    instance.onresult = (event) => {
      const transcript = Array.from(event.results).filter((result) => result.isFinal).map((result) => result[0].transcript).join(' ').trim()
      if (transcript) {
        received.current = true
        setInput(transcript)
        setStatus('Transcript received. Review and edit it before finding a match. Nothing has been submitted.')
      }
    }
    instance.onerror = (event) => {
      failed.current = true
      setListening(false)
      setStatus(speechError(event.error))
    }
    instance.onend = () => {
      setListening(false)
      if (!received.current && !failed.current) setStatus('No speech was recognised. Try again, type, or pick a phrase.')
    }
    setListening(true)
    setStatus('Listening. Use only a fictional phrase. Your browser may process audio through its speech provider.')
    try {
      instance.start()
    } catch {
      detachVoice()
      setListening(false)
      setStatus('Voice input could not start in this browser. You can type or use a preset.')
    }
  }
  function handleMatch() {
    stopVoice()
    const found = findPhrase(input, phraseCards)
    if (!found) {
      setCard(null)
      setUnmatched(true)
      setStatus(input.trim() ? 'No prepared rewrite matches this text. Choose a preset, edit the transcript, or use the optional live Copilot handoff below.' : 'Please enter a fictional phrase or choose a preset.')
      return
    }
    setUnmatched(false)
    setStatus('')
    setCard(found)
    setChoice(null)
    answered.current = false
    attempt.current = attemptId()
  }
  function handleAnswer(index: number) {
    if (!card || answered.current) return
    answered.current = true
    const correct = index === card.correctIndex
    setChoice(index)
    stopVoice()
    onResult({
      id: attempt.current, game: 'singlish', variant: card.id,
      score: correct ? 1 : 0, maxScore: 1, perfect: correct,
    })
  }

  return <section aria-label="Singlish to Boardroom">
    <GameHeading number="04" title="Singlish to Boardroom" description="Same meaning. Less lah. Zero invented promises.">
      <Tag><MessageSquareQuote size={14} />Meaning first. Fancy words optional.</Tag>
    </GameHeading>
    <div className="singlish-layout">
      <div className="singlish-input panel">
        <div className="section-label"><span>THE EVERYDAY VERSION</span><MessageSquareQuote size={20} /></div>
        <h2>Say it your way.</h2><p>Pick a fictional phrase, read it aloud, or type it. Then spot the boardroom rewrite that keeps the facts straight.</p>
        <label className="input-label" htmlFor="singlish-input">Your phrase / editable transcript</label>
        <textarea id="singlish-input" maxLength={700} value={input} onChange={(event) => edit(event.target.value)} />
        <div className="voice-panel">
          <div className="voice-heading"><Mic size={17} /><strong>Voice is optional</strong></div>
          <p>Browser speech recognition may need internet and send audio to its provider. This app saves no audio or transcript. Please use fictional content only.</p>
          {!Recognition || location.protocol === 'file:' ? <p className="helper">Voice is unavailable in this browser or local-file mode. Presets and typing still work.</p> : <>
            <label className="consent-control"><input type="checkbox" checked={consent} onChange={(event) => {
              setConsent(event.target.checked)
              if (!event.target.checked) stopVoice()
            }} /><span>I understand and choose to use voice input.</span></label>
            <button className={`button button-secondary${listening ? ' listening' : ''}`} disabled={!consent} onClick={() => {
              if (listening) { stopVoice(); setStatus('Voice stopped. Review your text before continuing.') } else startVoice()
            }}>{listening ? <MicOff size={17} /> : <Mic size={17} />}{listening ? 'Stop voice input' : 'Start voice input'}</button>
          </>}
        </div>
        {status && <p className={`notice${unmatched ? ' notice-warning' : ''}`} role="status">{status}</p>}
        <button className="button button-primary button-wide" onClick={handleMatch} disabled={listening}>Find the boardroom match<ArrowRight size={17} /></button>
        <p className="helper">Offline content is an authored phrase bank, not an AI model. New free text needs the optional live handoff.</p>
      </div>
      <aside className="preset-panel panel"><div className="section-label"><span>BORROW A LINE</span><span>8 phrase cards</span></div>
        <div className="phrase-presets">{phraseCards.map((item, index) => <button key={item.id} className={input === item.line ? 'phrase-preset selected' : 'phrase-preset'} onClick={() => { stopVoice(); edit(item.line) }}>
          <span>0{index + 1}</span><div><strong>{item.title}</strong><p>{item.line}</p></div>
        </button>)}</div>
      </aside>
    </div>
    {card && <div className="rewrite-panel panel" ref={rewritePanel} tabIndex={-1}>
      <div className="section-label"><span>SPOT THE FAITHFUL REWRITE</span><Tag subtle>Prepared examples, not live AI</Tag></div>
      <h2>Boardroom, not bored-room.</h2><p>Which version preserves the meaning without adding facts?</p>
      <div className="rewrite-choices">{card.choices.map((text, index) => <button key={text} className={`rewrite-choice${choice === index ? ' chosen' : ''}${choice !== null && index === card.correctIndex ? ' correct-rewrite' : ''}`} disabled={choice !== null} onClick={() => handleAnswer(index)}>
        <span className="rewrite-letter">{String.fromCharCode(65 + index)}</span><span>{text}</span>{choice !== null && index === card.correctIndex && <Check size={20} />}
      </button>)}</div>
      {choice !== null && <div className="rewrite-feedback" role="status"><h3>{choice === card.correctIndex ? 'Professional. Faithful. Confirm can.' : 'Aiyoh, that one added a little too much.'}</h3><p>{card.explanation}</p><p className="helper">{choice === card.correctIndex ? '1 / 1' : '0 / 1'} · Local score saved for this phrase. This judges the rewrite, not your accent.</p>
        <button className="button button-secondary" onClick={() => {
          const next = phraseCards[(phraseCards.findIndex((item) => item.id === card.id) + 1) % phraseCards.length]!
          edit(next.line)
        }}><RotateCcw size={16} />Try the next phrase</button>
      </div>}
    </div>}
    {input.trim() && <LiveHandoff prompt={singlishPrompt(input.trim())} />}
    <PersonaNote name="Mei">A useful draft sounds professional without losing facts or making promises. Mei reviews it and decides whether to send.</PersonaNote>
  </section>
}
