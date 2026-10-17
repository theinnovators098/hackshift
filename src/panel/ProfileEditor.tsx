import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Plus, Trash2, Upload } from 'lucide-react'
import { allSkills } from '../lib/match'
import { askJson, askText, errorText, FAST, MillisaError, SMART } from '../lib/millisa'
import { resumeRequest, summaryRequest, type ResumeRead } from '../lib/millisaPrompts'
import { profileScore } from '../lib/profileScore'
import { useMillisa } from '../millisa/MillisaProvider'
import { MillisaMark, Thinking } from '../millisa/parts'
import { useStore, type Profile } from '../store/AppStore'
import { PanelHead, Section, panelStyles as styles } from './ui'
import own from './ProfileEditor.module.css'

type Field<T> = { key: keyof T & string; label: string; placeholder?: string; wide?: boolean }

function Rows<T extends Record<string, string>>({
  items,
  fields,
  blank,
  onChange,
  addLabel,
}: {
  items: T[]
  fields: Field<T>[]
  blank: T
  onChange: (items: T[]) => void
  addLabel: string
}) {
  return (
    <div className={own.rows}>
      {items.map((item, i) => (
        <div key={i} className={own.row}>
          {fields.map((f) => (
            <label key={f.key} className={`field ${f.wide ? own.wide : ''}`}>
              <span>{f.label}</span>
              <input
                className="input"
                value={item[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, [f.key]: e.target.value } : x)))}
              />
            </label>
          ))}
          <button type="button" className={own.remove} onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...items, { ...blank }])}>
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  )
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

