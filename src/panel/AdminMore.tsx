import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { EventKind, HackEvent } from '../data/types'
import { eventTiming } from '../lib/events'
import { overlap } from '../lib/match'
import { kindLabel, useStore, type Report } from '../store/AppStore'
import { Empty, PanelHead, Section, slug, Stats, timeAgo, panelStyles as styles } from './ui'
import own from './AdminPanel.module.css'

const targetLink: Record<Report['kind'], (id: string) => string> = {
  opportunities: (id) => `/opportunities/${id}`,
  challenges: (id) => `/challenges/${id}`,
  ventures: (id) => `/ventures/${id}`,
  mentors: (id) => `/mentors/${id}`,
  account: () => '/admin/accounts',
}

const kindWord: Record<Report['kind'], string> = {
  opportunities: 'Role',
  challenges: 'Challenge',
  ventures: 'Venture',
  mentors: 'Mentor',
  account: 'Account',
}

function Bars({ rows }: { rows: { label: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <ul className={own.bars}>
      {rows.map((r) => (
        <li key={r.label}>
          <span>{r.label}</span>
          <span className={own.bar}>
            <span style={{ width: `${(r.n / max) * 100}%` }} />
          </span>
          <span className="num">{r.n}</span>
        </li>
      ))}
    </ul>
  )
}

export function Reports() {
  const { reports, accountById, resolveReport, setContentStatus, setAccountStatus } = useStore()
  const [tab, setTab] = useState<'open' | 'closed'>('open')
  const shown = reports.filter((r) => (tab === 'open' ? r.status === 'open' : r.status !== 'open'))

  const hide = (r: Report) => {
    if (r.kind === 'account') {
      setAccountStatus(r.targetId, 'suspended')
      resolveReport(r.id, 'resolved', 'Account suspended')
    } else {
      setContentStatus(r.kind, r.targetId, 'hidden')
      resolveReport(r.id, 'resolved', `${kindWord[r.kind]} hidden from HackShift`)
    }
  }

  return (
    <>
      <PanelHead title="Reports" intro="Things people flagged. Check each one, then hide it or close the report. The person who reported is never named to the other side." />
      <div className={styles.tabs}>
        <button type="button" aria-pressed={tab === 'open'} onClick={() => setTab('open')}>
          Open ({reports.filter((r) => r.status === 'open').length})
        </button>
        <button type="button" aria-pressed={tab === 'closed'} onClick={() => setTab('closed')}>
          Closed ({reports.filter((r) => r.status !== 'open').length})
        </button>
      </div>
      {shown.length === 0 ? (
        <Empty title={tab === 'open' ? 'No open reports' : 'Nothing closed yet'} />
      ) : (
        <ul className={styles.list}>
          {shown.map((r) => (
            <li key={r.id} className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <p className={own.type}>
                    {kindWord[r.kind]}: {r.reason}
                  </p>
                  <Link to={targetLink[r.kind](r.targetId)} className={styles.cardTitle}>
                    {r.label}
                  </Link>
                  <p className={styles.cardSub}>
                    Reported by {accountById(r.by)?.name ?? 'a visitor'}, {timeAgo(r.at)}
                  </p>
                </div>
              </div>
              {r.note && <blockquote className={styles.quote}>{r.note}</blockquote>}
              {r.status === 'open' ? (
                <div className={styles.cardFoot}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => hide(r)}>
                    {r.kind === 'account' ? 'Suspend the account' : `Hide this ${kindWord[r.kind].toLowerCase()}`}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => resolveReport(r.id, 'dismissed', 'No action needed')}>
                    No action needed
                  </button>
                </div>
              ) : (
                <p className={styles.cardSub}>{r.resolution}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function MillisaMonitor() {
  const { data, accountById, updateSettings } = useStore()
  const [limit, setLimit] = useState(String(data.settings.millisaDailyLimit))
  const day = new Date().toISOString().slice(0, 10)
  const weekAgo = Date.now() - 7 * 86400000
  const week = data.usage.filter((u) => new Date(u.at).getTime() >= weekAgo)
  const todayRows = data.usage.filter((u) => u.at.slice(0, 10) === day)
  const failed = week.filter((u) => !u.ok)
  const avg = week.filter((u) => u.ok).reduce((n, u, _, all) => n + u.ms / all.length, 0)
  const byUser = Object.entries(
    week.reduce<Record<string, number>>((acc, u) => {
      acc[u.accountId] = (acc[u.accountId] ?? 0) + 1
      return acc
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const tasks = data.tasks
  const failWords: Record<string, string> = {
    busy: 'Too busy',
    offline: 'No internet',
    'bad-key': 'Key not accepted',
    failed: 'No answer',
    blocked: 'Blocked',
    limit: 'Over the daily limit',
    signin: 'Not signed in',
  }

  return (
    <>
      <PanelHead title="Millisa" intro="How much Millisa is used, what fails, and the limits for everyone. Usage is counted per request in this browser." />
      <Stats
        items={[
          { label: 'Requests today', value: todayRows.length },
          { label: 'Requests this week', value: week.length },
          { label: 'Failed this week', value: failed.length, hot: failed.length > 0 },
          { label: 'Average answer time', value: avg ? `${(avg / 1000).toFixed(1)}s` : 'None' },
          { label: 'Waiting for approval', value: tasks.filter((t) => t.status === 'waiting').length },
        ]}
      />
      <div className={styles.two}>
        <Section title="Tasks Millisa prepared">
          <Bars
            rows={[
              { label: 'Approved', n: tasks.filter((t) => t.status === 'done').length },
              { label: 'Waiting', n: tasks.filter((t) => t.status === 'waiting').length },
              { label: 'Declined', n: tasks.filter((t) => t.status === 'declined').length },
              { label: 'Failed', n: tasks.filter((t) => t.status === 'failed').length },
            ]}
          />
        </Section>
        <Section title="Who uses it most this week">
          {byUser.length === 0 ? (
            <Empty title="No use yet" />
          ) : (
            <ul className={styles.feed}>
              {byUser.map(([id, n]) => (
                <li key={id}>
                  <span>
                    {accountById(id)?.name ?? 'Visitors without an account'}
                    {accountById(id) && <span className={styles.cellSub}> {kindLabel[accountById(id)!.kind]}</span>}
                  </span>
                  <span className="num">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
      <Section title="Recent failures">
        {failed.length === 0 ? (
          <Empty title="No failures this week" />
        ) : (
          <ul className={styles.feed}>
            {failed.slice(0, 10).map((u, i) => (
              <li key={`${u.at}-${i}`}>
                <span>
                  {failWords[u.kind ?? 'failed'] ?? u.kind}
                  <span className={styles.cellSub}> {accountById(u.accountId)?.name ?? 'Visitor'}</span>
                </span>
                <time dateTime={u.at}>{timeAgo(u.at)}</time>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Limits">
        <div className={styles.card}>
          <label className="field">
            <span>Requests each person can make in a day</span>
            <div className={styles.toolbar}>
              <input className={`input ${own.limitInput}`} type="number" min={5} max={1000} value={limit} onChange={(e) => setLimit(e.target.value)} />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => updateSettings({ millisaDailyLimit: Math.max(5, Math.min(1000, Math.round(Number(limit)) || 80)) })}
              >
                Save limit
              </button>
            </div>
            <small>The super admin has no limit. One answer can take two or three requests when Millisa looks things up.</small>
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={data.settings.guestMillisa} onChange={(e) => updateSettings({ guestMillisa: e.target.checked })} />
            Let visitors without an account ask Millisa questions
          </label>
          <p className={styles.cardSub}>Check spending on your AI provider’s billing page. HackShift only counts requests.</p>
        </div>
      </Section>
    </>
  )
}

export function Analytics() {
  const { data } = useStore()
  const apps = data.applications
  const stage = (s: string[]) => apps.filter((a) => s.includes(a.status)).length
  const matched = apps.filter((a) => {
    const o = data.opportunities.find((x) => x.id === a.opportunityId)
    const who = data.accounts.find((x) => x.id === a.accountId)
    return o && who && overlap(o.skills, who.profile.skills).length > 0
  }).length
  const rated = data.bookings.filter((b) => b.rating)
  const avgRating = rated.length ? rated.reduce((n, b) => n + (b.rating ?? 0), 0) / rated.length : 0

  return (
    <>
      <PanelHead title="Analytics" intro="Outcomes across HackShift: how far people get, and whether matching works." />
      <Stats
        items={[
          { label: 'Applications', value: apps.length },
          { label: 'Reached interview', value: stage(['Interview', 'Offer', 'Hired']) },
          { label: 'Offers and hires', value: stage(['Offer', 'Hired']) },
          { label: 'Applied with a matching skill', value: apps.length ? `${Math.round((matched / apps.length) * 100)}%` : 'None' },
          { label: 'Average session rating', value: avgRating ? avgRating.toFixed(1) : 'None' },
        ]}
      />
      <div className={styles.two}>
        <Section title="Application funnel">
          <Bars
            rows={[
              { label: 'Applied', n: apps.length },
              { label: 'Reviewed', n: stage(['Under review', 'Shortlisted', 'Interview', 'Offer', 'Hired']) },
              { label: 'Shortlisted', n: stage(['Shortlisted', 'Interview', 'Offer', 'Hired']) },
              { label: 'Interview', n: stage(['Interview', 'Offer', 'Hired']) },
              { label: 'Offer', n: stage(['Offer', 'Hired']) },
              { label: 'Hired', n: stage(['Hired']) },
            ]}
          />
        </Section>
        <Section title="Challenge work">
          <Bars
            rows={[
              { label: 'Submitted', n: data.submissions.length },
              { label: 'Accepted', n: data.submissions.filter((s) => s.status === 'Accepted').length },
              { label: 'Not selected', n: data.submissions.filter((s) => s.status === 'Not selected').length },
              { label: 'In review', n: data.submissions.filter((s) => s.status === 'In review').length },
            ]}
          />
        </Section>
        <Section title="Mentor sessions">
          <Bars
            rows={[
              { label: 'Asked for', n: data.bookings.length },
              { label: 'Confirmed', n: data.bookings.filter((b) => b.status === 'Confirmed').length },
              { label: 'Done', n: data.bookings.filter((b) => b.status === 'Done').length },
              { label: 'Declined', n: data.bookings.filter((b) => b.status === 'Declined').length },
            ]}
          />
        </Section>
        <Section title="Ventures by stage">
          <Bars rows={['Idea', 'Validated', 'MVP', 'Funded'].map((s) => ({ label: s, n: data.ventures.filter((v) => v.stage === s).length }))} />
        </Section>
      </div>
    </>
  )
}

const eventKinds: EventKind[] = ['Hackathon', 'Demo day', 'Workshop', 'Hiring drive', 'Meetup']

function blankEvent(): HackEvent {
  const d = new Date(Date.now() + 7 * 86400000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return {
    id: '',
    title: '',
    kind: 'Workshop',
    host: 'HackShift',
    city: '',
    online: false,
    starts: `${day}T18:00`,
    ends: `${day}T20:00`,
    blurb: '',
    featured: true,
    registered: [],
  }
}

function EventForm({ initial, onDone }: { initial: HackEvent; onDone: () => void }) {
  const { saveEvent } = useStore()
  const [e, setE] = useState<HackEvent>(initial)
  const [error, setError] = useState('')
  const set = (patch: Partial<HackEvent>) => {
    setE((x) => ({ ...x, ...patch }))
    setError('')
  }

  const save = (ev: FormEvent) => {
    ev.preventDefault()
    if (!e.title.trim() || !e.host.trim() || e.blurb.trim().length < 20 || (!e.online && !e.city.trim())) {
      setError('Add a title, the host, a city (or mark it online) and a description of a sentence or two.')
      return
    }
    if (new Date(e.ends) <= new Date(e.starts)) {
      setError('The event has to end after it starts.')
      return
    }
    saveEvent({
      ...e,
      id: e.id || slug(e.title),
      title: e.title.trim(),
      host: e.host.trim(),
      city: e.online ? 'Online' : e.city.trim(),
      blurb: e.blurb.trim(),
      highlight: e.highlight?.trim() || undefined,
      link: e.link?.trim() || undefined,
    })
    onDone()
  }

  return (
    <form className={styles.form} onSubmit={save} noValidate>
      <div className={styles.formRow}>
        <label className="field">
          <span>Title</span>
          <input className="input" value={e.title} onChange={(x) => set({ title: x.target.value })} />
        </label>
        <label className="field">
          <span>Type</span>
          <select className="input" value={e.kind} onChange={(x) => set({ kind: x.target.value as EventKind })}>
            {eventKinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.formRow3}>
        <label className="field">
          <span>Hosted by</span>
          <input className="input" value={e.host} onChange={(x) => set({ host: x.target.value })} />
        </label>
        <label className="field">
          <span>Starts</span>
          <input className="input" type="datetime-local" value={e.starts} onChange={(x) => set({ starts: x.target.value })} />
        </label>
        <label className="field">
          <span>Ends</span>
          <input className="input" type="datetime-local" value={e.ends} onChange={(x) => set({ ends: x.target.value })} />
        </label>
      </div>
      <div className={styles.formRow}>
        <label className="field">
          <span>City</span>
          <input className="input" value={e.online ? 'Online' : e.city} disabled={e.online} onChange={(x) => set({ city: x.target.value })} />
        </label>
        <label className="field">
          <span>Highlight on the banner</span>
          <input className="input" value={e.highlight ?? ''} onChange={(x) => set({ highlight: x.target.value })} placeholder="₹1 lakh in prizes, or 20 pitch slots" />
        </label>
      </div>
      <label className="field">
        <span>What happens there</span>
        <textarea className="input" value={e.blurb} onChange={(x) => set({ blurb: x.target.value })} />
      </label>
      <label className="field">
        <span>Link on HackShift (optional)</span>
        <input className="input" value={e.link ?? ''} onChange={(x) => set({ link: x.target.value })} placeholder="/challenges/tapri-checkout" />
      </label>
      <div className={styles.toolbar}>
        <label className={styles.check}>
          <input type="checkbox" checked={e.online} onChange={(x) => set({ online: x.target.checked })} />
          Online event
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={e.featured} onChange={(x) => set({ featured: x.target.checked })} />
          Show in the homepage banner
        </label>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.formActions}>
        <button type="submit" className="btn btn-primary btn-sm">
          {initial.id ? 'Save event' : 'Add event'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export function AdminEvents() {
  const { data, saveEvent, deleteEvent } = useStore()
  const [editing, setEditing] = useState<HackEvent | null>(null)
  const list = [...data.events].sort((a, b) => (a.starts < b.starts ? -1 : 1))
  const ended = (e: HackEvent) => new Date(e.ends).getTime() < Date.now()

  return (
    <>
      <PanelHead title="Events" intro="Events marked for the banner slide across the top of the homepage, soonest first. Past events drop off on their own.">
        {!editing && (
          <button type="button" className="btn btn-accent btn-sm" onClick={() => setEditing(blankEvent())}>
            Add an event
          </button>
        )}
      </PanelHead>
      {editing && <EventForm key={editing.id || 'new'} initial={editing} onDone={() => setEditing(null)} />}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Event</th>
              <th>When</th>
              <th>Going</th>
              <th>In banner</th>
              <th>Shown</th>
              <th className={styles.actions}>
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => {
              const t = eventTiming(e)
              return (
                <tr key={e.id}>
                  <td>
                    <p className={styles.cellTitle}>{e.title}</p>
                    <p className={styles.cellSub}>
                      {e.kind} by {e.host}, {e.online ? 'online' : e.city}
                    </p>
                  </td>
                  <td>
                    {t.date}
                    <p className={styles.cellSub}>{ended(e) ? 'Ended' : t.label}</p>
                  </td>
                  <td className="num">{e.registered.length}</td>
                  <td>
                    <input type="checkbox" checked={e.featured} onChange={(x) => saveEvent({ ...e, featured: x.target.checked })} aria-label={`Show ${e.title} in the banner`} />
                  </td>
                  <td>
                    <input type="checkbox" checked={!e.hidden} onChange={(x) => saveEvent({ ...e, hidden: !x.target.checked })} aria-label={`Show ${e.title} on HackShift`} />
                  </td>
                  <td className={styles.actions}>
                    <span className={styles.rowActions}>
                      <button type="button" className={styles.link} onClick={() => setEditing(e)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`${styles.link} ${styles.danger}`}
                        onClick={() => window.confirm(`Delete ${e.title}?`) && deleteEvent(e.id)}
                      >
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
    </>
  )
}
