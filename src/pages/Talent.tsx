import { useMemo, useState } from 'react'
import { BadgeCheck, Search, Star } from 'lucide-react'
import PageHead from '../components/PageHead'
import { people } from '../data/people'
import { useStore } from '../store/AppStore'
import styles from './Talent.module.css'

export default function Talent() {
  const { shortlist, toggleShortlist } = useStore()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [showShortlist, setShowShortlist] = useState(false)

  const cities = useMemo(() => Array.from(new Set(people.map((p) => p.city))).sort(), [])

  const results = people.filter((p) => {
    if (showShortlist) return shortlist.includes(p.id)
    if (verifiedOnly && p.badges.length === 0) return false
    if (availableOnly && !p.available) return false
    if (city && p.city !== city) return false
    if (query) {
      const text = [p.name, p.headline, p.college, ...p.skills, ...p.badges].join(' ').toLowerCase()
      if (!text.includes(query.toLowerCase())) return false
    }
    return true
  })

  return (
    <>
      <PageHead
        title="Find talent"
        intro="Every badge here is a challenge a startup reviewed and accepted. Search by what people have built, not by keywords on a CV."
      >
        <button
          className={`btn ${showShortlist ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={showShortlist}
          onClick={() => setShowShortlist((s) => !s)}
        >
          <Star size={16} /> Shortlist ({shortlist.length})
        </button>
      </PageHead>

      <div className="wrap">
        {!showShortlist && (
          <div className={styles.filters}>
            <label className={styles.search}>
              <Search size={18} aria-hidden="true" />
              <span className="visually-hidden">Search people</span>
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try React, SQL, Hindi or a company name"
              />
            </label>
            <label>
              <span className="visually-hidden">City</span>
              <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Anywhere in India</option>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
              Has verified work
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
              Open to offers
            </label>
          </div>
        )}

        <p className={styles.count} aria-live="polite">
          {showShortlist ? 'Your shortlist' : `${results.length} ${results.length === 1 ? 'person' : 'people'}`}
        </p>

        {results.length === 0 ? (
          <p className={styles.none}>
            {showShortlist
              ? 'Nobody on your shortlist yet. Tap the star on anyone you want to come back to.'
              : 'No one matches all of these. Try removing the city or the verified-work filter.'}
          </p>
        ) : (
          <ul className={styles.grid}>
            {results.map((p) => {
              const listed = shortlist.includes(p.id)
              return (
                <li key={p.id} className={styles.card}>
                  <div className={styles.top}>
                    <span className={styles.avatar} aria-hidden="true">
                      {p.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                    <div>
                      <h2>{p.name}</h2>
                      <p className={styles.where}>
                        {p.city}, {p.college}
                      </p>
                    </div>
                    <button
                      className={styles.star}
                      aria-pressed={listed}
                      aria-label={listed ? `Remove ${p.name} from shortlist` : `Add ${p.name} to shortlist`}
                      onClick={() => toggleShortlist(p.id)}
                    >
                      <Star size={18} fill={listed ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <p className={styles.headline}>{p.headline}</p>
                  <div className={styles.skills}>
                    {p.skills.map((s) => (
                      <span key={s} className="tag">
                        {s}
                      </span>
                    ))}
                  </div>
                  {p.badges.length > 0 ? (
                    <ul className={styles.badges}>
                      {p.badges.map((b) => (
                        <li key={b}>
                          <BadgeCheck size={16} aria-hidden="true" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.noBadge}>No accepted challenges yet</p>
                  )}
                  <p className={p.available ? styles.open : styles.busy}>
                    {p.available ? 'Open to offers' : 'Not looking right now'}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
