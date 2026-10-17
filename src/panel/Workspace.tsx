import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Plus, Printer, Trash2 } from 'lucide-react'
import MessageButton from '../components/MessageButton'
import { stages } from '../data/ventures'
import type { Budget, BusinessPlan, MvpPlan, Venture } from '../data/types'
import { cofounderMatches } from '../lib/cofounder'
import { askJson, SMART } from '../lib/millisa'
import { businessPlanRequest, deckRequest, mvpRequest } from '../lib/millisaPrompts'
import IdeaCheck from '../millisa/IdeaCheck'
import { useMillisa, useMillisaTask } from '../millisa/MillisaProvider'
import { LangToggle, MillisaMark, Points, Problem, SavedNote, Thinking } from '../millisa/parts'
import { today, useStore } from '../store/AppStore'
import { Empty, PanelHead, Section, Status, panelStyles as styles } from './ui'
import own from './Workspace.module.css'

type Tab = 'dashboard' | 'idea' | 'plan' | 'mvp' | 'deck' | 'money' | 'team' | 'tasks'

const tabs: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'idea', label: 'Idea' },
  { id: 'plan', label: 'Business plan' },
  { id: 'mvp', label: 'MVP' },
  { id: 'deck', label: 'Pitch deck' },
  { id: 'money', label: 'Money' },
  { id: 'team', label: 'Team' },
  { id: 'tasks', label: 'Milestones' },
]

const rupees = (n: number) => `${n < 0 ? '−' : ''}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`

function Generate({ label, made, onRun, loading, error }: { label: string; made?: string; onRun: () => void; loading: boolean; error?: string }) {
  return (
    <div className={own.generate}>
      <MillisaMark size={26} />
      <p>{made ? `Made on ${made}. Make it again after you change your idea.` : 'Millisa drafts it from your idea. Edit anything that is not right.'}</p>
      <LangToggle />
      <button type="button" className="btn btn-primary btn-sm" onClick={onRun} disabled={loading}>
        {made ? `Make the ${label} again` : `Make the ${label}`}
      </button>
      {loading && <Thinking>Millisa is writing the {label}</Thinking>}
      {error && <Problem message={error} onRetry={onRun} />}
    </div>
  )
}

