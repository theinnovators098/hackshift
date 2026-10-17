import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, Pause, Play, Wifi } from 'lucide-react'
import { eventTiming } from '../lib/events'
import { useStore } from '../store/AppStore'
import styles from './EventBanner.module.css'

const ROTATE_MS = 6500

export default function EventBanner() {
  const { events, account, toggleRegistration } = useStore()
  const slides = events.filter((e) => e.featured)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  })
  const [hovering, setHovering] = useState(false)
  const region = useRef<HTMLElement>(null)

  const count = slides.length
  const current = count ? index % count : 0

  useEffect(() => {
    if (paused || hovering || count < 2) return
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % count), ROTATE_MS)
    return () => window.clearTimeout(id)
  }, [current, paused, hovering, count])

  if (count === 0) return null

  const go = (i: number) => setIndex(((i % count) + count) % count)
  const e = slides[current]
  const t = eventTiming(e)
  const going = !!account && e.registered.includes(account.id)

  return (
    <section
      ref={region}
      className={styles.banner}
      aria-roledescription="carousel"
      aria-label="Events on HackShift"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={(ev) => {
        if (!region.current?.contains(ev.relatedTarget as Node)) setHovering(false)
      }}
      onKeyDown={(ev) => {
        if (ev.key === 'ArrowRight') go(current + 1)
        if (ev.key === 'ArrowLeft') go(current - 1)
      }}
    >
      <div className={`wrap ${styles.inner}`}>
        <article
          key={e.id}
          className={styles.slide}
          aria-roledescription="slide"
          aria-label={`${current + 1} of ${count}: ${e.title}`}
        >
          <div className={styles.copy}>
            <p className={styles.meta}>
              <span className={`${styles.when} ${t.live ? styles.live : ''}`}>
                {t.live && <span className={styles.pulse} aria-hidden="true" />}
                {t.label}
              </span>
              <span>{e.kind}</span>
              <span>by {e.host}</span>
            </p>
            <h2 className={styles.title}>{e.title}</h2>
            {e.highlight && <p className={styles.highlight}>{e.highlight}</p>}
            <p className={styles.blurb}>{e.blurb}</p>
            <div className={styles.actions}>
              {account ? (
                <button type="button" className={`btn ${going ? styles.goingBtn : 'btn-accent'}`} onClick={() => toggleRegistration(e.id)} aria-pressed={going}>
                  {going ? 'You are going' : t.live ? 'Join now' : 'Register'}
                </button>
              ) : (
                <Link to={`/login?next=${encodeURIComponent('/events')}`} className="btn btn-accent">
                  Sign in to register
                </Link>
              )}
              {e.link ? (
                <Link to={e.link} className={styles.more}>
                  See the details
                </Link>
              ) : (
                <Link to="/events" className={styles.more}>
                  All events
                </Link>
              )}
            </div>
          </div>
          <div className={styles.date} aria-hidden="true">
            <span className={styles.month}>{t.start.toLocaleDateString('en-IN', { month: 'short' })}</span>
            <span className={styles.day}>{t.start.getDate()}</span>
            <span className={styles.place}>
              {e.online ? <Wifi size={14} /> : <MapPin size={14} />} {e.online ? 'Online' : e.city}
            </span>
            <span className={styles.time}>{t.date}</span>
            <span className={styles.count}>
              {e.registered.length} {e.registered.length === 1 ? 'person' : 'people'} going
            </span>
          </div>
        </article>

        {count > 1 && (
          <div className={styles.controls}>
            <div className={styles.dots} role="group" aria-label="Choose an event">
              {slides.map((s, i) => (
                <button key={s.id} type="button" aria-label={`Show ${s.title}`} aria-current={i === current} onClick={() => go(i)}>
                  <span className={i === current && !paused && !hovering ? styles.running : undefined} />
                </button>
              ))}
            </div>
            <div className={styles.arrows}>
              <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play the slides' : 'Pause the slides'}>
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button type="button" onClick={() => go(current - 1)} aria-label="Previous event">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => go(current + 1)} aria-label="Next event">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
