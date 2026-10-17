import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import { roleInfo, roleOrder } from '../data/roles'
import type { Role } from '../data/types'
import { allSkills, indianCities } from '../lib/match'
import { kindFor, kindLabel, useStore, type Profile } from '../store/AppStore'
import styles from './Onboarding.module.css'

const stepTitles = ['About you', 'Why you are here', 'What you can do', 'What you want next']

const goalIdeas = [
  'My first paid internship',
  'A full-time job in a startup',
  'A co-founder for my idea',
  'Funding or a grant',
  'Help from someone experienced',
]

export default function Onboarding() {
  const { profile, saveProfile, signUp } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Profile>(
    profile ?? { name: '', city: '', college: '', roles: [], skills: [], goal: '' },
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [customSkill, setCustomSkill] = useState('')
  const [error, setError] = useState('')

  const update = (patch: Partial<Profile>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setError('')
  }

  const toggleRole = (role: Role) =>
    update({ roles: draft.roles.includes(role) ? draft.roles.filter((r) => r !== role) : [...draft.roles, role] })

  const toggleSkill = (skill: string) =>
    update({ skills: draft.skills.includes(skill) ? draft.skills.filter((s) => s !== skill) : [...draft.skills, skill] })

  const addCustomSkill = () => {
    const value = customSkill.trim()
    if (value && !draft.skills.includes(value)) update({ skills: [...draft.skills, value] })
    setCustomSkill('')
  }

  const validate = () => {
    if (step === 0 && (!draft.name.trim() || !draft.city.trim())) return 'Add your name and city to continue.'
    if (step === 0 && !profile && !/^\S+@\S+\.\S+$/.test(email.trim())) return 'Add an email you can sign in with.'
    if (step === 0 && !profile && password.length < 6) return 'Pick a password with at least 6 characters.'
    if (step === 1 && draft.roles.length === 0) return 'Pick at least one. You can change this later.'
    if (step === 2 && draft.skills.length === 0) return 'Pick at least one skill, even if you are still learning it.'
    return ''
  }

  const next = (e: FormEvent) => {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    if (step < stepTitles.length - 1) {
      setStep(step + 1)
      return
    }
    const clean = { ...draft, name: draft.name.trim(), city: draft.city.trim(), college: draft.college.trim() }
    if (profile) {
      saveProfile(clean)
      navigate('/panel')
      return
    }
    const problem2 = signUp(clean, email, password)
    if (problem2) {
      setStep(0)
      setError(problem2)
      return
    }
    navigate('/panel')
  }

  const skillOptions = Array.from(new Set([...allSkills, ...draft.skills]))

  return (
    <section className={`wrap ${styles.page}`}>
      <aside className={styles.aside}>
        <h1>{profile ? 'Edit your profile' : 'Create your profile'}</h1>
        <p>This is what startups, mentors and recruiters see. You can change any of it later.</p>
        {!profile && (
          <p className={styles.signin}>
            Already on HackShift? <Link to="/login">Sign in</Link>
          </p>
        )}
        <ol className={styles.steps}>
          {stepTitles.map((t, i) => (
            <li key={t} className={i === step ? styles.current : i < step ? styles.done : undefined}>
              <span className={styles.dot} aria-hidden="true">
                {i < step ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </aside>

      <form className={styles.card} onSubmit={next} noValidate>
        <p className={styles.counter}>
          Step {step + 1} of {stepTitles.length}
        </p>

        {step === 0 && (
          <fieldset className={styles.fields}>
            <legend>Tell us who you are</legend>
            <label className="field">
              <span>Full name</span>
              <input
                className="input"
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Riya Sharma"
                autoComplete="name"
                autoFocus
              />
            </label>
            <label className="field">
              <span>City</span>
              <input
                className="input"
                list="city-list"
                value={draft.city}
                onChange={(e) => update({ city: e.target.value })}
                placeholder="Start typing, for example Indore"
              />
              <datalist id="city-list">
                {indianCities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            {!profile && (
              <div className={styles.pair}>
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
                    placeholder="you@example.com"
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
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                  />
                </label>
              </div>
            )}
            <label className="field">
              <span>College or company</span>
              <input
                className="input"
                value={draft.college}
                onChange={(e) => update({ college: e.target.value })}
                placeholder="Optional"
              />
            </label>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className={styles.fields}>
            <legend>What brings you to HackShift?</legend>
            <p className={styles.help}>Pick all that apply. A lot of people are both students and founders.</p>
            <div className={styles.roles}>
              {roleOrder.map((role) => {
                const on = draft.roles.includes(role)
                return (
                  <button
                    type="button"
                    key={role}
                    className={`${styles.role} ${on ? styles.roleOn : ''}`}
                    aria-pressed={on}
                    onClick={() => toggleRole(role)}
                  >
                    <span className={styles.roleName}>{roleInfo[role].label}</span>
                    <span className={styles.roleHint}>{roleInfo[role].hint}</span>
                    <span className={styles.tick} aria-hidden="true">
                      {on && <Check size={14} strokeWidth={3} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className={styles.fields}>
            <legend>Which skills do you have?</legend>
            <p className={styles.help}>We use these to match you with challenges and roles. Include ones you are learning.</p>
            <div className={styles.chips}>
              {skillOptions.map((s) => (
                <button type="button" key={s} className="chip" aria-pressed={draft.skills.includes(s)} onClick={() => toggleSkill(s)}>
                  {s}
                </button>
              ))}
            </div>
            <div className={styles.addSkill}>
              <input
                className="input"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomSkill()
                  }
                }}
                placeholder="Something else? Type it here"
                aria-label="Add another skill"
              />
              <button type="button" className="btn btn-ghost" onClick={addCustomSkill}>
                <Plus size={16} /> Add
              </button>
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className={styles.fields}>
            <legend>What do you want in the next three months?</legend>
            {!profile && (
              <p className={styles.help}>
                You will get a {kindLabel[kindFor(draft.roles)].toLowerCase()} panel to manage everything in one place.
              </p>
            )}
            <div className={styles.chips}>
              {goalIdeas.map((g) => (
                <button type="button" key={g} className="chip" aria-pressed={draft.goal === g} onClick={() => update({ goal: g })}>
                  {g}
                </button>
              ))}
            </div>
            <label className="field">
              <span>In your own words</span>
              <textarea
                className="input"
                value={draft.goal}
                onChange={(e) => update({ goal: e.target.value })}
                placeholder="For example: a frontend internship at a startup that works with small businesses"
              />
              <small>Mentors read this before your session, so be specific.</small>
            </label>
          </fieldset>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.nav}>
          {step > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="btn btn-primary">
            {step < stepTitles.length - 1 ? 'Continue' : profile ? 'Save profile' : 'Create my account'}
          </button>
        </div>
      </form>
    </section>
  )
}
