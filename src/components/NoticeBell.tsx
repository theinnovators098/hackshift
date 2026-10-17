import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { timeAgo } from '../panel/ui'
import { useStore } from '../store/AppStore'
import styles from './NoticeBell.module.css'

export default function NoticeBell() {
  const { notices, markNoticesRead, openNotice, account } = useStore()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const unread = notices.filter((n) => !n.read).length

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  if (!account) return null

  const go = (id: string, link?: string) => {
    openNotice(id)
    setOpen(false)
    if (link) navigate(account.kind === 'admin' ? link.replace(/^\/panel/, '/admin') : link)
  }

  return (
    <div className={styles.wrap} ref={box}>
      <button
        type="button"
        className={styles.bell}
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && <span className={styles.dot}>{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Notifications">
          <div className={styles.head}>
            <p>Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markNoticesRead}>
                Mark all as read
              </button>
            )}
          </div>
          {notices.length === 0 ? (
            <p className={styles.empty}>Nothing yet. You will hear here when someone replies, reviews your work or books you.</p>
          ) : (
            <ul>
              {notices.slice(0, 12).map((n) => (
                <li key={n.id}>
                  <button type="button" className={n.read ? undefined : styles.unread} onClick={() => go(n.id, n.link)}>
                    <span>{n.text}</span>
                    <time dateTime={n.at}>{timeAgo(n.at)}</time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
