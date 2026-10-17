import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bell, Bookmark, BookmarkCheck, Search, Zap } from 'lucide-react'
import PageHead from '../components/PageHead'
import type { Experience, OpportunityKind, WorkMode } from '../data/types'
import { jobKinds, matches, modeOf, payFloors, workModes } from '../lib/jobs'
import { overlap } from '../lib/match'
import Verified from '../components/Verified'
import { useStore } from '../store/AppStore'
import styles from './Opportunities.module.css'

const kinds: (OpportunityKind | 'All')[] = ['All', ...jobKinds]

export default function Opportunities() {
  const { profile, saved, toggleSaved, opportunities, isVerified, account, saveSearch, savedSearches } = useStore()
  const [params] = useSearchParams()
  const [kind, setKind] = useState<OpportunityKind | 'All'>((params.get('kind') as OpportunityKind) || 'All')
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [city, setCity] = useState(params.get('city') ?? '')
  const [mode, setMode] = useState<WorkMode | ''>((params.get('mode') as WorkMode) || '')
  const [experience, setExperience] = useState<Experience | ''>((params.get('exp') as Experience) || '')
  const [minPay, setMinPay] = useState(Number(params.get('pay')) || 0)
  const [mineOnly, setMineOnly] = useState(params.get('mine') === '1')
  const [savedNote, setSavedNote] = useState(false)
  const filters = { query, kind, city, mode, experience, minPay, mineOnly }
  const canSave = !!account && account.kind === 'seeker'

  const cities = useMemo(() => Array.from(new Set(opportunities.map((o) => o.city))).sort(), [opportunities])

  const results = opportunities.filter((o) => matches(o, filters, profile))

  const clear = () => {
    setKind('All')
    setQuery('')
    setCity('')
    setMode('')
    setExperience('')
    setMinPay(0)
    setMineOnly(false)
  }

  const save = () => {
    saveSearch(filters)
    setSavedNote(true)
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
            <label>
              <span className="visually-hidden">Work mode</span>
              <select className="input" value={mode} onChange={(e) => setMode(e.target.value as WorkMode | '')}>
                <option value="">Any work mode</option>
                {workModes.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.controls}>
            <label>
              <span className="visually-hidden">Experience</span>
              <select className="input" value={experience} onChange={(e) => setExperience(e.target.value as Experience | '')}>
                <option value="">Any experience</option>
                <option value="Fresher">Fresher</option>
                <option value="1-3 years">1 to 3 years</option>
                <option value="3+ years">3 years or more</option>
              </select>
            </label>
            <label>
              <span className="visually-hidden">Pay</span>
              <select className="input" value={minPay} onChange={(e) => setMinPay(Number(e.target.value))}>
                <option value={0}>Any pay</option>
                {payFloors.map((p) => (
                  <option key={p} value={p}>
                    ₹{p.toLocaleString('en-IN')}+ a month
                  </option>
                ))}
              </select>
            </label>
            {profile && (
              <label className={styles.check}>
                <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
                Matches my skills
              </label>
            )}
          </div>
        </div>

        <div className={styles.countRow}>
          <p className={styles.count} aria-live="polite">
            {results.length} {results.length === 1 ? 'opportunity' : 'opportunities'}
          </p>
          {canSave &&
            (savedNote ? (
              <p className={styles.savedNote}>
                Search saved. We will tell you when a new role matches. <Link to="/panel/saved">See saved searches</Link>
              </p>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={save} disabled={savedSearches.length >= 10}>
                <Bell size={15} /> Save this search
              </button>
            ))}
        </div>

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
                      <span className="tag">{modeOf(o)}</span>
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
