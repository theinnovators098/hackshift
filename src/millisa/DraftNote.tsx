import { useEffect, useRef, useState } from 'react'
import { errorText, FAST, MillisaError, streamText } from '../lib/millisa'
import { draftRequest } from '../lib/millisaPrompts'
import type { Challenge, Opportunity } from '../data/types'
import { useStore } from '../store/AppStore'
import { useMillisa } from './MillisaProvider'
import { MillisaMark, Problem } from './parts'
import styles from './Millisa.module.css'

interface Props {
  opportunity: Opportunity
  challenge?: Challenge
  onText: (text: string) => void
}

export default function DraftNote({ opportunity, challenge, onText }: Props) {
  const { profile, submissions } = useStore()
  const { lang, ensureKey, keyRejected } = useMillisa()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ctrl = useRef<AbortController | null>(null)

  useEffect(() => () => ctrl.current?.abort(), [])

  if (!profile) return null

  const draft = async () => {
    if (!(await ensureKey())) return
    const submission = challenge && submissions.find((s) => s.challengeId === challenge.id)
    const c = new AbortController()
    ctrl.current = c
    setBusy(true)
    setError('')
    let text = ''
    try {
      const req = draftRequest(profile, opportunity, challenge, submission, lang)
      for await (const chunk of streamText({ model: FAST, ...req, temperature: 0.8, signal: c.signal })) {
        text += chunk
        onText(text)
      }
      onText(text.trim())
    } catch (e) {
      if (c.signal.aborted) return
      if (e instanceof MillisaError && e.kind === 'bad-key') keyRejected()
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.row}>
      <button type="button" className={`btn btn-ghost btn-sm ${styles.trigger}`} onClick={draft} disabled={busy}>
        <MillisaMark size={18} />
        {busy ? 'Millisa is writing…' : 'Draft with Millisa'}
      </button>
      {error && <Problem message={error} onRetry={draft} />}
    </div>
  )
}
