import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Plus, Users } from 'lucide-react'
import PageHead from '../components/PageHead'
import { stageHelp, stages } from '../data/ventures'
import type { Stage } from '../data/types'
import { useStore } from '../store/AppStore'
import styles from './Ventures.module.css'

export default function Ventures() {
  const { myVentures, interested, ventures } = useStore()
  const [sector, setSector] = useState('')
  const [mobileStage, setMobileStage] = useState<Stage>('Idea')

  const all = [...myVentures.filter((v) => v.status !== 'live'), ...ventures]
  const sectors = Array.from(new Set(all.map((v) => v.sector))).sort()
  const shown = all.filter((v) => !sector || v.sector === sector)

  return (
    <>
      <PageHead
        title="Ventures"
        intro="Ideas and early startups from across India, sorted by how far along they are. Join one, mentor one, or post your own."
      >
        <Link to="/ventures/new" className="btn btn-accent">
          <Plus size={18} /> Post your idea
        </Link>
      </PageHead>

      <div className="wrap">
        <div className={styles.bar}>
          <label className={styles.sector}>
            <span>Sector</span>
            <select className="input" value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="">All sectors</option>
              {sectors.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className={styles.tabs} role="group" aria-label="Stage">
            {stages.map((s) => (
              <button key={s} className="chip" aria-pressed={mobileStage === s} onClick={() => setMobileStage(s)}>
                {s} ({shown.filter((v) => v.stage === s).length})
              </button>
            ))}
          </div>
        </div>

        <div className={styles.board}>
          {stages.map((stage) => {
            const items = shown.filter((v) => v.stage === stage)
            return (
              <section
                key={stage}
                className={`${styles.column} ${mobileStage === stage ? styles.columnActive : ''}`}
                aria-labelledby={`stage-${stage}`}
              >
                <header className={styles.colHead}>
                  <h2 id={`stage-${stage}`}>
                    {stage} <span className="num">{items.length}</span>
                  </h2>
                  <p>{stageHelp[stage]}</p>
                </header>
                {items.length === 0 ? (
                  <p className={styles.empty}>Nothing at this stage{sector && ` in ${sector}`} yet.</p>
                ) : (
                  <ul className={styles.cards}>
                    {items.map((v) => (
                      <li key={v.id} className={`${styles.card} ${v.mine ? styles.mine : ''}`}>
                        <div className={styles.cardTop}>
                          <span className={styles.sectorTag}>{v.sector}</span>
                          {v.mine && <span className="tag tag-marigold">Yours</span>}
                          {!v.mine && interested.includes(v.id) && <span className="tag tag-leaf">Interested</span>}
                        </div>
                        <h3>
                          <Link to={`/ventures/${v.id}`}>{v.name}</Link>
                        </h3>
                        <p className={styles.line}>{v.oneLiner}</p>
                        <p className={styles.meta}>
                          <span>
                            <MapPin size={13} aria-hidden="true" /> {v.city}
                          </span>
                          <span>
                            <Users size={13} aria-hidden="true" /> {v.team === 1 ? 'Solo founder' : `Team of ${v.team}`}
                          </span>
                        </p>
                        {v.lookingFor[0] && <p className={styles.need}>Needs: {v.lookingFor[0].toLowerCase()}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </>
  )
}
