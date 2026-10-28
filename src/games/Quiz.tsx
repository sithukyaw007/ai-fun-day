import { useRef, useState } from 'react'
import { ArrowRight, Check, Lightbulb, RotateCcw, Smartphone, X } from 'lucide-react'
import { quizQuestions } from '../data/quiz'
import { GameHeading, ResultBadge, Tag } from '../components/Common'
import { useRoundActivity } from '../lib/hooks'
import type { GameProps } from '../lib/hooks'
import { attemptId } from '../lib/scoring'

export default function Quiz({ onResult, onActive }: GameProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [index, setIndex] = useState(0)
  const [responses, setResponses] = useState<(boolean | null)[]>(quizQuestions.map(() => null))
  const started = useRef(0)
  const attempt = useRef('')
  const completed = useRef(false)
  useRoundActivity(onActive, phase === 'playing')
  const question = quizQuestions[index]!
  const chosen = responses[index] ?? null
  const score = quizQuestions.filter((item, i) => responses[i] === item.correct).length

  function start() {
    started.current = performance.now()
    attempt.current = attemptId()
    completed.current = false
    setResponses(quizQuestions.map(() => null))
    setIndex(0)
    setPhase('playing')
  }
  function next() {
    if (chosen === null) return
    if (index < quizQuestions.length - 1) {
      setIndex(index + 1)
    } else if (!completed.current) {
      completed.current = true
      onResult({
        id: attempt.current, game: 'quiz', variant: 'eight-questions',
        score, maxScore: quizQuestions.length, perfect: score === quizQuestions.length,
        elapsedMs: performance.now() - started.current,
      })
      setPhase('done')
    }
  }
  return <section aria-label="AI or Aiyoh?">
    <GameHeading number="03" title="AI or Aiyoh?" description="Good AI instincts. A little Singapore flavour.">
      <Tag><Smartphone size={14} />Made for the queue</Tag>
    </GameHeading>
    {phase === 'ready' ? <div className="quiz-welcome panel">
      <div className="quiz-art" aria-hidden="true"><span>AI?</span><span>Aiyoh.</span><Lightbulb size={48} /></div>
      <div className="eyebrow">8 CLAIMS. TRUST YOUR INSTINCTS.</div>
      <h2>Can, or cannot?</h2>
      <p>AI sounds clever. But is it making sense? Give each claim a <strong>Can!</strong> or an <strong>Aiyoh!</strong> and see how your instincts stack up.</p>
      <button className="button button-primary" onClick={start}>Let's play<ArrowRight size={18} /></button>
      <p className="helper">No sign-in. No photo guessing. No contact collection.<br />Play on your phone and show your result to the host.</p>
    </div> : phase === 'playing' ? <div className="quiz-card panel">
      <div className="quiz-progress" aria-label={`Question ${index + 1} of ${quizQuestions.length}`}>
        {quizQuestions.map((item, i) => <span key={item.id} className={i < index ? 'complete' : i === index ? 'current' : ''} />)}
      </div>
      <div className="section-label"><span>QUESTION {index + 1} / {quizQuestions.length}</span><span>{question.topic}</span></div>
      <h2 className="quiz-claim">{question.claim}</h2>
      <div className="quiz-choices">
        <button className={`quiz-choice${chosen === true ? ' chosen' : ''}`} disabled={chosen !== null}
          onClick={() => setResponses((current) => current.map((value, i) => i === index ? true : value))}>
          <Check size={24} /><strong>Can!</strong><span>That checks out.</span>
        </button>
        <button className={`quiz-choice${chosen === false ? ' chosen' : ''}`} disabled={chosen !== null}
          onClick={() => setResponses((current) => current.map((value, i) => i === index ? false : value))}>
          <X size={24} /><strong>Aiyoh!</strong><span>Not so fast.</span>
        </button>
      </div>
      {chosen !== null && <div className="quiz-feedback" role="status">
        <span className="feedback-icon">{chosen === question.correct ? <Check size={21} /> : <Lightbulb size={21} />}</span>
        <div><h3>{chosen === question.correct ? 'Steady. You got it.' : 'A little plot twist.'}</h3><p>{question.explanation}</p></div>
      </div>}
      {chosen !== null && <button className="button button-primary next-question" onClick={next}>
        {index === quizQuestions.length - 1 ? 'Reveal my score' : 'Next claim'}<ArrowRight size={18} />
      </button>}
    </div> : <div className="quiz-results">
      <ResultBadge score={score} max={quizQuestions.length} perfect={score === quizQuestions.length}
        title={score === 8 ? 'AI street-smart. Confirm can.' : score >= 5 ? 'Solid instincts. A few new tricks.' : 'Aiyoh today. AI-savvy tomorrow.'}>
        <p>Show this card to the booth host. This is an informal game result, not a certificate or a verified prize entry.</p>
      </ResultBadge>
      <div className="panel quiz-takeaways"><span className="eyebrow">TAKE THESE INSTINCTS WITH YOU</span><h2>Sources over swagger.</h2><p>Check the evidence. Know the data's limits. Keep people in control.</p>
        <button className="button button-primary" onClick={start}><RotateCcw size={17} />Play again</button>
        <a className="text-link" href="#/beat">Try Mei's evidence hunt<ArrowRight size={16} /></a>
      </div>
      <p className="helper centered">Your score stays on this device. Nothing is synced to the laptop.</p>
    </div>}
  </section>
}
