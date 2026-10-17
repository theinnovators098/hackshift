import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <section className={`wrap ${styles.page}`}>
      <p className={styles.code}>404</p>
      <h1>This page has shifted somewhere else.</h1>
      <p>The link may be old, or the page was never here. Try one of these instead.</p>
      <div className={styles.links}>
        <Link to="/" className="btn btn-primary">
          Go to home
        </Link>
        <Link to="/opportunities" className="btn btn-ghost">
          Browse opportunities
        </Link>
      </div>
    </section>
  )
}
