import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, MapPin, Wifi } from 'lucide-react'
import PageHead from '../components/PageHead'
import type { EventKind } from '../data/types'
import { googleLink } from '../lib/calendar'
import { eventTiming } from '../lib/events'
import { useStore } from '../store/AppStore'
import styles from './Events.module.css'

const kinds: (EventKind | 'All')[] = ['All', 'Hackathon', 'Demo day', 'Workshop', 'Hiring drive', 'Meetup']

export default function Events() {
  const { events, account, toggleRegistration } = useStore()
  const [kind, setKind] = useState<EventKind | 'All'>('All')
  const [online, setOnline] = useState(false)
  const shown = events.filter((e) => (kind === 'All' || e.kind === kind) && (!online || e.online))

  return (
    <>
      <PageHead
        title="Events"
        intro="Hackathons, demo days, workshops and hiring drives. Register once and it shows up in your HackShift calendar."
      />
      <div className="wrap">
        <div className={styles.filters}>
          <div className={styles.kinds} role="group" aria-label="Type of event">
            {kinds.map((k) => (
              <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
                {k}
              </button>
            ))}
          </div>
          <label className={styles.check}>
            <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} />
            Online only
          </label>
        </div>

        {shown.length === 0 ? (
          <p className={styles.none}>No events match. Try another type.</p>
        ) : (
          <ul className={styles.list}>
            {shown.map((e) => {
              const t = eventTiming(e)
              const going = !!account && e.registered.includes(account.id)
              return (
                <li key={e.id} className={`${styles.item} ${t.live ? styles.liveItem : ''}`}>
                  <div className={styles.date} aria-hidden="true">
                    <span>{t.start.toLocaleDateString('en-IN', { month: 'short' })}</span>
                    <strong>{t.start.getDate()}</strong>
                  </div>
                  <div className={styles.body}>
                    <p className={styles.meta}>
                      <span className={t.live ? styles.live : styles.when}>{t.label}</span>
                      {e.kind}, by {e.host}
                    </p>
                    <h2>{e.title}</h2>
                    <p className={styles.blurb}>{e.blurb}</p>
                    <p className={styles.facts}>
                      {e.online ? <Wifi size={15} aria-hidden="true" /> : <MapPin size={15} aria-hidden="true" />}
                      {e.online ? 'Online' : e.city}. {t.date}. {e.registered.length} going
                      {e.highlight && <span className={styles.highlight}> {e.highlight}</span>}
                    </p>
                  </div>
                  <div className={styles.side}>
                    {account ? (
                      <button
                        type="button"
                        className={`btn btn-sm ${going ? 'btn-ghost' : 'btn-primary'}`}
                        onClick={() => toggleRegistration(e.id)}
                        aria-pressed={going}
                      >
                        {going ? 'Cancel my spot' : t.live ? 'Join now' : 'Register'}
                      </button>
                    ) : (
                      <Link to={`/login?next=${encodeURIComponent('/events')}`} className="btn btn-primary btn-sm">
                        Sign in to register
                      </Link>
                    )}
                    {going && <span className={styles.going}>You are going</span>}
                    <a href={googleLink(e.title, t.start, Math.max(30, (t.end.getTime() - t.start.getTime()) / 60000), e.blurb)} target="_blank" rel="noreferrer" className={styles.gcal}>
                      <CalendarPlus size={14} aria-hidden="true" /> Add to Google Calendar
                    </a>
                    {e.link && (
                      <Link to={e.link} className={styles.gcal}>
                        See the details
                      </Link>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