export default function ProfileEditor() {
  const { profile, account, saveProfile, setResume } = useStore()
  const { ensureKey, keyRejected, lang } = useMillisa()
  const [draft, setDraft] = useState<Profile>(() => ({
    education: [],
    work: [],
    certificates: [],
    links: {},
    visibility: 'public',
    allowMessages: true,
    headline: '',
    about: '',
    ...profile!,
  }))
  const [skill, setSkill] = useState('')
  const [reading, setReading] = useState(false)
  const [found, setFound] = useState<ResumeRead | null>(null)
  const [fileName, setFileName] = useState('')
  const [writing, setWriting] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  if (!profile || !account) return null

  const set = (patch: Partial<Profile>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setMessage(null)
  }

  const { score, missing } = profileScore(draft, !!account.resume)

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf') {
      setMessage({ ok: false, text: 'Upload your resume as a PDF file.' })
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setMessage({ ok: false, text: 'That file is over 4 MB. Save a smaller PDF and try again.' })
      return
    }
    if (!(await ensureKey())) return
    setReading(true)
    setFound(null)
    setMessage(null)
    try {
      const data = await readFile(file)
      const { data: read } = await askJson<ResumeRead>({ model: SMART, ...resumeRequest(), files: [{ mimeType: 'application/pdf', data }] })
      setFound(read)
      setFileName(file.name)
      setResume(file.name)
    } catch (err) {
      if (err instanceof MillisaError && err.kind === 'bad-key') keyRejected()
      setMessage({ ok: false, text: errorText(err) })
    } finally {
      setReading(false)
    }
  }

  const useFound = () => {
    if (!found) return
    const known = (list: object[] = [], key: string, value: string) =>
      list.some((x) => String((x as Record<string, unknown>)[key] ?? '').trim().toLowerCase() === value.trim().toLowerCase())
    set({
      headline: draft.headline?.trim() ? draft.headline : found.headline,
      about: draft.about?.trim() ? draft.about : found.about,
      skills: Array.from(new Set([...draft.skills, ...found.skills.filter(Boolean)])),
      education: [...(draft.education ?? []), ...found.education.filter((x) => x.school && !known(draft.education, 'school', x.school))],
      work: [...(draft.work ?? []), ...found.work.filter((x) => x.role && !known(draft.work, 'role', x.role))],
      certificates: [...(draft.certificates ?? []), ...found.certificates.filter((x) => x.name && !known(draft.certificates, 'name', x.name))],
      links: {
        github: draft.links?.github || found.links.github,
        portfolio: draft.links?.portfolio || found.links.portfolio,
        linkedin: draft.links?.linkedin || found.links.linkedin,
        website: draft.links?.website || found.links.website,
      },
    })
    setFound(null)
    setMessage({ ok: true, text: 'Added to the form below. Check it, then press Save profile.' })
  }

  const writeAbout = async () => {
    if (!(await ensureKey())) return
    setWriting(true)
    try {
      set({ about: await askText({ model: FAST, ...summaryRequest(draft, lang), temperature: 0.7 }) })
    } catch (err) {
      if (err instanceof MillisaError && err.kind === 'bad-key') keyRejected()
      setMessage({ ok: false, text: errorText(err) })
    } finally {
      setWriting(false)
    }
  }

  const save = () => {
    if (!draft.name.trim() || !draft.city.trim()) {
      setMessage({ ok: false, text: 'Your name and city cannot be empty.' })
      return
    }
    saveProfile({ ...draft, name: draft.name.trim(), city: draft.city.trim() })
    setMessage({ ok: true, text: 'Profile saved.' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const skillOptions = allSkills.filter((s) => !draft.skills.includes(s))

  return (
    <>
      <PanelHead title="Profile" intro="What startups, mentors and recruiters see. A complete profile gets read first.">
        <Link to="/panel/resume" className="btn btn-ghost btn-sm">
          <FileText size={15} /> See my resume
        </Link>
        <button type="button" className="btn btn-primary btn-sm" onClick={save}>
          Save profile
        </button>
      </PanelHead>

      {message && (
        <p className={message.ok ? styles.toast : styles.error} role="status">
          {message.text}
        </p>
      )}

      <div className={own.top}>
        <section className={own.score} aria-label="Profile completion">
          <p className={own.scoreNum}>
            <span className="num">{score}</span>%
          </p>
          <p className={own.scoreLabel}>Profile complete</p>
          <div className={own.meter} aria-hidden="true">
            <span style={{ width: `${score}%` }} />
          </div>
          {missing.length > 0 && (
            <ul>
              {missing.slice(0, 4).map((m) => (
                <li key={m.text}>{m.text}</li>
              ))}
            </ul>
          )}
        </section>

        <section className={own.resume}>
          <div className={own.resumeHead}>
            <MillisaMark size={28} />
            <div>
              <h2>Fill your profile from your resume</h2>
              <p>
                Upload a PDF and Millisa reads it. Nothing changes until you add it and save.
                {account.resume && ` Last read: ${account.resume.name}, on ${account.resume.readOn}.`}
              </p>
            </div>
          </div>
          <input ref={fileInput} type="file" accept="application/pdf" hidden onChange={upload} />
          {reading ? (
            <Thinking>Millisa is reading your resume</Thinking>
          ) : found ? (
            <div className={own.found}>
              <p>
                From <strong>{fileName}</strong>, Millisa found {found.skills.length} skills, {found.education.length} education{' '}
                {found.education.length === 1 ? 'entry' : 'entries'}, {found.work.length} work{' '}
                {found.work.length === 1 ? 'entry' : 'entries'} and {found.certificates.length}{' '}
                {found.certificates.length === 1 ? 'certificate' : 'certificates'}.
              </p>
              {found.headline && <p className={own.foundLine}>“{found.headline}”</p>}
              <div className={styles.cardFoot}>
                <button type="button" className="btn btn-primary btn-sm" onClick={useFound}>
                  Add to my profile
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFound(null)}>
                  Not now
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>
              <Upload size={15} /> Upload resume (PDF)
            </button>
          )}
        </section>
      </div>

      <Section title="About you">
        <div className={styles.form}>
          <div className={styles.formRow}>
            <label className="field">
              <span>Full name</span>
              <input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            </label>
            <label className="field">
              <span>City</span>
              <input className="input" value={draft.city} onChange={(e) => set({ city: e.target.value })} />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className="field">
              <span>Headline</span>
              <input
                className="input"
                value={draft.headline ?? ''}
                onChange={(e) => set({ headline: e.target.value })}
                placeholder="B.Com final year, building frontend for small shops"
                maxLength={80}
              />
            </label>
            <label className="field">
              <span>College or company</span>
              <input className="input" value={draft.college} onChange={(e) => set({ college: e.target.value })} />
            </label>
          </div>
          <label className="field">
            <span>About</span>
            <textarea
              className="input"
              value={draft.about ?? ''}
              onChange={(e) => set({ about: e.target.value })}
              placeholder="Two or three lines on what you do and what you want next"
            />
          </label>
          <div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={writeAbout} disabled={writing}>
              <MillisaMark size={18} /> {writing ? 'Millisa is writing…' : 'Write it with Millisa'}
            </button>
          </div>
          <label className="field">
            <span>What you want next</span>
            <input className="input" value={draft.goal} onChange={(e) => set({ goal: e.target.value })} />
          </label>
        </div>
      </Section>

      <Section title="Skills">
        <div className={styles.form}>
          <div className={styles.chips}>
            {draft.skills.map((s) => (
              <button key={s} type="button" className="chip" aria-pressed="true" onClick={() => set({ skills: draft.skills.filter((x) => x !== s) })}>
                {s} <span aria-hidden="true">×</span>
                <span className="visually-hidden">remove</span>
              </button>
            ))}
          </div>
          <div className={own.addSkill}>
            <input
              className="input"
              list="profile-skills"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (skill.trim() && !draft.skills.includes(skill.trim())) set({ skills: [...draft.skills, skill.trim()] })
                  setSkill('')
                }
              }}
              placeholder="Add a skill and press Enter"
              aria-label="Add a skill"
            />
            <datalist id="profile-skills">
              {skillOptions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>
      </Section>

      <Section title="Education">
        <div className={styles.form}>
          <Rows
            items={draft.education ?? []}
            blank={{ school: '', degree: '', years: '' }}
            fields={[
              { key: 'school', label: 'College or school', placeholder: 'DAVV Indore', wide: true },
              { key: 'degree', label: 'Degree or class', placeholder: 'B.Com' },
              { key: 'years', label: 'Years', placeholder: '2022 to 2025' },
            ]}
            onChange={(education) => set({ education })}
            addLabel="Add education"
          />
        </div>
      </Section>

      <Section title="Work, internships and projects">
        <div className={styles.form}>
          <Rows
            items={draft.work ?? []}
            blank={{ role: '', org: '', years: '', summary: '' }}
            fields={[
              { key: 'role', label: 'Role or project', placeholder: 'Frontend volunteer' },
              { key: 'org', label: 'Where', placeholder: 'College fest team' },
              { key: 'years', label: 'When', placeholder: '2024' },
              { key: 'summary', label: 'What you did', placeholder: 'Built the registration page used by 2,000 students', wide: true },
            ]}
            onChange={(work) => set({ work })}
            addLabel="Add work or project"
          />
        </div>
      </Section>

      <Section title="Certificates and courses">
        <div className={styles.form}>
          <Rows
            items={draft.certificates ?? []}
            blank={{ name: '', issuer: '', year: '' }}
            fields={[
              { key: 'name', label: 'Name', placeholder: 'Responsive Web Design', wide: true },
              { key: 'issuer', label: 'Given by', placeholder: 'freeCodeCamp' },
              { key: 'year', label: 'Year', placeholder: '2024' },
            ]}
            onChange={(certificates) => set({ certificates })}
            addLabel="Add certificate"
          />
        </div>
      </Section>

      <div className={styles.two}>
        <Section title="Links">
          <div className={styles.form}>
            {(['github', 'portfolio', 'linkedin', 'website'] as const).map((k) => (
              <label key={k} className="field">
                <span>{k === 'github' ? 'GitHub' : k === 'linkedin' ? 'LinkedIn' : k[0].toUpperCase() + k.slice(1)}</span>
                <input
                  className="input"
                  value={draft.links?.[k] ?? ''}
                  onChange={(e) => set({ links: { ...draft.links, [k]: e.target.value } })}
                  placeholder="https://"
                />
              </label>
            ))}
          </div>
        </Section>

        <Section title="Privacy">
          <div className={styles.form}>
            <fieldset className={own.radios}>
              <legend>Who can find you in talent search</legend>
              {(
                [
                  ['public', 'Everyone', 'Your profile shows up in Find talent for anyone.'],
                  ['hiring', 'Only startups and recruiters', 'Hidden from other job seekers.'],
                  ['private', 'Nobody', 'You still apply and book as normal. Only people you apply to see your profile.'],
                ] as const
              ).map(([value, label, hint]) => (
                <label key={value} className={own.radio}>
                  <input type="radio" name="visibility" checked={(draft.visibility ?? 'public') === value} onChange={() => set({ visibility: value })} />
                  <span>
                    <strong>{label}</strong>
                    <small>{hint}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className={styles.check}>
              <input type="checkbox" checked={draft.allowMessages !== false} onChange={(e) => set({ allowMessages: e.target.checked })} />
              Let startups and recruiters message me
            </label>
          </div>
        </Section>
      </div>

      <div className={styles.formActions}>
        <button type="button" className="btn btn-primary" onClick={save}>
          Save profile
        </button>
      </div>
    </>
  )
}
