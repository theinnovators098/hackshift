import { useEffect, useState } from 'react'
import { MoveRight } from 'lucide-react'
import { shifts } from '../data/people'
import styles from './ShiftBoard.module.css'

const VISIBLE = 5

export default function ShiftBoard() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setTick((t) => t + 1), 4000)
    return () => window.clearInterval(id)
  }, [])

  const rows = Array.from({ length: VISIBLE }, (_, i) => {
    const index = (((tick - i) % shifts.length) + shifts.length) % shifts.length
    return { ...shifts[index], key: tick - i }
  })

  return (
    <section className={styles.board} aria-labelledby="board-title">
      <div className={styles.top}>
        <h2 id="board-title">Shifts this week</h2>
        <span className={styles.live}>
          <span className={styles.dot} aria-hidden="true" />
          Live
        </span>
      </div>
      <ol className={styles.list}>
        {rows.map((row, i) => (
          <li key={row.key} className={styles.row} style={{ animationDelay: tick === 0 ? `${i * 120}ms` : '0ms' }}>
            <p className={styles.who}>
              {row.name}, {row.city}
            </p>
            <p className={styles.move}>
              <span className={styles.from}>{row.from}</span>
              <MoveRight size={16} className={styles.arrow} aria-label="to" />
              <span className={styles.to}>{row.to}</span>
            </p>
            <span className={styles.via}>{row.via}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