function Dashboard({ v, go }: { v: Venture; go: (t: Tab) => void }) {
  const { data, schemes, reviewRequests, requestReview, moveVenture } = useStore()
  const interested = data.accounts.filter((a) => a.lists.interested.includes(v.id))
  const tasks = v.tasks ?? []
  const checks = [
    { done: v.problem.length > 40 && !!v.solution, text: 'Problem and solution written down', tab: 'idea' as Tab },
    { done: v.progress.length >= 2, text: 'Two pieces of proof from real people', tab: 'idea' as Tab },
    { done: !!v.plan, text: 'Business plan drafted', tab: 'plan' as Tab },
    { done: !!v.mvp, text: 'MVP planned', tab: 'mvp' as Tab },
    { done: !!v.budget, text: 'Runway worked out', tab: 'money' as Tab },
    { done: interested.length > 0 || v.team > 1, text: 'Someone to build it with', tab: 'team' as Tab },
    { done: tasks.filter((t) => t.done).length >= 3, text: 'Three milestones done', tab: 'tasks' as Tab },
  ]
  const ready = Math.round((checks.filter((c) => c.done).length / checks.length) * 100)
  const fits = schemes.filter((s) => s.stages.includes(v.stage) && !s.onlyFor).slice(0, 3)

  return (
    <>
      <div className={own.dashTop}>
        <section className={own.ready}>
          <p className={own.readyNum}>
            <span className="num">{ready}</span>%
          </p>
          <p>Ready to launch</p>
          <ul>
            {checks.map((c) => (
              <li key={c.text} className={c.done ? own.done : undefined}>
                <span className={own.box} aria-hidden="true">
                  {c.done && <Check size={12} strokeWidth={3} />}
                </span>
                {c.done ? c.text : <button type="button" onClick={() => go(c.tab)}>{c.text}</button>}
              </li>
            ))}
          </ul>
        </section>
        <section className={styles.form}>
          <label className="field">
            <span>Stage</span>
            <select className="input" value={v.stage} onChange={(e) => moveVenture(v.id, e.target.value as Venture['stage'])}>
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <p className={styles.cardSub}>
            {interested.length} {interested.length === 1 ? 'person wants' : 'people want'} to help. {tasks.filter((t) => !t.done).length} milestones open.
          </p>
          <button type="button" className="btn btn-ghost btn-sm" disabled={reviewRequests.includes(v.id)} onClick={() => requestReview(v.id)}>
            {reviewRequests.includes(v.id) ? 'Mentor review asked for' : 'Ask a mentor to review'}
          </button>
        </section>
      </div>

      {(v.reviews?.length ?? 0) > 0 && (
        <Section title="Mentor feedback">
          <ul className={styles.list}>
            {v.reviews!.map((r, i) => (
              <li key={i} className={styles.card}>
                <p className={styles.cardTitle}>{data.mentors.find((m) => m.id === r.mentorId)?.name}</p>
                <p className={styles.cardBody}>{r.text}</p>
                <p className={styles.cardSub}>{r.on}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className={styles.two}>
        <Section title="Next milestones">
          {tasks.filter((t) => !t.done).length === 0 ? (
            <Empty title="No open milestones" action={<button type="button" className="btn btn-ghost btn-sm" onClick={() => go('tasks')}>Add one</button>} />
          ) : (
            <ul className={styles.feed}>
              {tasks
                .filter((t) => !t.done)
                .slice(0, 4)
                .map((t) => (
                  <li key={t.id}>
                    <span>{t.title}</span>
                    <time>{t.due || 'No date'}</time>
                  </li>
                ))}
            </ul>
          )}
        </Section>
        <Section title={`Funding for the ${v.stage.toLowerCase()} stage`} link={{ to: '/schemes', label: 'All schemes' }}>
          <ul className={styles.feed}>
            {fits.map((s) => (
              <li key={s.id}>
                <a href={s.link} target="_blank" rel="noreferrer">
                  {s.name}
                </a>
                <span className={styles.cellSub}>{s.amount}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  )
}

function Idea({ v }: { v: Venture }) {
  const { updateVenture } = useStore()
  const [problem, setProblem] = useState(v.problem)
  const [solution, setSolution] = useState(v.solution ?? '')
  const [customer, setCustomer] = useState(v.customer ?? '')
  const [model, setModel] = useState(v.model ?? '')
  const [proof, setProof] = useState(v.progress.join('\n'))
  const [oneLiner, setOneLiner] = useState(v.oneLiner)
  const [demo, setDemo] = useState(v.demoLink ?? '')
  const [saved, setSaved] = useState(false)

  const save = (e: FormEvent) => {
    e.preventDefault()
    updateVenture(v.id, {
      problem: problem.trim(),
      solution: solution.trim(),
      customer: customer.trim(),
      model: model.trim(),
      oneLiner: oneLiner.trim().slice(0, 110),
      demoLink: demo.trim() || undefined,
      progress: proof
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    })
    setSaved(true)
  }

  const touch = <T,>(set: (v: T) => void) => (value: T) => {
    set(value)
    setSaved(false)
  }

  return (
    <>
      {saved && (
        <p className={styles.toast} role="status">
          Idea saved. Your public venture page shows it now.
        </p>
      )}
      <form className={styles.form} onSubmit={save}>
        <label className="field">
          <span>In one line</span>
          <input className="input" value={oneLiner} maxLength={110} onChange={(e) => touch(setOneLiner)(e.target.value)} />
        </label>
        <label className="field">
          <span>The problem, and who has it</span>
          <textarea className="input" value={problem} onChange={(e) => touch(setProblem)(e.target.value)} />
        </label>
        <label className="field">
          <span>Your solution</span>
          <textarea className="input" value={solution} onChange={(e) => touch(setSolution)(e.target.value)} placeholder="What you will build, in plain words" />
        </label>
        <div className={styles.formRow}>
          <label className="field">
            <span>Target customer</span>
            <input className="input" value={customer} onChange={(e) => touch(setCustomer)(e.target.value)} placeholder="Kirana shop owners in Indore" />
          </label>
          <label className="field">
            <span>How it makes money</span>
            <input className="input" value={model} onChange={(e) => touch(setModel)(e.target.value)} placeholder="₹199 a month per shop" />
          </label>
        </div>
        <label className="field">
          <span>Proof so far, one per line</span>
          <textarea className="input" value={proof} onChange={(e) => touch(setProof)(e.target.value)} />
        </label>
        <label className="field">
          <span>Demo or prototype link</span>
          <input className="input" value={demo} onChange={(e) => touch(setDemo)(e.target.value)} placeholder="https://" />
        </label>
        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary btn-sm">
            Save idea
          </button>
        </div>
      </form>
      <IdeaCheck
        idea={{ name: v.name, oneLiner, sector: v.sector, city: v.city, stage: v.stage, problem, progress: proof, needs: v.lookingFor }}
        onUseOneLiner={(text) => touch(setOneLiner)(text)}
        onUseStage={(stage) => updateVenture(v.id, { stage })}
      />
    </>
  )
}

function Plan({ v }: { v: Venture }) {
  const { updateVenture } = useStore()
  const { lang } = useMillisa()
  const task = useMillisaTask<Omit<BusinessPlan, 'madeOn'>>()
  const run = () =>
    task.run(async (signal) => {
      const res = await askJson<Omit<BusinessPlan, 'madeOn'>>({ model: SMART, ...businessPlanRequest(v, lang), signal })
      updateVenture(v.id, { plan: { ...res.data, madeOn: today() } })
      return res
    })
  const p = v.plan
  return (
    <>
      <Generate label="business plan" made={p?.madeOn} onRun={run} loading={task.status === 'loading'} error={task.status === 'error' ? task.error : undefined} />
      {task.saved && <SavedNote />}
      {p && (
        <article className={`${own.doc} print-area`}>
          <h2>{v.name}: business plan</h2>
          {(
            [
              ['Summary', p.summary],
              ['Customer', p.customer],
              ['First market', p.market],
              ['Business model', p.model],
              ['How the team works', p.operations],
            ] as const
          ).map(([h, t]) => (
            <section key={h}>
              <h3>{h}</h3>
              <p>{t}</p>
            </section>
          ))}
          <div className={styles.two}>
            <Points title="Biggest risks" items={p.risks} tone="gap" />
            <Points title="First 90 days" items={p.first90} tone="good" />
          </div>
        </article>
      )}
      {p && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}>
          <Printer size={15} /> Print or save as PDF
        </button>
      )}
    </>
  )
}

function Mvp({ v }: { v: Venture }) {
  const { updateVenture } = useStore()
  const { lang } = useMillisa()
  const task = useMillisaTask<Omit<MvpPlan, 'madeOn'>>()
  const run = () =>
    task.run(async (signal) => {
      const res = await askJson<Omit<MvpPlan, 'madeOn'>>({ model: SMART, ...mvpRequest(v, lang), signal })
      updateVenture(v.id, { mvp: { ...res.data, madeOn: today() } })
      return res
    })
  const m = v.mvp

  const toTasks = () => {
    if (!m) return
    const start = new Date()
    const existing = new Set((v.tasks ?? []).map((t) => t.title))
    const added = m.milestones
      .filter((x) => !existing.has(x.goal))
      .map((x) => {
        const d = new Date(start)
        d.setDate(d.getDate() + x.week * 7)
        return { id: `t-${x.week}-${Date.now().toString(36)}`, title: x.goal, due: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), done: false }
      })
    updateVenture(v.id, { tasks: [...(v.tasks ?? []), ...added] })
  }

  return (
    <>
      <Generate label="MVP plan" made={m?.madeOn} onRun={run} loading={task.status === 'loading'} error={task.status === 'error' ? task.error : undefined} />
      {task.saved && <SavedNote />}
      {m && (
        <>
          <div className={own.columns}>
            <Points title="Must have" items={m.must} tone="good" />
            <Points title="Soon after" items={m.should} tone="plain" />
            <Points title="Leave out for now" items={m.later} tone="gap" />
          </div>
          <Section title="First user journey">
            <ol className={own.journey}>
              {m.journey.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </Section>
          <Section title="Milestones">
            <ul className={styles.feed}>
              {m.milestones.map((x) => (
                <li key={x.week}>
                  <span>{x.goal}</span>
                  <time>Week {x.week}</time>
                </li>
              ))}
            </ul>
            <div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={toTasks}>
                Add these to my milestones
              </button>
            </div>
          </Section>
        </>
      )}
    </>
  )
}

function Deck({ v }: { v: Venture }) {
  const { updateVenture } = useStore()
  const { lang } = useMillisa()
  const task = useMillisaTask<{ slides: { title: string; points: string[] }[] }>()
  const run = () =>
    task.run(async (signal) => {
      const res = await askJson<{ slides: { title: string; points: string[] }[] }>({ model: SMART, ...deckRequest(v, lang), signal })
      updateVenture(v.id, { deck: { slides: res.data.slides, madeOn: today() } })
      return res
    })
  return (
    <>
      <Generate label="pitch deck" made={v.deck?.madeOn} onRun={run} loading={task.status === 'loading'} error={task.status === 'error' ? task.error : undefined} />
      {task.saved && <SavedNote />}
      {v.deck && (
        <>
          <p className={styles.cardSub}>A first draft. Fill the parts in square brackets with your real numbers before you show it to anyone.</p>
          <ol className={`${own.slides} print-area`}>
            {v.deck.slides.map((s, i) => (
              <li key={i}>
                <span className={own.slideNum}>{i + 1}</span>
                <h3>{s.title}</h3>
                <ul>
                  {s.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}>
            <Printer size={15} /> Print or save as PDF
          </button>
        </>
      )}
    </>
  )
}

const blankBudget: Budget = {
  cash: 200000,
  costs: [
    { label: 'Team', amount: 30000 },
    { label: 'Tools and hosting', amount: 3000 },
    { label: 'Marketing', amount: 5000 },
  ],
  price: 199,
  customers: 10,
  newPerMonth: 15,
}

function Money({ v }: { v: Venture }) {
  const { updateVenture } = useStore()
  const [b, setB] = useState<Budget>(v.budget ?? blankBudget)
  const [saved, setSaved] = useState(false)
  const set = (patch: Partial<Budget>) => {
    setB((x) => ({ ...x, ...patch }))
    setSaved(false)
  }
  const burn = b.costs.reduce((n, c) => n + (Number(c.amount) || 0), 0)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  let cash = b.cash
  let breakEven: number | null = null
  let runOut: number | null = null
  const rows = months.map((m) => {
    const customers = b.customers + b.newPerMonth * (m - 1)
    const revenue = customers * b.price
    cash += revenue - burn
    if (breakEven === null && revenue >= burn) breakEven = m
    if (runOut === null && cash < 0) runOut = m
    return { m, customers, revenue, cash }
  })

  return (
    <>
      <div className={styles.two}>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <label className="field">
            <span>Cash in the bank (₹)</span>
            <input className="input" type="number" min={0} value={b.cash} onChange={(e) => set({ cash: Number(e.target.value) })} />
          </label>
          <div className="field" role="group" aria-label="Monthly costs">
            <span>Monthly costs (₹)</span>
            {b.costs.map((c, i) => (
              <div key={i} className={own.costRow}>
                <input
                  className="input"
                  value={c.label}
                  onChange={(e) => set({ costs: b.costs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                  aria-label="Cost name"
                />
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={c.amount}
                  onChange={(e) => set({ costs: b.costs.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)) })}
                  aria-label={`${c.label} per month`}
                />
                <button type="button" className={own.iconBtn} onClick={() => set({ costs: b.costs.filter((_, j) => j !== i) })} aria-label={`Remove ${c.label}`}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ costs: [...b.costs, { label: 'Other', amount: 0 }] })}>
                <Plus size={15} /> Add a cost
              </button>
            </div>
          </div>
          <div className={styles.formRow3}>
            <label className="field">
              <span>Price per customer a month (₹)</span>
              <input className="input" type="number" min={0} value={b.price} onChange={(e) => set({ price: Number(e.target.value) })} />
            </label>
            <label className="field">
              <span>Paying customers now</span>
              <input className="input" type="number" min={0} value={b.customers} onChange={(e) => set({ customers: Number(e.target.value) })} />
            </label>
            <label className="field">
              <span>New customers a month</span>
              <input className="input" type="number" min={0} value={b.newPerMonth} onChange={(e) => set({ newPerMonth: Number(e.target.value) })} />
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                updateVenture(v.id, { budget: b })
                setSaved(true)
              }}
            >
              Save numbers
            </button>
            {saved && <span className={styles.cardSub}>Saved</span>}
          </div>
        </form>
        <div className={own.result}>
          <p className={own.big}>
            {runOut === null ? '12+' : <span className="num">{runOut - 1}</span>}
            <small> months of runway</small>
          </p>
          <p className={styles.cardBody}>
            You spend {rupees(burn)} a month.{' '}
            {breakEven ? `Revenue covers costs from month ${breakEven}.` : 'At these numbers, revenue does not cover costs within a year.'}
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Customers</th>
                  <th>Revenue</th>
                  <th>Cash left</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.m} className={r.cash < 0 ? own.negative : undefined}>
                    <td className="num">{r.m}</td>
                    <td className="num">{r.customers}</td>
                    <td className="num">{rupees(r.revenue)}</td>
                    <td className="num">{rupees(r.cash)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.cardSub}>A simple estimate. It assumes costs stay flat and nobody cancels.</p>
        </div>
      </div>
    </>
  )
}

function Team({ v }: { v: Venture }) {
  const { people, profile, data, accountOfPerson, updateVenture } = useStore()
  const [need, setNeed] = useState('')
  const interestedPeople = new Set(
    data.accounts.filter((a) => a.lists.interested.includes(v.id)).map((a) => a.personId ?? a.id),
  )
  const matches = cofounderMatches(v, profile, people, interestedPeople)

  return (
    <>
      <Section title="Open positions">
        <div className={styles.form}>
          <div className={styles.chips}>
            {v.lookingFor.map((n) => (
              <button key={n} type="button" className="chip" aria-pressed="true" onClick={() => updateVenture(v.id, { lookingFor: v.lookingFor.filter((x) => x !== n) })}>
                {n} <span aria-hidden="true">×</span>
                <span className="visually-hidden">remove</span>
              </button>
            ))}
          </div>
          <form
            className={own.costRow}
            onSubmit={(e) => {
              e.preventDefault()
              if (!need.trim()) return
              updateVenture(v.id, { lookingFor: [...v.lookingFor, need.trim()] })
              setNeed('')
            }}
          >
            <input className="input" value={need} onChange={(e) => setNeed(e.target.value)} placeholder="Designer, part-time, equity" aria-label="Add a position" />
            <button type="submit" className="btn btn-ghost btn-sm">
              Add
            </button>
          </form>
          <p className={styles.cardSub}>These show on your public venture page. Be clear whether it is paid, equity or volunteer.</p>
        </div>
      </Section>
      <Section title="People who could build this with you">
        {matches.length === 0 ? (
          <Empty title="No strong matches yet">Add the positions you need above, and HackShift will look for people with those skills.</Empty>
        ) : (
          <ul className={own.matches}>
            {matches.map(({ person, reasons }) => (
              <li key={person.id} className={styles.card}>
                <p className={styles.cardTitle}>{person.name}</p>
                <p className={styles.cardSub}>
                  {person.city}. {person.headline}
                </p>
                <ul className={own.reasons}>
                  {reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <div className={styles.cardFoot}>
                  <MessageButton to={accountOfPerson(person.id)?.id} label="Invite to talk" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}

function Tasks({ v }: { v: Venture }) {
  const { updateVenture } = useStore()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const tasks = v.tasks ?? []
  const save = (list: Venture['tasks']) => updateVenture(v.id, { tasks: list })

  return (
    <>
      <form
        className={own.taskForm}
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          save([...tasks, { id: `t-${Date.now().toString(36)}`, title: title.trim(), due: due.trim(), done: false }])
          setTitle('')
          setDue('')
        }}
      >
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Talk to 20 shop owners in Vijay Nagar" aria-label="Milestone" />
        <input className="input" value={due} onChange={(e) => setDue(e.target.value)} placeholder="By 30 Oct" aria-label="Due" />
        <button type="submit" className="btn btn-primary btn-sm">
          Add milestone
        </button>
      </form>
      {tasks.length === 0 ? (
        <Empty title="No milestones yet">Add what you will finish this week, or make an MVP plan and add its milestones in one go.</Empty>
      ) : (
        <ul className={own.tasks}>
          {tasks.map((t) => (
            <li key={t.id} className={t.done ? own.taskDone : undefined}>
              <label>
                <input type="checkbox" checked={t.done} onChange={() => save(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} />
                <span>{t.title}</span>
              </label>
              <time>{t.due}</time>
              <button type="button" className={own.iconBtn} onClick={() => save(tasks.filter((x) => x.id !== t.id))} aria-label={`Delete ${t.title}`}>
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default function Workspace() {
  const { id } = useParams()
  const { myVentures } = useStore()
  const [tab, setTab] = useState<Tab>('dashboard')
  const v = myVentures.find((x) => x.id === id)
  if (!v) return <Empty title="This venture is not yours" action={<Link to="/panel/ventures" className="btn btn-ghost btn-sm">My ventures</Link>} />

  return (
    <>
      <Link to="/panel/ventures" className="back-link">
        <ArrowLeft size={16} /> Founder workspace
      </Link>
      <PanelHead title={v.name} intro={v.oneLiner}>
        <Status value={v.status ?? 'live'} />
        <Link to={`/ventures/${v.id}`} className="btn btn-ghost btn-sm">
          Public page
        </Link>
      </PanelHead>
      <div className={styles.tabs} role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'dashboard' && <Dashboard v={v} go={setTab} />}
      {tab === 'idea' && <Idea v={v} />}
      {tab === 'plan' && <Plan v={v} />}
      {tab === 'mvp' && <Mvp v={v} />}
      {tab === 'deck' && <Deck v={v} />}
      {tab === 'money' && <Money v={v} />}
      {tab === 'team' && <Team v={v} />}
      {tab === 'tasks' && <Tasks v={v} />}
    </>
  )
}
