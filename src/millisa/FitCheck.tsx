import { Link } from 'react-router-dom'
import { MessagesSquare } from 'lucide-react'
import { askJson, SMART } from '../lib/millisa'
import { fitRequest, type Fit, type Verdict } from '../lib/millisaPrompts'
import type { Challenge, Opportunity } from '../data/types'
import { useStore } from '../store/AppStore'
import { useMillisa, useMillisaTask } from './MillisaProvider'
import { MillisaBox, Points, Problem, SavedNote, Thinking } from './parts'
import styles from './Millisa.module.css'

const tone: Record<Verdict, string> = {
  'Strong fit': styles.strong,
  'Good fit': styles.middle,
  Stretch: styles.weak,
}

export default function FitCheck({ opportunity, challenge }: { opportunity: Opportunity; challenge?: Challenge }) {
  const { profile, submissions } = useStore()
  const { lang } = useMillisa()
  const fit = useMillisaTask<Fit>()

  const check = () => {
    if (!profile) return
    const submission = challenge && submissions.find((s) => s.challengeId === challenge.id)
    fit.run((signal) => askJson<Fit>({ model: SMART, ...fitRequest(profile, opportunity, challenge, submission, lang), signal }))
  }

  return (
    <MillisaBox title="Is this role for you?">
      {!profile ? (
        <p>Create a profile and Millisa will tell you how well you fit this role, and what to work on first.</p>
      ) : fit.status === 'idle' ? (
        <>
          <p>Millisa reads the role and your profile, then tells you honestly where you stand.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={check}>
            Check my fit
          </button>
        </>
      ) : fit.status === 'loading' ? (
        <Thinking>Millisa is comparing your skills with the role</Thinking>
      ) : fit.status === 'error' ? (
        <Problem message={fit.error ?? ''} onRetry={check} />
      ) : (
        fit.data && (
          <>
            {fit.saved && <SavedNote />}
            <div className={styles.verdict}>
              <strong className={tone[fit.data.verdict] ?? ''}>{fit.data.verdict}</strong>
            </div>
            <p className={styles.summary}>{fit.data.summary}</p>
            <Points title="What you already have" items={fit.data.strengths} tone="good" />
            <Points title="What is missing" items={fit.data.gaps} tone="gap" />
            <p className={styles.step}>
              <strong>Do this first</strong>
              {fit.data.firstStep}
            </p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={check}>
              Check again
            </button>
          </>
        )
      )}

      <Link to={`/opportunities/${opportunity.id}/practice`} className={`btn btn-ghost btn-sm ${styles.trigger}`}>
        <MessagesSquare size={16} /> Practice the interview
      </Link>
    </MillisaBox>
  )
}
