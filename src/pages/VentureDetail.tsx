import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ExternalLink, MapPin, Tag, Users } from 'lucide-react'
import { stages } from '../data/ventures'
import MessageButton from '../components/MessageButton'
import ReportButton from '../components/ReportButton'
import { useStore } from '../store/AppStore'
import NotFound from './NotFound'
import styles from './Detail.module.css'
import own from './VentureDetail.module.css'

export default function VentureDetail() {
  const { id } = useParams()
  const { profile, myVentures, interested, toggleInterest, reviewRequests, requestReview, moveVenture, ventures, schemes } = useStore()

  const v = [...myVentures, ...ventures].find((x) => x.id === id)
  const pending = v?.mine && v.status && v.status !== 'live'
  if (!v) return <NotFound />

  const current = stages.indexOf(v.stage)
  const isInterested = interested.includes(v.id)
  const reviewAsked = reviewRequests.includes(v.id)
  const fits = schemes.filter((s) => s.stages.includes(v.stage) && !s.onlyFor).slice(0, 3)

  return (
    <div className={`wrap ${styles.page}`}>
      <Link to="/ventures" className="back-link">
        <ArrowLeft size={16} /> All ventures
      </Link>

      {pending && (
        <p className="notice">
          {v.status === 'pending'
            ? 'Only you and the HackShift team can see this idea. It goes live once the team approves it.'
            : 'This idea is hidden from HackShift. Only you and the HackShift team can see it.'}
        </p>
      )}
      <header className={styles.head}>
        <p className={styles.kicker}>
          {v.mine ? 'Your venture' : `Founded by ${v.founder}`}
        </p>
        <h1>{v.name}</h1>
        <p className={own.oneLiner}>{v.oneLiner}</p>
        <ul className={styles.facts}>
          <li>
            <MapPin size={16} aria-hidden="true" /> {v.city}
          </li>
          <li>
            <Tag size={16} aria-hidden="true" /> {v.sector}
          </li>
          <li>
            <Users size={16} aria-hidden="true" /> {v.team === 1 ? 'Solo founder' : `Team of ${v.team}`}
          </li>
        </ul>
      </header>

      <ol className={own.track} aria-label="Stage">
        {stages.map((s, i) => (
          <li
            key={s}
            className={i < current ? own.past : i === current ? own.now : undefined}
            aria-current={i === current ? 'step' : undefined}
          >
            <span className={own.marker} aria-hidden="true">
              {i < current ? <Check size={14} strokeWidth={3} /> : null}
            </span>
            {s}
          </li>
        ))}
      </ol>

      <div className={styles.layout}>
        <article className={styles.article}>
          <section>
            <h2>The problem</h2>
            <p>{v.problem}</p>
          </section>
          {v.solution && (
            <section>
              <h2>The solution</h2>
              <p>{v.solution}</p>
              {v.demoLink && (
                <p className={styles.muted}>
                  <a href={v.demoLink} target="_blank" rel="noreferrer">
                    See the demo
                  </a>
                </p>
              )}
            </section>
          )}
          {(v.customer || v.model) && (
            <section>
              <h2>Customer and business model</h2>
              <ul className={styles.bullets}>
                {v.customer && <li>For: {v.customer}</li>}
                {v.model && <li>Makes money by: {v.model}</li>}
              </ul>
            </section>
          )}
          {v.progress.length > 0 && (
            <section>
              <h2>Proof so far</h2>
              <ul className={styles.bullets}>
                {v.progress.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h2>Looking for</h2>
            <ul className={own.needs}>
              {v.lookingFor.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </section>
        </article>

        <aside className={styles.aside}>
          <div className={styles.panel}>
            {v.mine ? (
              <>
                <Link to={`/panel/ventures/${v.id}`} className="btn btn-accent">
                  Open founder workspace
                </Link>
                <label className="field">
                  <span>Stage</span>
                  <select className="input" value={v.stage} onChange={(e) => moveVenture(v.id, e.target.value as typeof v.stage)}>
                    {stages.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <small>Move it forward when you have the proof for the next stage.</small>
                </label>
                <button className="btn btn-primary" disabled={reviewAsked} onClick={() => requestReview(v.id)}>
                  {reviewAsked ? 'Mentor review requested' : 'Ask a mentor to review'}
                </button>
                {reviewAsked && (
                  <p className={styles.muted}>A mentor with {v.sector.toLowerCase()} experience will reply within three days.</p>
                )}
              </>
            ) : (
              <>
                <p className={styles.muted}>
                  {isInterested
                    ? `${v.founder.split(' ')[0]} can see your profile and will message you if it is a fit.`
                    : `Think you could help ${v.name}? Let ${v.founder.split(' ')[0]} know. They will see your profile and skills.`}
                </p>
                {profile ? (
                  <button
                    className={`btn ${isInterested ? 'btn-ghost' : 'btn-primary'}`}
                    aria-pressed={isInterested}
                    onClick={() => toggleInterest(v.id)}
                  >
                    {isInterested ? 'Withdraw interest' : 'I want to help build this'}
                  </button>
                ) : (
                  <Link to="/start" className="btn btn-primary">
                    Create your profile first
                  </Link>
                )}
                {profile && v.ownerId && <MessageButton to={v.ownerId} label={`Message ${v.founder.split(' ')[0]}`} small={false} />}
              </>
            )}
          </div>

          {!v.mine && <ReportButton kind="ventures" targetId={v.id} label={v.name} />}

          {fits.length > 0 && (
            <div className={styles.panel}>
              <p className={styles.doneTitle}>Schemes for the {v.stage.toLowerCase()} stage</p>
              <ul className={own.schemes}>
                {fits.map((s) => (
                  <li key={s.id}>
                    <a href={s.link} target="_blank" rel="noreferrer">
                      {s.name} <ExternalLink size={13} aria-hidden="true" />
                    </a>
                    <span>{s.amount}</span>
                  </li>
                ))}
              </ul>
              <Link to="/schemes" className="btn btn-ghost btn-sm">
                Check all schemes
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
