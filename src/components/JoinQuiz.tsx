import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { ArrowDownToLine, ArrowRight, QrCode, Smartphone } from 'lucide-react'
import { CopyPrompt, GameHeading, Tag } from './Common'
import { configuredSiteUrl, quizUrl } from '../lib/sharing'

export default function JoinQuiz({ dark, shared = false }: { dark: boolean; shared?: boolean }) {
  const [publicUrl, setPublicUrl] = useState(() => {
    const configured = configuredSiteUrl()
    return configured.startsWith('https://') ? configured : ''
  })
  const [generated, setGenerated] = useState({ key: '', image: '', error: '' })
  const target = quizUrl(publicUrl, publicUrl.trim() ? '' : location.href)
  const key = `${dark}/${target ?? ''}`
  const image = generated.key === key ? generated.image : ''
  const error = generated.key === key ? generated.error : ''

  useEffect(() => {
    if (!target) return
    let disposed = false
    const styles = getComputedStyle(document.documentElement)
    QRCode.toDataURL(target, {
      width: 600, margin: 4, errorCorrectionLevel: 'M',
      color: {
        dark: styles.getPropertyValue(dark ? '--cp-bg' : '--cp-text').trim(),
        light: styles.getPropertyValue(dark ? '--cp-text' : '--cp-surface').trim(),
      },
    }).then((data) => { if (!disposed) setGenerated({ key, image: data, error: '' }) }).catch(() => {
      if (!disposed) setGenerated({ key, image: '', error: 'The QR code could not be generated. Visitors can use the quiz link below.' })
    })
    return () => { disposed = true }
  }, [target, dark, key])

  return <section aria-label="Quiz QR display">
    <GameHeading number="QR" title="Queue up. Quiz on." description="Your phone can keep the whole queue entertained.">
      <Tag><Smartphone size={14} />No sign-in. No app download.</Tag>
    </GameHeading>
    <div className="join-layout">
      <div className="qr-card panel">
        <div className="eyebrow"><QrCode size={17} /> SCAN &amp; PLAY</div>
        <h2>AI or Aiyoh?</h2><p>Eight claims. Can, or cannot?</p>
        {image ? <img className="qr-image" src={image} alt={`QR code linking directly to the AI or Aiyoh quiz: ${target}`} width={300} height={300} />
          : <div className="qr-placeholder"><QrCode size={70} /><p>{target ? 'Preparing your QR code...' : 'A public HTTPS link is needed before visitors can scan.'}</p></div>}
        {error && <p role="alert" className="notice notice-warning">{error}</p>}
        <strong className="qr-tagline">Pick a nickname. Bring your instincts.</strong>
        {target && <><a className="quiz-url" href={target}>{target}</a><CopyPrompt text={target} label="Copy quiz link" successMessage="Quiz link copied. Open this QR page on your phone, or share the quiz link with visitors." /></>}
        {image && <a className="text-link" href={image} download="jtc-quiz-qr.png"><ArrowDownToLine size={16} />Save QR image</a>}
      </div>
      <div className="join-notes">
        <div className="panel"><div className="eyebrow">FOR THE HOST'S PHONE</div><h2>Let the queue do its thing.</h2><ol className="numbered-steps"><li>Open this QR display on your phone and turn up the screen brightness.</li><li>Visitors scan it and play on their own phones using mobile data or Wi-Fi.</li><li>{shared ? 'Online players share nicknames and results on the same board. Each phone keeps its own current player.' : 'They show you the result. Scores stay on each device, not a shared board.'}</li></ol><a className="button button-primary" href="#/quiz">Play the quiz here<ArrowRight size={18} /></a></div>
        <div className="panel share-settings"><label className="input-label" htmlFor="public-url">Public site URL</label><input id="public-url" type="url" value={publicUrl} placeholder="Paste the verified HTTPS site URL" onChange={(event) => setPublicUrl(event.target.value)} />
          {!target && <p className="notice notice-warning" role="status">No shareable URL yet. Localhost, file links, and local IP addresses will not work for visitors on mobile data. Paste the verified public site URL.</p>}
          <p className="helper">The QR opens the quiz directly, preserving the project's base path. It is generated on this device, not by an external QR service.</p><p className="helper">First-time visitors need internet. The laptop's offline copy cannot serve a phone without a connection.</p>
        </div>
      </div>
    </div>
  </section>
}
