import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ShieldCheck, Trophy, UserRound, X } from 'lucide-react'
import { validateNickname } from '../lib/players'

export default function PlayerCheckIn({ onJoin, onCancel, guestName }: {
  onJoin: (nickname: string) => void
  onCancel: () => void
  guestName: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => { if (element?.open) element.close() }
  }, [])
  return <dialog ref={dialog} className="checkin-dialog" aria-labelledby="checkin-title" aria-describedby="checkin-privacy" onCancel={onCancel}>
    <button className="icon-button checkin-close" aria-label="Close player check-in" onClick={onCancel}><X size={19} /></button>
    <div className="checkin-art" aria-hidden="true"><span className="checkin-avatar">{name.trim() ? [...name.trim()][0]?.toUpperCase() : <UserRound size={38} />}</span><span className="mini-medal"><Trophy size={21} /></span><span className="checkin-doodle">YOUR TURN</span></div>
    <div className="eyebrow">A LITTLE FRIENDLY COMPETITION</div>
    <h2 id="checkin-title">What should we<br />call our next challenger?</h2>
    <form onSubmit={(event) => {
      event.preventDefault()
      const validated = validateNickname(name)
      if (validated.error) { setError(validated.error); return }
      onJoin(validated.value || guestName)
    }}>
      <label className="input-label" htmlFor="player-nickname">Name or nickname (optional)</label>
      <input id="player-nickname" autoFocus autoComplete="off" maxLength={40} placeholder="e.g. ChillerChamp" value={name}
        aria-invalid={!!error} aria-describedby={error ? 'nickname-error checkin-privacy' : 'checkin-privacy'}
        onChange={(event) => { setName(event.target.value); setError('') }} />
      {error && <p id="nickname-error" className="notice notice-warning" role="alert">{error}</p>}
      <p className="helper" id="checkin-privacy"><ShieldCheck size={14} />Use a nickname, not personal details. It appears with scores on this device only. Nothing is uploaded.</p>
      <button type="submit" className="button button-primary button-wide">Join the leaderboard<ArrowRight size={17} /></button>
      <button type="button" className="text-button checkin-guest" onClick={() => onJoin(guestName)}>Play as {guestName} instead</button>
    </form>
  </dialog>
}
