import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, ArrowDownToLine, ArrowRight, BookOpen, Check, ChevronRight, CirclePlay, Cloud, Files, Grid2X2, MessageSquareQuote, Moon, QrCode, Settings2, ShieldCheck, Smartphone, Sparkles, Sun, Trophy, UserRound, UserRoundPlus, Wifi, WifiOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import BeatAgent from './games/BeatAgent'
import SpotDrift from './games/SpotDrift'
import Quiz from './games/Quiz'
import Singlish from './games/Singlish'
import JoinQuiz from './components/JoinQuiz'
import LocalScores from './components/LocalScores'
import PlayerCheckIn from './components/PlayerCheckIn'
import GameplayGuide from './components/GameplayGuide'
import { Tag } from './components/Common'
import { useNetwork, useOfflineCache } from './lib/hooks'
import { useScores } from './lib/scores'
import { useSharedScores } from './lib/sharedScores'
import { leaderboardUrl, nextGuestName } from './lib/players'
import { gameNames } from './types'
import type { GameId, PlayerProfile, ResultInput, Route } from './types'
import { attemptId } from './lib/scoring'

const games: { id: GameId; number: string; icon: LucideIcon; caption: string; badge: string }[] = [
  { id: 'beat', number: '01', icon: Files, caption: 'Find the facts. Take your time.', badge: 'THE MAIN EVENT' },
  { id: 'drift', number: '02', icon: Activity, caption: 'Catch it before the tenant calls.', badge: 'QUICK REACTIONS' },
  { id: 'quiz', number: '03', icon: Sparkles, caption: 'Eight claims. Can, or cannot?', badge: 'PLAY ON YOUR PHONE' },
  { id: 'singlish', number: '04', icon: MessageSquareQuote, caption: 'Same meaning. Less lah.', badge: 'SAY IT YOUR WAY' },
]
const routes: string[] = [...games.map((game) => game.id), 'home', 'join', 'scores', 'host']

interface PendingRound {
  game: GameId
  start: () => void
}

