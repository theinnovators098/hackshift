import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, CalendarClock, Clock, Gauge, Users } from 'lucide-react'
import { challenges } from '../data/challenges'
import { opportunities } from '../data/opportunities'
import PreReview from '../millisa/PreReview'
import { useStore } from '../store/AppStore'
import NotFound from './NotFound'
import styles from './Detail.module.css'

export default function ChallengeDetail() {
  const { id } = useParams()
  const { profile, submissions, submit, markReviewed } = useStore()
  const [link, setLink] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  const c = challenges.find((x) => x.id === id)
  if (!c) return <NotFound />

  const mine = submissions.find((s) => s.challengeId === c.id)
  const role = opportunities.find((o) => o.challengeId === c.id)

  const send = (e: FormEvent) => {
    e.preventDefault()
    if (!/^https?:\/\/\S+\.\S+/.test(link.trim())) {
      setError('Paste a full link that starts with https://, for example a GitHub repo or a Figma file.')
      return
    }
    submit(c.id, link.trim(), note.trim())
    setEditing(false)
    setError('')
  }

  const showForm = profile && (!mine || editing)

  return (
    <div className={`wrap ${styles.page}`}>
      <Link to="/challenges" className="back-link">
        <ArrowLeft size={16} /> All challenges
      </Link>

      <header className={styles.head}>
        <p className={styles.kicker}>Challenge from {c.company}</p>
        <h1>{c.title}</h1>
        <ul className={styles.facts}>
          <li>
            <Gauge size={16} aria-hidden="true" /> {c.level}
          </li>
          <li>
            <Clock size={16} aria-hidden="true" /> About {c.hours} hours
          </li>
          <li>
            <CalendarClock size={16} aria-hidden="true" /> Closes {c.closes}
          </li>
          <li>
            <Users size={16} aria-hidden="true" /> {c.submissions + (mine ? 1 : 0)} submissions so far
          </li>
        </ul>
      </header>

      <div className={styles.layout}>
        <article className={styles.article}>
          <section>
            <h2>The problem</h2>
            <p>{c.brief}</p>
          </section>
          <section>
            <h2>What to send</h2>
            <ul className={styles.bullets}>
              {c.deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>How it is reviewed</h2>
            <ol className={styles.numbered}>
              <li>Someone from {c.company} reads every submission within seven days of the deadline.</li>
              <li>The best ones are paid and invited to talk.</li>
              <li>Every accepted submission becomes a badge on your profile that recruiters can search.</li>
            </ol>
          </section>
          <section>
            <h2>Skills it uses</h2>
            <div className={styles.tags}>
              {c.skills.map((s) => (
                <span key={s} className="tag">
                  {s}
                </span>
              ))}
            </div>
          </section>
        </article>

        <aside className={styles.aside}>
          <div className={styles.panel}>
            <p className={styles.muted}>Reward</p>
            <p className={styles.doneTitle}>{c.reward}</p>
          </div>

          <div className={styles.panel}>
            {!profile && (
              <>
                <p className={styles.muted}>You need a profile so {c.company} knows whose work they are reading.</p>
                <Link to="/start" className="btn btn-primary">
                  Create your profile to submit
                </Link>
              </>
            )}

            {showForm && (
              <form onSubmit={send} className={styles.form} noValidate>
                <label className="field">
                  <span>Link to your work</span>
                  <input
                    className="input"
                    type="url"
                    inputMode="url"
                    value={link}
                    onChange={(e) => {
                      setLink(e.target.value)
                      setError('')
                    }}
                    placeholder="https://github.com/you/project"
                  />
                </label>
                <label className="field">
                  <span>A note for the reviewer</span>
                  <textarea
                    className="input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What did you try, and what would you do with more time?"
                  />
                </label>
                {error && (
                  <p className={styles.muted} role="alert" style={{ color: 'var(--rose)' }}>
                    {error}
                  </p>
                )}
                <div className={styles.formActions}>
                  <button type="submit" className="btn btn-primary">
                    {mine ? 'Update submission' : 'Submit work'}
                  </button>
                  {mine && (
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            {profile && mine && !editing && (
              <>
                {mine.status === 'Accepted' ? (
                  <div className={styles.done}>
                    <BadgeCheck size={22} aria-hidden="true" />
                    <div>
                      <p className={styles.doneTitle}>Accepted</p>
                      <p className={styles.muted}>
                        {c.company}: {c.title.toLowerCase()} is now a badge on your profile.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className={styles.doneTitle}>Submitted on {mine.submittedOn}</p>
                    <p className={styles.muted}>
                      In review. You will hear from {c.company} within seven days of the deadline.
                    </p>
                  </div>
                )}
                <a href={mine.link} target="_blank" rel="noreferrer" className={styles.muted}>
                  {mine.link}
                </a>
                {mine.status === 'In review' && (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                      Change my submission
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => markReviewed(c.id)}>
                      Mark as accepted (demo)
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {showForm && <PreReview challenge={c} link={link} note={note} onUseNote={setNote} />}

          {role && (
            <div className={styles.callout}>
              <p className={styles.calloutTitle}>Linked role</p>
              <p>
                This challenge is the first round for the {role.title.toLowerCase()} role at {role.company} ({role.pay}).
              </p>
              <Link to={`/opportunities/${role.id}`} className="btn btn-accent btn-sm">
                See the role
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
