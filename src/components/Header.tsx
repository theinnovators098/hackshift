import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useStore } from '../store/AppStore'
import styles from './Header.module.css'

const links = [
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/ventures', label: 'Ventures' },
  { to: '/mentors', label: 'Mentors' },
  { to: '/talent', label: 'Find talent' },
  { to: '/schemes', label: 'Schemes' },
]

export default function Header() {
  const { profile } = useStore()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.bar}`}>
        <Link to="/" className={styles.logo} aria-label="HackShift home">
          <span className={styles.mark} aria-hidden="true">
            H
          </span>
          HackShift
        </Link>

        <nav className={`${styles.nav} ${open ? styles.navOpen : ''}`} aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? styles.active : undefined)}>
              {l.label}
            </NavLink>
          ))}
          <div className={styles.mobileCta}>
            {profile ? (
              <Link to="/dashboard" className="btn btn-primary">
                My dashboard
              </Link>
            ) : (
              <Link to="/start" className="btn btn-accent">
                Create your profile
              </Link>
            )}
          </div>
        </nav>

        <div className={styles.right}>
          {profile ? (
            <Link to="/dashboard" className={styles.me}>
              <span className={styles.avatar} aria-hidden="true">
                {profile.name.charAt(0).toUpperCase()}
              </span>
              <span className={styles.meName}>{profile.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link to="/start" className={`btn btn-primary btn-sm ${styles.startBtn}`}>
              Create your profile
            </Link>
          )}
          <button
            className={styles.toggle}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  )
}
