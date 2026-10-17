import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, Search, Zap } from 'lucide-react'
import PageHead from '../components/PageHead'
import type { OpportunityKind } from '../data/types'
import { overlap } from '../lib/match'
import Verified from '../components/Verified'
import { useStore } from '../store/AppStore'
import styles from './Opportunities.module.css'

const kinds: (OpportunityKind | 'All')[] = ['All', 'Internship', 'Job', 'Gig', 'Co-founder']

export default function Opportunities() {
  const { profile, saved, toggleSaved, opportunities, isVerified } = useStore()
  const [kind, setKind] = useState<OpportunityKind | 'All'>('All')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [mineOnly, setMineOnly] = useState(false)

  const cities = useMemo(() => Array.from(new Set(opportunities.map((o) => o.city))).sort(), [opportunities])

  const results = opportunities.filter((o) => {
    if (kind !== 'All' && o.kind !== kind) return false
    if (city && o.city !== city) return false
    if (remoteOnly && !o.remote) return false
    if (mineOnly && profile && overlap(o.skills, profile.skills).length === 0) return false
    if (query) {
      const q = query.toLowerCase()
      const text = [o.title, o.company, o.city, ...o.skills].join(' ').toLowerCase()
      if (!text.includes(q)) return false
    }
    return true
  })

  const clear = () => {
    setKind('All')
    setQuery('')
    setCity('')
    setRemoteOnly(false)
    setMineOnly(false)
  }

  return (
    <>
      <PageHead
        title="Opportunities"
        intro="Internships, jobs, short gigs and co-founder roles at startups across India. Pay is listed on every one."
      />

      <div className="wrap">
        <div className={styles.filters}>
          <div className={styles.kinds} role="group" aria-label="Type">
            {kinds.map((k) => (
              <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
                {k}
              </button>
            ))}
          </div>
          <div className={styles.controls}>
            <label className={styles.search}>
              <Search size={18} aria-hidden="true" />
              <span className="visually-hidden">Search</span>
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by role, company or skill"
              />
            </label>
            <label>
              <span className="visually-hidden">City</span>
              <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} />
              Remote ok
            </label>
            {profile && (
              <label className={styles.check}>
                <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
                Matches my skills
              </label>
            )}
          </div>
        </div>

        <p className={styles.count} aria-live="polite">
          {results.length} {results.length === 1 ? 'opportunity' : 'opportunities'}
        </p>

        {results.length === 0 ? (
          <div className={styles.none}>
            <p>Nothing matches these filters. Try another city or turn off one of the checkboxes.</p>
            <button className="btn btn-ghost btn-sm" onClick={clear}>
              Clear filters
            </button>
          </div>
        ) : (
          <ul className={styles.list}>
            {results.map((o) => {
              const hits = profile ? overlap(o.skills, profile.skills) : []
              const isSaved = saved.includes(o.id)
              return (
                <li key={o.id} className={styles.item}>
                  <span className={styles.logo} aria-hidden="true">
                    {o.company.charAt(0)}
                  </span>
                  <div className={styles.body}>
                    <p className={styles.company}>
                      {o.company}
                      {isVerified(o.ownerId) && <Verified />}, {o.city}
                      {o.remote && <span className="tag">Remote ok</span>}
                    </p>
                    <h2 className={styles.title}>
                      <Link to={`/opportunities/${o.id}`}>{o.title}</Link>
                    </h2>
                    <div className={styles.skills}>
                      {o.skills.map((s) => (
                        <span key={s} className={`tag ${hits.includes(s) ? 'tag-leaf' : ''}`}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.end}>
                    <span className={styles.kind}>{o.kind}</span>
                    <span className={`num ${styles.pay}`}>{o.pay}</span>
                    <span className={styles.posted}>
                      {o.postedDaysAgo === 1 ? 'Posted yesterday' : `Posted ${o.postedDaysAgo} days ago`}
                    </span>
                    {o.challengeId && (
                      <span className={styles.fast}>
                        <Zap size={14} aria-hidden="true" /> Has a challenge
                      </span>
                    )}
                  </div>
                  <button
                    className={styles.save}
                    onClick={() => toggleSaved(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? `Remove ${o.title} from saved` : `Save ${o.title}`}
                  >
                    {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
