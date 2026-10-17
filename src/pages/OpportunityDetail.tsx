import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, BookmarkCheck, CalendarClock, CheckCircle2, MapPin, Wallet, Zap } from 'lucide-react'
import { challenges } from '../data/challenges'
import { opportunities } from '../data/opportunities'
import { overlap } from '../lib/match'
import DraftNote from '../millisa/DraftNote'
import FitCheck from '../millisa/FitCheck'
import { useStore } from '../store/AppStore'
import NotFound from './NotFound'
import styles from './Detail.module.css'

export default function OpportunityDetail() {
  const { id } = useParams()
  const { profile, saved, toggleSaved, applications, apply, submissions } = useStore()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')

  const o = opportunities.find((x) => x.id === id)
  if (!o) return <NotFound />

  const challenge = challenges.find((c) => c.id === o.challengeId)
  const challengeDone = challenge && submissions.some((s) => s.challengeId === challenge.id)
  const application = applications.find((a) => a.opportunityId === o.id)
  const hits = profile ? overlap(o.skills, profile.skills) : []
  const isSaved = saved.includes(o.id)

  const send = (e: FormEvent) => {
    e.preventDefault()
    apply(o.id, note.trim())
    setOpen(false)
  }

  return (
    <div className={`wrap ${styles.page}`}>
      <Link to="/opportunities" className="back-link">
        <ArrowLeft size={16} /> All opportunities
      </Link>

      <header className={styles.head}>
        <p className={styles.kicker}>
          {o.kind} at {o.company}
        </p>
        <h1>{o.title}</h1>
        <ul className={styles.facts}>
          <li>
            <MapPin size={16} aria-hidden="true" /> {o.city}
            {o.remote && ', remote ok'}
          </li>
          <li>
            <Wallet size={16} aria-hidden="true" /> <span className="num">{o.pay}</span>
          </li>
          <li>
            <CalendarClock size={16} aria-hidden="true" /> {o.closes === 'Open' ? 'No deadline' : `Closes ${o.closes}`}
          </li>
        </ul>
      </header>

      <div className={styles.layout}>
        <article className={styles.article}>
          <section>
            <h2>About {o.company}</h2>
            <p>{o.about}</p>
          </section>
          <section>
            <h2>What you will do</h2>
            <ul className={styles.bullets}>
              {o.work.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Skills they are looking for</h2>
            <div className={styles.tags}>
              {o.skills.map((s) => (
                <span key={s} className={`tag ${hits.includes(s) ? 'tag-leaf' : ''}`}>
                  {hits.includes(s) && <CheckCircle2 size={14} aria-hidden="true" />}
                  {s}
                </span>
              ))}
            </div>
            {profile && (
              <p className={styles.muted}>
                You have {hits.length} of the {o.skills.length} skills listed.
              </p>
            )}
          </section>
        </article>

        <aside className={styles.aside}>
          <div className={styles.panel}>
            {application ? (
              <div className={styles.done}>
                <CheckCircle2 size={22} aria-hidden="true" />
                <div>
                  <p className={styles.doneTitle}>Application sent</p>
                  <p className={styles.muted}>
                    Sent on {application.appliedOn}. {o.company} usually replies within a week.
                  </p>
                </div>
              </div>
            ) : open ? (
              <form onSubmit={send} className={styles.form}>
                <label className="field">
                  <span>Why you, in a few lines</span>
                  <textarea
                    className="input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={`What have you made that ${o.company} should look at?`}
                    autoFocus
                  />
                  <small>Your profile and any challenge badges are attached for you.</small>
                </label>
                <DraftNote opportunity={o} challenge={challenge} onText={setNote} />
                <div className={styles.formActions}>
                  <button type="submit" className="btn btn-primary">
                    Send application
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : profile ? (
              <button className="btn btn-primary" onClick={() => setOpen(true)}>
                Apply as {profile.name.split(' ')[0]}
              </button>
            ) : (
              <>
                <p className={styles.muted}>Create a profile once and apply anywhere on HackShift with a short note.</p>
                <Link to="/start" className="btn btn-primary">
                  Create your profile to apply
                </Link>
              </>
            )}
            <button className="btn btn-ghost" onClick={() => toggleSaved(o.id)} aria-pressed={isSaved}>
              {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              {isSaved ? 'Saved' : 'Save for later'}
            </button>
          </div>

          <FitCheck opportunity={o} challenge={challenge} />

          {challenge && (
            <div className={styles.callout}>
              <p className={styles.calloutTitle}>
                <Zap size={16} aria-hidden="true" /> Skip the queue
              </p>
              <p>
                {challengeDone
                  ? 'You have submitted the challenge for this role. Your application goes to the top of the pile.'
                  : `Finish the "${challenge.title}" challenge and ${o.company} reads your application first.`}
              </p>
              {!challengeDone && (
                <Link to={`/challenges/${challenge.id}`} className="btn btn-accent btn-sm">
                  See the challenge
                </Link>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
