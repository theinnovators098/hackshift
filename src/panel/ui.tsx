import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './Panel.module.css'

export function PanelHead({ title, intro, children }: { title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className={styles.head}>
      <div>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>
      {children && <div className={styles.headActions}>{children}</div>}
    </header>
  )
}

export interface StatItem {
  label: string
  value: number | string
  to?: string
  hot?: boolean
}

export function Stats({ items }: { items: StatItem[] }) {
  return (
    <div className={styles.stats}>
      {items.map((s) => {
        const body = (
          <>
            <p className={styles.statValue}>{s.value}</p>
            <p className={styles.statLabel}>{s.label}</p>
          </>
        )
        const cls = `${styles.stat} ${s.hot ? styles.statHot : ''}`
        return s.to ? (
          <Link key={s.label} to={s.to} className={cls}>
            {body}
          </Link>
        ) : (
          <div key={s.label} className={cls}>
            {body}
          </div>
        )
      })}
    </div>
  )
}

export function Section({ title, link, children }: { title: string; link?: { to: string; label: string }; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>{title}</h2>
        {link && <Link to={link.to}>{link.label}</Link>}
      </div>
      {children}
    </section>
  )
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

const tones: Record<string, string> = {
  live: 'tag-leaf',
  Accepted: 'tag-leaf',
  Hired: 'tag-leaf',
  'Under review': 'tag-marigold',
  Proposed: 'tag-marigold',
  'New time asked': 'tag-rose',
  Rejected: 'tag-rose',
  Interview: 'tag-leaf',
  Confirmed: 'tag-leaf',
  Done: 'tag-leaf',
  Offer: 'tag-leaf',
  active: 'tag-leaf',
  pending: 'tag-marigold',
  'In review': 'tag-marigold',
  Shortlisted: 'tag-marigold',
  Requested: 'tag-marigold',
  Contacted: 'tag-marigold',
  hidden: 'tag-rose',
  'Not selected': 'tag-rose',
  Declined: 'tag-rose',
  suspended: 'tag-rose',
  'Not a fit': 'tag-rose',
}

const words: Record<string, string> = {
  live: 'Live',
  pending: 'Waiting for review',
  hidden: 'Hidden',
  active: 'Active',
  suspended: 'Suspended',
}

export function Status({ value }: { value: string }) {
  return <span className={`tag ${tones[value] ?? ''}`}>{words[value] ?? value}</span>
}

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function lines(text: string) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

export function commaList(text: string) {
  return Array.from(
    new Set(
      text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  )
}

export function slug(text: string) {
  return `${text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`
}

export { styles as panelStyles }
