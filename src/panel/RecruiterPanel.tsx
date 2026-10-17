import { useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { BadgeCheck, KanbanSquare, LayoutDashboard, Search, UserCog } from 'lucide-react'
import { useStore, type PipelineEntry, type PipelineStage } from '../store/AppStore'
import AccountSettings from './AccountSettings'
import PanelShell from './PanelShell'
import { Empty, PanelHead, Section, Stats, panelStyles as styles } from './ui'
import own from './RecruiterPanel.module.css'

const stages: PipelineStage[] = ['Shortlisted', 'Contacted', 'Interview', 'Offer', 'Hired', 'Not a fit']

function usePipeline() {
  const store = useStore()
  const me = store.account!
  const entries = store.data.pipeline.filter((p) => p.recruiterId === me.id)
  return { ...store, me, entries }
}

function Overview() {
  const { me, entries, personById } = usePipeline()
  const active = entries.filter((e) => e.stage !== 'Hired' && e.stage !== 'Not a fit')
  const interviews = entries.filter((e) => e.stage === 'Interview')
  const max = Math.max(1, ...stages.map((s) => entries.filter((e) => e.stage === s).length))

  return (
    <>
      <PanelHead title={`Hiring for ${me.company ?? 'your team'}`} intro="Where every candidate stands, and who you are talking to this week.">
        <Link to="/talent" className="btn btn-accent btn-sm">
          Find talent
        </Link>
      </PanelHead>
      <Stats
        items={[
          { label: 'In your pipeline', value: active.length, to: '/panel/pipeline' },
          { label: 'Interviews', value: interviews.length, hot: interviews.length > 0 },
          { label: 'Hired', value: entries.filter((e) => e.stage === 'Hired').length },
        ]}
      />
      <div className={styles.two}>
        <Section title="By stage" link={{ to: '/panel/pipeline', label: 'Open pipeline' }}>
          <ul className={own.funnel}>
            {stages.map((s) => {
              const n = entries.filter((e) => e.stage === s).length
              return (
                <li key={s}>
                  <span className={own.funnelLabel}>{s}</span>
                  <span className={own.bar}>
                    <span style={{ width: `${(n / max) * 100}%` }} className={s === 'Not a fit' ? own.barMuted : undefined} />
                  </span>
                  <span className="num">{n}</span>
                </li>
              )
            })}
          </ul>
        </Section>
        <Section title="Interviews">
          {interviews.length === 0 ? (
            <Empty title="No interviews set">Move someone to Interview and add a time.</Empty>
          ) : (
            <ul className={styles.feed}>
              {interviews.map((e) => (
                <li key={e.id}>
                  <span>
                    <strong>{personById(e.personId)?.name}</strong>
                  </span>
                  <time>{e.interviewOn || 'Time not set'}</time>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  )
}

function Card({ entry }: { entry: PipelineEntry }) {
  const { personById, updatePipeline, removePipeline } = useStore()
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(entry.note)
  const [when, setWhen] = useState(entry.interviewOn ?? '')
  const p = personById(entry.personId)
  if (!p) return null

  return (
    <li className={own.card}>
      <p className={own.name}>{p.name}</p>
      <p className={styles.cellSub}>
        {p.city}. {p.skills.slice(0, 3).join(', ')}
      </p>
      {p.badges.length > 0 && (
        <p className={own.badges}>
          <BadgeCheck size={14} aria-hidden="true" /> {p.badges.length} verified {p.badges.length === 1 ? 'challenge' : 'challenges'}
        </p>
      )}
      <select
        className={styles.select}
        value={entry.stage}
        onChange={(e) => updatePipeline(entry.id, { stage: e.target.value as PipelineStage })}
        aria-label={`Stage for ${p.name}`}
      >
        {stages.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      {editing ? (
        <div className={own.edit}>
          <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you know so far" aria-label="Note" />
          {entry.stage === 'Interview' && (
            <input className="input" value={when} onChange={(e) => setWhen(e.target.value)} placeholder="Thu, 23 Oct, 11:00 am" aria-label="Interview time" />
          )}
          <div className={styles.cardFoot}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                updatePipeline(entry.id, { note: note.trim(), interviewOn: when.trim() || undefined })
                setEditing(false)
              }}
            >
              Save
            </button>
            <button type="button" className={styles.link} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {entry.note && <p className={own.note}>{entry.note}</p>}
          {entry.stage === 'Interview' && entry.interviewOn && <p className={own.when}>Interview: {entry.interviewOn}</p>}
          <div className={styles.cardFoot}>
            <button type="button" className={styles.link} onClick={() => setEditing(true)}>
              {entry.note ? 'Edit note' : 'Add note'}
            </button>
            <button type="button" className={`${styles.link} ${styles.danger} ${styles.push}`} onClick={() => removePipeline(entry.id)}>
              Remove
            </button>
          </div>
        </>
      )}
    </li>
  )
}

function Pipeline() {
  const { entries } = usePipeline()
  return (
    <>
      <PanelHead title="Pipeline" intro="Star people on Find talent to add them here, then move them along as you talk.">
        <Link to="/talent" className="btn btn-ghost btn-sm">
          <Search size={15} /> Find talent
        </Link>
      </PanelHead>
      {entries.length === 0 ? (
        <Empty title="Your pipeline is empty" action={<Link to="/talent" className="btn btn-primary btn-sm">Find talent</Link>}>
          Search people by verified work and star the ones you want to talk to.
        </Empty>
      ) : (
        <div className={own.board}>
          {stages.map((s) => {
            const list = entries.filter((e) => e.stage === s)
            return (
              <section key={s} className={own.column} aria-label={s}>
                <h2>
                  {s} <span className="num">{list.length}</span>
                </h2>
                <ul>
                  {list.map((e) => (
                    <Card key={e.id} entry={e} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}

export default function RecruiterPanel() {
  const { entries } = usePipeline()
  const nav = [
    { to: '/panel', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/panel/pipeline', label: 'Pipeline', icon: KanbanSquare, count: entries.filter((e) => e.stage === 'Interview').length },
    { to: '/panel/account', label: 'Account', icon: UserCog },
  ]
  return (
    <PanelShell nav={nav} publicLink={{ to: '/talent', label: 'Find talent' }}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="*" element={<Navigate to="/panel" replace />} />
      </Routes>
    </PanelShell>
  )
}
