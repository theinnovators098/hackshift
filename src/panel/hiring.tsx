import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CalendarClock, MessageSquare, NotebookPen, Star } from 'lucide-react'
import MessageButton from '../components/MessageButton'
import type { Opportunity } from '../data/types'
import { overlap } from '../lib/match'
import { askJson, askText, FAST, SMART } from '../lib/millisa'
import {
  candidateRequest,
  employerMessageRequest,
  pipelineRequest,
  questionsRequest,
  type CandidateRead,
  type DraftPurpose,
  type Question,
} from '../lib/millisaPrompts'
import { useMillisaTask } from '../millisa/MillisaProvider'
import { MillisaMark, Points, Problem, Reply, SavedNote, Thinking } from '../millisa/parts'
import { useStore, type Application, type ApplicationStatus, type ContentKind } from '../store/AppStore'
import { Empty, PanelHead, Section, Stats, Status, panelStyles as styles } from './ui'
import own from './hiring.module.css'

export const stages: ApplicationStatus[] = ['Applied', 'Under review', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected']

const rejectReasons = [
  'Skills do not match this role yet',
  'We need more experience for this role',
  'The role has been filled',
  'Location or work mode does not fit',
  'We picked people whose challenge work was closer to what we need',
]

export function useCompany() {
  const store = useStore()
  const me = store.account!
  const roles = store.data.opportunities.filter((o) => o.ownerId === me.id)
  const challenges = store.data.challenges.filter((c) => c.ownerId === me.id)
  const roleIds = new Set(roles.map((r) => r.id))
  const challengeIds = new Set(challenges.map((c) => c.id))
  const applicants = store.data.applications.filter((a) => roleIds.has(a.opportunityId))
  const submissions = store.data.submissions.filter((s) => challengeIds.has(s.challengeId))
  return { ...store, me, roles, challenges, applicants, submissions }
}

export function Toast() {
  const { state } = useLocation()
  const toast = (state as { toast?: string } | null)?.toast
  return toast ? (
    <p className={styles.toast} role="status">
      {toast}
    </p>
  ) : null
}

function when(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export { when as interviewTime }

export function HiringOverview() {
  const { me, roles, challenges, applicants, submissions, accountById, data } = useCompany()
  const summary = useMillisaTask<string>()
  const fresh = applicants.filter((a) => a.status === 'Applied')
  const toReview = submissions.filter((s) => s.status === 'In review')
  const pending = [...roles, ...challenges].filter((x) => x.status === 'pending').length
  const upcoming = applicants.filter((a) => a.interview && new Date(a.interview.when) >= new Date(Date.now() - 3600000))

  const summarise = () =>
    summary.run(async (signal) => {
      const rows = applicants.map((a) => {
        const o = data.opportunities.find((x) => x.id === a.opportunityId)
        return `${accountById(a.accountId)?.name}, ${o?.title}: ${a.status}, applied ${a.appliedOn}${a.interview ? `, interview ${when(a.interview.when)} (${a.interview.status})` : ''}${a.evaluation ? `, feedback ${a.evaluation.score}/5` : a.status === 'Interview' ? ', no interview feedback yet' : ''}`
      })
      const text = await askText({ model: FAST, ...pipelineRequest([...rows, `${toReview.length} challenge submissions waiting for review`]), signal })
      return { data: text, saved: false }
    })

  return (
    <>
      <PanelHead title={`Hiring at ${me.company}`} intro="New applicants, interviews and challenge work waiting for you.">
        <Link to="/panel/roles/new" className="btn btn-accent btn-sm">
          Post a role
        </Link>
      </PanelHead>
      <Stats
        items={[
          { label: 'Live roles', value: roles.filter((r) => (r.status ?? 'live') === 'live').length, to: '/panel/roles' },
          { label: 'New applicants', value: fresh.length, to: '/panel/applicants', hot: fresh.length > 0 },
          { label: 'Interviews coming up', value: upcoming.length, to: '/panel/calendar' },
          { label: 'Work to review', value: toReview.length, to: '/panel/submissions', hot: toReview.length > 0 },
          { label: 'Waiting for approval', value: pending },
        ]}
      />

      <section className={own.summary}>
        <div className={own.summaryHead}>
          <MillisaMark size={26} />
          <p>Millisa can read your pipeline and tell you what needs attention first.</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={summarise} disabled={summary.status === 'loading'}>
            {summary.data ? 'Summarise again' : 'Summarise my hiring'}
          </button>
        </div>
        {summary.status === 'loading' && <Thinking>Millisa is reading your pipeline</Thinking>}
        {summary.status === 'error' && <Problem message={summary.error ?? ''} onRetry={summarise} />}
        {summary.status === 'done' && summary.data && <Reply text={summary.data} />}
      </section>

      <Section title="Role performance">
        {roles.length === 0 ? (
          <Empty title="No roles yet">Post your first role. It takes about five minutes.</Empty>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Applied</th>
                  <th>Shortlisted</th>
                  <th>Interviews</th>
                  <th>Offers and hires</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => {
                  const list = applicants.filter((a) => a.opportunityId === r.id)
                  const at = (s: ApplicationStatus[]) => list.filter((a) => s.includes(a.status)).length
                  return (
                    <tr key={r.id}>
                      <td>
                        <Link to={`/panel/applicants?role=${r.id}`} className={styles.cellTitle}>
                          {r.title}
                        </Link>
                        <p className={styles.cellSub}>
                          <Status value={r.status ?? 'live'} />
                        </p>
                      </td>
                      <td className="num">{list.length}</td>
                      <td className="num">{at(['Shortlisted', 'Interview', 'Offer', 'Hired'])}</td>
                      <td className="num">{at(['Interview', 'Offer', 'Hired'])}</td>
                      <td className="num">{at(['Offer', 'Hired'])}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  )
}

export function ContentTable({ kind }: { kind: 'opportunities' | 'challenges' }) {
  const { roles, challenges, applicants, submissions, setContentStatus, deleteContent } = useCompany()
  const isRoles = kind === 'opportunities'
  const items: { id: string; title: string; closes: string; status?: string; sub: string }[] = isRoles
    ? roles.map((r) => ({ ...r, sub: `${r.kind}, ${r.pay}` }))
    : challenges.map((c) => ({ ...c, sub: `${c.level}, ${c.reward}` }))
  const base = isRoles ? '/panel/roles' : '/panel/challenges'
  const publicBase = isRoles ? '/opportunities' : '/challenges'
  const count = (id: string) =>
    isRoles ? applicants.filter((a) => a.opportunityId === id).length : submissions.filter((s) => s.challengeId === id).length

  const remove = (id: string, title: string) => {
    const word = isRoles ? 'its applications' : 'its submissions'
    if (window.confirm(`Delete "${title}"? This also removes ${word}. It cannot be undone.`)) deleteContent(kind as ContentKind, id)
  }

  return (
    <>
      <PanelHead
        title={isRoles ? 'Roles' : 'Challenges'}
        intro={isRoles ? 'Jobs, internships and gigs you are hiring for.' : 'Small paid tasks. Accepted work becomes a badge on the person’s profile.'}
      >
        <Link to={`${base}/new`} className="btn btn-accent btn-sm">
          {isRoles ? 'Post a role' : 'Post a challenge'}
        </Link>
      </PanelHead>
      <Toast />
      {items.length === 0 ? (
        <Empty title={isRoles ? 'No roles yet' : 'No challenges yet'}>
          {isRoles ? 'Post your first role. Millisa can write it from a few lines of notes.' : 'A challenge shows you who can actually do the work.'}
        </Empty>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{isRoles ? 'Role' : 'Challenge'}</th>
                <th>{isRoles ? 'Applicants' : 'Submissions'}</th>
                <th>Closes</th>
                <th>Status</th>
                <th className={styles.actions}>
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const status = item.status ?? 'live'
                return (
                  <tr key={item.id}>
                    <td>
                      <Link to={`${publicBase}/${item.id}`} className={styles.cellTitle}>
                        {item.title}
                      </Link>
                      <p className={styles.cellSub}>{item.sub}</p>
                    </td>
                    <td className="num">{count(item.id)}</td>
                    <td>{item.closes}</td>
                    <td>
                      <Status value={status} />
                    </td>
                    <td className={styles.actions}>
                      <span className={styles.rowActions}>
                        <Link to={`${base}/${item.id}`} className={styles.link}>
                          Edit
                        </Link>
                        {status === 'live' && (
                          <button type="button" className={styles.link} onClick={() => setContentStatus(kind, item.id, 'hidden')}>
                            Close
                          </button>
                        )}
                        {status === 'hidden' && (
                          <button type="button" className={styles.link} onClick={() => setContentStatus(kind, item.id, 'live')}>
                            Reopen
                          </button>
                        )}
                        <button type="button" className={`${styles.link} ${styles.danger}`} onClick={() => remove(item.id, item.title)}>
                          Delete
                        </button>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

type Tool = 'interview' | 'fit' | 'notes' | 'feedback' | 'draft' | null

function ApplicantCard({ a, role }: { a: Application; role: Opportunity }) {
  const { accountById, data, account, setApplicationStatus, scheduleInterview, addApplicantNote, evaluate } = useStore()
  const navigate = useNavigate()
  const who = accountById(a.accountId)
  const [tool, setTool] = useState<Tool>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState(rejectReasons[0])
  const [whenAt, setWhenAt] = useState(a.interview?.when ?? '')
  const [mode, setMode] = useState(a.interview?.mode ?? 'Video')
  const [where, setWhere] = useState(a.interview?.where ?? '')
  const [note, setNote] = useState('')
  const [score, setScore] = useState(a.evaluation?.score ?? 0)
  const [evalNotes, setEvalNotes] = useState(a.evaluation?.notes ?? '')
  const [purpose, setPurpose] = useState<DraftPurpose>('update')
  const fit = useMillisaTask<CandidateRead>()
  const questions = useMillisaTask<{ questions: Question[] }>()
  const draft = useMillisaTask<string>()
  if (!who) return null

  const hits = overlap(role.skills, who.profile.skills)
  const work = role.challengeId ? data.submissions.find((s) => s.accountId === who.id && s.challengeId === role.challengeId) : undefined
  const workStatus = !role.challengeId ? 'This role has no linked challenge' : work ? `Submitted, ${work.status.toLowerCase()}` : 'Not attempted'

  const open = (t: Tool) => setTool((cur) => (cur === t ? null : t))

  const changeStage = (s: ApplicationStatus) => {
    if (s === 'Rejected') {
      setRejecting(true)
      return
    }
    setApplicationStatus(a.id, s)
  }

  const schedule = (e: FormEvent) => {
    e.preventDefault()
    if (!whenAt || !where.trim()) return
    scheduleInterview(a.id, { when: whenAt, mode, where: where.trim() })
    setTool(null)
  }

  const explain = () =>
    fit.run((signal) => askJson<CandidateRead>({ model: SMART, ...candidateRequest(role, who.profile, a.note, workStatus), signal }))

  const suggest = () => questions.run((signal) => askJson({ model: SMART, ...questionsRequest(role, who.profile, 'en'), signal }))

  const showFit = () => {
    open('fit')
    if (fit.status === 'idle') explain()
  }

  const writeDraft = () =>
    draft.run(async (signal) => {
      const extra =
        purpose === 'interview' && a.interview
          ? `Interview: ${when(a.interview.when)}, ${a.interview.mode}, ${a.interview.where}`
          : purpose === 'rejection'
            ? `Reason: ${a.rejectReason ?? reason}`
            : `Current stage: ${a.status}`
      const text = await askText({ model: FAST, ...employerMessageRequest(purpose, account?.company ?? '', role.title, who.name, extra), signal })
      return { data: text, saved: false }
    })

  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <p className={styles.cardTitle}>{who.name}</p>
          <p className={styles.cardSub}>
            {who.profile.city}
            {who.profile.college ? `, ${who.profile.college}` : ''}. Applied for {role.title} on {a.appliedOn}
          </p>
        </div>
        <select className={styles.select} value={a.status} onChange={(e) => changeStage(e.target.value as ApplicationStatus)} aria-label={`Stage for ${who.name}`}>
          {stages.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {rejecting && (
        <div className={own.reject}>
          <label className="field">
            <span>Why are you closing this application? {who.name.split(' ')[0]} will see this.</span>
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
              {rejectReasons.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <div className={styles.cardFoot}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setApplicationStatus(a.id, 'Rejected', reason)
                setRejecting(false)
              }}
            >
              Close application
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRejecting(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.chips}>
        {who.profile.skills.map((s) => (
          <span key={s} className={`tag ${hits.includes(s) ? 'tag-leaf' : ''}`}>
            {s}
          </span>
        ))}
      </div>
      {a.note && <blockquote className={styles.quote}>{a.note}</blockquote>}
      <p className={styles.cardSub}>
        {hits.length} of {role.skills.length} skills match. Linked challenge: {workStatus.toLowerCase()}.
        {a.status === 'Rejected' && a.rejectReason && ` Closed: ${a.rejectReason.toLowerCase()}.`}
      </p>

      {a.interview && (
        <p className={own.interview}>
          <CalendarClock size={15} aria-hidden="true" /> Interview {when(a.interview.when)}, {a.interview.mode.toLowerCase()}
          <Status value={a.interview.status} />
          {a.interview.reply && <span className={styles.cellSub}> “{a.interview.reply}”</span>}
        </p>
      )}

      <div className={own.tools}>
        <button type="button" aria-pressed={tool === 'interview'} onClick={() => open('interview')}>
          <CalendarClock size={15} /> {a.interview ? 'Change interview' : 'Schedule interview'}
        </button>
        <button type="button" aria-pressed={tool === 'fit'} onClick={showFit}>
          <MillisaMark size={15} /> Explain fit
        </button>
        <button type="button" aria-pressed={tool === 'draft'} onClick={() => open('draft')}>
          <MessageSquare size={15} /> Draft a message
        </button>
        <button type="button" aria-pressed={tool === 'notes'} onClick={() => open('notes')}>
          <NotebookPen size={15} /> Private notes{a.notes?.length ? ` (${a.notes.length})` : ''}
        </button>
        {(a.status === 'Interview' || a.status === 'Offer' || a.evaluation) && (
          <button type="button" aria-pressed={tool === 'feedback'} onClick={() => open('feedback')}>
            <Star size={15} /> Interview feedback{a.evaluation ? ` (${a.evaluation.score}/5)` : ''}
          </button>
        )}
        {work && (
          <a href={work.link} target="_blank" rel="noreferrer">
            Challenge work
          </a>
        )}
        <MessageButton to={who.id} plain />
      </div>

      {tool === 'interview' && (
        <form className={own.panel} onSubmit={schedule}>
          <div className={styles.formRow3}>
            <label className="field">
              <span>When</span>
              <input className="input" type="datetime-local" value={whenAt} onChange={(e) => setWhenAt(e.target.value)} required />
            </label>
            <label className="field">
              <span>How</span>
              <select className="input" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
                <option>Video</option>
                <option>Phone</option>
                <option>In person</option>
              </select>
            </label>
            <label className="field">
              <span>{mode === 'Video' ? 'Meeting link' : mode === 'Phone' ? 'Number to call' : 'Address'}</span>
              <input className="input" value={where} onChange={(e) => setWhere(e.target.value)} required />
            </label>
          </div>
          <div className={styles.cardFoot}>
            <button type="submit" className="btn btn-primary btn-sm">
              {a.interview ? 'Send the new time' : 'Send invite'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={suggest} disabled={questions.status === 'loading'}>
              <MillisaMark size={15} /> Suggest interview questions
            </button>
          </div>
          {questions.status === 'loading' && <Thinking>Millisa is writing questions for this role</Thinking>}
          {questions.status === 'error' && <Problem message={questions.error ?? ''} onRetry={suggest} />}
          {questions.data && (
            <ol className={own.questions}>
              {questions.data.questions.map((q) => (
                <li key={q.question}>
                  {q.question}
                  <span className={styles.cellSub}> Listen for: {q.lookFor}</span>
                </li>
              ))}
            </ol>
          )}
        </form>
      )}

      {tool === 'fit' && (
        <div className={own.panel}>
          <p className={own.disclaimer}>Millisa explains how the profile lines up with the role. You make the decision.</p>
          {fit.status === 'loading' && <Thinking>Millisa is reading {who.name.split(' ')[0]}’s profile</Thinking>}
          {fit.status === 'error' && <Problem message={fit.error ?? ''} onRetry={explain} />}
          {fit.data && (
            <>
              {fit.saved && <SavedNote />}
              <p>{fit.data.summary}</p>
              <div className={styles.two}>
                <Points title="What the profile shows" items={fit.data.strengths} tone="good" />
                <Points title="Not shown yet" items={fit.data.gaps} tone="gap" />
              </div>
              <Points title="Ask in the interview" items={fit.data.ask} tone="plain" />
            </>
          )}
        </div>
      )}

      {tool === 'draft' && (
        <div className={own.panel}>
          <div className={styles.toolbar}>
            <select className={styles.select} value={purpose} onChange={(e) => setPurpose(e.target.value as DraftPurpose)} aria-label="Message about">
              <option value="update">Update on their application</option>
              <option value="interview">Interview invite</option>
              <option value="offer">Offer</option>
              <option value="rejection">Kind no</option>
            </select>
            <button type="button" className="btn btn-ghost btn-sm" onClick={writeDraft} disabled={draft.status === 'loading'}>
              <MillisaMark size={15} /> Write with Millisa
            </button>
          </div>
          {draft.status === 'loading' && <Thinking>Millisa is writing</Thinking>}
          {draft.status === 'error' && <Problem message={draft.error ?? ''} onRetry={writeDraft} />}
          {draft.data && (
            <>
              <blockquote className={styles.quote}>{draft.data}</blockquote>
              <div className={styles.cardFoot}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/panel/messages/${who.id}`, { state: { draft: draft.data } })}
                >
                  Open in messages to review and send
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {tool === 'notes' && (
        <div className={own.panel}>
          <p className={own.disclaimer}>Only your team sees these notes. {who.name.split(' ')[0]} never does.</p>
          {a.notes?.map((n, i) => (
            <p key={i} className={own.note}>
              {n.text}
              <span className={styles.cellSub}>
                {' '}
                {n.by}, {n.on}
              </span>
            </p>
          ))}
          <form
            className={own.noteForm}
            onSubmit={(e) => {
              e.preventDefault()
              if (!note.trim()) return
              addApplicantNote(a.id, note.trim())
              setNote('')
            }}
          >
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for your team" aria-label="Private note" />
            <button type="submit" className="btn btn-ghost btn-sm" disabled={!note.trim()}>
              Add
            </button>
          </form>
        </div>
      )}

      {tool === 'feedback' && (
        <div className={own.panel}>
          <div className={own.stars} role="group" aria-label="How did the interview go?">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-pressed={score >= n} onClick={() => setScore(n)} aria-label={`${n} out of 5`}>
                <Star size={20} fill={score >= n ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <textarea
            className="input"
            value={evalNotes}
            onChange={(e) => setEvalNotes(e.target.value)}
            placeholder="What stood out, and what you are still unsure about"
            aria-label="Interview notes"
          />
          <div className={styles.cardFoot}>
            <button type="button" className="btn btn-primary btn-sm" disabled={!score} onClick={() => evaluate(a.id, score, evalNotes.trim())}>
              Save feedback
            </button>
            {a.evaluation && (
              <span className={styles.cellSub}>
                Saved by {a.evaluation.by} on {a.evaluation.on}
              </span>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

export function Applicants() {
  const { roles, applicants, data } = useCompany()
  const { search } = useLocation()
  const [role, setRole] = useState(new URLSearchParams(search).get('role') ?? 'all')
  const [stage, setStage] = useState<ApplicationStatus | 'all'>('all')

  const shown = applicants.filter((a) => (role === 'all' || a.opportunityId === role) && (stage === 'all' || a.status === stage)).reverse()

  return (
    <>
      <PanelHead title="Applicants" intro="Move people through your stages. They see each change in their own panel, and a reason if you close their application." />
      <div className={styles.toolbar}>
        <select className={styles.select} value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="all">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </div>
      <div className={own.stageBar} role="group" aria-label="Stage">
        {(['all', ...stages] as const).map((s) => {
          const n = s === 'all' ? applicants.length : applicants.filter((a) => a.status === s && (role === 'all' || a.opportunityId === role)).length
          return (
            <button key={s} type="button" aria-pressed={stage === s} onClick={() => setStage(s)}>
              <span>{s === 'all' ? 'Everyone' : s}</span>
              <strong className="num">{n}</strong>
            </button>
          )
        })}
      </div>
      {shown.length === 0 ? (
        <Empty title="Nobody here">No applicants match these filters.</Empty>
      ) : (
        <ul className={styles.list}>
          {shown.map((a) => {
            const r = data.opportunities.find((o) => o.id === a.opportunityId)
            return r ? <ApplicantCard key={a.id} a={a} role={r} /> : null
          })}
        </ul>
      )}
    </>
  )
}

function SubmissionCard({ id }: { id: string }) {
  const { data, accountById, reviewSubmission } = useStore()
  const s = data.submissions.find((x) => x.id === id)!
  const [feedback, setFeedback] = useState(s.feedback ?? '')
  const who = accountById(s.accountId)
  const c = data.challenges.find((x) => x.id === s.challengeId)

  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <p className={styles.cardTitle}>{who?.name}</p>
          <p className={styles.cardSub}>
            {c?.title}. Sent {s.submittedOn}
          </p>
        </div>
        <Status value={s.status} />
      </div>
      <blockquote className={styles.quote}>{s.note || 'No note.'}</blockquote>
      <a href={s.link} target="_blank" rel="noreferrer" className={styles.link}>
        {s.link}
      </a>
      <label className="field">
        <span>Feedback for {who?.name.split(' ')[0]}</span>
        <textarea
          className="input"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="One or two lines on what worked and what to change. People read every word of this."
        />
      </label>
      <div className={styles.cardFoot}>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => reviewSubmission(s.id, 'Accepted', feedback.trim())}>
          Accept and give a badge
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => reviewSubmission(s.id, 'Not selected', feedback.trim())}>
          Not selected
        </button>
        {s.status !== 'In review' && (
          <button type="button" className={`${styles.link} ${styles.push}`} onClick={() => reviewSubmission(s.id, 'In review', feedback.trim())}>
            Move back to review
          </button>
        )}
      </div>
    </li>
  )
}

export function Submissions() {
  const { submissions } = useCompany()
  const [tab, setTab] = useState<'In review' | 'Done'>('In review')
  const shown = submissions.filter((s) => (tab === 'In review' ? s.status === 'In review' : s.status !== 'In review'))
  return (
    <>
      <PanelHead title="Challenge work" intro="Read each submission, then accept it or say why not. Accepted work becomes a badge recruiters can search." />
      <div className={styles.tabs}>
        <button type="button" aria-pressed={tab === 'In review'} onClick={() => setTab('In review')}>
          To review ({submissions.filter((s) => s.status === 'In review').length})
        </button>
        <button type="button" aria-pressed={tab === 'Done'} onClick={() => setTab('Done')}>
          Reviewed ({submissions.filter((s) => s.status !== 'In review').length})
        </button>
      </div>
      {shown.length === 0 ? (
        <Empty title={tab === 'In review' ? 'Nothing to review' : 'Nothing reviewed yet'} />
      ) : (
        <ul className={styles.list}>
          {shown.map((s) => (
            <SubmissionCard key={s.id} id={s.id} />
          ))}
        </ul>
      )}
    </>
  )
}

export function Company() {
  const { me, updateAccount } = useCompany()
  const [about, setAbout] = useState(me.companyAbout ?? '')
  const [website, setWebsite] = useState(me.website ?? '')
  const [done, setDone] = useState(false)

  const save = (e: FormEvent) => {
    e.preventDefault()
    updateAccount({ companyAbout: about.trim(), website: website.trim() })
    setDone(true)
  }

  return (
    <>
      <PanelHead title="Company profile" intro="Used as the starting description when you post a new role." />
      {done && (
        <p className={styles.toast} role="status">
          Company profile saved.
        </p>
      )}
      <form className={styles.form} onSubmit={save}>
        <label className="field">
          <span>Company name</span>
          <input className="input" value={me.company ?? ''} disabled />
          <small>To change the name, write to the HackShift team.</small>
        </label>
        <label className="field">
          <span>What you do</span>
          <textarea
            className="input"
            value={about}
            onChange={(e) => {
              setAbout(e.target.value)
              setDone(false)
            }}
          />
        </label>
        <label className="field">
          <span>Website</span>
          <input
            className="input"
            value={website}
            onChange={(e) => {
              setWebsite(e.target.value)
              setDone(false)
            }}
            placeholder="https://"
          />
        </label>
        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary btn-sm">
            Save company profile
          </button>
        </div>
      </form>
    </>
  )
}

