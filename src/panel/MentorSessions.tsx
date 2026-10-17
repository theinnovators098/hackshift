import { useMemo, useState } from 'react'
import { CalendarClock, Video } from 'lucide-react'
import { defaultSaturdaySlots, defaultWeekdaySlots } from '../pages/MentorDetail'
import { askJson, askText, FAST } from '../lib/millisa'
import { agendaRequest, followUpRequest, type FollowUp } from '../lib/millisaPrompts'
import { useMillisa, useMillisaTask } from '../millisa/MillisaProvider'
import { MillisaMark, Problem, Reply, Thinking } from '../millisa/parts'
import { useStore, type Booking } from '../store/AppStore'
import { Empty, PanelHead, Status, panelStyles as styles } from './ui'
import own from './MentorSessions.module.css'

function nextDays(weekday: string[], saturday: string[]) {
  const out: { day: string; times: string[] }[] = []
  const d = new Date()
  while (out.length < 6) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0) continue
    out.push({ day: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }), times: d.getDay() === 6 ? saturday : weekday })
  }
  return out
}

function SessionCard({ b }: { b: Booking }) {
  const { accountById, data, account, setBookingStatus, confirmBooking, proposeTime, finishSession } = useStore()
  const { lang } = useMillisa()
  const mentor = data.mentors.find((m) => m.id === b.mentorId)
  const who = accountById(b.accountId)
  const days = useMemo(
    () => nextDays(mentor?.weekdaySlots ?? defaultWeekdaySlots, mentor?.saturdaySlots ?? defaultSaturdaySlots),
    [mentor?.weekdaySlots, mentor?.saturdaySlots],
  )
  const [mode, setMode] = useState<'accept' | 'move' | 'finish' | null>(null)
  const [link, setLink] = useState(b.link ?? '')
  const [day, setDay] = useState(days[0]?.day ?? '')
  const [time, setTime] = useState(days[0]?.times[0] ?? '')
  const [notes, setNotes] = useState('')
  const [actions, setActions] = useState('')
  const agenda = useMillisaTask<string>()
  const followUp = useMillisaTask<FollowUp>()

  const prepare = () =>
    agenda.run(async (signal) => ({
      data: await askText({ model: FAST, ...agendaRequest(who!.profile, b.topic, account?.name ?? 'the mentor', lang), signal }),
      saved: false,
    }))

  const draftFollowUp = () =>
    followUp.run(async (signal) => {
      const res = await askJson<FollowUp>({ model: FAST, ...followUpRequest(notes, b.topic, who?.name ?? 'the mentee'), signal })
      setNotes(res.data.note)
      setActions(res.data.actions.join('\n'))
      return res
    })

  const finish = () => {
    finishSession(
      b.id,
      notes.trim(),
      actions
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    )
    setMode(null)
  }

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
      {b.proposed && (
        <p className="notice">
          You suggested {b.proposed.day}, {b.proposed.time}. Waiting for {who?.name.split(' ')[0]} to agree.
        </p>
      )}
      {b.link && b.status === 'Confirmed' && (
        <a href={b.link} target="_blank" rel="noreferrer" className={own.join}>
          <Video size={15} /> {b.link.replace(/^https?:\/\//, '')}
        </a>
      )}

      {b.status === 'Done' && (
        <div className={own.done}>
          {b.mentorNote && <p>{b.mentorNote}</p>}
          {b.actions && b.actions.length > 0 && (
            <ul>
              {b.actions.map((a) => (
                <li key={a.text} className={a.done ? own.actionDone : undefined}>
                  {a.text}
                </li>
              ))}
            </ul>
          )}
          {b.rating && (
            <p className={own.rating} aria-label={`Rated ${b.rating} out of 5`}>
              {'★'.repeat(b.rating)}
              {'☆'.repeat(5 - b.rating)} {b.review && <span>“{b.review}”</span>}
            </p>
          )}
        </div>
      )}

      {mode === 'accept' && (
        <div className={own.panel}>
          <label className="field">
            <span>Meeting link</span>
            <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/..." />
          </label>
          <div className={styles.cardFoot}>
            <button type="button" className="btn btn-primary btn-sm" disabled={!/^https?:\/\/\S+/.test(link)} onClick={() => confirmBooking(b.id, link.trim())}>
              Confirm session
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLink(`https://meet.jit.si/hackshift-${b.id}`)}>
              Use a free Jitsi link
            </button>
          </div>
        </div>
      )}

      {mode === 'move' && (
        <div className={own.panel}>
          <div className={styles.formRow}>
            <label className="field">
              <span>Day</span>
              <select
                className="input"
                value={day}
                onChange={(e) => {
                  setDay(e.target.value)
                  setTime(days.find((d) => d.day === e.target.value)?.times[0] ?? '')
                }}
              >
                {days.map((d) => (
                  <option key={d.day}>{d.day}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Time</span>
              <select className="input" value={time} onChange={(e) => setTime(e.target.value)}>
                {(days.find((d) => d.day === day)?.times ?? []).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.cardFoot}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!day || !time}
              onClick={() => {
                proposeTime(b.id, day, time)
                setMode(null)
              }}
            >
              Suggest this time
            </button>
          </div>
        </div>
      )}

      {mode === 'finish' && (
        <div className={own.panel}>
          <label className="field">
            <span>Note for {who?.name.split(' ')[0]}</span>
            <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Rough notes are fine. Millisa can tidy them up." />
          </label>
          <label className="field">
            <span>Action items, one per line</span>
            <textarea className="input" value={actions} onChange={(e) => setActions(e.target.value)} />
          </label>
          <div className={styles.cardFoot}>
            <button type="button" className="btn btn-primary btn-sm" disabled={!notes.trim()} onClick={finish}>
              Send notes and mark done
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={notes.trim().length < 15 || followUp.status === 'loading'} onClick={draftFollowUp}>
              <MillisaMark size={15} /> Tidy up with Millisa
            </button>
          </div>
          {followUp.status === 'loading' && <Thinking>Millisa is turning your notes into action items</Thinking>}
          {followUp.status === 'error' && <Problem message={followUp.error ?? ''} onRetry={draftFollowUp} />}
        </div>
      )}

      {agenda.status !== 'idle' && (
        <div className={own.panel}>
          {agenda.status === 'loading' && <Thinking>Millisa is planning the 30 minutes</Thinking>}
          {agenda.status === 'error' && <Problem message={agenda.error ?? ''} onRetry={prepare} />}
          {agenda.data && <Reply text={agenda.data} />}
        </div>
      )}

      <div className={styles.cardFoot}>
        {b.status === 'Requested' && (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setMode(mode === 'accept' ? null : 'accept')}>
              Accept
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode(mode === 'move' ? null : 'move')}>
              <CalendarClock size={15} /> Suggest another time
            </button>
            <button type="button" className={`${styles.link} ${styles.danger}`} onClick={() => setBookingStatus(b.id, 'Declined')}>
              Decline
            </button>
          </>
        )}
        {b.status === 'Confirmed' && (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setMode(mode === 'finish' ? null : 'finish')}>
              Mark as done
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={prepare} disabled={agenda.status === 'loading'}>
              <MillisaMark size={15} /> Prepare an agenda
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode(mode === 'move' ? null : 'move')}>
              Move it
            </button>
          </>
        )}
      </div>
    </li>
  )
}

