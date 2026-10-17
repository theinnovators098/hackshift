import type { ReactNode } from 'react'
import styles from './PageHead.module.css'

interface Props {
  title: string
  intro?: ReactNode
  children?: ReactNode
}

export default function PageHead({ title, intro, children }: Props) {
  return (
    <div className={`wrap ${styles.head}`}>
      <div>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>
      {children && <div className={styles.side}>{children}</div>}
    </div>
  )
}
