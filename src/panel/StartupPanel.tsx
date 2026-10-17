import { useState, type FormEvent } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Briefcase, Building2, ClipboardCheck, LayoutDashboard, UserCog, Users, Zap } from 'lucide-react'
import MessageButton from '../components/MessageButton'
import { overlap } from '../lib/match'
import { useStore, type ApplicationStatus, type ContentKind } from '../store/AppStore'
import AccountSettings from './AccountSettings'
import { ChallengeEditor, RoleEditor } from './Editors'
import { sharedRoutes, useSharedNav } from './shared'
import PanelShell from './PanelShell'
import { Empty, PanelHead, Section, Stats, Status, panelStyles as styles } from './ui'

const appStatuses: ApplicationStatus[] = ['Sent', 'Shortlisted', 'Interview', 'Hired', 'Not selected']

function useCompany() {
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

function Toast() {
  const { state } = useLocation()
  const toast = (state as { toast?: string } | null)?.toast
  return toast ? (
    <p className={styles.toast} role="status">
      {toast}
    </p>
  ) : null
}

function Overview() {
  const { me, roles, challenges, applicants, submissions, accountById, data } = useCompany()
  const fresh = applicants.filter((a) => a.status === 'Sent')
  const toReview = submissions.filter((s) => s.status === 'In review')
  const pending = [...roles, ...challenges].filter((x) => x.status === 'pending').length

  return (
    <>
      <PanelHead title={`${me.company} on HackShift`} intro="New applicants and challenge work waiting for you.">
        <Link to="/panel/roles/new" className="btn btn-accent btn-sm">
          Post a role
        </Link>
      </PanelHead>
      <Stats
        items={[
          { label: 'Live roles', value: roles.filter((r) => (r.status ?? 'live') === 'live').length, to: '/panel/roles' },
          { label: 'New applicants', value: fresh.length, to: '/panel/applicants', hot: fresh.length > 0 },
          { label: 'Work to review', value: toReview.length, to: '/panel/submissions', hot: toReview.length > 0 },
          { label: 'Waiting for approval', value: pending },
        ]}
      />
      <div className={styles.two}>
        <Section title="Latest applicants" link={{ to: '/panel/applicants', label: 'See all' }}>
          {applicants.length === 0 ? (
            <Empty title="No applicants yet">Once your roles are live, applications show up here.</Empty>
          ) : (
            <ul className={styles.feed}>
              {[...applicants].reverse().slice(0, 5).map((a) => {
                const who = accountById(a.accountId)
                const role = data.opportunities.find((o) => o.id === a.opportunityId)
                return (
                  <li key={a.id}>
                    <span>
                      <strong>{who?.name}</strong> for {role?.title}
                    </span>
                    <Status value={a.status} />
                  </li>
                )
              })}
            </ul>
          )}
        </Section>
        <Section title="Challenge work to review" link={{ to: '/panel/submissions', label: 'Review' }}>
          {toReview.length === 0 ? (
            <Empty title="All reviewed">Nothing is waiting. Good time to post a new challenge.</Empty>
          ) : (
            <ul className={styles.feed}>
              {toReview.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <span>
                    <strong>{accountById(s.accountId)?.name}</strong> for {data.challenges.find((c) => c.id === s.challengeId)?.title}
                  </span>
                  <time>{s.submittedOn}</time>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  )
}

function ContentTable({ kind }: { kind: 'opportunities' | 'challenges' }) {
  const { roles, challenges, applicants, submissions, setContentStatus, deleteContent } = useCompany()
  const isRoles = kind === 'opportunities'
  const items = isRoles ? roles : challenges
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
          {isRoles ? 'Post your first role. It takes about five minutes.' : 'A challenge shows you who can actually do the work.'}
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
                const sub = 'kind' in item ? `${item.kind}, ${item.pay}` : `${item.level}, ${item.reward}`
                return (
                  <tr key={item.id}>
                    <td>
                      <Link to={`${publicBase}/${item.id}`} className={styles.cellTitle}>
                        {item.title}
                      </Link>
                      <p className={styles.cellSub}>{sub}</p>
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

function Applicants() {
  const { roles, applicants, accountById, data, setApplicationStatus } = useCompany()
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState<ApplicationStatus | 'all'>('all')

  const shown = applicants
    .filter((a) => (role === 'all' || a.opportunityId === role) && (status === 'all' || a.status === status))
    .reverse()

  return (
    <>
      <PanelHead title="Applicants" intro="Everyone who applied to your roles. Move people along and they see the change in their panel." />
      <div className={styles.toolbar}>
        <select className={styles.select} value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="all">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        <div className={styles.chips} role="group" aria-label="Status">
          {(['all', ...appStatuses] as const).map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s === 'all' ? 'Everyone' : s} ({s === 'all' ? applicants.length : applicants.filter((a) => a.status === s).length})
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <Empty title="Nobody here">No applicants match these filters.</Empty>
      ) : (
        <ul className={styles.list}>
          {shown.map((a) => {
            const who = accountById(a.accountId)
            const r = data.opportunities.find((o) => o.id === a.opportunityId)
            if (!who || !r) return null
            const hits = overlap(r.skills, who.profile.skills)
            const work = r.challengeId ? data.submissions.find((s) => s.accountId === who.id && s.challengeId === r.challengeId) : undefined
            return (
              <li key={a.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <p className={styles.cardTitle}>{who.name}</p>
                    <p className={styles.cardSub}>
                      {who.profile.city}
                      {who.profile.college ? `, ${who.profile.college}` : ''}. Applied for {r.title} on {a.appliedOn}
                    </p>
                  </div>
                  <select
                    className={styles.select}
                    value={a.status}
                    onChange={(e) => setApplicationStatus(a.id, e.target.value as ApplicationStatus)}
                    aria-label={`Status for ${who.name}`}
                  >
                    {appStatuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.chips}>
                  {who.profile.skills.map((s) => (
                    <span key={s} className={`tag ${hits.includes(s) ? 'tag-leaf' : ''}`}>
                      {s}
                    </span>
                  ))}
                </div>
                {a.note && <blockquote className={styles.quote}>{a.note}</blockquote>}
                <div className={styles.cardFoot}>
                  <span className={styles.cardSub}>
                    {hits.length} of {r.skills.length} skills match.{' '}
                    {r.challengeId && (work ? `Linked challenge: ${work.status.toLowerCase()}.` : 'Has not done the linked challenge.')}
                  </span>
                  <span className={`${styles.rowActions} ${styles.push}`}>
                    {work && (
                      <a href={work.link} target="_blank" rel="noreferrer" className={styles.link}>
                        See their challenge work
                      </a>
                    )}
                    <MessageButton to={who.id} />
                  </span>
                </div>
              </li>
            )
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

function Submissions() {
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

function Company() {
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
          <textarea className="input" value={about} onChange={(e) => { setAbout(e.target.value); setDone(false) }} />
        </label>
        <label className="field">
          <span>Website</span>
          <input className="input" value={website} onChange={(e) => { setWebsite(e.target.value); setDone(false) }} placeholder="https://" />
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

export default function StartupPanel() {
  const { applicants, submissions } = useCompany()
  const shared = useSharedNav('/panel')
  const nav = [
    { to: '/panel', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/panel/roles', label: 'Roles', icon: Briefcase },
    { to: '/panel/challenges', label: 'Challenges', icon: Zap },
    { to: '/panel/applicants', label: 'Applicants', icon: Users, count: applicants.filter((a) => a.status === 'Sent').length },
    { to: '/panel/submissions', label: 'Challenge work', icon: ClipboardCheck, count: submissions.filter((s) => s.status === 'In review').length },
    { to: '/panel/company', label: 'Company profile', icon: Building2 },
    ...shared,
    { to: '/panel/account', label: 'Account', icon: UserCog },
  ]
  return (
    <PanelShell nav={nav} publicLink={{ to: '/opportunities', label: 'See the public site' }}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="roles" element={<ContentTable kind="opportunities" />} />
        <Route path="roles/new" element={<RoleEditor backTo="/panel/roles" />} />
        <Route path="roles/:id" element={<RoleEditor backTo="/panel/roles" />} />
        <Route path="challenges" element={<ContentTable kind="challenges" />} />
        <Route path="challenges/new" element={<ChallengeEditor backTo="/panel/challenges" />} />
        <Route path="challenges/:id" element={<ChallengeEditor backTo="/panel/challenges" />} />
        <Route path="applicants" element={<Applicants />} />
        <Route path="submissions" element={<Submissions />} />
        <Route path="company" element={<Company />} />
        {sharedRoutes()}
        <Route path="account" element={<AccountSettings />} />
        <Route path="*" element={<Navigate to="/panel" replace />} />
      </Routes>
    </PanelShell>
  )
}
