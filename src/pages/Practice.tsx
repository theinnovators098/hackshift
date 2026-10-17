import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { askJson, looksHindi, SMART } from '../lib/millisa'
import { feedbackRequest, questionsRequest, type Feedback, type Question } from '../lib/millisaPrompts'
import { useMillisa, useMillisaTask } from '../millisa/MillisaProvider'
import { LangToggle, MillisaMark, Problem, SavedNote, Thinking } from '../millisa/parts'
import { useStore } from '../store/AppStore'
import NotFound from './NotFound'
import styles from './Practice.module.css'

interface Result {
  question: Question
  answer: string
  feedback: Feedback
}

function Score({ value }: { value: number }) {
  const score = Math.max(1, Math.min(5, Math.round(value)))
  return (
    <span className={styles.score} aria-label={`${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= score ? styles.on : undefined} />
      ))}
      <b className="num">{score}/5</b>
    </span>
  )
}

export default function Practice() {
  const { id } = useParams()
  const { profile, opportunities } = useStore()
  const { lang } = useMillisa()
  const questions = useMillisaTask<{ questions: Question[] }>()
  const feedback = useMillisaTask<Feedback>()
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [results, setResults] = useState<Result[]>([])

  const o = opportunities.find((x) => x.id === id)
  if (!o) return <NotFound />

  const list = questions.data?.questions ?? []
  const current = list[index]
  const finished = questions.status === 'done' && list.length > 0 && index >= list.length

  const start = () => {
    setIndex(0)
    setResults([])
    setAnswer('')
    feedback.reset()
    questions.run((signal) => askJson({ model: SMART, ...questionsRequest(o, profile, lang), signal }))
  }

  const getFeedback = (e?: FormEvent) => {
    e?.preventDefault()
    if (!current || answer.trim().length < 3) return
    const answerLang = looksHindi(answer) ? 'hi' : lang
    feedback.run((signal) =>
      askJson<Feedback>({ model: SMART, ...feedbackRequest(o, profile, current, answer.trim(), answerLang), signal }),
    )
  }

  const next = () => {
    if (!current || !feedback.data) return
    setResults((r) => [...r, { question: current, answer: answer.trim(), feedback: feedback.data! }])
    setAnswer('')
    feedback.reset()
    setIndex((i) => i + 1)
  }

  const average = results.length ? results.reduce((sum, r) => sum + r.feedback.score, 0) / results.length : 0
  const focus = [...results].sort((a, b) => a.feedback.score - b.feedback.score).slice(0, 2)

  return (
    <div className={`wrap ${styles.page}`}>
      <Link to={`/opportunities/${o.id}`} className="back-link">
        <ArrowLeft size={16} /> Back to the role
      </Link>

      <header className={styles.head}>
        <div>
          <p className={styles.kicker}>
            <MillisaMark size={20} /> Practice interview with Millisa
          </p>
          <h1>
            {o.title}, {o.company}
          </h1>
        </div>
        <LangToggle />
      </header>

      {questions.status === 'idle' && (
        <section className={styles.card}>
          <h2>Five questions, written for this role</h2>
          <ol className={styles.how}>
            <li>Millisa asks the kind of questions the {o.company} founder would ask in a first call.</li>
            <li>You type your answer, in English or Hindi.</li>
            <li>Millisa scores it, says what worked, and shows a stronger version.</li>
          </ol>
          <p className={styles.muted}>It takes about ten minutes. Nothing you write here is shared with {o.company}.</p>
          <button type="button" className="btn btn-primary" onClick={start}>
            Start the interview
          </button>
        </section>
      )}

      {questions.status === 'loading' && (
        <section className={styles.card}>
          <Thinking>Millisa is writing questions for {o.title.toLowerCase()}</Thinking>
        </section>
      )}

      {questions.status === 'error' && (
        <section className={styles.card}>
          <Problem message={questions.error ?? ''} onRetry={start} />
        </section>
      )}

      {questions.status === 'done' && current && (
        <section className={styles.card}>
          {questions.saved && <SavedNote />}
          <div className={styles.progress} aria-hidden="true">
            {list.map((_, i) => (
              <span key={i} className={i < index ? styles.past : i === index ? styles.now : undefined} />
            ))}
          </div>
          <p className={styles.muted}>
            Question {index + 1} of {list.length}
          </p>
          <h2 className={styles.question}>{current.question}</h2>
          <p className={styles.lookFor}>A good answer covers: {current.lookFor}</p>

          {feedback.status !== 'done' ? (
            <form onSubmit={getFeedback} className={styles.answer}>
              <label className="field">
                <span>Your answer</span>
                <textarea
                  className="input"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={lang === 'hi' ? 'अपना जवाब यहाँ लिखें' : 'Answer the way you would on a call'}
                  disabled={feedback.status === 'loading'}
                  autoFocus
                />
              </label>
              {feedback.status === 'loading' && <Thinking>Millisa is reading your answer</Thinking>}
              {feedback.status === 'error' && <Problem message={feedback.error ?? ''} onRetry={() => getFeedback()} />}
              <div className={styles.actions}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={answer.trim().length < 3 || feedback.status === 'loading'}
                >
                  Get feedback
                </button>
              </div>
            </form>
          ) : (
            feedback.data && (
              <div className={styles.feedback}>
                {feedback.saved && <SavedNote />}
                <blockquote className={styles.yours}>{answer}</blockquote>
                <Score value={feedback.data.score} />
                <div className={styles.split}>
                  <div>
                    <h3>What worked</h3>
                    <p>{feedback.data.worked}</p>
                  </div>
                  <div>
                    <h3>Change this</h3>
                    <p>{feedback.data.improve}</p>
                  </div>
                </div>
                <div className={styles.stronger}>
                  <h3>A stronger answer</h3>
                  <p>{feedback.data.stronger}</p>
                </div>
                <div className={styles.actions}>
                  <button type="button" className="btn btn-primary" onClick={next}>
                    {index + 1 < list.length ? 'Next question' : 'See my summary'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => feedback.reset()}>
                    Answer again
                  </button>
                </div>
              </div>
            )
          )}
        </section>
      )}

      {finished && (
        <section className={styles.card}>
          <h2>Your practice summary</h2>
          <p className={styles.average}>
            <span className="num">{average.toFixed(1)}</span> out of 5 on average
          </p>
          <ol className={styles.results}>
            {results.map((r) => (
              <li key={r.question.question}>
                <p>{r.question.question}</p>
                <Score value={r.feedback.score} />
              </li>
            ))}
          </ol>
          {focus.length > 0 && (
            <div className={styles.stronger}>
              <h3>Work on these before the real call</h3>
              <ul>
                {focus.map((r) => (
                  <li key={r.question.question}>{r.feedback.improve}</li>
                ))}
              </ul>
            </div>
          )}
          <div className={styles.actions}>
            <Link to={`/opportunities/${o.id}`} className="btn btn-primary">
              Go to the role
            </Link>
            <button type="button" className="btn btn-ghost" onClick={start}>
              Practice again
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
