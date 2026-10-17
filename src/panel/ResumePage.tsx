import { Link } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { PanelHead, panelStyles as styles } from './ui'
import own from './ResumePage.module.css'

export default function ResumePage() {
  const { profile, account, submissions, data } = useStore()
  if (!profile || !account) return null
  const accepted = submissions
    .filter((s) => s.status === 'Accepted')
    .map((s) => data.challenges.find((c) => c.id === s.challengeId))
    .filter((c) => !!c)
  const links = Object.entries(profile.links ?? {}).filter(([, v]) => v)
  const empty = !profile.about && !profile.education?.length && !profile.work?.length

  return (
    <>
      <PanelHead title="Resume" intro="Built from your profile. Print it or save it as a PDF to attach anywhere.">
        <Link to="/panel/profile" className="btn btn-ghost btn-sm">
          Edit profile
        </Link>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
          <Printer size={15} /> Print or save as PDF
        </button>
      </PanelHead>
      {empty && (
        <p className="notice">
          Your resume is thin right now. Add your education and work on the profile page, or upload an old resume there and Millisa will fill it in.
        </p>
      )}
      <article className={`${own.sheet} print-area`}>
        <header className={own.head}>
          <h1>{profile.name}</h1>
          {profile.headline && <p className={own.headline}>{profile.headline}</p>}
          <p className={own.contact}>
            {[profile.city, account.email, ...links.map(([, v]) => String(v).replace(/^https?:\/\//, ''))].filter(Boolean).join('   ')}
          </p>
        </header>
        {profile.about && (
          <section>
            <h2>About</h2>
            <p>{profile.about}</p>
          </section>
        )}
        {profile.work && profile.work.length > 0 && (
          <section>
            <h2>Work and projects</h2>
            {profile.work.map((w, i) => (
              <div key={i} className={own.item}>
                <p className={own.itemHead}>
                  <span>
                    <strong>{w.role}</strong>
                    {w.org && `, ${w.org}`}
                  </span>
                  <span className={own.when}>{w.years}</span>
                </p>
                {w.summary && <p>{w.summary}</p>}
              </div>
            ))}
          </section>
        )}
        {accepted.length > 0 && (
          <section>
            <h2>Verified work on HackShift</h2>
            {accepted.map((c) => (
              <div key={c.id} className={own.item}>
                <p className={own.itemHead}>
                  <span>
                    <strong>{c.title}</strong>, {c.company}
                  </span>
                  <span className={own.when}>Accepted</span>
                </p>
              </div>
            ))}
          </section>
        )}
        {profile.education && profile.education.length > 0 && (
          <section>
            <h2>Education</h2>
            {profile.education.map((e, i) => (
              <p key={i} className={own.itemHead}>
                <span>
                  <strong>{e.degree}</strong>
                  {e.school && `, ${e.school}`}
                </span>
                <span className={own.when}>{e.years}</span>
              </p>
            ))}
          </section>
        )}
        {profile.skills.length > 0 && (
          <section>
            <h2>Skills</h2>
            <p>{profile.skills.join(', ')}</p>
          </section>
        )}
        {profile.certificates && profile.certificates.length > 0 && (
          <section>
            <h2>Certificates</h2>
            {profile.certificates.map((c, i) => (
              <p key={i} className={own.itemHead}>
                <span>
                  <strong>{c.name}</strong>
                  {c.issuer && `, ${c.issuer}`}
                </span>
                <span className={own.when}>{c.year}</span>
              </p>
            ))}
          </section>
        )}
      </article>
      <p className={styles.cardSub}>In the print window, choose “Save as PDF” to get a file.</p>
    </>
  )
}
