import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { kindLabel, useStore } from '../store/AppStore'
import { PanelHead, Section, panelStyles as styles } from './ui'

export default function AccountSettings() {
  const { account, data, updateAccount } = useStore()
  const [email, setEmail] = useState(account?.email ?? '')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  if (!account) return null

  const saveEmail = (e: FormEvent) => {
    e.preventDefault()
    const clean = email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(clean)) {
      setMessage({ ok: false, text: 'That does not look like an email address.' })
      return
    }
    if (data.accounts.some((a) => a.id !== account.id && a.email.toLowerCase() === clean)) {
      setMessage({ ok: false, text: 'Another account already uses that email.' })
      return
    }
    updateAccount({ email: clean })
    setMessage({ ok: true, text: 'Email updated.' })
  }

  const savePassword = (e: FormEvent) => {
    e.preventDefault()
    if (current !== account.password) {
      setMessage({ ok: false, text: 'Your current password is not right.' })
      return
    }
    if (next.length < 6) {
      setMessage({ ok: false, text: 'Pick a new password with at least 6 characters.' })
      return
    }
    updateAccount({ password: next })
    setCurrent('')
    setNext('')
    setMessage({ ok: true, text: 'Password changed.' })
  }

  return (
    <>
      <PanelHead
        title="Account"
        intro={`${kindLabel[account.kind]} account. Joined ${account.joinedOn}.`}
      >
        {account.kind !== 'admin' && (
          <Link to="/start" className="btn btn-ghost btn-sm">
            Edit profile
          </Link>
        )}
      </PanelHead>

      {message && (
        <p className={message.ok ? styles.toast : styles.error} role="status">
          {message.text}
        </p>
      )}

      <div className={styles.two}>
        <Section title="Sign-in email">
          <form className={styles.form} onSubmit={saveEmail} noValidate>
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <div className={styles.formActions}>
              <button type="submit" className="btn btn-primary btn-sm">
                Save email
              </button>
            </div>
          </form>
        </Section>

        <Section title="Password">
          <form className={styles.form} onSubmit={savePassword} noValidate>
            <label className="field">
              <span>Current password</span>
              <input
                className="input"
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="field">
              <span>New password</span>
              <input
                className="input"
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <div className={styles.formActions}>
              <button type="submit" className="btn btn-primary btn-sm">
                Change password
              </button>
            </div>
          </form>
        </Section>
      </div>
    </>
  )
}
