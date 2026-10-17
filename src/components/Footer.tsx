import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.inner}`}>
        <div>
          <p className={styles.brand}>HackShift</p>
          <p className={styles.line}>Talent, ideas and opportunities, from every corner of India.</p>
        </div>
        <nav className={styles.cols} aria-label="Footer">
          <div>
            <p className={styles.head}>Find work</p>
            <Link to="/opportunities">Opportunities</Link>
            <Link to="/challenges">Challenges</Link>
            <Link to="/mentors">Mentors</Link>
          </div>
          <div>
            <p className={styles.head}>Build something</p>
            <Link to="/ventures">Ventures</Link>
            <Link to="/ventures/new">Post your idea</Link>
            <Link to="/schemes">Government schemes</Link>
          </div>
          <div>
            <p className={styles.head}>Hire</p>
            <Link to="/talent">Find talent</Link>
            <Link to="/challenges">Post a challenge</Link>
          </div>
        </nav>
      </div>
      <div className={`wrap ${styles.credit}`}>
        <p>Made at Hack Shift, IIIT Delhi, by Abhishek, Mridul, Aadya and Muskan.</p>
      </div>
    </footer>
  )
}
