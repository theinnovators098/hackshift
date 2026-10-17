import { Link } from 'react-router-dom'
import { CalendarDays, Check, MapPin, Pencil } from 'lucide-react'
import { roleInfo } from '../data/roles'
import { matchChallenges, matchOpportunities, greeting } from '../lib/match'
import { useStore } from '../store/AppStore'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const store = useStore()
  const { profile, submissions, applications, bookings, myVentures, saved, shortlist, reviewRequests, opportunities, challenges, people, data } = store
  const mentors = data.mentors

  if (!profile) {
    return (
      <section className={styles.empty}>
        <h1>You do not have a profile yet</h1>
        <p>Your dashboard fills up with matched roles, challenges and mentor sessions once we know what you are looking for.</p>
        <Link to="/start" className="btn btn-accent">
          Create your profile
        </Link>
      </section>
    )
  }

  const first = profile.name.split(' ')[0]
  const matches = matchOpportunities(opportunities, profile.skills, 3)
  const suggested = matchChallenges(challenges, profile.skills, 2).filter((c) => !submissions.some((s) => s.challengeId === c.item.id))
  const isFounder = profile.roles.includes('founder') || profile.roles.includes('startup')
  const isHiring = profile.roles.includes('recruiter') || profile.roles.includes('startup')

  const checklist = [
    { done: profile.skills.length >= 3, text: 'Add at least three skills', to: '/start' },
    { done: submissions.length > 0, text: 'Submit your first challenge', to: '/challenges' },
    { done: bookings.length > 0, text: 'Book a session with a mentor', to: '/mentors' },
    { done: applications.length > 0, text: 'Apply to an opportunity', to: '/opportunities' },
  ]
  const doneCount = checklist.filter((c) => c.done).length

  return (
    <div>
      <header className={styles.head}>
        <div>
          <h1>
            {greeting()}, {first}
          </h1>
          <p className={styles.meta}>
            <span>
              <MapPin size={15} aria-hidden="true" /> {profile.city}
            </span>
            {profile.roles.map((r) => (
              <span key={r} className="tag">
                {roleInfo[r].short}
              </span>
            ))}
          </p>
        </div>
        <div className={styles.headActions}>
          <Link to="/profile" className="btn btn-ghost btn-sm">
            View public profile
          </Link>
          <Link to="/start" className="btn btn-ghost btn-sm">
            <Pencil size={14} /> Edit profile
          </Link>
        </div>
      </header>

      {profile.goal && (
        <p className={styles.goal}>
          <span>Your goal</span>
          {profile.goal}
        </p>
      )}

      <div className={styles.grid}>
        <div className={styles.main}>
          <section className={styles.block} aria-labelledby="matches">
            <div className={styles.blockHead}>
              <h2 id="matches">Matched to your skills</h2>
              <Link to="/opportunities">See all</Link>
            </div>
            <ul className={styles.list}>
              {matches.map(({ item, hits }) => (
                <li key={item.id}>
                  <Link to={`/opportunities/${item.id}`} className={styles.row}>
                    <div>
                      <p className={styles.rowTitle}>{item.title}</p>
                      <p className={styles.rowSub}>
                        {item.company}, {item.city}
                        {item.remote && ' (remote ok)'}
                      </p>
                    </div>
                    <div className={styles.rowEnd}>
                      <span className="num">{item.pay}</span>
                      {hits.length > 0 ? (
                        <span className="tag tag-leaf">
                          {hits.length} of {item.skills.length} skills
                        </span>
                      ) : (
                        <span className="tag">New</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.block} aria-labelledby="mine">
            <div className={styles.blockHead}>
              <h2 id="mine">Your challenges</h2>
              <Link to="/challenges">Browse challenges</Link>
            </div>
            {submissions.length === 0 ? (
              <p className={styles.note}>
                You have not submitted any work yet. A finished challenge is the fastest way to get an interview.
              </p>
            ) : (
              <ul className={styles.list}>
                {submissions.map((s) => {
                  const c = data.challenges.find((x) => x.id === s.challengeId)
                  if (!c) return null
                  return (
                    <li key={s.id}>
                      <Link to={`/challenges/${c.id}`} className={styles.row}>
                        <div>
                          <p className={styles.rowTitle}>{c.title}</p>
                          <p className={styles.rowSub}>
                            {c.company}, submitted {s.submittedOn}
                          </p>
                        </div>
                        <span className={`tag ${s.status === 'Accepted' ? 'tag-leaf' : s.status === 'Not selected' ? 'tag-rose' : 'tag-marigold'}`}>
                          {s.status}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
            {suggested.length > 0 && (
              <div className={styles.suggest}>
                <p>Worth a try next</p>
                {suggested.map(({ item }) => (
                  <Link key={item.id} to={`/challenges/${item.id}`}>
                    {item.title}
                    <span>
                      {item.company}, about {item.hours} hours
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {isFounder && (
            <section className={styles.block} aria-labelledby="ventures">
              <div className={styles.blockHead}>
                <h2 id="ventures">Your ventures</h2>
                <Link to="/ventures/new">Post an idea</Link>
              </div>
              {myVentures.length === 0 ? (
                <p className={styles.note}>
                  Post your idea to find a co-founder, get mentor feedback and track it from idea to funded.
                </p>
              ) : (
                <ul className={styles.list}>
                  {myVentures.map((v) => (
                    <li key={v.id}>
                      <Link to={`/ventures/${v.id}`} className={styles.row}>
                        <div>
                          <p className={styles.rowTitle}>{v.name}</p>
                          <p className={styles.rowSub}>{v.oneLiner}</p>
                        </div>
                        <span className="tag tag-marigold">{v.stage}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {reviewRequests.length > 0 && (
                <p className={styles.note}>
                  {reviewRequests.length} mentor review {reviewRequests.length === 1 ? 'request is' : 'requests are'} waiting
                  for a reply.
                </p>
              )}
            </section>
          )}

          {applications.length > 0 && (
            <section className={styles.block} aria-labelledby="apps">
              <div className={styles.blockHead}>
                <h2 id="apps">Applications</h2>
              </div>
              <ul className={styles.list}>
                {applications.map((a) => {
                  const o = data.opportunities.find((x) => x.id === a.opportunityId)
                  if (!o) return null
                  return (
                    <li key={a.id}>
                      <Link to={`/opportunities/${o.id}`} className={styles.row}>
                        <div>
                          <p className={styles.rowTitle}>{o.title}</p>
                          <p className={styles.rowSub}>
                            {o.company}, applied {a.appliedOn}
                          </p>
                        </div>
                        <span className={`tag ${a.status === 'Hired' || a.status === 'Interview' ? 'tag-leaf' : a.status === 'Not selected' ? 'tag-rose' : a.status === 'Shortlisted' ? 'tag-marigold' : ''}`}>
                          {a.status}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className={styles.side}>
          <section className={styles.panel} aria-labelledby="noticed">
            <h2 id="noticed">Get noticed</h2>
            <div className={styles.meter} aria-hidden="true">
              <span style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
            </div>
            <p className={styles.meterText}>
              {doneCount} of {checklist.length} done
            </p>
            <ul className={styles.checklist}>
              {checklist.map((c) => (
                <li key={c.text} className={c.done ? styles.checked : undefined}>
                  <span className={styles.box} aria-hidden="true">
                    {c.done && <Check size={12} strokeWidth={3} />}
                  </span>
                  {c.done ? c.text : <Link to={c.to}>{c.text}</Link>}
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.panel} aria-labelledby="sessions">
            <h2 id="sessions">Mentor sessions</h2>
            {bookings.length === 0 ? (
              <p className={styles.note}>
                Nothing booked. <Link to="/mentors">Find a mentor</Link> who has done what you are trying to do.
              </p>
            ) : (
              <ul className={styles.sessions}>
                {bookings.map((b) => {
                  const m = mentors.find((x) => x.id === b.mentorId)
                  return (
                    <li key={b.id}>
                      <CalendarDays size={16} aria-hidden="true" />
                      <div>
                        <p>
                          <strong>{m?.name}</strong>
                        </p>
                        <p className={styles.rowSub}>
                          {b.day}, {b.time}
                        </p>
                        <p className={styles.rowSub}>
                          {b.status}: {b.topic}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {isHiring && (
            <section className={styles.panel} aria-labelledby="hiring">
              <h2 id="hiring">Hiring</h2>
              <p className={styles.note}>
                {shortlist.length === 0
                  ? 'Your shortlist is empty.'
                  : `${shortlist.length} ${shortlist.length === 1 ? 'person' : 'people'} on your shortlist.`}{' '}
                {people.filter((p) => p.available).length} people with verified work are open to offers.
              </p>
              <Link to="/talent" className="btn btn-primary btn-sm">
                Search talent
              </Link>
            </section>
          )}

          {saved.length > 0 && (
            <section className={styles.panel} aria-labelledby="saved">
              <h2 id="saved">Saved</h2>
              <ul className={styles.saved}>
                {saved.map((id) => {
                  const o = data.opportunities.find((x) => x.id === id)
                  return o ? (
                    <li key={id}>
                      <Link to={`/opportunities/${id}`}>{o.title}</Link>
                      <span>{o.company}</span>
                    </li>
                  ) : null
                })}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
