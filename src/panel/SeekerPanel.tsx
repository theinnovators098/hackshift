import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { Bookmark, CalendarDays, LayoutDashboard, Lightbulb, Send, UserCog, Zap } from 'lucide-react'
import Dashboard from '../pages/Dashboard'
import { useStore, type ApplicationStatus } from '../store/AppStore'
import AccountSettings from './AccountSettings'
import PanelShell from './PanelShell'
import { Empty, PanelHead, Status, panelStyles as styles } from './ui'

const nextStep: Record<ApplicationStatus, string> = {
  Sent: 'Waiting for the startup to read it. Most reply within a week.',
  Shortlisted: 'You are on the shortlist. Finish the linked challenge if there is one.',
  Interview: 'They want to talk. Practise the interview with Millisa before the call.',
  Hired: 'You got it. The startup will contact you with the offer.',
  'Not selected': 'Not this time. Ask a mentor what to change before the next one.',
}

function Applications() {
  const { applications, data, withdrawApplication } = useStore()
  return (
    <>
      <PanelHead title="Applications" intro="Every role you applied to and where it stands now." />
      {applications.length === 0 ? (
        <Empty title="No applications yet" action={<Link to="/opportunities" className="btn btn-primary btn-sm">Browse opportunities</Link>}>
          Apply with a short note. Your profile and challenge badges are attached for you.
        </Empty>
      ) : (
        <ul className={styles.list}>
          {[...applications].reverse().map((a) => {
            const o = data.opportunities.find((x) => x.id === a.opportunityId)
            if (!o) return null
            return (
              <li key={a.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <Link to={`/opportunities/${o.id}`} className={styles.cardTitle}>
                      {o.title}
                    </Link>
                    <p className={styles.cardSub}>
                      {o.company}, {o.city}. Applied {a.appliedOn}
                    </p>
                  </div>
                  <Status value={a.status} />
                </div>
                <p className={styles.cardBody}>{nextStep[a.status]}</p>
                {a.note && <blockquote className={styles.quote}>{a.note}</blockquote>}
                <div className={styles.cardFoot}>
                  {a.status === 'Interview' && (
                    <Link to={`/opportunities/${o.id}/practice`} className="btn btn-primary btn-sm">
                      Practise the interview
                    </Link>
                  )}
                  {a.status === 'Sent' && (
                    <button type="button" className={`${styles.link} ${styles.danger}`} onClick={() => withdrawApplication(a.id)}>
                      Withdraw application
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

function ChallengesDone() {
  const { submissions, data } = useStore()
  return (
    <>
      <PanelHead title="Challenges" intro="Work you sent to startups, and what they said about it." />
      {submissions.length === 0 ? (
        <Empty title="Nothing submitted yet" action={<Link to="/challenges" className="btn btn-primary btn-sm">Find a challenge</Link>}>
          A finished challenge is the fastest way to get an interview. Most take an evening.
        </Empty>
      ) : (
        <ul className={styles.list}>
          {[...submissions].reverse().map((s) => {
            const c = data.challenges.find((x) => x.id === s.challengeId)
            if (!c) return null
            return (
              <li key={s.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <Link to={`/challenges/${c.id}`} className={styles.cardTitle}>
                      {c.title}
                    </Link>
                    <p className={styles.cardSub}>
                      {c.company}. Submitted {s.submittedOn}
                    </p>
                  </div>
                  <Status value={s.status} />
                </div>
                {s.feedback ? (
                  <blockquote className={styles.quote}>
                    {c.company}: {s.feedback}
                  </blockquote>
                ) : (
                  <p className={styles.cardBody}>
                    {s.status === 'In review' ? `${c.company} reviews every submission within seven days of ${c.closes}.` : ''}
                  </p>
                )}
                <div className={styles.cardFoot}>
                  <a href={s.link} target="_blank" rel="noreferrer" className={styles.link}>
                    Open my work
                  </a>
                  {s.status === 'Accepted' && <span className={styles.cardSub}>Now a badge on your profile</span>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

function Sessions() {
  const { bookings, data, cancelBooking } = useStore()
  return (
    <>
      <PanelHead title="Mentor sessions" intro="Sessions you asked for. Mentors confirm or suggest another time." />
      {bookings.length === 0 ? (
        <Empty title="No sessions yet" action={<Link to="/mentors" className="btn btn-primary btn-sm">Find a mentor</Link>}>
          Thirty minutes with someone who has done it before can save you months.
        </Empty>
      ) : (
        <ul className={styles.list}>
          {[...bookings].reverse().map((b) => {
            const m = data.mentors.find((x) => x.id === b.mentorId)
            return (
              <li key={b.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <Link to={`/mentors/${b.mentorId}`} className={styles.cardTitle}>
                      {m?.name ?? 'Mentor'}
                    </Link>
                    <p className={styles.cardSub}>
                      {b.day}, {b.time}
                    </p>
                  </div>
                  <Status value={b.status} />
                </div>
                <p className={styles.cardBody}>{b.topic}</p>
                {b.mentorNote && (
                  <blockquote className={styles.quote}>
                    {m?.name.split(' ')[0]}: {b.mentorNote}
                  </blockquote>
                )}
                {(b.status === 'Requested' || b.status === 'Confirmed') && (
                  <div className={styles.cardFoot}>
                    <button type="button" className={`${styles.link} ${styles.danger}`} onClick={() => cancelBooking(b.id)}>
                      Cancel this session
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

function Saved() {
  const { saved, data, toggleSaved } = useStore()
  const items = saved.map((id) => data.opportunities.find((o) => o.id === id)).filter((o) => !!o)
  return (
    <>
      <PanelHead title="Saved" intro="Roles you want to come back to." />
      {items.length === 0 ? (
        <Empty title="Nothing saved" action={<Link to="/opportunities" className="btn btn-primary btn-sm">Browse opportunities</Link>}>
          Press the bookmark on any role to keep it here.
        </Empty>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Pay</th>
                <th>Closes</th>
                <th className={styles.actions}>
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/opportunities/${o.id}`} className={styles.cellTitle}>
                      {o.title}
                    </Link>
                    <p className={styles.cellSub}>
                      {o.company}, {o.city}
                    </p>
                  </td>
                  <td className="num">{o.pay}</td>
                  <td>{o.closes}</td>
                  <td className={styles.actions}>
                    <button type="button" className={styles.link} onClick={() => toggleSaved(o.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function MyVentures() {
  const { myVentures, data } = useStore()
  const interestCount = (id: string) => data.accounts.filter((a) => a.lists.interested.includes(id)).length
  return (
    <>
      <PanelHead title="My ventures" intro="Ideas you posted, their stage, and who wants to help.">
        <Link to="/ventures/new" className="btn btn-accent btn-sm">
          Post an idea
        </Link>
      </PanelHead>
      {myVentures.length === 0 ? (
        <Empty title="No ideas posted yet">Post your idea to find a co-founder, get mentor feedback and track it from idea to funded.</Empty>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Venture</th>
                <th>Stage</th>
                <th>People interested</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myVentures.map((v) => (
                <tr key={v.id}>
                  <td>
                    <Link to={`/ventures/${v.id}`} className={styles.cellTitle}>
                      {v.name}
                    </Link>
                    <p className={styles.cellSub}>{v.oneLiner}</p>
                  </td>
                  <td>{v.stage}</td>
                  <td className="num">{interestCount(v.id)}</td>
                  <td>
                    <Status value={v.status ?? 'live'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default function SeekerPanel() {
  const { applications, profile, myVentures } = useStore()
  const founder = !!profile?.roles.includes('founder') || myVentures.length > 0
  const moving = applications.filter((a) => a.status === 'Shortlisted' || a.status === 'Interview').length

  const nav = [
    { to: '/panel', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/panel/applications', label: 'Applications', icon: Send, count: moving },
    { to: '/panel/challenges', label: 'Challenges', icon: Zap },
    { to: '/panel/sessions', label: 'Mentor sessions', icon: CalendarDays },
    { to: '/panel/saved', label: 'Saved', icon: Bookmark },
    ...(founder ? [{ to: '/panel/ventures', label: 'My ventures', icon: Lightbulb }] : []),
    { to: '/panel/account', label: 'Account', icon: UserCog },
  ]

  return (
    <PanelShell nav={nav} publicLink={{ to: '/profile', label: 'My public profile' }}>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="challenges" element={<ChallengesDone />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="saved" element={<Saved />} />
        <Route path="ventures" element={<MyVentures />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="*" element={<Navigate to="/panel" replace />} />
      </Routes>
    </PanelShell>
  )
}
