import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { DEMO_PASSWORD } from '../store/seed'
import { kindLabel, panelPath, useStore, type AccountKind } from '../store/AppStore'
import styles from './Login.module.css'

const demoOrder: { id: string; kind: AccountKind; what: string }[] = [
  { id: 'acc-riya-sharma', kind: 'seeker', what: 'Applications, challenges, sessions and her ideas' },
  { id: 'acc-tapri', kind: 'startup', what: 'Roles, challenges, applicants and submissions at Tapri Pay' },
  { id: 'acc-meera', kind: 'mentor', what: 'Session requests, weekly times and mentor profile' },
  { id: 'acc-neha', kind: 'recruiter', what: 'Hiring pipeline for Pinwheel Logistics' },
  { id: 'acc-admin', kind: 'admin', what: 'Every account, post, scheme and setting on HackShift' },
]

export default function Login() {
  const { account, data, signIn, signInAs } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const next = params.get('next')

  if (account) return <Navigate to={next ?? panelPath(account.kind)} replace />

  const go = (kind: AccountKind) => navigate(next ?? panelPath(kind), { replace: true })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const problem = signIn(email, password)
    if (problem) {
      setError(problem)
      return
    }
    const acc = data.accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
    go(acc?.kind ?? 'seeker')
  }

  const demos = demoOrder
    .map((d) => ({ ...d, acc: data.accounts.find((a) => a.id === d.id) }))
    .filter((d) => d.acc && d.acc.status === 'active')

  return (
    <div className={`wrap ${styles.page}`}>
      <section className={styles.formSide}>
        <h1>Sign in</h1>
        <p className={styles.lede}>Pick up where you left off: your applications, sessions, roles or hiring pipeline.</p>
        <form onSubmit={submit} className={styles.form} noValidate>
          <label className="field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              autoComplete="email"
              autoFocus
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary">
            Sign in
          </button>
        </form>
        <p className={styles.alt}>
          New to HackShift? <Link to="/start">Create your profile</Link>
        </p>
      </section>

      <section className={styles.demoSide} aria-labelledby="demo-title">
        <h2 id="demo-title">Try a demo account</h2>
        <p>
          Each one opens a different panel with sample data. The password for all of them is{' '}
          <code className={styles.code}>{DEMO_PASSWORD}</code>.
        </p>
        <ul className={styles.demos}>
          {demos.map(({ id, kind, what, acc }) => (
            <li key={id} className={kind === 'admin' ? styles.adminRow : undefined}>
              <div>
                <p className={styles.demoKind}>{kindLabel[kind]}</p>
                <p className={styles.demoName}>
                  {acc!.name}
                  {acc!.company ? `, ${acc!.company}` : ''}
                </p>
                <p className={styles.demoWhat}>{what}</p>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${kind === 'admin' ? 'btn-accent' : 'btn-ghost'}`}
                onClick={() => {
                  signInAs(id)
                  go(kind)
                }}
              >
                Sign in as {acc!.name.split(' ')[0]}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
