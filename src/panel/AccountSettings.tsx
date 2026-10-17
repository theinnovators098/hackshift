import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Verified from '../components/Verified'
import { kindLabel, panelPath, useStore, type AccountKind } from '../store/AppStore'
import { PanelHead, Section, panelStyles as styles } from './ui'

export default function AccountSettings() {
  const { account, data, updateAccount, addRole, requestVerification } = useStore()
  const navigate = useNavigate()
  const [newRole, setNewRole] = useState<Exclude<AccountKind, 'admin'> | ''>('')
  const [company, setCompany] = useState('')
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

  const missing = (['seeker', 'startup', 'mentor', 'recruiter'] as const).filter((k) => !account.kinds.includes(k))
  const needsCompany = newRole === 'startup' || newRole === 'recruiter'
  const verifiable = account.kind === 'startup' || account.kind === 'recruiter' || account.kind === 'mentor'

  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!newRole) return
    if (needsCompany && !company.trim() && !account.company) {
      setMessage({ ok: false, text: 'Add the company name for this role.' })
      return
    }
    addRole(newRole, company)
    navigate(panelPath(newRole))
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
        {account.kind !== 'admin' && (
          <Section title="Your roles">
            <div className={styles.form}>
              <p className={styles.cardBody}>
                You are signed up as {account.kinds.map((k) => kindLabel[k].toLowerCase()).join(', ')}. One account can hold more than one
                role, for example a student who also runs a startup.
              </p>
              {missing.length > 0 && (
                <form onSubmit={add} className={styles.inlineForm}>
                  <label className="field">
                    <span>Add a role</span>
                    <select className="input" value={newRole} onChange={(e) => setNewRole(e.target.value as typeof newRole)}>
                      <option value="">Pick one</option>
                      {missing.map((k) => (
                        <option key={k} value={k}>
                          {kindLabel[k]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {needsCompany && !account.company && (
                    <label className="field">
                      <span>Company name</span>
                      <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
                    </label>
                  )}
                  {newRole === 'mentor' && <small className={styles.cardSub}>Your mentor profile is reviewed by the HackShift team before people can book you.</small>}
                  <div className={styles.formActions}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={!newRole}>
                      Add role
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Section>
        )}

        {verifiable && (
          <Section title="Verification">
            <div className={styles.form}>
              {account.verified ? (
                <p className={styles.cardBody}>
                  Verified <Verified /> People see a verified badge next to {account.kind === 'mentor' ? 'your name' : 'your company'}.
                </p>
              ) : account.verifyRequested ? (
                <p className={styles.cardBody}>Your request is with the HackShift team. Most are checked within two working days.</p>
              ) : (
                <>
                  <p className={styles.cardBody}>
                    A verified badge tells people the HackShift team has checked {account.kind === 'mentor' ? 'who you are' : 'that your company is real'},
                    so they can trust you before they {account.kind === 'mentor' ? 'book a session' : 'apply'}.
                  </p>
                  <div className={styles.formActions}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={requestVerification}>
                      Ask to be verified
                    </button>
                  </div>
                </>
              )}
            </div>
          </Section>
        )}

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
