import { useState } from 'react'
import { ExternalLink, Info } from 'lucide-react'
import PageHead from '../components/PageHead'
import { schemes } from '../data/schemes'
import { stages } from '../data/ventures'
import type { FounderGroup, Scheme, SchemeNeed, Stage } from '../data/types'
import styles from './Schemes.module.css'

const needLabels: Record<SchemeNeed, string> = {
  grant: 'A grant I do not repay',
  loan: 'A loan without collateral',
  incubation: 'Workspace and mentoring',
  recognition: 'Official startup status',
}

export default function Schemes() {
  const [stage, setStage] = useState<Stage | null>(null)
  const [needs, setNeeds] = useState<SchemeNeed[]>([])
  const [groups, setGroups] = useState<FounderGroup[]>([])

  const toggleNeed = (n: SchemeNeed) => setNeeds((l) => (l.includes(n) ? l.filter((x) => x !== n) : [...l, n]))
  const toggleGroup = (g: FounderGroup) => setGroups((l) => (l.includes(g) ? l.filter((x) => x !== g) : [...l, g]))

  const eligible = (s: Scheme) => !s.onlyFor || s.onlyFor.some((g) => groups.includes(g))

  const fits = (s: Scheme) =>
    eligible(s) && (!stage || s.stages.includes(stage)) && (needs.length === 0 || s.needs.some((n) => needs.includes(n)))

  const answered = stage !== null || needs.length > 0
  const matched = schemes.filter(fits)
  const others = schemes.filter((s) => !fits(s))

  return (
    <>
      <PageHead
        title="Government schemes"
        intro="The Government of India runs several schemes for new founders. Answer three questions and we will show the ones that fit you."
      />

      <div className={`wrap ${styles.layout}`}>
        <form className={styles.quiz} onSubmit={(e) => e.preventDefault()}>
          <fieldset>
            <legend>Where is your venture right now?</legend>
            <div className={styles.options}>
              {stages.map((s) => (
                <button type="button" key={s} className="chip" aria-pressed={stage === s} onClick={() => setStage(stage === s ? null : s)}>
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>What do you need most?</legend>
            <div className={styles.stack}>
              {(Object.keys(needLabels) as SchemeNeed[]).map((n) => (
                <label key={n} className={styles.check}>
                  <input type="checkbox" checked={needs.includes(n)} onChange={() => toggleNeed(n)} />
                  {needLabels[n]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Do any of these apply to a founder?</legend>
            <div className={styles.stack}>
              <label className={styles.check}>
                <input type="checkbox" checked={groups.includes('women')} onChange={() => toggleGroup('women')} />
                A founder is a woman
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={groups.includes('scst')} onChange={() => toggleGroup('scst')} />
                A founder is from an SC or ST community
              </label>
            </div>
            <p className={styles.small}>Some schemes are reserved for these founders. We do not store this answer.</p>
          </fieldset>
        </form>

        <div className={styles.results} aria-live="polite">
          <h2 className={styles.resultsTitle}>
            {answered
              ? matched.length === 0
                ? 'No exact match yet'
                : `${matched.length} ${matched.length === 1 ? 'scheme fits' : 'schemes fit'} your answers`
              : 'All schemes'}
          </h2>
          {answered && matched.length === 0 && (
            <p className={styles.small}>Try selecting another need. Most founders start with DPIIT recognition.</p>
          )}

          <ul className={styles.list}>
            {(answered ? matched : schemes).map((s) => (
              <SchemeItem key={s.id} scheme={s} highlight={answered} />
            ))}
          </ul>

          {answered && others.length > 0 && (
            <>
              <h3 className={styles.othersTitle}>Other schemes</h3>
              <ul className={`${styles.list} ${styles.dim}`}>
                {others.map((s) => (
                  <SchemeItem key={s.id} scheme={s} />
                ))}
              </ul>
            </>
          )}

          <p className={styles.note}>
            <Info size={16} aria-hidden="true" />
            Amounts and rules change often. Always check the official website before you apply, and never pay an
            agent to apply for you.
          </p>
        </div>
      </div>
    </>
  )
}

function SchemeItem({ scheme, highlight }: { scheme: Scheme; highlight?: boolean }) {
  return (
    <li className={`${styles.item} ${highlight ? styles.fit : ''}`}>
      <div className={styles.itemHead}>
        <h3>{scheme.name}</h3>
        <span className={`num ${styles.amount}`}>{scheme.amount}</span>
      </div>
      <p className={styles.runBy}>{scheme.runBy}</p>
      <p>{scheme.summary}</p>
      <div className={styles.itemFoot}>
        <span className={styles.stagesList}>For: {scheme.stages.join(', ')}</span>
        {scheme.onlyFor && <span className="tag tag-marigold">Women and SC/ST founders</span>}
        <a href={scheme.link} target="_blank" rel="noreferrer">
          Official website <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </li>
  )
}
