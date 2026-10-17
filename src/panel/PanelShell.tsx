import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, type LucideIcon } from 'lucide-react'
import { kindLabel, useStore } from '../store/AppStore'
import { initials } from './ui'
import styles from './Panel.module.css'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  count?: number
}

const RETURN_KEY = 'hackshift:return-admin'

export function rememberAdmin(id: string) {
  try {
    sessionStorage.setItem(RETURN_KEY, id)
  } catch {
    return
  }
}

function adminToReturn() {
  try {
    return sessionStorage.getItem(RETURN_KEY)
  } catch {
    return null
  }
}

function forgetAdmin() {
  try {
    sessionStorage.removeItem(RETURN_KEY)
  } catch {
    return
  }
}

export default function PanelShell({ nav, children, publicLink }: { nav: NavItem[]; children: ReactNode; publicLink?: { to: string; label: string } }) {
  const { account, signOut, signInAs, accountById } = useStore()
  const navigate = useNavigate()
  if (!account) return null

  const isAdmin = account.kind === 'admin'
  const returnId = !isAdmin ? adminToReturn() : null
  const returnTo = returnId ? accountById(returnId) : undefined

  const leave = () => {
    forgetAdmin()
    signOut()
    navigate('/')
  }

  const backToAdmin = () => {
    if (!returnTo) return
    forgetAdmin()
    signInAs(returnTo.id)
    navigate('/admin/accounts')
  }

  return (
    <div className={`wrap ${styles.shell} ${isAdmin ? styles.admin : ''}`}>
      <aside className={styles.side}>
        <div className={styles.who}>
          <span className={styles.avatar} aria-hidden="true">
            {initials(account.name)}
          </span>
          <div>
            <p className={styles.whoName}>{account.company && account.kind === 'startup' ? account.company : account.name}</p>
            <p className={styles.whoKind}>
              {kindLabel[account.kind]}
              {account.kind === 'recruiter' && account.company ? ` at ${account.company}` : ''}
            </p>
          </div>
        </div>
        <nav className={styles.nav} aria-label="Panel">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? styles.on : undefined)}>
              <item.icon size={17} aria-hidden="true" />
              {item.label}
              {item.count ? <span className={styles.count}>{item.count}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className={styles.foot}>
          {publicLink && (
            <Link to={publicLink.to}>
              <ExternalLink size={15} aria-hidden="true" /> {publicLink.label}
            </Link>
          )}
          <button type="button" onClick={leave}>
            <LogOut size={15} aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>
      <div className={styles.main}>
        {returnTo && (
          <div className={styles.viewing}>
            <span>
              You are viewing HackShift as {account.name}. Anything you change here is saved to their account.
            </span>
            <button type="button" onClick={backToAdmin}>
              Back to admin
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