export function Sessions() {
  const { account, data } = useStore()
  const bookings = data.bookings.filter((b) => b.mentorId === account?.mentorId)
  const [tab, setTab] = useState<'Requested' | 'Confirmed' | 'Past'>('Requested')
  const groups = {
    Requested: bookings.filter((b) => b.status === 'Requested'),
    Confirmed: bookings.filter((b) => b.status === 'Confirmed'),
    Past: bookings.filter((b) => b.status === 'Done' || b.status === 'Declined'),
  }
  const labels = { Requested: 'Requests', Confirmed: 'Upcoming', Past: 'Past' }
  return (
    <>
      <PanelHead title="Sessions" intro="Accept the requests you can take, or suggest a better time. People see your answer straight away." />
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

function ReviewCard({ ventureId }: { ventureId: string }) {
  const { data, reviewVenture } = useStore()
  const [text, setText] = useState('')
  const v = data.ventures.find((x) => x.id === ventureId)
  if (!v) return null
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <p className={styles.cardTitle}>{v.name}</p>
          <p className={styles.cardSub}>
            {v.founder}, {v.city}. {v.sector}, {v.stage}
          </p>
        </div>
      </div>
      <p className={styles.cardBody}>{v.oneLiner}</p>
      <blockquote className={styles.quote}>{v.problem}</blockquote>
      {v.progress.length > 0 && <p className={styles.cardSub}>Proof: {v.progress.join('; ')}</p>}
      <label className="field">
        <span>Your feedback</span>
        <textarea
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What is strong, what worries you, and the one thing they should do next"
        />
      </label>
      <div className={styles.cardFoot}>
        <button type="button" className="btn btn-primary btn-sm" disabled={text.trim().length < 20} onClick={() => reviewVenture(v.id, text.trim())}>
          Send feedback
        </button>
      </div>
    </li>
  )
}

export function VentureReviews() {
  const { data } = useStore()
  const ids = Array.from(new Set(data.accounts.flatMap((a) => a.lists.reviewRequests)))
  return (
    <>
      <PanelHead title="Venture reviews" intro="Founders asking a mentor to look at their idea. Your feedback goes straight to their workspace." />
      {ids.length === 0 ? (
        <Empty title="No reviews waiting">When a founder asks for a review, it shows up here.</Empty>
      ) : (
        <ul className={styles.list}>
          {ids.map((id) => (
            <ReviewCard key={id} ventureId={id} />
          ))}
        </ul>
      )}
    </>
  )
}
