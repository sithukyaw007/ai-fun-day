import { useEffect, useRef, useState } from 'react'
import { Activity, ArrowDownToLine, ArrowRight, BookOpen, Check, ChevronRight, Files, Grid2X2, MessageSquareQuote, Moon, QrCode, Settings2, ShieldCheck, Smartphone, Sparkles, Sun, Trophy, Wifi, WifiOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import BeatAgent from './games/BeatAgent'
import SpotDrift from './games/SpotDrift'
import Quiz from './games/Quiz'
import Singlish from './games/Singlish'
import JoinQuiz from './components/JoinQuiz'
import LocalScores from './components/LocalScores'
import { Tag } from './components/Common'
import { useNetwork, useOfflineCache } from './lib/hooks'
import { useScores } from './lib/scores'
import { gameNames } from './types'
import type { GameId, Route } from './types'

const games: { id: GameId; number: string; icon: LucideIcon; caption: string; badge: string }[] = [
  { id: 'beat', number: '01', icon: Files, caption: 'Find the facts. Beat the clock.', badge: 'THE MAIN EVENT' },
  { id: 'drift', number: '02', icon: Activity, caption: 'Catch it before the tenant calls.', badge: 'QUICK REACTIONS' },
  { id: 'quiz', number: '03', icon: Sparkles, caption: 'Eight claims. Can, or cannot?', badge: 'PLAY ON YOUR PHONE' },
  { id: 'singlish', number: '04', icon: MessageSquareQuote, caption: 'Same meaning. Less lah.', badge: 'SAY IT YOUR WAY' },
]
const routes: string[] = [...games.map((game) => game.id), 'home', 'join', 'scores', 'host']

function readRoute(): Route | 'not-found' {
  const hash = location.hash.replace(/^#\/?/, '')
  if (!hash) return 'beat'
  return routes.includes(hash) ? hash as Route : 'not-found'
}

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark')
  const [active, setActive] = useState(false)
  const main = useRef<HTMLElement>(null)
  const online = useNetwork()
  const offline = useOfflineCache()
  const scores = useScores()
  const release = document.documentElement.dataset.release !== 'dev'
  const localFile = location.protocol === 'file:'

  useEffect(() => {
    const change = () => {
      setRoute(readRoute())
      window.scrollTo(0, 0)
      main.current?.focus({ preventScroll: true })
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  useEffect(() => {
    document.querySelector('.game-nav-item.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [route])

  function toggleTheme() {
    document.documentElement.dataset.theme = dark ? 'light' : 'dark'
    setDark(!dark)
  }
  const gameProps = { onResult: scores.record, onActive: setActive }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); main.current?.focus() }}>Skip to game</a>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="#/home" aria-label="JTC AI Playground home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span className="brand-word">Microsoft<span>JTC AI PLAYGROUND</span></span></a>
      <div className="header-actions">
        <span className={`connection-status${online ? '' : ' is-offline'}`}>{online ? <Wifi size={14} /> : <WifiOff size={14} />}<span>{online ? 'Offline-ready games' : 'Playing offline'}</span></span>
        <a className="header-link" href="#/join" aria-label="Quiz QR"><QrCode size={18} /><span>Quiz QR</span></a>
        <a className="header-link" href="#/scores" aria-label="Local scores"><Trophy size={18} /><span>Local scores</span></a>
        <button className="icon-button" onClick={toggleTheme} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
        <a className="icon-button host-link" href="#/host" aria-label="Booth host guide"><Settings2 size={19} /></a>
      </div>
    </div></header>
    <div className="nav-wrap"><nav className="game-nav" aria-label="Games">
      {games.map((game) => <a key={game.id} href={`#/${game.id}`} className={route === game.id ? 'game-nav-item active' : 'game-nav-item'} aria-current={route === game.id ? 'page' : undefined}><span className="nav-number">{game.number}</span><game.icon size={18} /><span>{gameNames[game.id]}</span>{route === game.id && <span className="nav-dot" />}</a>)}
    </nav></div>
    {offline.waiting && <div className="update-notice notice"><span>A new offline release is ready. {active ? 'Finish this round before updating.' : 'Update between visitors.'}</span><button className="text-button" disabled={active} onClick={offline.applyUpdate}>Load update</button></div>}
    {scores.warning && <div className="storage-notice notice notice-warning" role="status">{scores.warning}</div>}
    <main id="main-content" ref={main} tabIndex={-1} className="main-content">
      <div className="event-line"><span>MICROSOFT BOOTH <span className="separator">/</span> JTC AI &amp; ANALYTICS DAY</span><span>Four little challenges. One connected estate.</span></div>
      {route === 'beat' && <BeatAgent {...gameProps} />}
      {route === 'drift' && <SpotDrift {...gameProps} />}
      {route === 'quiz' && <Quiz {...gameProps} />}
      {route === 'singlish' && <Singlish {...gameProps} />}
      {route === 'join' && <JoinQuiz dark={dark} />}
      {route === 'scores' && <LocalScores results={scores.results} onClear={scores.clear} />}
      {route === 'home' && <section className="home">
        <div className="home-heading"><Tag><Grid2X2 size={14} />Pick your kind of clever</Tag><h1>Come for the AI.<br /><span>Stay for the aiyoh.</span></h1><p>A little friendly competition, inspired by a day in a connected estate.<br />No sign-in. No real tenant data. Just you versus the challenge.</p></div>
        <div className="game-gallery">{games.map((game) => <a key={game.id} className={`gallery-card gallery-${game.id}`} href={`#/${game.id}`}>
          <div className="section-label"><span>{game.badge}</span><span>{game.number}</span></div>
          <div className="gallery-illustration" aria-hidden="true"><game.icon size={72} strokeWidth={1} /><span className="illustration-orbit" /><span className="illustration-note">{game.id === 'beat' ? '60s' : game.id === 'drift' ? '4.5 C' : game.id === 'quiz' ? '8 / 8' : 'lah ->'}</span></div>
          <h2>{gameNames[game.id]}</h2><p>{game.caption}</p><span className="gallery-cta">Let's play<ArrowRight size={18} /></span>
        </a>)}</div>
        <a className="queue-banner" href="#/join"><Smartphone size={25} /><div><strong>Waiting your turn? Your phone is a game controller.</strong><p>Open the QR display and let the queue play AI or Aiyoh?</p></div><ChevronRight size={22} /></a>
      </section>}
      {route === 'host' && <section>
        <div className="game-heading"><div><div className="eyebrow"><BookOpen size={15} /> BOOTH HOST GUIDE</div><h1>Keep the booth flowing.</h1><p>One laptop, one phone, four good conversation starters.</p></div><Tag subtle>No account connection needed</Tag></div>
        <div className="host-grid">
          <article className="panel host-card"><span className="step-number">01</span><h2>Lead with the evidence hunt.</h2><p>Open Beat the Agent on the laptop. Give the visitor the context, then let them start the clock. Reward a correct, sourced answer, not just speed.</p><a className="text-link" href="#/beat">Open the main game<ArrowRight size={16} /></a></article>
          <article className="panel host-card"><span className="step-number">02</span><h2>Let the queue play.</h2><p>Open the Quiz QR page on your phone. Visitors scan it using their own mobile data and show you their result. Phone and laptop scores do not sync.</p><a className="text-link" href="#/join">Show the QR code<ArrowRight size={16} /></a></article>
          <article className="panel host-card"><span className="step-number">03</span><h2>Switch the pace.</h2><p>Use Singlish for a shared laugh, or Spot the Drift for a quick reaction challenge. In the drift game, some rounds are healthy: waiting is a valid move.</p><a className="text-link" href="#/singlish">Try a Singlish phrase<ArrowRight size={16} /></a></article>
          <article className="panel host-card"><span className="step-number">04</span><h2>Bring it back to the story.</h2><p>Mei checks records and drafts notices. Chloe spots emerging facilities issues. Connected information helps both; the officer still decides.</p><span className="host-close">"The officer decides. Copilot did the legwork."</span></article>
        </div>
        <div className="panel host-notes"><h2>Before the first visitor</h2>
          <p><strong>Offline:</strong> {offline.status}. Open the site online once and wait for caching, or download the standalone HTML and keep it on the laptop. First-time QR visitors still need internet.</p>
          {!localFile && release && <a className="button button-secondary" href="./booth-offline.html" download="jtc-ai-playground-offline.html"><ArrowDownToLine size={17} />Download offline copy</a>}
          {localFile && <p className="notice"><Check size={17} />You are using the standalone offline copy. Voice and clipboard features may be unavailable here.</p>}
          <p><strong>Voice:</strong> rehearse the microphone in the actual booth browser. Permission or service failure must never block typed/preset play. Browser speech may process audio online; use fictional phrases.</p>
          <p><strong>Optional Copilot:</strong> use your already-approved session/account. Copy the full synthetic prompt pack from the game. Check citations and uncertainty. The game has no AI API connection and never sends messages.</p>
          <p><strong>Reset:</strong> use the game's replay controls between visitors. Leaving a game cancels the current attempt. Local scores persist only in that browser; clear them from Local scores at the end of the event.</p>
          <p><strong>Privacy:</strong> no sign-in, contact collection, webcam, app analytics, or saved transcripts. Game results are anonymous and local. The hosting provider may retain standard access/security logs. Public-source code and prepared answers mean scores are informal, not tamper-proof.</p>
          <p><strong>Demonstration:</strong> all people, documents, figures and telemetry are fictional. This is not a production JTC system, an operational alarm, or a connected Microsoft service.</p>
          <p className="helper">This guide is public and changes only this device's experience. It is not an authenticated administrator panel.</p>
        </div>
      </section>}
      {route === 'not-found' && <section className="panel empty-state"><h1>That game link went missing.</h1><p>No mystery to solve here. Choose a game from the playground.</p><a className="button button-primary" href="#/home">Back to the playground<ArrowRight size={18} /></a></section>}
    </main>
    <footer className="site-footer"><div className="footer-story"><ShieldCheck size={19} /><strong>The officer decides.<span> Copilot did the legwork.</span></strong></div><div className="footer-bottom"><span>Fictional booth demo. Synthetic data. No app analytics.</span><span>{offline.status}</span><a href="#/host">Host guide &amp; privacy<ArrowRight size={13} /></a></div></footer>
  </div>
}
