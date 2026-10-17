import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { panelPath, useStore } from '../store/AppStore'
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
  const { account } = useStore()
  const home = account ? panelPath(account.kind) : '/start'
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
            {account ? (
              <Link to={home} className="btn btn-primary">
                {account.kind === 'admin' ? 'Admin panel' : 'My panel'}
              </Link>
            ) : (
              <>
                <Link to="/start" className="btn btn-accent">
                  Create your profile
                </Link>
                <Link to="/login" className="btn btn-ghost">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className={styles.right}>
          {account ? (
            <Link to={home} className={styles.me} aria-label={`Open ${account.kind === 'admin' ? 'admin panel' : 'my panel'}`}>
              <span className={`${styles.avatar} ${account.kind === 'admin' ? styles.adminAvatar : ''}`} aria-hidden="true">
                {account.name.charAt(0).toUpperCase()}
              </span>
              <span className={styles.meName}>{account.kind === 'admin' ? 'Admin' : account.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className={styles.signIn}>
                Sign in
              </Link>
              <Link to="/start" className={`btn btn-primary btn-sm ${styles.startBtn}`}>
                Create your profile
              </Link>
            </>
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
