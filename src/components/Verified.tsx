import { BadgeCheck } from 'lucide-react'
import styles from './Verified.module.css'

export default function Verified({ label = 'Verified by HackShift' }: { label?: string }) {
  return (
    <span className={styles.badge} title={label}>
      <BadgeCheck size={15} aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </span>
  )
}
