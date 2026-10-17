import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { Challenge, Experience, Level, Opportunity, OpportunityKind, WorkMode } from '../data/types'
import { jobKinds, modeOf, workModes } from '../lib/jobs'
import { indianCities } from '../lib/match'
import { askJson, SMART } from '../lib/millisa'
import { roleDraftRequest, type RoleDraft } from '../lib/millisaPrompts'
import { useMillisaTask } from '../millisa/MillisaProvider'
import { MillisaMark, Problem, Thinking } from '../millisa/parts'
import { useStore } from '../store/AppStore'
import { commaList, lines, PanelHead, slug, panelStyles as styles } from './ui'

const levels: Level[] = ['Beginner', 'Intermediate', 'Advanced']

function Missing({ backTo, what }: { backTo: string; what: string }) {
  return (
    <>
      <PanelHead title={`This ${what} is not here`} intro="It may have been deleted, or it belongs to another account." />
      <Link to={backTo} className="btn btn-ghost btn-sm">
        Go back
      </Link>
    </>
  )
}

export function RoleEditor({ backTo }: { backTo: string }) {
  const { id } = useParams()
  const { account, data, saveOpportunity } = useStore()
  const navigate = useNavigate()
  const existing = id ? data.opportunities.find((o) => o.id === id) : undefined
  const canEdit = !!account && (!existing || existing.ownerId === account.id || account.kind === 'admin')
  const company = existing?.company ?? account?.company ?? ''

  const [title, setTitle] = useState(existing?.title ?? '')
  const [kind, setKind] = useState<OpportunityKind>(existing?.kind ?? 'Internship')
  const [city, setCity] = useState(existing?.city ?? account?.profile.city ?? '')
  const [mode, setMode] = useState<WorkMode>(existing ? modeOf(existing) : 'On-site')
  const [experience, setExperience] = useState<Experience | ''>(existing?.experience ?? '')
  const [monthly, setMonthly] = useState(existing?.monthly ? String(existing.monthly) : '')
  const [pay, setPay] = useState(existing?.pay ?? '')
  const [closes, setCloses] = useState(existing?.closes ?? '')
  const [skills, setSkills] = useState(existing?.skills.join(', ') ?? '')
  const [about, setAbout] = useState(existing?.about ?? account?.companyAbout ?? '')
  const [work, setWork] = useState(existing?.work.join('\n') ?? '')
  const [challengeId, setChallengeId] = useState(existing?.challengeId ?? '')
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')
  const writer = useMillisaTask<RoleDraft>()

  if (id && !existing) return <Missing backTo={backTo} what="role" />

  const write = () =>
    writer.run(async (signal) => {
      const res = await askJson<RoleDraft>({ model: SMART, ...roleDraftRequest(notes, company, about, city), signal })
      const r = res.data
      setTitle(r.title)
      setKind(r.kind as OpportunityKind)
      setMode(r.mode as WorkMode)
      setExperience((r.experience as Experience) || '')
      setCity(r.city)
      setPay(r.pay)
      setMonthly(r.monthly > 0 ? String(r.monthly) : '')
      setSkills(r.skills.join(', '))
      setWork(r.work.join('\n'))
      return res
    })
  if (!canEdit) return <Missing backTo={backTo} what="role" />

  const ownChallenges = data.challenges.filter((c) => c.company === company)

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !city.trim() || !pay.trim() || !about.trim() || lines(work).length === 0 || commaList(skills).length === 0) {
      setError('Fill in the title, city, pay, skills, the company description and at least one line about the work.')
      return
    }
    const role: Opportunity = {
      ...(existing ?? { postedDaysAgo: 0 }),
      id: existing?.id ?? slug(`${company} ${title}`),
      title: title.trim(),
      company,
      kind,
      city: city.trim(),
      remote: mode !== 'On-site',
      mode,
      experience: experience || undefined,
      monthly: Number(monthly) > 0 ? Math.round(Number(monthly)) : undefined,
      pay: pay.trim(),
      closes: closes.trim() || 'Open',
      skills: commaList(skills),
      about: about.trim(),
      work: lines(work),
      challengeId: challengeId || undefined,
    }
    saveOpportunity(role)
    const toast = existing
      ? 'Role updated.'
      : data.settings.reviewPosts
        ? 'Role posted. It goes live once the HackShift team approves it, usually within a day.'
        : 'Role posted and live.'
    navigate(backTo, { state: { toast } })
  }

  return (
    <>
      <Link to={backTo} className="back-link">
        <ArrowLeft size={16} /> Back
      </Link>
      <PanelHead
        title={existing ? `Edit: ${existing.title}` : 'Post a role'}
        intro={existing ? `${company}. Changes show up straight away.` : `For ${company}. Say what the work is and what it pays. Roles with pay listed get far more replies.`}
      />
      {!existing && (
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <p className={`${styles.cardTitle} ${styles.withMark}`}>
              <MillisaMark size={20} /> Start from a few lines
            </p>
          </div>
          <label className="field">
            <span>Tell Millisa what you need, in your own words</span>
            <textarea
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Need someone in Pune to call shopkeepers in Marathi and help them set up UPI. Freshers ok. 22k a month."
            />
          </label>
          <div className={styles.cardFoot}>
            <button type="button" className="btn btn-primary btn-sm" onClick={write} disabled={notes.trim().length < 15 || writer.status === 'loading'}>
              Write the role
            </button>
            <span className={styles.cardSub}>Millisa fills the form below. Check every field before you post.</span>
          </div>
          {writer.status === 'loading' && <Thinking>Millisa is writing the role</Thinking>}
          {writer.status === 'error' && <Problem message={writer.error ?? ''} onRetry={write} />}
        </section>
      )}
      <form className={styles.form} onSubmit={save} noValidate>
        <div className={styles.formRow}>
          <label className="field">
            <span>Role title</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Frontend intern" />
          </label>
          <label className="field">
            <span>Type</span>
            <select className="input" value={kind} onChange={(e) => setKind(e.target.value as OpportunityKind)}>
              {jobKinds.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.formRow3}>
          <label className="field">
            <span>City</span>
            <input className="input" list="editor-cities" value={city} onChange={(e) => setCity(e.target.value)} />
            <datalist id="editor-cities">
              {indianCities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="field">
            <span>Pay</span>
            <input className="input" value={pay} onChange={(e) => setPay(e.target.value)} placeholder="₹15,000 / month" />
          </label>
          <label className="field">
            <span>Closes on</span>
            <input className="input" value={closes} onChange={(e) => setCloses(e.target.value)} placeholder="30 Nov, or leave empty" />
          </label>
        </div>
        <div className={styles.formRow3}>
          <label className="field">
            <span>Work mode</span>
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value as WorkMode)}>
              {workModes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Experience</span>
            <select className="input" value={experience} onChange={(e) => setExperience(e.target.value as Experience | '')}>
              <option value="">Not fixed</option>
              <option value="Fresher">Fresher</option>
              <option value="1-3 years">1 to 3 years</option>
              <option value="3+ years">3 years or more</option>
            </select>
          </label>
          <label className="field">
            <span>Monthly pay in ₹</span>
            <input className="input" type="number" min={0} value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="18000" />
            <small>Used for pay filters. Leave empty for equity-only roles.</small>
          </label>
        </div>
        <label className="field">
          <span>Skills</span>
          <input className="input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, CSS, Figma" />
          <small>Separate them with commas. We use these to match people to the role.</small>
        </label>
        <label className="field">
          <span>About {company}</span>
          <textarea className="input" value={about} onChange={(e) => setAbout(e.target.value)} />
        </label>
        <label className="field">
          <span>What the person will do</span>
          <textarea
            className="input"
            value={work}
            onChange={(e) => setWork(e.target.value)}
            placeholder={'One task per line, for example:\nBuild screens for the shopkeeper dashboard'}
          />
        </label>
        {ownChallenges.length > 0 && (
          <label className="field">
            <span>Linked challenge</span>
            <select className="input" value={challengeId} onChange={(e) => setChallengeId(e.target.value)}>
              <option value="">None</option>
              {ownChallenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <small>People who finish it go to the top of your applicant list.</small>
          </label>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary">
            {existing ? 'Save changes' : 'Post role'}
          </button>
          <Link to={backTo} className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}

export function ChallengeEditor({ backTo }: { backTo: string }) {
  const { id } = useParams()
  const { account, data, saveChallenge } = useStore()
  const navigate = useNavigate()
  const existing = id ? data.challenges.find((c) => c.id === id) : undefined
  const canEdit = !!account && (!existing || existing.ownerId === account.id || account.kind === 'admin')
  const company = existing?.company ?? account?.company ?? ''

  const [title, setTitle] = useState(existing?.title ?? '')
  const [brief, setBrief] = useState(existing?.brief ?? '')
  const [deliverables, setDeliverables] = useState(existing?.deliverables.join('\n') ?? '')
  const [skills, setSkills] = useState(existing?.skills.join(', ') ?? '')
  const [level, setLevel] = useState<Level>(existing?.level ?? 'Beginner')
  const [hours, setHours] = useState(String(existing?.hours ?? 4))
  const [reward, setReward] = useState(existing?.reward ?? '')
  const [closes, setCloses] = useState(existing?.closes ?? '')
  const [fastTrack, setFastTrack] = useState(existing?.fastTrack ?? true)
  const [error, setError] = useState('')

  if (id && !existing) return <Missing backTo={backTo} what="challenge" />
  if (!canEdit) return <Missing backTo={backTo} what="challenge" />

  const save = (e: FormEvent) => {
    e.preventDefault()
    const h = Number(hours)
    if (!title.trim() || brief.trim().length < 30 || lines(deliverables).length === 0 || !reward.trim() || !closes.trim()) {
      setError('Fill in the title, a brief of at least a few sentences, what to send, the reward and the closing date.')
      return
    }
    if (!Number.isFinite(h) || h < 1 || h > 40) {
      setError('Hours should be a number between 1 and 40. Most good challenges take an evening or a weekend.')
      return
    }
    const challenge: Challenge = {
      ...(existing ?? { submissions: 0 }),
      id: existing?.id ?? slug(`${company} ${title}`),
      title: title.trim(),
      company,
      brief: brief.trim(),
      deliverables: lines(deliverables),
      skills: commaList(skills),
      level,
      hours: Math.round(h),
      reward: reward.trim(),
      closes: closes.trim(),
      fastTrack,
    }
    saveChallenge(challenge)
    const toast = existing
      ? 'Challenge updated.'
      : data.settings.reviewPosts
        ? 'Challenge posted. It goes live once the HackShift team approves it.'
        : 'Challenge posted and live.'
    navigate(backTo, { state: { toast } })
  }

  return (
    <>
      <Link to={backTo} className="back-link">
        <ArrowLeft size={16} /> Back
      </Link>
      <PanelHead
        title={existing ? `Edit: ${existing.title}` : 'Post a challenge'}
        intro="A real problem you have right now, small enough for an evening or a weekend. Pay for the best answers."
      />
      <form className={styles.form} onSubmit={save} noValidate>
        <label className="field">
          <span>Title</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Redesign the payment confirmation screen" />
        </label>
        <label className="field">
          <span>The problem</span>
          <textarea
            className="input"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="What is going wrong today, for whom, and what would a good answer change?"
          />
        </label>
        <label className="field">
          <span>What to send</span>
          <textarea
            className="input"
            value={deliverables}
            onChange={(e) => setDeliverables(e.target.value)}
            placeholder={'One per line, for example:\nA link to your code\nA short note on what you changed and why'}
          />
        </label>
        <div className={styles.formRow3}>
          <label className="field">
            <span>Level</span>
            <select className="input" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {levels.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Hours it takes</span>
            <input className="input" type="number" min={1} max={40} value={hours} onChange={(e) => setHours(e.target.value)} />
          </label>
          <label className="field">
            <span>Closes on</span>
            <input className="input" value={closes} onChange={(e) => setCloses(e.target.value)} placeholder="30 Nov" />
          </label>
        </div>
        <div className={styles.formRow}>
          <label className="field">
            <span>Reward</span>
            <input className="input" value={reward} onChange={(e) => setReward(e.target.value)} placeholder="₹3,000 + interview for the internship" />
          </label>
          <label className="field">
            <span>Skills</span>
            <input className="input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, CSS, UX" />
          </label>
        </div>
        <label className={styles.check}>
          <input type="checkbox" checked={fastTrack} onChange={(e) => setFastTrack(e.target.checked)} />
          The best submissions get an interview
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary">
            {existing ? 'Save changes' : 'Post challenge'}
          </button>
          <Link to={backTo} className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}
