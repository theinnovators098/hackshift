import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Briefcase, CalendarCheck, Languages, MapPin } from 'lucide-react'
import { mentors } from '../data/people'
import { useStore } from '../store/AppStore'
import NotFound from './NotFound'
import styles from './Detail.module.css'
import own from './MentorDetail.module.css'

const weekdaySlots = ['7:00 pm', '7:30 pm', '8:00 pm', '8:30 pm']
const saturdaySlots = ['10:00 am', '10:30 am', '11:30 am', '4:00 pm']

function upcomingDays(count: number) {
  const days: { label: string; slots: string[] }[] = []
  const d = new Date()
  while (days.length < count) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow === 0) continue
    days.push({
      label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      slots: dow === 6 ? saturdaySlots : weekdaySlots,
    })
  }
  return days
}

export default function MentorDetail() {
  const { id } = useParams()
  const { profile, bookings, book, cancelBooking } = useStore()
  const days = useMemo(() => upcomingDays(5), [])
  const [day, setDay] = useState(days[0].label)
  const [time, setTime] = useState('')
  const [topic, setTopic] = useState('')
  const [error, setError] = useState('')

  const m = mentors.find((x) => x.id === id)
  if (!m) return <NotFound />

  const mine = bookings.filter((b) => b.mentorId === m.id)
  const taken = (d: string, t: string) => bookings.some((b) => b.mentorId === m.id && b.day === d && b.time === t)
  const slots = days.find((d) => d.label === day)?.slots ?? []
  const first = m.name.split(' ')[0]

  const confirm = (e: FormEvent) => {
    e.preventDefault()
    if (!time) {
      setError('Pick a time slot first.')
      return
    }
    if (topic.trim().length < 10) {
      setError(`Tell ${first} what you want to talk about, in a sentence or two.`)
      return
    }
    book({ mentorId: m.id, day, time, topic: topic.trim() })
    setTime('')
    setTopic('')
    setError('')
  }

  return (
    <div className={`wrap ${styles.page}`}>
      <Link to="/mentors" className="back-link">
        <ArrowLeft size={16} /> All mentors
      </Link>

      <header className={`${styles.head} ${own.head}`}>
        <span className={own.avatar} aria-hidden="true">
          {m.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </span>
        <div>
          <h1>{m.name}</h1>
          <ul className={styles.facts}>
            <li>
              <Briefcase size={16} aria-hidden="true" /> {m.title} at {m.company}
            </li>
            <li>
              <MapPin size={16} aria-hidden="true" /> {m.city}
            </li>
            <li>
              <Languages size={16} aria-hidden="true" /> {m.languages.join(', ')}
            </li>
          </ul>
        </div>
      </header>

      <div className={styles.layout}>
        <article className={styles.article}>
          <section>
            <h2>About</h2>
            <p>{m.bio}</p>
            <p className={styles.muted}>
              {m.yearsExp} years of experience. {m.sessions} sessions given on HackShift.
            </p>
          </section>
          <section>
            <h2>Ask {first} about</h2>
            <div className={styles.tags}>
              {m.expertise.map((e) => (
                <span key={e} className="tag tag-marigold">
                  {e}
                </span>
              ))}
            </div>
          </section>
          <section>
            <h2>Getting the most out of 30 minutes</h2>
            <ul className={styles.bullets}>
              <li>Come with one question, not ten. Write it down before the call.</li>
              <li>Share a link to your work, deck or resume when you book.</li>
              <li>Send a short thank-you with what you will do next. Mentors remember who follows up.</li>
            </ul>
          </section>
        </article>

        <aside className={styles.aside}>
          <div className={styles.panel}>
            <p className={styles.doneTitle}>Book 30 minutes</p>
            {!profile ? (
              <>
                <p className={styles.muted}>
                  {first} reads your profile before the call, so create one first.
                </p>
                <Link to="/start" className="btn btn-primary">
                  Create your profile
                </Link>
              </>
            ) : (
              <form className={styles.form} onSubmit={confirm} noValidate>
                <div className={own.days} role="group" aria-label="Day">
                  {days.map((d) => (
                    <button
                      type="button"
                      key={d.label}
                      className={own.day}
                      aria-pressed={day === d.label}
                      onClick={() => {
                        setDay(d.label)
                        setTime('')
                      }}
                    >
                      {d.label.split(' ')[0].replace(',', '')}
                      <strong>{d.label.split(' ')[1]}</strong>
                    </button>
                  ))}
                </div>
                <div className={own.slots} role="group" aria-label="Time">
                  {slots.map((t) => {
                    const busy = taken(day, t)
                    return (
                      <button
                        type="button"
                        key={t}
                        className="chip"
                        aria-pressed={time === t}
                        disabled={busy}
                        onClick={() => {
                          setTime(t)
                          setError('')
                        }}
                      >
                        {busy ? `${t} (booked)` : t}
                      </button>
                    )
                  })}
                </div>
                <label className="field">
                  <span>What do you want to talk about?</span>
                  <textarea
                    className="input"
                    value={topic}
                    onChange={(e) => {
                      setTopic(e.target.value)
                      setError('')
                    }}
                    placeholder="For example: I have two internship offers and cannot decide between them"
                  />
                </label>
                {error && (
                  <p className={styles.muted} role="alert" style={{ color: 'var(--rose)' }}>
                    {error}
                  </p>
                )}
                <button type="submit" className="btn btn-primary">
                  {time ? `Book ${day}, ${time}` : 'Book session'}
                </button>
              </form>
            )}
          </div>

          {mine.length > 0 && (
            <div className={styles.panel}>
              <p className={styles.doneTitle}>Your sessions with {first}</p>
              <ul className={own.booked}>
                {mine.map((b) => (
                  <li key={`${b.day}-${b.time}`}>
                    <CalendarCheck size={18} aria-hidden="true" />
                    <div>
                      <p>
                        <strong>
                          {b.day}, {b.time}
                        </strong>
                      </p>
                      <p className={styles.muted}>{b.topic}</p>
                      <button className={own.cancel} onClick={() => cancelBooking(b)}>
                        Cancel this session
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
