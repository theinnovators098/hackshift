import { useState, type FormEvent } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { CalendarClock, CalendarDays, LayoutDashboard, UserCog, UserRound } from 'lucide-react'
import { defaultSaturdaySlots, defaultWeekdaySlots } from '../pages/MentorDetail'
import { useStore, type Booking } from '../store/AppStore'
import AccountSettings from './AccountSettings'
import PanelShell from './PanelShell'
import { commaList, Empty, PanelHead, Section, Stats, Status, panelStyles as styles } from './ui'

const weekdayOptions = ['6:00 pm', '6:30 pm', '7:00 pm', '7:30 pm', '8:00 pm', '8:30 pm', '9:00 pm', '9:30 pm']
const saturdayOptions = ['9:00 am', '10:00 am', '10:30 am', '11:30 am', '12:00 pm', '3:00 pm', '4:00 pm', '5:00 pm']
const languageOptions = ['English', 'Hindi', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Marathi', 'Odia', 'Punjabi', 'Tamil', 'Telugu', 'Urdu']

function useMentor() {
  const store = useStore()
  const me = store.account!
  const mentor = store.data.mentors.find((m) => m.id === me.mentorId)
  const bookings = store.data.bookings.filter((b) => b.mentorId === me.mentorId)
  return { ...store, me, mentor, bookings }
}

function PendingNote() {
  const { mentor } = useMentor()
  if (!mentor || (mentor.status ?? 'live') === 'live') return null
  return (
    <p className="notice">
      {mentor.status === 'pending'
        ? 'Your mentor profile is waiting for the HackShift team to approve it. People can book you once it is live.'
        : 'Your mentor profile is hidden right now, so nobody can book you. Write to the HackShift team to restore it.'}
    </p>
  )
}

function Overview() {
  const { me, mentor, bookings, accountById } = useMentor()
  const requests = bookings.filter((b) => b.status === 'Requested')
  const upcoming = bookings.filter((b) => b.status === 'Confirmed')
  return (
    <>
      <PanelHead title={`Hello, ${me.name.split(' ')[0]}`} intro="Requests waiting for you and your next sessions.">
        {mentor && (
          <Link to={`/mentors/${mentor.id}`} className="btn btn-ghost btn-sm">
            See my public page
          </Link>
        )}
      </PanelHead>
      <PendingNote />
      <Stats
        items={[
          { label: 'Requests waiting', value: requests.length, to: '/panel/sessions', hot: requests.length > 0 },
          { label: 'Upcoming sessions', value: upcoming.length, to: '/panel/sessions' },
          { label: 'Sessions given', value: mentor?.sessions ?? 0 },
        ]}
      />
      <Section title="Coming up" link={{ to: '/panel/sessions', label: 'All sessions' }}>
        {upcoming.length === 0 ? (
          <Empty title="Nothing confirmed yet">Accept a request and it shows up here.</Empty>
        ) : (
          <ul className={styles.feed}>
            {upcoming.map((b) => (
              <li key={b.id}>
                <span>
                  <strong>{accountById(b.accountId)?.name}</strong>: {b.topic}
                </span>
                <time>
                  {b.day}, {b.time}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}

function SessionCard({ b }: { b: Booking }) {
  const { accountById, setBookingStatus } = useStore()
  const [note, setNote] = useState(b.mentorNote ?? '')
  const [writing, setWriting] = useState(false)
  const who = accountById(b.accountId)

  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <p className={styles.cardTitle}>{who?.name ?? 'Former member'}</p>
          <p className={styles.cardSub}>
            {b.day}, {b.time}
            {who ? `. ${who.profile.city}${who.profile.college ? `, ${who.profile.college}` : ''}` : ''}
          </p>
        </div>
        <Status value={b.status} />
      </div>
      <blockquote className={styles.quote}>{b.topic}</blockquote>
      {who?.profile.goal && <p className={styles.cardBody}>Their goal: {who.profile.goal}</p>}
      {b.mentorNote && !writing && <p className={styles.cardBody}>Your note: {b.mentorNote}</p>}
      {writing && (
        <label className="field">
          <span>Note for {who?.name.split(' ')[0]}</span>
          <textarea
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What you talked about and the one thing they should do next."
          />
        </label>
      )}
      <div className={styles.cardFoot}>
        {b.status === 'Requested' && (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setBookingStatus(b.id, 'Confirmed')}>
              Accept
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBookingStatus(b.id, 'Declined')}>
              Decline
            </button>
          </>
        )}
        {b.status === 'Confirmed' &&
          (writing ? (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setBookingStatus(b.id, 'Done', note.trim())
                  setWriting(false)
                }}
              >
                Mark as done
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setWriting(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setWriting(true)}>
                Mark as done
              </button>
              <button type="button" className={`${styles.link} ${styles.danger}`} onClick={() => setBookingStatus(b.id, 'Declined')}>
                Cancel session
              </button>
            </>
          ))}
      </div>
    </li>
  )
}

function Sessions() {
  const { bookings } = useMentor()
  const [tab, setTab] = useState<'Requested' | 'Confirmed' | 'Past'>('Requested')
  const groups = {
    Requested: bookings.filter((b) => b.status === 'Requested'),
    Confirmed: bookings.filter((b) => b.status === 'Confirmed'),
    Past: bookings.filter((b) => b.status === 'Done' || b.status === 'Declined'),
  }
  const labels = { Requested: 'Requests', Confirmed: 'Upcoming', Past: 'Past' }
  return (
    <>
      <PanelHead title="Sessions" intro="Accept the requests you can take. People see your answer straight away." />
      <div className={styles.tabs}>
        {(Object.keys(groups) as (keyof typeof groups)[]).map((k) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)}>
            {labels[k]} ({groups[k].length})
          </button>
        ))}
      </div>
      {groups[tab].length === 0 ? (
        <Empty title={tab === 'Requested' ? 'No new requests' : tab === 'Confirmed' ? 'Nothing coming up' : 'No past sessions yet'} />
      ) : (
        <ul className={styles.list}>
          {groups[tab].map((b) => (
            <SessionCard key={b.id} b={b} />
          ))}
        </ul>
      )}
    </>
  )
}

