import { askJson, SMART } from '../lib/millisa'
import { ideaRequest, type IdeaDraft, type IdeaReview } from '../lib/millisaPrompts'
import type { Stage } from '../data/types'
import { useMillisa, useMillisaTask } from './MillisaProvider'
import { MillisaBox, Points, Problem, SavedNote, Thinking } from './parts'
import styles from './IdeaCheck.module.css'
import shared from './Millisa.module.css'

interface Props {
  idea: IdeaDraft
  onUseOneLiner: (text: string) => void
  onUseStage: (stage: Stage) => void
}

export default function IdeaCheck({ idea, onUseOneLiner, onUseStage }: Props) {
  const { lang } = useMillisa()
  const review = useMillisaTask<IdeaReview>()
  const ready = idea.problem.trim().length >= 20 && (idea.oneLiner.trim() || idea.name.trim())

  const check = () => review.run((signal) => askJson<IdeaReview>({ model: SMART, ...ideaRequest(idea, lang), signal }))

  const r = review.data

  return (
    <MillisaBox title="Check your idea before you post it">
      {review.status === 'loading' ? (
        <Thinking>Millisa is reading your idea like a co-founder would</Thinking>
      ) : review.status === 'error' ? (
        <Problem message={review.error ?? ''} onRetry={check} />
      ) : review.status === 'done' && r ? (
        <>
          {review.saved && <SavedNote />}
          <p className={shared.summary}>{r.verdict}</p>

          <div className={styles.grid}>
            <Points title="Already strong" items={r.strengths} tone="good" />
            <Points title="What people will ask next" items={r.questions} tone="gap" />
          </div>

          <div className={styles.stage}>
            <p>
              <strong>Stage: {r.stage}</strong> {r.stageReason}
            </p>
            {r.stage !== idea.stage && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUseStage(r.stage)}>
                Change stage to {r.stage}
              </button>
            )}
          </div>

          <div>
            <h3 className={styles.heading}>Three cheap ways to test it</h3>
            <ol className={styles.experiments}>
              {r.experiments.map((x) => (
                <li key={x.title}>
                  <div className={styles.expHead}>
                    <strong>{x.title}</strong>
                    <span className="tag">{x.cost}</span>
                  </div>
                  <p>{x.how}</p>
                </li>
              ))}
            </ol>
          </div>

          {r.oneLiner && r.oneLiner !== idea.oneLiner && (
            <div className={shared.rewrite}>
              <p>A sharper one-liner</p>
              <blockquote>{r.oneLiner}</blockquote>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUseOneLiner(r.oneLiner.slice(0, 110))}>
                Use this one-liner
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
            Millisa reads your idea the way a co-founder or mentor would. It checks the stage, lists the questions people
            will ask, and suggests three cheap ways to test it this month.
          </p>
          <div>
            <button type="button" className="btn btn-primary btn-sm" onClick={check} disabled={!ready}>
              Check with Millisa
            </button>
          </div>
          {!ready && <p>Write the one-liner and a few lines about the problem first.</p>}
        </>
      )}
    </MillisaBox>
  )
}
