import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Flag } from 'lucide-react'
import { useStore, type ReportKind } from '../store/AppStore'
import styles from './ReportButton.module.css'

const reasons = ['Looks like a scam or fake', 'Asks for money to apply or join', 'Unclear or unfair terms', 'Rude or abusive', 'Something else']

function ReportDialog({ kind, targetId, label, onClose }: { kind: ReportKind; targetId: string; label: string; onClose: () => void }) {
  const { report } = useStore()
  const ref = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState(reasons[0])
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])

  const send = (e: FormEvent) => {
    e.preventDefault()
    report(kind, targetId, label, reason, note.trim())
    setSent(true)
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="report-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      {sent ? (
        <div className={styles.body}>
          <h2 id="report-title">Thank you</h2>
          <p>The HackShift team will look at “{label}” and act on it if it breaks the rules. You will not be named to the other person.</p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      ) : (
        <form className={styles.body} onSubmit={send}>
          <h2 id="report-title">Report “{label}”</h2>
          <fieldset className={styles.reasons}>
            <legend>What is wrong?</legend>
            {reasons.map((r) => (
              <label key={r}>
                <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
                {r}
              </label>
            ))}
          </fieldset>
          <label className="field">
            <span>Anything else the team should know</span>
            <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className={styles.actions}>
            <button type="submit" className="btn btn-primary">
              Send report
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}

export default function ReportButton({ kind, targetId, label }: { kind: ReportKind; targetId: string; label: string }) {
  const { account } = useStore()
  const [open, setOpen] = useState(false)
  if (!account || account.kind === 'admin') return null
  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
        <Flag size={14} aria-hidden="true" /> Report
      </button>
      {open && <ReportDialog kind={kind} targetId={targetId} label={label} onClose={() => setOpen(false)} />}
    </>
  )
}
