import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { askJson, SMART } from '../lib/millisa'
import { planRequest, type PlanReply } from '../lib/millisaPrompts'
import { useMillisa, useMillisaTask } from '../millisa/MillisaProvider'
import { LangToggle, MillisaMark, Problem, SavedNote, Thinking } from '../millisa/parts'
import { today, useStore } from '../store/AppStore'
import { Empty, PanelHead, Section, panelStyles as styles } from './ui'
import own from './CareerPlan.module.css'

export default function CareerPlan() {
  const { profile, account, challenges, mentors, opportunities, saveCareerPlan, submissions } = useStore()
  const { lang } = useMillisa()
  const task = useMillisaTask<PlanReply>()
  const plan = account?.careerPlan
  const [target, setTarget] = useState(plan?.target ?? profile?.goal ?? '')

  if (!profile || !account) return null

  const make = (e?: FormEvent) => {
    e?.preventDefault()
    if (target.trim().length < 3) return
    task.run(async (signal) => {
      const res = await askJson<PlanReply>({ model: SMART, ...planRequest(profile, target.trim(), { challenges, mentors, opportunities }, lang), signal })
      const valid = {
        ...res.data,
        challengeIds: res.data.challengeIds.filter((id) => challenges.some((c) => c.id === id)),
        mentorIds: res.data.mentorIds.filter((id) => mentors.some((m) => m.id === id)),
      }
      saveCareerPlan({ ...valid, target: target.trim(), madeOn: today() })
      return { data: valid, saved: res.saved }
    })
  }

  const done = (id: string) => submissions.some((s) => s.challengeId === id)

  return (
    <>
      <PanelHead title="Career plan" intro="Tell Millisa the role you want. It compares it with your profile and lays out the next few weeks.">
        <LangToggle />
      </PanelHead>

      <form className={own.ask} onSubmit={make}>
        <MillisaMark size={30} />
        <label className="field">
          <span>The role you want</span>
          <input
            className="input"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Frontend developer at a fintech startup"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={task.status === 'loading' || target.trim().length < 3}>
          {plan ? 'Make a new plan' : 'Make my plan'}
        </button>
      </form>

      {task.status === 'loading' && <Thinking>Millisa is comparing your profile with the role</Thinking>}
      {task.status === 'error' && <Problem message={task.error ?? ''} onRetry={() => make()} />}
      {task.saved && <SavedNote />}

      {!plan ? (
        task.status !== 'loading' && (
          <Empty title="No plan yet">
            A plan works best when your profile has your skills, education and projects. <Link to="/panel/profile">Check your profile</Link>.
          </Empty>
        )
      ) : (
        <>
          <p className={styles.cardSub}>
            Plan for “{plan.target}”, made on {plan.madeOn}.
          </p>
          <div className={styles.two}>
            <Section title="What you already have">
              <ul className={own.have}>
                {plan.have.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </Section>
            <Section title="What to learn">
              <ul className={own.gaps}>
                {plan.gaps.map((g) => (
                  <li key={g.skill}>
                    <strong>{g.skill}</strong>
                    <span>{g.why}</span>
                    <span className={own.how}>{g.how}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section title="Week by week">
            <ol className={own.weeks}>
              {plan.weeks.map((w) => (
                <li key={w.week}>
                  <p className={own.weekNum}>Week {w.week}</p>
                  <p className={own.weekFocus}>{w.focus}</p>
                  <ul>
                    {w.tasks.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </Section>

          <div className={styles.two}>
            <Section title="Prove it with a challenge">
              {plan.challengeIds.length === 0 ? (
                <Empty title="No matching challenge right now" />
              ) : (
                <ul className={styles.feed}>
                  {plan.challengeIds.map((id) => {
                    const c = challenges.find((x) => x.id === id)
                    return c ? (
                      <li key={id}>
                        <Link to={`/challenges/${id}`}>{c.title}</Link>
                        <span className={styles.cellSub}>{done(id) ? 'Submitted' : `${c.company}, about ${c.hours} hours`}</span>
                      </li>
                    ) : null
                  })}
                </ul>
              )}
            </Section>
            <Section title="People who can help">
              {plan.mentorIds.length === 0 ? (
                <Empty title="No mentor picked" />
              ) : (
                <ul className={styles.feed}>
                  {plan.mentorIds.map((id) => {
                    const m = mentors.find((x) => x.id === id)
                    return m ? (
                      <li key={id}>
                        <Link to={`/mentors/${id}`}>{m.name}</Link>
                        <span className={styles.cellSub}>{m.title}</span>
                      </li>
                    ) : null
                  })}
                </ul>
              )}
            </Section>
          </div>
        </>
      )}
    </>
  )
}
