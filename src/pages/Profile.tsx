import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, Building2, Hourglass, MapPin, Pencil } from 'lucide-react'
import { challenges } from '../data/challenges'
import { roleInfo } from '../data/roles'
import { useStore } from '../store/AppStore'
import styles from './Profile.module.css'

export default function Profile() {
  const { profile, submissions, myVentures, reset } = useStore()
  const navigate = useNavigate()

  if (!profile) {
    return (
      <section className={`wrap ${styles.empty}`}>
        <h1>No profile yet</h1>
        <p>Your public profile shows your skills and the work startups have accepted. It takes two minutes to set up.</p>
        <Link to="/start" className="btn btn-accent">
          Create your profile
        </Link>
      </section>
    )
  }

  const accepted = submissions.filter((s) => s.status === 'Accepted')
  const inReview = submissions.filter((s) => s.status === 'In review')
  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const clearAll = () => {
    if (window.confirm('This removes your profile, applications, submissions and bookings from this browser. Continue?')) {
      reset()
      navigate('/')
    }
  }

  return (
    <div className="wrap">
      <header className={styles.cover}>
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <div className={styles.who}>
          <h1>{profile.name}</h1>
          <ul className={styles.facts}>
            <li>
              <MapPin size={16} aria-hidden="true" /> {profile.city}
            </li>
            {profile.college && (
              <li>
                <Building2 size={16} aria-hidden="true" /> {profile.college}
              </li>
            )}
          </ul>
          <div className={styles.roles}>
            {profile.roles.map((r) => (
              <span key={r} className="tag">
                {roleInfo[r].short}
              </span>
            ))}
          </div>
        </div>
        <Link to="/start" className="btn btn-ghost btn-sm">
          <Pencil size={14} /> Edit
        </Link>
      </header>

      <div className={styles.grid}>
        <div className={styles.main}>
          {profile.goal && (
            <section>
              <h2>Looking for</h2>
              <p className={styles.goal}>{profile.goal}</p>
            </section>
          )}

          <section>
            <h2>Verified work</h2>
            {accepted.length === 0 ? (
              <p className={styles.muted}>
                Nothing accepted yet. When a startup accepts one of your challenge submissions, it shows up here as a
                badge.
              </p>
            ) : (
              <ul className={styles.badges}>
                {accepted.map((s) => {
                  const c = challenges.find((x) => x.id === s.challengeId)
                  return c ? (
                    <li key={s.challengeId}>
                      <BadgeCheck size={28} aria-hidden="true" />
                      <div>
                        <p className={styles.badgeTitle}>{c.title}</p>
                        <p className={styles.muted}>
                          Accepted by {c.company}.{' '}
                          <a href={s.link} target="_blank" rel="noreferrer">
                            See the work
                          </a>
                        </p>
                      </div>
                    </li>
                  ) : null
                })}
              </ul>
            )}
            {inReview.length > 0 && (
              <ul className={styles.pending}>
                {inReview.map((s) => {
                  const c = challenges.find((x) => x.id === s.challengeId)
                  return c ? (
                    <li key={s.challengeId}>
                      <Hourglass size={16} aria-hidden="true" />
                      <Link to={`/challenges/${c.id}`}>{c.title}</Link>
                      <span>in review at {c.company}</span>
                    </li>
                  ) : null
                })}
              </ul>
            )}
          </section>

          {myVentures.length > 0 && (
            <section>
              <h2>Building</h2>
              <ul className={styles.ventures}>
                {myVentures.map((v) => (
                  <li key={v.id}>
                    <Link to={`/ventures/${v.id}`}>{v.name}</Link>
                    <span>{v.oneLiner}</span>
                    <span className="tag tag-marigold">{v.stage}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className={styles.side}>
          <section>
            <h2>Skills</h2>
            <div className={styles.skills}>
              {profile.skills.map((s) => (
                <span key={s} className="tag">
                  {s}
                </span>
              ))}
            </div>
          </section>
          <section className={styles.danger}>
            <h2>Demo data</h2>
            <p className={styles.muted}>Everything is saved in this browser only. Clear it to start the demo again.</p>
            <button className="btn btn-ghost btn-sm" onClick={clearAll}>
              Clear my data
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}
