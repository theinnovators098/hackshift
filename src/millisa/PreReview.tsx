import { askJson, SMART } from '../lib/millisa'
import { preReviewRequest, type PreReview as Review, type Readiness } from '../lib/millisaPrompts'
import type { Challenge } from '../data/types'
import { useMillisa, useMillisaTask } from './MillisaProvider'
import { MillisaBox, Points, Problem, SavedNote, Thinking } from './parts'
import styles from './Millisa.module.css'

const label: Record<Readiness, string> = {
  Ready: 'Ready to submit',
  Almost: 'Almost there',
  'Not yet': 'Not ready yet',
}

const tone: Record<Readiness, string> = {
  Ready: styles.strong,
  Almost: styles.middle,
  'Not yet': styles.weak,
}

interface Props {
  challenge: Challenge
  link: string
  note: string
  onUseNote: (note: string) => void
}

export default function PreReview({ challenge, link, note, onUseNote }: Props) {
  const { lang } = useMillisa()
  const review = useMillisaTask<Review>()
  const empty = !link.trim() && !note.trim()

  const check = () =>
    review.run((signal) =>
      askJson<Review>({ model: SMART, ...preReviewRequest(challenge, link.trim(), note.trim(), lang), signal }),
    )

  return (
    <MillisaBox title="Pre-review before you submit">
      {review.status === 'loading' ? (
        <Thinking>Millisa is checking your note against the brief</Thinking>
      ) : review.status === 'error' ? (
        <Problem message={review.error ?? ''} onRetry={check} />
      ) : review.status === 'done' && review.data ? (
        <>
          {review.saved && <SavedNote />}
          <div className={styles.verdict}>
            <strong className={tone[review.data.readiness] ?? ''}>
              {label[review.data.readiness] ?? review.data.readiness}
            </strong>
          </div>
          <p className={styles.summary}>{review.data.summary}</p>
          <Points title="Covered" items={review.data.covered} tone="good" />
          <Points title="Missing or unclear" items={review.data.missing} tone="gap" />
          <Points title={`${challenge.company} may ask`} items={review.data.questions} tone="plain" />
          {review.data.note && (
            <div className={styles.rewrite}>
              <p>A clearer note</p>
              <blockquote>{review.data.note}</blockquote>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUseNote(review.data!.note)}>
                Use this note
              </button>
            </div>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={check}>
            Check again
          </button>
        </>
      ) : (
        <>
          <p>
            Millisa compares your link and note with what {challenge.company} asked for, and tells you what a reviewer
            might flag. It cannot open the link itself.
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={check} disabled={empty}>
            Pre-review my work
          </button>
          {empty && <p>Add your link or note above first.</p>}
        </>
      )}
    </MillisaBox>
  )
}
