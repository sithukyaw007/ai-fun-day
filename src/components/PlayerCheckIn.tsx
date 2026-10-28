import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ShieldCheck, Trophy, UserRound, X } from 'lucide-react'
import { validateNickname } from '../lib/players'

export default function PlayerCheckIn({ onJoin, onCancel, guestName, shared = false, onLocalJoin }: {
  onJoin: (nickname: string) => void | Promise<void>
  onCancel: () => void
  guestName: string
  shared?: boolean
  onLocalJoin?: (nickname: string) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    const element = dialog.current
    element?.showModal()
    return () => { mounted.current = false; if (element?.open) element.close() }
  }, [])
  async function submit(raw: string, local = false) {
    const validated = validateNickname(raw)
    if (validated.error) { setError(validated.error); return }
    setBusy(true)
    setError('')
    try {
      if (local && onLocalJoin) onLocalJoin(validated.value || guestName)
      else await onJoin(validated.value || guestName)
    } catch (reason) {
      if (mounted.current) setError(`Shared check-in failed: ${reason instanceof Error ? reason.message : 'Please retry.'} You can also play on this device only.`)
    } finally { if (mounted.current) setBusy(false) }
  }
  return <dialog ref={dialog} className="checkin-dialog" aria-labelledby="checkin-title" aria-describedby="checkin-privacy" onCancel={onCancel}>
    <button className="icon-button checkin-close" aria-label="Close player check-in" onClick={onCancel}><X size={19} /></button>
    <div className="checkin-art" aria-hidden="true"><span className="checkin-avatar">{name.trim() ? [...name.trim()][0]?.toUpperCase() : <UserRound size={38} />}</span><span className="mini-medal"><Trophy size={21} /></span><span className="checkin-doodle">YOUR TURN</span></div>
    <div className="eyebrow">A LITTLE FRIENDLY COMPETITION</div>
    <h2 id="checkin-title">What should we<br />call our next challenger?</h2>
    <form onSubmit={(event) => {
      event.preventDefault()
      void submit(name)
    }}>
      <label className="input-label" htmlFor="player-nickname">Name or nickname (optional)</label>
      <input id="player-nickname" autoFocus autoComplete="off" maxLength={40} placeholder="e.g. ChillerChamp" value={name}
        aria-invalid={!!error} aria-describedby={error ? 'nickname-error checkin-privacy' : 'checkin-privacy'}
        onChange={(event) => { setName(event.target.value); setError('') }} />
      {error && <p id="nickname-error" className="notice notice-warning" role="alert">{error}</p>}
      <p className="helper" id="checkin-privacy"><ShieldCheck size={14} />{shared
        ? 'Use a nickname, not personal details. By joining, you share your nickname and best game scores publicly across devices. No email or sign-in required.'
        : 'Use a nickname, not personal details. It appears with scores on this device only. Nothing is uploaded.'}</p>
      <button type="submit" disabled={busy} className="button button-primary button-wide">{busy ? 'Checking in...' : shared ? 'Join shared leaderboard' : 'Join the leaderboard'}<ArrowRight size={17} /></button>
      <button type="button" disabled={busy} className="text-button checkin-guest" onClick={() => void submit(guestName)}>Play as {guestName} instead</button>
      {shared && <button type="button" disabled={busy} className="text-button checkin-guest" onClick={() => void submit(name, true)}>Play on this device only</button>}
    </form>
  </dialog>
}
