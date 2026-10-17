import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Users, Zap } from 'lucide-react'
import PageHead from '../components/PageHead'
import type { Level } from '../data/types'
import { useStore } from '../store/AppStore'
import styles from './Challenges.module.css'

const levels: (Level | 'Any level')[] = ['Any level', 'Beginner', 'Intermediate', 'Advanced']

export default function Challenges() {
  const { submissions, challenges } = useStore()
  const [level, setLevel] = useState<Level | 'Any level'>('Any level')
  const [fastOnly, setFastOnly] = useState(false)
  const [maxHours, setMaxHours] = useState(12)

  const results = challenges.filter(
    (c) => (level === 'Any level' || c.level === level) && (!fastOnly || c.fastTrack) && c.hours <= maxHours,
  )

  return (
    <>
      <PageHead
        title="Challenges"
        intro="Small, paid tasks from startups with real problems. Do one well and it counts for more than any line on your resume."
      />

      <div className="wrap">
        <div className={styles.filters}>
          <div className={styles.levels} role="group" aria-label="Level">
            {levels.map((l) => (
              <button key={l} className="chip" aria-pressed={level === l} onClick={() => setLevel(l)}>
                {l}
              </button>
            ))}
          </div>
          <label className={styles.range}>
            <span>
              Up to <strong className="num">{maxHours}</strong> hours
            </span>
            <input
              type="range"
              min={2}
              max={12}
              step={1}
              value={maxHours}
              onChange={(e) => setMaxHours(Number(e.target.value))}
            />
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={fastOnly} onChange={(e) => setFastOnly(e.target.checked)} />
            Leads to an interview
          </label>
        </div>

        {results.length === 0 ? (
          <p className={styles.none}>No challenges fit in that time. Slide the hours up a little.</p>
        ) : (
          <ul className={styles.grid}>
            {results.map((c) => {
              const mine = submissions.find((s) => s.challengeId === c.id)
              const [cash, extra] = c.reward.split(' + ')
              return (
                <li key={c.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <span className={styles.company}>{c.company}</span>
                    {mine ? (
                      <span className={`tag ${mine.status === 'Accepted' ? 'tag-leaf' : 'tag-marigold'}`}>{mine.status}</span>
                    ) : (
                      <span className={styles.level} data-level={c.level}>
                        {c.level}
                      </span>
                    )}
                  </div>
                  <h2>
                    <Link to={`/challenges/${c.id}`}>{c.title}</Link>
                  </h2>
                  <p className={styles.brief}>{c.brief}</p>
                  <div className={styles.reward}>
                    <span className={`num ${styles.cash}`}>{cash}</span>
                    {extra && <span className={styles.extra}>+ {extra}</span>}
                  </div>
                  <ul className={styles.meta}>
                    <li>
                      <Clock size={14} aria-hidden="true" /> About {c.hours} hours
                    </li>
                    <li>
                      <Users size={14} aria-hidden="true" /> {c.submissions} submitted
                    </li>
                    <li>Closes {c.closes}</li>
                    {c.fastTrack && (
                      <li className={styles.fast}>
                        <Zap size={14} aria-hidden="true" /> Interview
                      </li>
                    )}
                  </ul>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
