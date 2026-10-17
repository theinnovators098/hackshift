import { CalendarClock, Check, MessageSquare, Send, Briefcase, ArrowRight, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useMillisaTools } from './tools'
import styles from './TaskCard.module.css'

const icons: Record<string, LucideIcon> = {
  apply_to_opportunity: Send,
  request_mentor_session: CalendarClock,
  send_message: MessageSquare,
  create_role_draft: Briefcase,
  move_applicant: ArrowRight,
  save_opportunity: Check,
}

const words = { waiting: 'Waiting for you', done: 'Done', declined: 'Declined', failed: 'Did not work' }

export default function TaskCard({ id, compact = false }: { id: string; compact?: boolean }) {
  const { data } = useStore()
  const { approve, decline } = useMillisaTools()
  const task = data.tasks.find((t) => t.id === id)
  if (!task) return null
  const Icon = icons[task.tool] ?? Check
  const a = task.args
  const detail =
    task.tool === 'apply_to_opportunity'
      ? String(a.note ?? '')
      : task.tool === 'send_message'
        ? String(a.text ?? '')
        : task.tool === 'request_mentor_session'
          ? String(a.topic ?? '')
          : task.tool === 'create_role_draft'
            ? `${a.kind}, ${a.city}${a.remote ? ' (remote ok)' : ''}. ${a.pay}. Skills: ${((a.skills as string[]) ?? []).join(', ')}`
            : ''

  return (
    <div className={`${styles.card} ${styles[task.status]} ${compact ? styles.compact : ''}`}>
      <div className={styles.head}>
        <Icon size={16} aria-hidden="true" />
        <p className={styles.summary}>{task.summary}</p>
        <span className={styles.status}>{words[task.status]}</span>
      </div>
      {detail && <blockquote className={styles.detail}>{detail}</blockquote>}
      {task.status === 'waiting' && (
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => approve(task.id)}>
            <Check size={15} /> Approve
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => decline(task.id)}>
            <X size={15} /> Decline
          </button>
        </div>
      )}
    </div>
  )
}