function readRoute(): Route | 'not-found' {
  const hash = location.hash.replace(/^#\/?/, '').split('?')[0] ?? ''
  if (!hash) return 'beat'
  return routes.includes(hash) ? hash as Route : 'not-found'
}

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark')
  const [active, setActive] = useState(false)
  const [player, setPlayer] = useState<PlayerProfile | null>(null)
  const playerRef = useRef<PlayerProfile | null>(null)
  const checkInVersion = useRef(0)
  const [checkIn, setCheckIn] = useState(false)
  const pendingStart = useRef<PendingRound | null>(null)
  const seenGuides = useRef(new Set<GameId>())
  const [guide, setGuide] = useState<{ game: GameId; pendingRound: boolean } | null>(null)
  const [session, setSession] = useState(0)
  const [lastResult, setLastResult] = useState<ResultInput | null>(null)
  const main = useRef<HTMLElement>(null)
  const online = useNetwork()
  const offline = useOfflineCache()
  const scores = useScores()
  const shared = useSharedScores()
  const saveResult = scores.record
  const publishResult = shared.publish
  const release = document.documentElement.dataset.release !== 'dev'
  const localFile = location.protocol === 'file:'

  useEffect(() => {
    const change = () => {
      setRoute(readRoute())
      pendingStart.current = null
      setCheckIn(false)
      checkInVersion.current++
      setGuide(null)
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
  const recordResult = useCallback((result: ResultInput) => {
    saveResult(result, playerRef.current ?? undefined)
    if (playerRef.current) publishResult(result, playerRef.current)
    setLastResult(result)
  }, [saveResult, publishResult])
  const prepareRound = useCallback((pending: PendingRound) => {
    if (!seenGuides.current.has(pending.game)) setGuide({ game: pending.game, pendingRound: true })
    else {
      pendingStart.current = null
      pending.start()
    }
  }, [])
  const beginRound = useCallback((start: () => void) => {
    const game = games.find((item) => item.id === route)?.id
    if (!game) return
    setLastResult(null)
    const pending = { game, start }
    pendingStart.current = pending
    if (playerRef.current) prepareRound(pending)
    else setCheckIn(true)
  }, [route, prepareRound])
  function nextPlayer() {
    if (active) return
    playerRef.current = null
    setPlayer(null)
    setSession((value) => value + 1)
    setLastResult(null)
    pendingStart.current = null
    seenGuides.current.clear()
    setGuide(null)
    setCheckIn(true)
    checkInVersion.current++
  }
  function finishCheckIn(profile: PlayerProfile) {
    playerRef.current = profile
    seenGuides.current.clear()
    setPlayer(profile)
    setCheckIn(false)
    const pending = pendingStart.current
    if (pending) prepareRound(pending)
  }
  const gameProps = { onResult: recordResult, onActive: setActive, onStart: beginRound, shared: shared.enabled }
  const isGame = games.some((game) => game.id === route)

  return <div className={`app-shell${shared.enabled ? ' has-shared-board' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); main.current?.focus() }}>Skip to game</a>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="#/home" aria-label="JTC AI Playground home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span className="brand-word">Microsoft<span>JTC AI PLAYGROUND</span></span></a>
      <div className="header-actions">
        <span className={`connection-status${online ? '' : ' is-offline'}`}>{online ? <Wifi size={14} /> : <WifiOff size={14} />}<span>{online ? 'Offline-ready games' : 'Playing offline'}</span></span>
        <a className="header-link" href="#/join" aria-label="Quiz QR"><QrCode size={18} /><span>Quiz QR</span></a>
        <a className="header-link leaderboard-link" href="#/scores" aria-label="Leaderboard"><Trophy size={18} /><span>Leaderboard</span></a>
        <button className="icon-button" onClick={toggleTheme} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
        <a className="icon-button host-link" href="#/host" aria-label="Booth host guide"><Settings2 size={19} /></a>
      </div>
    </div></header>
    <div className="nav-wrap"><nav className="game-nav" aria-label="Games">
      {games.map((game) => <a key={game.id} href={`#/${game.id}`} className={route === game.id ? 'game-nav-item active' : 'game-nav-item'} aria-current={route === game.id ? 'page' : undefined}><span className="nav-number">{game.number}</span><game.icon size={18} /><span>{gameNames[game.id]}</span>{route === game.id && <span className="nav-dot" />}</a>)}
    </nav></div>
    {offline.waiting && <div className="update-notice notice"><span>A new offline release is ready. {active ? 'Finish this round before updating.' : 'Update between visitors.'}</span><button className="text-button" disabled={active || checkIn || guide !== null} onClick={offline.applyUpdate}>Load update</button></div>}
    {scores.warning && <div className="storage-notice notice notice-warning" role="status">{scores.warning}</div>}
    {shared.enabled && <div className={`shared-status notice${shared.error || shared.submissionError ? ' notice-warning' : ''}`} role="status">
      <Cloud size={18} /><div><strong>{shared.status === 'online' ? 'Shared leaderboard connected' : shared.status === 'loading' ? 'Connecting to the shared leaderboard...' : 'Shared leaderboard connection unavailable'}</strong>
        <p>{shared.pending ? `${shared.pending} score upload(s) awaiting confirmation. Keep this tab open and retry. ` : 'Nicknames and best scores are shared. Each device has its own player. '}
          {shared.submissionError || shared.error || (shared.refreshedAt ? 'Refreshes automatically every 10 seconds.' : '')}</p>
      </div><button className="text-button" onClick={shared.retry}>{shared.pending ? 'Retry sync' : 'Refresh board'}</button>
    </div>}
    <main id="main-content" ref={main} tabIndex={-1} className="main-content">
      <div className="event-line"><span>MICROSOFT BOOTH <span className="separator">/</span> JTC AI &amp; ANALYTICS DAY</span>
        <div className="booth-player-tools">
          {isGame && <button className="button button-secondary how-to-play" disabled={active}
            title={active ? 'Finish this round to replay the guide.' : 'Watch a short gameplay demo'}
            onClick={() => {
              const current = games.find((game) => game.id === route)
              if (current) { pendingStart.current = null; setGuide({ game: current.id, pendingRound: false }) }
            }}><CirclePlay size={16} />How to play</button>}
        <button className="player-session-button" disabled={active} onClick={nextPlayer} title={active ? 'Finish this round before changing player' : undefined}>
          <UserRound size={15} />{player ? <><strong>{player.nickname}</strong><span>Next player</span></> : 'Choose your nickname'}<ChevronRight size={14} />
        </button>
        </div>
      </div>
      {route === 'beat' && <BeatAgent key={`beat-${session}`} {...gameProps} />}
      {route === 'drift' && <SpotDrift key={`drift-${session}`} {...gameProps} />}
      {route === 'quiz' && <Quiz key={`quiz-${session}`} {...gameProps} />}
      {route === 'singlish' && <Singlish key={`singlish-${session}`} {...gameProps} />}
      {isGame && lastResult && !active && <div className="player-result-actions">
        <span><Trophy size={20} /><strong>{player?.nickname}</strong>{shared.enabled ? ', your result is saved on this device. Shared upload status is shown above.' : ", you're on the board."}</span>
        <a className="button button-secondary" href={leaderboardUrl(lastResult.game, lastResult.variant)}><Trophy size={17} />View leaderboard</a>
        <button className="button button-primary" onClick={nextPlayer}><UserRoundPlus size={17} />Next player</button>
      </div>}
      {route === 'join' && <JoinQuiz dark={dark} shared={shared.enabled} />}
      {route === 'scores' && <LocalScores results={scores.results} shared={shared} onClear={() => {
        scores.clear()
        playerRef.current = null
        setPlayer(null)
        setLastResult(null)
        seenGuides.current.clear()
        pendingStart.current = null
        setSession((value) => value + 1)
      }} />}
      {route === 'home' && <section className="home">
        <div className="home-heading"><Tag><Grid2X2 size={14} />Pick your kind of clever</Tag><h1>Come for the AI.<br /><span>Stay for the aiyoh.</span></h1><p>A little friendly competition, inspired by a day in a connected estate.<br />No sign-in. No real tenant data. Just you versus the challenge.</p></div>
        <div className="game-gallery">{games.map((game) => <a key={game.id} className={`gallery-card gallery-${game.id}`} href={`#/${game.id}`}>
          <div className="section-label"><span>{game.badge}</span><span>{game.number}</span></div>
          <div className="gallery-illustration" aria-hidden="true"><game.icon size={72} strokeWidth={1} /><span className="illustration-orbit" /><span className="illustration-note">{game.id === 'beat' ? 'No limit' : game.id === 'drift' ? '4.5 C' : game.id === 'quiz' ? '8 / 8' : 'lah ->'}</span></div>
          <h2>{gameNames[game.id]}</h2><p>{game.caption}</p><span className="gallery-cta">Let's play<ArrowRight size={18} /></span>
        </a>)}</div>
        <a className="queue-banner" href="#/join"><Smartphone size={25} /><div><strong>Waiting your turn? Your phone is a game controller.</strong><p>Open the QR display and let the queue play AI or Aiyoh?</p></div><ChevronRight size={22} /></a>
      </section>}
      {route === 'host' && <section>
        <div className="game-heading"><div><div className="eyebrow"><BookOpen size={15} /> BOOTH HOST GUIDE</div><h1>Keep the booth flowing.</h1><p>One laptop, one phone, four good conversation starters.</p></div><Tag subtle>No account connection needed</Tag></div>
        <div className="host-grid">
          <article className="panel host-card"><span className="step-number">01</span><h2>Lead with the evidence hunt.</h2><p>Open Beat the Agent on the laptop. Let the visitor read and explore at their own pace. The counter records elapsed time without a deadline; accuracy and evidence determine the score.</p><a className="text-link" href="#/beat">Open the main game<ArrowRight size={16} /></a></article>
          <article className="panel host-card"><span className="step-number">02</span><h2>Let the queue play.</h2><p>Open the Quiz QR page on your phone. Visitors scan it using mobile data and check in independently. Online shared check-ins publish their best scores to the same board.</p><a className="text-link" href="#/join">Show the QR code<ArrowRight size={16} /></a></article>
          <article className="panel host-card"><span className="step-number">03</span><h2>Switch the pace.</h2><p>Use Singlish for a shared laugh, or Spot the Drift for a quick reaction challenge. In the drift game, some rounds are healthy: waiting is a valid move.</p><a className="text-link" href="#/singlish">Try a Singlish phrase<ArrowRight size={16} /></a></article>
          <article className="panel host-card"><span className="step-number">04</span><h2>Bring it back to the story.</h2><p>Mei checks records and drafts notices. Chloe spots emerging facilities issues. Connected information helps both; the officer still decides.</p><span className="host-close">"The officer decides. Copilot did the legwork."</span></article>
        </div>
        <div className="panel host-notes"><h2>Before the first visitor</h2>
          <p><strong>Offline:</strong> {offline.status}. Open the site online once and wait for caching, or download the standalone HTML and keep it on the laptop. First-time QR visitors still need internet.</p>
          {!localFile && release && <a className="button button-secondary" href="./booth-offline.html" download="jtc-ai-playground-offline.html"><ArrowDownToLine size={17} />Download offline copy</a>}
          {localFile && <p className="notice"><Check size={17} />You are using the standalone offline copy. Voice and clipboard features may be unavailable here.</p>}
          <p><strong>Voice:</strong> rehearse the microphone in the actual booth browser. Permission or service failure must never block typed/preset play. Browser speech may process audio online; use fictional phrases.</p>
          <p><strong>Optional Copilot:</strong> use your already-approved session/account. Copy the full synthetic prompt pack from the game. Check citations and uncertainty. The game has no AI API connection and never sends messages.</p>
          <p><strong>Players:</strong> each device checks visitors in independently. Online shared check-in publishes a nickname and best result per game/case to one public board. Use Next player between visitors; it never changes the player on someone else's device. Identical nicknames are separate people, not a way to log in as someone else.</p>
          <p><strong>How to play:</strong> each new player gets a short silent walkthrough before their first round of each game. Skip it or watch the three steps, then choose Got it. The game clock starts only after that. How to play replays the guide between rounds; Next player resets all four guides. Practice demos never earn scores or use the microphone. Reduced-motion mode uses manual still frames.</p>
          <p><strong>Offline and sync:</strong> the standalone file and local previews use device-only play. The hosted shared board needs internet. Failed uploads remain pending while this tab is open; use Retry sync. Local-only players and old device history are never uploaded automatically. Reloading loses pending uploads and the active player; local results remain.</p>
          <p><strong>Reset:</strong> Clear this device's scores clears local history, not the public shared board or already-submitted scores. Administrative shared-board cleanup requires the host's Azure account. Sessions expire after 24 hours; public reads show the last seven days. The host must remove cloud records after the event.</p>
          <p><strong>Privacy:</strong> shared check-in explicitly discloses public nicknames/scores before upload. Prefer a nickname and avoid personal details; a local-only option remains available. No email, webcam, audio or transcript is uploaded by the scoreboard. Azure monitoring and hosting providers may retain standard service/access logs. Scores are informal, not tamper-proof.</p>
          <p><strong>Demonstration:</strong> all people, documents, figures and telemetry are fictional. This is not a production JTC system, an operational alarm, or a connected Microsoft service.</p>
          <p className="helper">This guide is public and changes only this device's experience. It is not an authenticated administrator panel.</p>
        </div>
      </section>}
      {route === 'not-found' && <section className="panel empty-state"><h1>That game link went missing.</h1><p>No mystery to solve here. Choose a game from the playground.</p><a className="button button-primary" href="#/home">Back to the playground<ArrowRight size={18} /></a></section>}
    </main>
    {checkIn && <PlayerCheckIn guestName={nextGuestName(scores.results)} shared={shared.enabled}
      onCancel={() => { checkInVersion.current++; pendingStart.current = null; setCheckIn(false) }}
      onLocalJoin={(nickname) => finishCheckIn({ id: attemptId(), nickname })}
      onJoin={async (nickname) => {
        const version = checkInVersion.current
        const profile = shared.enabled ? await shared.join(nickname) : { id: attemptId(), nickname }
        if (version === checkInVersion.current) finishCheckIn(profile)
      }} />}
    {guide && <GameplayGuide game={guide.game} pendingRound={guide.pendingRound} onCancel={() => {
      pendingStart.current = null
      setGuide(null)
    }} onContinue={() => {
      if (playerRef.current) seenGuides.current.add(guide.game)
      const pending = pendingStart.current
      pendingStart.current = null
      setGuide(null)
      pending?.start()
    }} />}
    <footer className="site-footer"><div className="footer-story"><ShieldCheck size={19} /><strong>The officer decides.<span> Copilot did the legwork.</span></strong></div><div className="footer-bottom"><span>Fictional booth demo. Synthetic data. No app analytics.</span><span>{offline.status}</span><a href="#/host">Host guide &amp; privacy<ArrowRight size={13} /></a></div></footer>
  </div>
}
