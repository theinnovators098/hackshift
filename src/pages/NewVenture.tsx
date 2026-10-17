import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { stageHelp, stages } from '../data/ventures'
import type { Stage } from '../data/types'
import { indianCities } from '../lib/match'
import IdeaCheck from '../millisa/IdeaCheck'
import { useStore } from '../store/AppStore'
import styles from './NewVenture.module.css'

const sectors = ['Agritech', 'Edtech', 'Employment', 'Fintech', 'Healthtech', 'Logistics', 'Retail', 'Sustainability', 'Other']

const needOptions = [
  'Technical co-founder',
  'Business co-founder',
  'Designer',
  'Mentor',
  'First customers',
  'Seed funding',
]

export default function NewVenture() {
  const { profile, addVenture } = useStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [oneLiner, setOneLiner] = useState('')
  const [sector, setSector] = useState('')
  const [city, setCity] = useState(profile?.city ?? '')
  const [stage, setStage] = useState<Stage>('Idea')
  const [problem, setProblem] = useState('')
  const [progress, setProgress] = useState('')
  const [needs, setNeeds] = useState<string[]>([])
  const [error, setError] = useState('')

  if (!profile) {
    return (
      <section className={`wrap ${styles.gate}`}>
        <h1>Post your idea</h1>
        <p>Co-founders and mentors want to know who is behind an idea. Create your profile first, then come back here.</p>
        <Link to="/start" className="btn btn-accent">
          Create your profile
        </Link>
      </section>
    )
  }

  const toggleNeed = (n: string) => setNeeds((list) => (list.includes(n) ? list.filter((x) => x !== n) : [...list, n]))

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !oneLiner.trim() || !sector || !problem.trim()) {
      setError('Fill in the name, one-line description, sector and problem. The rest can wait.')
      return
    }
    const id = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`
    addVenture({
      id,
      name: name.trim(),
      oneLiner: oneLiner.trim(),
      founder: profile.name,
      city: city.trim() || profile.city,
      sector,
      stage,
      problem: problem.trim(),
      progress: progress
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      lookingFor: needs,
      team: 1,
      mine: true,
    })
    navigate(`/ventures/${id}`)
  }

  return (
    <div className={`wrap ${styles.page}`}>
      <Link to="/ventures" className="back-link">
        <ArrowLeft size={16} /> All ventures
      </Link>
      <h1>Post your idea</h1>
      <p className={styles.intro}>
        Keep it short and honest. People decide in a few seconds whether to read more, so lead with the problem.
      </p>

      <form className={styles.form} onSubmit={save} noValidate>
        <div className={styles.two}>
          <label className="field">
            <span>Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mandi Bhav" />
          </label>
          <label className="field">
            <span>Sector</span>
            <select className="input" value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="">Choose one</option>
              {sectors.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>In one line</span>
          <input
            className="input"
            value={oneLiner}
            onChange={(e) => setOneLiner(e.target.value)}
            maxLength={110}
            placeholder="Daily crop prices from nearby mandis, sent on WhatsApp"
          />
          <small>{110 - oneLiner.length} characters left</small>
        </label>

        <label className="field">
          <span>City</span>
          <input className="input" list="venture-cities" value={city} onChange={(e) => setCity(e.target.value)} />
          <datalist id="venture-cities">
            {indianCities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <fieldset className={styles.stages}>
          <legend>Where is it today?</legend>
          {stages.map((s) => (
            <label key={s} className={`${styles.stage} ${stage === s ? styles.stageOn : ''}`}>
              <input type="radio" name="stage" value={s} checked={stage === s} onChange={() => setStage(s)} />
              <span className={styles.stageName}>{s}</span>
              <span className={styles.stageHelp}>{stageHelp[s]}</span>
            </label>
          ))}
        </fieldset>

        <label className="field">
          <span>What problem are you solving, and for whom?</span>
          <textarea
            className="input"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Who has this problem, how do they deal with it today, and why is that not good enough?"
          />
        </label>

        <label className="field">
          <span>Proof so far</span>
          <textarea
            className="input"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            placeholder={'One per line, for example:\nSpoke to 40 shop owners in Indore\n12 signed up for the pilot'}
          />
          <small>Optional, but ideas with real numbers get far more replies.</small>
        </label>

        <fieldset className={styles.needs}>
          <legend>What are you looking for?</legend>
          <div>
            {needOptions.map((n) => (
              <button type="button" key={n} className="chip" aria-pressed={needs.includes(n)} onClick={() => toggleNeed(n)}>
                {n}
              </button>
            ))}
          </div>
        </fieldset>

        <IdeaCheck
          idea={{ name, oneLiner, sector, city, stage, problem, progress, needs }}
          onUseOneLiner={setOneLiner}
          onUseStage={setStage}
        />

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary">
            Post idea
          </button>
          <Link to="/ventures" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
