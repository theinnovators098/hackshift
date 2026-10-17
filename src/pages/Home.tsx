import { Link } from 'react-router-dom'
import { Clock, IndianRupee } from 'lucide-react'
import ShiftBoard from '../components/ShiftBoard'
import { challenges } from '../data/challenges'
import { stageHelp, stages, ventures } from '../data/ventures'
import { useStore } from '../store/AppStore'
import styles from './Home.module.css'

const roles = [
  {
    name: 'Looking for work',
    text: 'Skip the resume pile. Finish a short paid task from a real startup and get an interview on the strength of what you made.',
    cta: 'See open challenges',
    to: '/challenges',
  },
  {
    name: 'Sitting on an idea',
    text: 'Post it, track it from idea to funded, and find the co-founder and mentors you are missing.',
    cta: 'Post your idea',
    to: '/ventures/new',
  },
  {
    name: 'Running a startup',
    text: 'Put a real problem out as a challenge. Hire the person whose answer you would have shipped.',
    cta: 'Browse people with proof of work',
    to: '/talent',
  },
  {
    name: 'Ready to mentor',
    text: 'Give an hour a week. People book you with a specific question, so every session has a point.',
    cta: 'Meet the mentors',
    to: '/mentors',
  },
  {
    name: 'Hiring for a team',
    text: 'Search by work people have finished, their city and when they can start, instead of keywords on a CV.',
    cta: 'Search talent',
    to: '/talent',
  },
]

const steps = [
  { title: 'Pick a challenge', text: 'Each one is a real problem a startup has right now, sized to take an evening or a weekend.' },
  { title: 'Do the work and send a link', text: 'GitHub, Figma, a Google Doc. Whatever the brief asks for, with a short note on your thinking.' },
  { title: 'The startup reviews it', text: 'Every submission is read within seven days. The best ones get paid and get an interview.' },
  { title: 'It stays on your profile', text: 'Accepted work becomes a badge that recruiters can search. It travels with you to the next job.' },
]

const cities = [
  ['Indore', 312],
  ['Lucknow', 207],
  ['Jaipur', 268],
  ['Kochi', 190],
  ['Surat', 176],
  ['Bhubaneswar', 144],
  ['Nashik', 121],
  ['Patna', 98],
  ['Guwahati', 87],
  ['Coimbatore', 134],
  ['Warangal', 73],
  ['Ranchi', 66],
  ['Dehradun', 59],
  ['Mangaluru', 81],
] as const

export default function Home() {
  const { profile } = useStore()
  const featured = challenges[0]
  const funded = ventures.find((v) => v.stage === 'Funded')!

  return (
    <>
      <section className={`wrap ${styles.hero}`}>
        <div className={styles.heroText}>
          <h1 className={styles.headline}>
            Do real work.
            <br />
            Get found for it.
          </h1>
          <p className={styles.lede}>
            HackShift brings together job seekers, founders, startups, mentors and recruiters from across India. Take on
            a short paid task from a startup, find a co-founder for your idea, or book an hour with someone who has
            done it before.
          </p>
          <div className={styles.actions}>
            {profile ? (
              <Link to="/dashboard" className="btn btn-accent">
                Go to your dashboard
              </Link>
            ) : (
              <Link to="/start" className="btn btn-accent">
                Create your profile
              </Link>
            )}
            <Link to="/opportunities" className="btn btn-ghost">
              Browse opportunities
            </Link>
          </div>
          <p className={styles.proof}>
            <strong className="num">2,418</strong> challenges finished this year, by people from{' '}
            <strong className="num">183</strong> cities.
          </p>
        </div>
        <ShiftBoard />
      </section>

      <section className={`wrap ${styles.section}`} aria-labelledby="roles-title">
        <h2 id="roles-title" className={styles.sectionTitle}>
          Where are you right now?
        </h2>
        <ul className={styles.roles}>
          {roles.map((r) => (
            <li key={r.name} className={styles.role}>
              <h3>{r.name}</h3>
              <p>{r.text}</p>
              <Link to={r.to}>{r.cta}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.band} aria-labelledby="how-title">
        <div className={`wrap ${styles.how}`}>
          <div className={styles.howIntro}>
            <h2 id="how-title" className={styles.sectionTitle}>
              How a challenge works
            </h2>
            <p>A resume says what you studied. A challenge shows what you can do with it.</p>
            <Link to={`/challenges/${featured.id}`} className={styles.example}>
              <span className={styles.exampleCompany}>{featured.company}</span>
              <span className={styles.exampleTitle}>{featured.title}</span>
              <span className={styles.exampleMeta}>
                <span>
                  <Clock size={14} aria-hidden="true" /> About {featured.hours} hours
                </span>
                <span>
                  <IndianRupee size={14} aria-hidden="true" /> {featured.reward.split(' + ')[0].replace('₹', '')}
                </span>
              </span>
            </Link>
          </div>
          <ol className={styles.steps}>
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className={styles.stepNum} aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`wrap ${styles.section}`} aria-labelledby="venture-title">
        <div className={styles.ventureHead}>
          <h2 id="venture-title" className={styles.sectionTitle}>
            From an idea to a company
          </h2>
          <p>
            Every venture on HackShift sits at one of four stages. Founders move forward when they have proof, and
            mentors can see exactly where to help.
          </p>
        </div>
        <ol className={styles.track}>
          {stages.map((stage) => (
            <li key={stage} className={stage === funded.stage ? styles.trackDone : undefined}>
              <h3>{stage}</h3>
              <p>{stageHelp[stage]}</p>
            </li>
          ))}
        </ol>
        <div className={styles.story}>
          <div>
            <p className={styles.storyName}>
              {funded.name}, {funded.city}
            </p>
            <p className={styles.storyLine}>{funded.oneLiner}.</p>
          </div>
          <ul>
            {funded.progress.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className={styles.storyActions}>
            <Link to={`/ventures/${funded.id}`} className="btn btn-ghost btn-sm">
              Read their story
            </Link>
            <Link to="/schemes" className="btn btn-ghost btn-sm">
              Find a scheme for your idea
            </Link>
          </div>
        </div>
      </section>

      <section className={`wrap ${styles.section}`} aria-labelledby="cities-title">
        <h2 id="cities-title" className={styles.sectionTitle}>
          Not just Bengaluru and Gurugram
        </h2>
        <p className={styles.citiesIntro}>
          Most of the people who joined last month live outside the big metros. These cities sent the most:
        </p>
        <p className={styles.cities}>
          {cities.map(([city, count]) => (
            <span key={city}>
              {city}
              <sup className="num">{count}</sup>
            </span>
          ))}
        </p>
      </section>

      <section className={`wrap ${styles.close}`}>
        <h2>Your next shift starts with a profile.</h2>
        <p>Tell us where you are and what you want next. It takes about two minutes.</p>
        <Link to={profile ? '/dashboard' : '/start'} className="btn btn-accent">
          {profile ? 'Go to your dashboard' : 'Create your profile'}
        </Link>
      </section>
    </>
  )
}
