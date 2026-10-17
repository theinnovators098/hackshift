import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { errorText, saveKey, testKey } from '../lib/millisa'
import { MillisaMark } from './parts'
import styles from './Millisa.module.css'

export default function KeyDialog({ onDone }: { onDone: (ok: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const connect = async (e: FormEvent) => {
    e.preventDefault()
    if (!key.trim()) {
      setError('Paste the access key first.')
      return
    }
    setChecking(true)
    setError('')
    try {
      if (await testKey(key)) {
        saveKey(key)
        onDone(true)
      } else {
        setError('That key was not accepted. Check that you copied all of it.')
      }
    } catch (err) {
      setError(errorText(err))
    } finally {
      setChecking(false)
    }
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="millisa-key-title"
      onCancel={(e) => {
        e.preventDefault()
        onDone(false)
      }}
    >
      <form onSubmit={connect} className={styles.dialogBody}>
        <div className={styles.dialogHead}>
          <MillisaMark size={36} />
          <h2 id="millisa-key-title">Connect Millisa</h2>
        </div>
        <p>
          Millisa needs an access key before it can answer. Paste the key your team lead shared with you. It is saved in
          this browser only.
        </p>
        <label className="field">
          <span>Access key</span>
          <div className={styles.keyRow}>
            <input
              className="input"
              type={show ? 'text' : 'password'}
              value={key}
              onChange={(e) => {
                setKey(e.target.value)
                setError('')
              }}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide key' : 'Show key'}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {error && (
          <p className={styles.problem} role="alert">
            {error}
          </p>
        )}
        <div className={styles.dialogActions}>
          <button type="submit" className="btn btn-primary" disabled={checking}>
            {checking ? 'Checking the key…' : 'Connect'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onDone(false)}>
            Not now
          </button>
        </div>
      </form>
    </dialog>
  )
}