function Availability() {
  const { mentor, saveMentor } = useMentor()
  const [weekday, setWeekday] = useState<string[]>(mentor?.weekdaySlots ?? defaultWeekdaySlots)
  const [saturday, setSaturday] = useState<string[]>(mentor?.saturdaySlots ?? defaultSaturdaySlots)
  const [done, setDone] = useState(false)
  if (!mentor) return <Empty title="No mentor profile">Write to the HackShift team to set one up.</Empty>

  const flip = (list: string[], set: (v: string[]) => void, t: string, order: string[]) => {
    set(list.includes(t) ? list.filter((x) => x !== t) : [...list, t].sort((a, b) => order.indexOf(a) - order.indexOf(b)))
    setDone(false)
  }

  return (
    <>
      <PanelHead title="Weekly times" intro="Pick the 30 minute slots you can usually give. People book from the next five working days." />
      {done && (
        <p className={styles.toast} role="status">
          Times saved. Your public page shows them now.
        </p>
      )}
      <div className={styles.form}>
        <div className="field" role="group" aria-label="Monday to Friday">
          <span>Monday to Friday</span>
          <div className={styles.chips}>
            {weekdayOptions.map((t) => (
              <button key={t} type="button" className="chip" aria-pressed={weekday.includes(t)} onClick={() => flip(weekday, setWeekday, t, weekdayOptions)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="field" role="group" aria-label="Saturday">
          <span>Saturday</span>
          <div className={styles.chips}>
            {saturdayOptions.map((t) => (
              <button key={t} type="button" className="chip" aria-pressed={saturday.includes(t)} onClick={() => flip(saturday, setSaturday, t, saturdayOptions)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.formActions}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              saveMentor({ ...mentor, weekdaySlots: weekday, saturdaySlots: saturday })
              setDone(true)
            }}
          >
            Save times
          </button>
          <span className={styles.cardSub}>
            {weekday.length + saturday.length === 0 ? 'With no times picked, nobody can book you.' : `${weekday.length * 5 + saturday.length} slots a week`}
          </span>
        </div>
      </div>
    </>
  )
}

function MentorProfile() {
  const { mentor, saveMentor } = useMentor()
  const [title, setTitle] = useState(mentor?.title ?? '')
  const [company, setCompany] = useState(mentor?.company ?? '')
  const [city, setCity] = useState(mentor?.city ?? '')
  const [years, setYears] = useState(String(mentor?.yearsExp ?? 0))
  const [bio, setBio] = useState(mentor?.bio ?? '')
  const [expertise, setExpertise] = useState(mentor?.expertise.join(', ') ?? '')
  const [languages, setLanguages] = useState<string[]>(mentor?.languages ?? [])
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  if (!mentor) return <Empty title="No mentor profile">Write to the HackShift team to set one up.</Empty>

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || bio.trim().length < 30 || commaList(expertise).length === 0 || languages.length === 0) {
      setMessage({ ok: false, text: 'Add your title, a bio of a few sentences, at least one topic and one language.' })
      return
    }
    saveMentor({
      ...mentor,
      title: title.trim(),
      company: company.trim(),
      city: city.trim(),
      yearsExp: Math.max(0, Number(years) || 0),
      bio: bio.trim(),
      expertise: commaList(expertise),
      languages,
    })
    setMessage({ ok: true, text: 'Mentor profile saved.' })
  }

  return (
    <>
      <PanelHead title="Mentor profile" intro="What people see before they book you. Be specific about what you can help with." />
      <PendingNote />
      {message && (
        <p className={message.ok ? styles.toast : styles.error} role="status">
          {message.text}
        </p>
      )}
      <form className={styles.form} onSubmit={save} noValidate>
        <div className={styles.formRow}>
          <label className="field">
            <span>Title</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Product lead" />
          </label>
          <label className="field">
            <span>Where you work</span>
            <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="a payments company" />
            <small>You can keep it general, like “a payments company”.</small>
          </label>
        </div>
        <div className={styles.formRow}>
          <label className="field">
            <span>City</span>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label className="field">
            <span>Years of experience</span>
            <input className="input" type="number" min={0} value={years} onChange={(e) => setYears(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>About you</span>
          <textarea className="input" value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>
        <label className="field">
          <span>Topics people can ask you about</span>
          <input className="input" value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="Product, Fintech, Career switch" />
          <small>Separate them with commas.</small>
        </label>
        <div className="field" role="group" aria-label="Languages you speak">
          <span>Languages you speak</span>
          <div className={styles.chips}>
            {languageOptions.map((l) => (
              <button
                key={l}
                type="button"
                className="chip"
                aria-pressed={languages.includes(l)}
                onClick={() => setLanguages((list) => (list.includes(l) ? list.filter((x) => x !== l) : [...list, l]))}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary btn-sm">
            Save profile
          </button>
        </div>
      </form>
    </>
  )
}

export default function MentorPanel() {
  const { bookings, mentor } = useMentor()
  const nav = [
    { to: '/panel', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/panel/sessions', label: 'Sessions', icon: CalendarDays, count: bookings.filter((b) => b.status === 'Requested').length },
    { to: '/panel/availability', label: 'Weekly times', icon: CalendarClock },
    { to: '/panel/profile', label: 'Mentor profile', icon: UserRound },
    { to: '/panel/account', label: 'Account', icon: UserCog },
  ]
  return (
    <PanelShell nav={nav} publicLink={mentor ? { to: `/mentors/${mentor.id}`, label: 'My public page' } : undefined}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="availability" element={<Availability />} />
        <Route path="profile" element={<MentorProfile />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="*" element={<Navigate to="/panel" replace />} />
      </Routes>
    </PanelShell>
  )
}
