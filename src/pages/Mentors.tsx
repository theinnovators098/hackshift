import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Languages, MapPin } from 'lucide-react'
import PageHead from '../components/PageHead'
import { mentors } from '../data/people'
import styles from './Mentors.module.css'

export default function Mentors() {
  const [topic, setTopic] = useState('')
  const [language, setLanguage] = useState('')

  const topics = useMemo(() => Array.from(new Set(mentors.flatMap((m) => m.expertise))).sort(), [])
  const languages = useMemo(() => Array.from(new Set(mentors.flatMap((m) => m.languages))).sort(), [])

  const results = mentors.filter(
    (m) => (!topic || m.expertise.includes(topic)) && (!language || m.languages.includes(language)),
  )

  return (
    <>
      <PageHead
        title="Mentors"
        intro="People who have built, hired and raised before, giving an evening a week. Sessions are free and last 30 minutes."
      />

      <div className="wrap">
        <div className={styles.filters}>
          <div className={styles.topics} role="group" aria-label="Topic">
            <button className="chip" aria-pressed={topic === ''} onClick={() => setTopic('')}>
              Any topic
            </button>
            {topics.map((t) => (
              <button key={t} className="chip" aria-pressed={topic === t} onClick={() => setTopic(topic === t ? '' : t)}>
                {t}
              </button>
            ))}
          </div>
          <label className={styles.lang}>
            <Languages size={18} aria-hidden="true" />
            <span className="visually-hidden">Language</span>
            <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">Any language</option>
              {languages.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>

        {results.length === 0 ? (
          <p className={styles.none}>No mentor covers that topic in that language yet. Try another language.</p>
        ) : (
          <ul className={styles.list}>
            {results.map((m) => (
              <li key={m.id} className={styles.item}>
                <span className={styles.avatar} aria-hidden="true">
                  {m.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </span>
                <div className={styles.body}>
                  <h2>
                    <Link to={`/mentors/${m.id}`}>{m.name}</Link>
                  </h2>
                  <p className={styles.role}>
                    {m.title} at {m.company}
                  </p>
                  <p className={styles.bio}>{m.bio}</p>
                  <div className={styles.tags}>
                    {m.expertise.map((e) => (
                      <span key={e} className={`tag ${e === topic ? 'tag-marigold' : ''}`}>
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.side}>
                  <p>
                    <MapPin size={14} aria-hidden="true" /> {m.city}
                  </p>
                  <p>{m.languages.join(', ')}</p>
                  <p>
                    <strong className="num">{m.sessions}</strong> sessions given
                  </p>
                  <Link to={`/mentors/${m.id}`} className="btn btn-primary btn-sm">
                    Book a session
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
