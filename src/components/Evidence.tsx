import { FileSpreadsheet, Mail, Map, Paperclip, ShieldCheck } from 'lucide-react'
import type { EvidenceFile } from '../types'

const fileIcons = { register: FileSpreadsheet, email: Mail, plan: Map, policy: ShieldCheck }

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
          id={`tab-${file.id}`} onClick={() => onFile(file.id)} className={file.id === active.id ? 'file-tab active' : 'file-tab'}>
          <FileIcon size={16} /><span>{file.title}</span>
        </button>
      })}
    </div>
    <div className="file-content" role="tabpanel" id="evidence-panel" aria-labelledby={`tab-${active.id}`}>
      <div className="file-title"><Icon size={22} /><div><h3>{active.title}</h3><p>{active.caption}</p></div></div>
      {active.kind === 'plan' && <div className="floor-plan" aria-label="Illustrative service map: AHU-24-1 serves units 24-01, 24-02, 24-03; check the rows below">
        <span className="plant-box">AHU-24-1</span><span className="plan-connector" aria-hidden="true" />
        <div className="unit-boxes"><span>24-01</span><span>24-02</span><span>24-03</span></div>
      </div>}
      <div className="table-scroll"><table className="evidence-table">
        <thead><tr>{active.columns.map((column) => <th key={column}>{column}</th>)}<th className="cite-heading">Cite</th></tr></thead>
        <tbody>{active.rows.map((row) => {
          const ref = `${active.id}:${row.id}`
          return <tr key={row.id} id={`source-${ref}`} className={highlighted.includes(ref) ? 'source-highlight' : ''}>
            {row.cells.map((cell, index) => <td key={index}>{cell}</td>)}
            <td><label className="cite-control"><input type="checkbox" checked={selected.includes(ref)} disabled={!editable} onChange={() => onToggle(ref)} aria-label={`Cite ${ref}`} /><span className="sr-only">Cite {ref}</span></label></td>
          </tr>
        })}</tbody>
      </table></div>
      <p className="file-footnote">Fictional booth evidence. {editable ? 'Tick the rows that support your answer.' : 'Source IDs appear in the reference answer after your round.'}</p>
    </div>
  </div>
}
