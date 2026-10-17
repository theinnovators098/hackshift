import { Link } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import { googleLink, parseSlot } from '../lib/calendar'
import { useStore } from '../store/AppStore'
import { Empty, PanelHead, Status } from './ui'
import own from './Calendar.module.css'

interface Event {
  id: string
  at: Date
  minutes: number
  title: string
  detail: string
  status: string
  link: string
}

export default function Calendar() {
  const { account, data, accountById } = useStore()
  if (!account) return null

  const events: Event[] = []
  const add = (e: Event | null) => e && !Number.isNaN(e.at.getTime()) && events.push(e)

  for (const a of data.applications) {
    if (!a.interview) continue
    const o = data.opportunities.find((x) => x.id === a.opportunityId)
    if (!o) continue
    const mine = a.accountId === account.id
    const hiring = o.ownerId === account.id
    if (!mine && !hiring) continue
    add({
      id: `i-${a.id}`,
      at: new Date(a.interview.when),
      minutes: 45,
      title: mine ? `Interview with ${o.company}` : `Interview: ${accountById(a.accountId)?.name}`,
      detail: `${o.title}. ${a.interview.mode}: ${a.interview.where}`,
      status: a.interview.status,
      link: mine ? '/panel/applications' : '/panel/applicants',
    })
  }

  for (const b of data.bookings) {
    if (b.status === 'Declined') continue
    const m = data.mentors.find((x) => x.id === b.mentorId)
    const mine = b.accountId === account.id
    const mentoring = account.mentorId === b.mentorId
    if (!mine && !mentoring) continue
    const at = parseSlot(b.day, b.time)
    if (!at) continue
    add({
      id: `b-${b.id}`,
      at,
      minutes: 30,
      title: mine ? `Mentor session with ${m?.name}` : `Session with ${accountById(b.accountId)?.name}`,
      detail: b.topic,
      status: b.status,
      link: '/panel/sessions',
    })
  }

  for (const ev of data.events) {
    if (!ev.registered.includes(account.id) || ev.hidden) continue
    const start = new Date(ev.starts)
    add({
      id: `e-${ev.id}`,
      at: start,
      minutes: Math.max(30, Math.round((new Date(ev.ends).getTime() - start.getTime()) / 60000)),
      title: ev.title,
      detail: `${ev.kind} by ${ev.host}. ${ev.online ? 'Online' : ev.city}`,
      status: 'Going',
      link: '/events',
    })
  }

  events.sort((x, y) => x.at.getTime() - y.at.getTime())
  const now = Date.now()
  const soon = events.filter((e) => e.at.getTime() >= now - 3600000)
  const past = events.filter((e) => e.at.getTime() < now - 3600000).reverse().slice(0, 10)

  const row = (e: Event) => (
    <li key={e.id} className={own.event}>
      <div className={own.date} aria-hidden="true">
        <span>{e.at.toLocaleDateString('en-IN', { month: 'short' })}</span>
        <strong>{e.at.getDate()}</strong>
      </div>
      <div className={own.body}>
        <Link to={e.link} className={own.title}>
          {e.title}
        </Link>
        <p className={own.time}>
          {e.at.toLocaleString('en-IN', { weekday: 'long', hour: 'numeric', minute: '2-digit' })}, {e.minutes} minutes
        </p>
        <p className={own.detail}>{e.detail}</p>
      </div>
      <div className={own.side}>
        <Status value={e.status} />
        <a href={googleLink(e.title, e.at, e.minutes, e.detail)} target="_blank" rel="noreferrer" className={own.gcal}>
          <CalendarPlus size={14} aria-hidden="true" /> Google Calendar
        </a>
      </div>
    </li>
  )

  return (
    <>
      <PanelHead title="Calendar" intro="Interviews, mentor sessions and events you registered for, in your local time." />
      {soon.length === 0 ? (
        <Empty title="Nothing coming up">Interviews you schedule or accept, and mentor sessions you book, show up here.</Empty>
      ) : (
        <ul className={own.list}>{soon.map(row)}</ul>
      )}
      {past.length > 0 && (
        <>
          <h2 className={own.pastTitle}>Earlier</h2>
          <ul className={`${own.list} ${own.past}`}>{past.map(row)}</ul>
        </>
      )}
    </>
  )
}
