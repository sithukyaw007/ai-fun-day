import { ArrowDown, ArrowRight, BadgeCheck, Banknote, BookmarkCheck, CalendarDays, Check, Fan, FileSpreadsheet, Mail, Map, Paperclip, ShieldCheck, Sun, TriangleAlert, UsersRound, Zap } from 'lucide-react'
import type { EvidenceFile } from '../types'

const fileIcons = { register: FileSpreadsheet, email: Mail, plan: Map, policy: ShieldCheck }
const rowIcons = { tenant: UsersRound, fan: Fan, calendar: CalendarDays, cash: Banknote, check: Check, alert: TriangleAlert, power: Zap, solar: Sun, mail: Mail, shield: ShieldCheck, map: Map }

export function EvidenceBrowser({ files, activeId, onFile, selected, onToggle, editable, highlighted = [] }: {
  files: EvidenceFile[]
  activeId: string
  onFile: (id: string) => void
  selected: string[]
  onToggle: (id: string) => void
  editable: boolean
  highlighted?: string[]
}) {
  const active = files.find((file) => file.id === activeId) ?? files[0]
  if (!active) return <p role="alert">This exercise has no evidence files. Please choose another challenge.</p>
  const Icon = fileIcons[active.kind]
  return <div className="evidence-browser">
    <div className="folder-header"><Paperclip size={17} /><strong>Estate desk / messy folder</strong><span>{files.length} files</span></div>
    <div className="file-tabs" role="tablist" aria-label="Evidence files">
      {files.map((file) => {
        const FileIcon = fileIcons[file.kind]
        return <button key={file.id} role="tab" tabIndex={file.id === active.id ? 0 : -1} aria-selected={file.id === active.id} aria-controls="evidence-panel"
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const current = files.findIndex((item) => item.id === file.id)
            const index = event.key === 'Home' ? 0 : event.key === 'End' ? files.length - 1
              : (current + (event.key === 'ArrowRight' ? 1 : -1) + files.length) % files.length
            const next = files[index]!
            onFile(next.id)
            document.getElementById(`tab-${next.id}`)?.focus()
          }}
          id={`tab-${file.id}`} aria-label={file.title} onClick={() => onFile(file.id)} className={file.id === active.id ? 'file-tab active' : 'file-tab'}>
          <FileIcon size={16} /><span>{file.shortTitle ?? file.title}</span>
        </button>
      })}
    </div>
    <div className="file-content" role="tabpanel" id="evidence-panel" aria-labelledby={`tab-${active.id}`}>
      <div className="file-title"><Icon size={22} /><div><h3>{active.shortTitle ?? active.title}</h3><p>Explore the cards. Pin the evidence for your answer.</p></div></div>
      <div className={`visual-evidence visual-evidence-${active.presentation ?? 'checks'}`}>
        {active.rows.map((row) => {
          const ref = `${active.id}:${row.id}`
          const RowIcon = rowIcons[row.visual?.icon ?? 'shield']
          const amount = row.visual?.amount
          const maximum = Math.max(1, ...active.rows.map((item) => item.visual?.amount ?? 0))
          const date = active.presentation === 'leases' ? new Date(row.cells[1] ?? '') : null
          return <article key={row.id} id={`source-${ref}`} className={`evidence-tile tone-${row.visual?.tone ?? 'neutral'}${selected.includes(ref) ? ' pinned' : ''}${highlighted.includes(ref) ? ' source-highlight' : ''}`}>
            <div className="evidence-tile-top"><span className="evidence-pictogram"><RowIcon size={24} /></span><strong>{row.cells[0]}</strong>
              {row.visual?.status && <span className="evidence-status">{row.visual.status}</span>}
            </div>
            {row.visual?.units ? <div className="asset-service-map"><div className="map-branch"><ArrowDown size={18} /></div><div className="service-units">{row.visual.units.map((unit) => <div key={unit}><span className="unit-window" aria-hidden="true"><i /><i /><i /><i /></span><strong>{unit}</strong></div>)}</div></div>
              : amount !== undefined ? <div className="bid-visual"><div><strong>{row.cells[1]}</strong><span>Received {row.cells[2]}</span></div><div className="bid-track"><span style={{ width: `${amount / maximum * 100}%` }} /></div></div>
              : date ? <div className="lease-visual">{Number.isFinite(date.getTime()) ? <div className="calendar-tile"><span>{new Intl.DateTimeFormat('en-SG', { month: 'short', timeZone: 'UTC' }).format(date)}</span><strong>{date.getUTCDate()}</strong><small>{date.getUTCFullYear()}</small></div> : <p role="alert">Date unavailable. Check the original source.</p>}<div><span className="eyebrow">LEASE ENDS</span><time dateTime={row.cells[1]}>{row.cells[1]}</time><p>{row.visual?.status}</p></div></div>
              : <p className="evidence-brief">{row.visual?.detail ?? row.cells.slice(1).join(' / ')}</p>}
            <label className="evidence-pin"><input type="checkbox" checked={selected.includes(ref)} disabled={!editable} onChange={() => onToggle(ref)} aria-label={`Cite ${ref}`} /><BookmarkCheck size={15} /><span>{selected.includes(ref) ? 'Evidence pinned' : 'Pin evidence'}</span></label>
          </article>
        })}
      </div>
      <details className="original-source"><summary><FileSpreadsheet size={15} />Read original source<ArrowRight size={14} /></summary><p className="helper">{active.title} / {active.caption}</p><div className="table-scroll"><table className="evidence-table">
        <thead><tr>{active.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{active.rows.map((row) => <tr key={row.id}>{row.cells.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody>
      </table></div></details>
      <p className="file-footnote"><BadgeCheck size={12} /> Fictional evidence. Every card links to an original source row.</p>
    </div>
  </div>
}
