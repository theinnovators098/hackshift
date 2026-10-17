import { useState, type FormEvent } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileStack, History, Inbox, Landmark, LayoutDashboard, Settings as SettingsIcon, UserCog, Users } from 'lucide-react'
import { stages } from '../data/ventures'
import type { FounderGroup, Scheme, SchemeNeed, Stage, Visibility } from '../data/types'
import { useMillisa } from '../millisa/MillisaProvider'
import { kindLabel, panelPath, useStore, type AccountKind, type ContentKind } from '../store/AppStore'
import AccountSettings from './AccountSettings'
import { ChallengeEditor, RoleEditor } from './Editors'
import PanelShell, { rememberAdmin } from './PanelShell'
import { Empty, PanelHead, Section, Stats, Status, slug, timeAgo, panelStyles as styles } from './ui'
import own from './AdminPanel.module.css'

const kinds: AccountKind[] = ['seeker', 'startup', 'mentor', 'recruiter', 'admin']

const contentTabs: { kind: ContentKind; label: string; publicBase: string; editBase?: string }[] = [
  { kind: 'opportunities', label: 'Roles', publicBase: '/opportunities', editBase: '/admin/content/roles' },
  { kind: 'challenges', label: 'Challenges', publicBase: '/challenges', editBase: '/admin/content/challenges' },
  { kind: 'ventures', label: 'Ventures', publicBase: '/ventures' },
  { kind: 'mentors', label: 'Mentors', publicBase: '/mentors' },
]

interface Row {
  kind: ContentKind
  id: string
  title: string
  detail: string
  status: Visibility
  link: string
  editLink?: string
}

function useRows() {
  const { data } = useStore()
  const rows: Row[] = [
    ...data.opportunities.map((o) => ({
      kind: 'opportunities' as const,
      id: o.id,
      title: o.title,
      detail: `${o.company}. ${o.kind}, ${o.pay}`,
      status: o.status ?? 'live',
      link: `/opportunities/${o.id}`,
      editLink: `/admin/content/roles/${o.id}`,
    })),
    ...data.challenges.map((c) => ({
      kind: 'challenges' as const,
      id: c.id,
      title: c.title,
      detail: `${c.company}. ${c.level}, ${c.reward}`,
      status: c.status ?? 'live',
      link: `/challenges/${c.id}`,
      editLink: `/admin/content/challenges/${c.id}`,
    })),
    ...data.ventures.map((v) => ({
      kind: 'ventures' as const,
      id: v.id,
      title: v.name,
      detail: `${v.founder}, ${v.city}. ${v.oneLiner}`,
      status: v.status ?? 'live',
      link: `/ventures/${v.id}`,
    })),
    ...data.mentors.map((m) => ({
      kind: 'mentors' as const,
      id: m.id,
      title: m.name,
      detail: `${m.title} at ${m.company}, ${m.city}`,
      status: m.status ?? 'live',
      link: `/mentors/${m.id}`,
    })),
  ]
  return rows
}

const typeWord: Record<ContentKind, string> = {
  opportunities: 'Role',
  challenges: 'Challenge',
  ventures: 'Venture idea',
  mentors: 'Mentor application',
}

function ReviewList({ limit }: { limit?: number }) {
  const { setContentStatus } = useStore()
  const pending = useRows().filter((r) => r.status === 'pending')
  const shown = limit ? pending.slice(0, limit) : pending
  if (pending.length === 0) return <Empty title="Nothing waiting">Every post and mentor application has been reviewed.</Empty>
  return (
    <ul className={styles.list}>
      {shown.map((r) => (
        <li key={`${r.kind}-${r.id}`} className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <p className={own.type}>{typeWord[r.kind]}</p>
              <Link to={r.link} className={styles.cardTitle}>
                {r.title}
              </Link>
              <p className={styles.cardSub}>{r.detail}</p>
            </div>
          </div>
          <div className={styles.cardFoot}>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setContentStatus(r.kind, r.id, 'live')}>
              Approve
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setContentStatus(r.kind, r.id, 'hidden')}>
              Reject
            </button>
            <Link to={r.link} className={`${styles.link} ${styles.push}`}>
              Open
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}

function Overview() {
  const { data, accountById } = useStore()
  const rows = useRows()
  const pending = rows.filter((r) => r.status === 'pending').length
  const byKind = kinds.map((k) => ({ k, n: data.accounts.filter((a) => a.kind === k).length }))
  const max = Math.max(1, ...byKind.map((x) => x.n))

  return (
    <>
      <PanelHead title="HackShift today" intro="Everything happening on the platform, and what needs your decision." />
      <Stats
        items={[
          { label: 'Accounts', value: data.accounts.length, to: '/admin/accounts' },
          { label: 'Waiting for review', value: pending, to: '/admin/review', hot: pending > 0 },
          { label: 'Live roles', value: data.opportunities.filter((o) => (o.status ?? 'live') === 'live').length, to: '/admin/content' },
          { label: 'Applications', value: data.applications.length },
          { label: 'Challenge submissions', value: data.submissions.length },
          { label: 'Mentor sessions', value: data.bookings.length },
        ]}
      />
      <div className={styles.two}>
        <Section title="Waiting for review" link={{ to: '/admin/review', label: 'See all' }}>
          <ReviewList limit={3} />
        </Section>
        <div className={styles.main}>
          <Section title="Accounts by type" link={{ to: '/admin/accounts', label: 'Manage' }}>
            <ul className={own.bars}>
              {byKind.map(({ k, n }) => (
                <li key={k}>
                  <span>{kindLabel[k]}</span>
                  <span className={own.bar}>
                    <span style={{ width: `${(n / max) * 100}%` }} />
                  </span>
                  <span className="num">{n}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Recent activity" link={{ to: '/admin/activity', label: 'Full log' }}>
            <ul className={styles.feed}>
              {data.log.slice(0, 6).map((l) => (
                <li key={l.id}>
                  <span>{l.text}</span>
                  <time dateTime={l.at} title={accountById(l.actorId)?.name}>
                    {timeAgo(l.at)}
                  </time>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </>
  )
}

function Accounts() {
  const { data, account, setAccountStatus, deleteAccount, signInAs } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<AccountKind | 'all'>('all')

  const q = query.trim().toLowerCase()
  const shown = data.accounts.filter(
    (a) =>
      (kind === 'all' || a.kind === kind) &&
      (!q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.company ?? '').toLowerCase().includes(q)),
  )

  const viewAs = (id: string, k: AccountKind) => {
    rememberAdmin(account!.id)
    signInAs(id)
    navigate(panelPath(k))
  }

  const remove = (id: string, name: string) => {
    if (window.confirm(`Delete ${name}'s account? Their applications, submissions, sessions and posts are removed too. This cannot be undone.`)) {
      deleteAccount(id)
    }
  }

  return (
    <>
      <PanelHead title="Accounts" intro="Everyone on HackShift. Suspended accounts cannot sign in and are hidden from search." />
      <div className={styles.toolbar}>
        <input
          className={`input ${styles.search}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or company"
          aria-label="Search accounts"
        />
        <div className={styles.chips} role="group" aria-label="Account type">
          {(['all', ...kinds] as const).map((k) => (
            <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
              {k === 'all' ? 'Everyone' : kindLabel[k]}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Joined</th>
              <th>Status</th>
              <th className={styles.actions}>
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((a) => {
              const self = a.id === account?.id
              return (
                <tr key={a.id}>
                  <td>
                    <p className={styles.cellTitle}>
                      {a.name}
                      {a.company && a.kind !== 'seeker' ? `, ${a.company}` : ''}
                    </p>
                    <p className={styles.cellSub}>{a.email}</p>
                  </td>
                  <td>{kindLabel[a.kind]}</td>
                  <td>{a.joinedOn}</td>
                  <td>
                    <Status value={a.status} />
                  </td>
                  <td className={styles.actions}>
                    {self ? (
                      <span className={styles.cellSub}>This is you</span>
                    ) : (
                      <span className={styles.rowActions}>
                        {a.kind !== 'admin' && a.status === 'active' && (
                          <button type="button" className={styles.link} onClick={() => viewAs(a.id, a.kind)}>
                            View as
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.link}
                          onClick={() => setAccountStatus(a.id, a.status === 'active' ? 'suspended' : 'active')}
                        >
                          {a.status === 'active' ? 'Suspend' : 'Restore'}
                        </button>
                        <button type="button" className={`${styles.link} ${styles.danger}`} onClick={() => remove(a.id, a.name)}>
                          Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {shown.length === 0 && <Empty title="No accounts match">Try a different name or clear the filter.</Empty>}
    </>
  )
}

function Review() {
  return (
    <>
      <PanelHead
        title="Review queue"
        intro="New roles, challenges, ideas and mentor applications wait here until you approve them. Rejected posts are hidden, not deleted."
      />
      <ReviewList />
    </>
  )
}

function Content() {
  const { setContentStatus, deleteContent } = useStore()
  const rows = useRows()
  const [tab, setTab] = useState<ContentKind>('opportunities')
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const meta = contentTabs.find((t) => t.kind === tab)!
  const shown = rows.filter((r) => r.kind === tab && (!q || r.title.toLowerCase().includes(q) || r.detail.toLowerCase().includes(q)))

  const remove = (r: Row) => {
    if (window.confirm(`Delete "${r.title}" for good? Anything linked to it, such as applications or sessions, is removed too.`)) {
      deleteContent(r.kind, r.id)
    }
  }

  return (
    <>
      <PanelHead title="Content" intro="Everything posted on HackShift. Hide something to take it off the site without deleting it." />
      <div className={styles.tabs}>
        {contentTabs.map((t) => (
          <button key={t.kind} type="button" aria-pressed={tab === t.kind} onClick={() => setTab(t.kind)}>
            {t.label} ({rows.filter((r) => r.kind === t.kind).length})
          </button>
        ))}
      </div>
      <div className={styles.toolbar}>
        <input
          className={`input ${styles.search}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${meta.label.toLowerCase()}`}
          aria-label={`Search ${meta.label.toLowerCase()}`}
        />
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{meta.label.replace(/s$/, '')}</th>
              <th>Status</th>
              <th className={styles.actions}>
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={r.link} className={styles.cellTitle}>
                    {r.title}
                  </Link>
                  <p className={styles.cellSub}>{r.detail}</p>
                </td>
                <td>
                  <select
                    className={styles.select}
                    value={r.status}
                    onChange={(e) => setContentStatus(r.kind, r.id, e.target.value as Visibility)}
                    aria-label={`Status of ${r.title}`}
                  >
                    <option value="live">Live</option>
                    <option value="pending">Waiting for review</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </td>
                <td className={styles.actions}>
                  <span className={styles.rowActions}>
                    {r.editLink && (
                      <Link to={r.editLink} className={styles.link}>
                        Edit
                      </Link>
                    )}
                    <button type="button" className={`${styles.link} ${styles.danger}`} onClick={() => remove(r)}>
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown.length === 0 && <Empty title="Nothing here" />}
    </>
  )
}

function Schemes() {
  const { data, saveScheme, deleteScheme } = useStore()
  return (
    <>
      <PanelHead title="Government schemes" intro="The list people see on the schemes finder. Keep amounts and links in line with the official websites.">
        <Link to="/admin/schemes/new" className="btn btn-accent btn-sm">
          Add a scheme
        </Link>
      </PanelHead>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Scheme</th>
              <th>Amount</th>
              <th>Shown</th>
              <th className={styles.actions}>
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.schemes.map((s) => (
              <tr key={s.id}>
                <td>
                  <p className={styles.cellTitle}>{s.name}</p>
                  <p className={styles.cellSub}>{s.runBy}</p>
                </td>
                <td>{s.amount}</td>
                <td>
                  <label className={styles.check}>
                    <input type="checkbox" checked={!s.hidden} onChange={(e) => saveScheme({ ...s, hidden: !e.target.checked })} />
                    {s.hidden ? 'Hidden' : 'Shown'}
                  </label>
                </td>
                <td className={styles.actions}>
                  <span className={styles.rowActions}>
                    <Link to={`/admin/schemes/${s.id}`} className={styles.link}>
                      Edit
                    </Link>
                    <a href={s.link} target="_blank" rel="noreferrer" className={styles.link}>
                      Official site
                    </a>
                    <button
                      type="button"
                      className={`${styles.link} ${styles.danger}`}
                      onClick={() => window.confirm(`Delete ${s.name}?`) && deleteScheme(s.id)}
                    >
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

const needOptions: { value: SchemeNeed; label: string }[] = [
  { value: 'grant', label: 'Grant' },
  { value: 'loan', label: 'Loan' },
  { value: 'incubation', label: 'Incubation and mentoring' },
  { value: 'recognition', label: 'Startup recognition' },
]

const groupOptions: { value: FounderGroup; label: string }[] = [
  { value: 'women', label: 'Women founders' },
  { value: 'scst', label: 'SC/ST founders' },
]

function SchemeEditor() {
  const { id } = useParams()
  const { data, saveScheme } = useStore()
  const navigate = useNavigate()
  const existing = id ? data.schemes.find((s) => s.id === id) : undefined
  const [name, setName] = useState(existing?.name ?? '')
  const [runBy, setRunBy] = useState(existing?.runBy ?? '')
  const [amount, setAmount] = useState(existing?.amount ?? '')
  const [summary, setSummary] = useState(existing?.summary ?? '')
  const [link, setLink] = useState(existing?.link ?? 'https://')
  const [stageList, setStageList] = useState<Stage[]>(existing?.stages ?? [])
  const [needs, setNeeds] = useState<SchemeNeed[]>(existing?.needs ?? [])
  const [groups, setGroups] = useState<FounderGroup[]>(existing?.onlyFor ?? [])
  const [error, setError] = useState('')

  if (id && !existing) return <Navigate to="/admin/schemes" replace />

  const flip = <T,>(list: T[], set: (v: T[]) => void, v: T) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !runBy.trim() || !amount.trim() || summary.trim().length < 30 || !/^https:\/\/\S+\.\S+/.test(link.trim())) {
      setError('Fill in every field. The link must be the official https website.')
      return
    }
    if (stageList.length === 0 || needs.length === 0) {
      setError('Pick at least one stage and one kind of help.')
      return
    }
    const scheme: Scheme = {
      id: existing?.id ?? slug(name),
      hidden: existing?.hidden,
      name: name.trim(),
      runBy: runBy.trim(),
      amount: amount.trim(),
      summary: summary.trim(),
      link: link.trim(),
      stages: stages.filter((s) => stageList.includes(s)),
      needs,
      onlyFor: groups.length ? groups : undefined,
    }
    saveScheme(scheme)
    navigate('/admin/schemes')
  }

  return (
    <>
      <Link to="/admin/schemes" className="back-link">
        <ArrowLeft size={16} /> All schemes
      </Link>
      <PanelHead title={existing ? `Edit: ${existing.name}` : 'Add a scheme'} />
      <form className={styles.form} onSubmit={save} noValidate>
        <div className={styles.formRow}>
          <label className="field">
            <span>Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span>Run by</span>
            <input className="input" value={runBy} onChange={(e) => setRunBy(e.target.value)} placeholder="Ministry or agency" />
          </label>
        </div>
        <div className={styles.formRow}>
          <label className="field">
            <span>Amount or benefit</span>
            <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Up to ₹20 lakh grant" />
          </label>
          <label className="field">
            <span>Official website</span>
            <input className="input" value={link} onChange={(e) => setLink(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>What it is, in plain words</span>
          <textarea className="input" value={summary} onChange={(e) => setSummary(e.target.value)} />
        </label>
        <div className="field" role="group" aria-label="Stages">
          <span>For ventures at these stages</span>
          <div className={styles.chips}>
            {stages.map((s) => (
              <button key={s} type="button" className="chip" aria-pressed={stageList.includes(s)} onClick={() => flip(stageList, setStageList, s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="field" role="group" aria-label="Kind of help">
          <span>Kind of help</span>
          <div className={styles.chips}>
            {needOptions.map((n) => (
              <button key={n.value} type="button" className="chip" aria-pressed={needs.includes(n.value)} onClick={() => flip(needs, setNeeds, n.value)}>
                {n.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field" role="group" aria-label="Only for">
          <span>Only for (leave empty if open to everyone)</span>
          <div className={styles.chips}>
            {groupOptions.map((g) => (
              <button key={g.value} type="button" className="chip" aria-pressed={groups.includes(g.value)} onClick={() => flip(groups, setGroups, g.value)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary">
            {existing ? 'Save changes' : 'Add scheme'}
          </button>
          <Link to="/admin/schemes" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}

function Activity() {
  const { data, accountById } = useStore()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = data.log.filter((l) => !q || l.text.toLowerCase().includes(q))
  return (
    <>
      <PanelHead title="Activity" intro="The last 200 things that happened on HackShift, newest first." />
      <div className={styles.toolbar}>
        <input className={`input ${styles.search}`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search activity" aria-label="Search activity" />
      </div>
      {shown.length === 0 ? (
        <Empty title="Nothing found" />
      ) : (
        <ul className={`${styles.feed} ${own.log}`}>
          {shown.map((l) => (
            <li key={l.id}>
              <span>
                {l.text}
                <span className={own.actor}>{accountById(l.actorId) ? kindLabel[accountById(l.actorId)!.kind] : 'System'}</span>
              </span>
              <time dateTime={l.at}>{timeAgo(l.at)}</time>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function Settings() {
  const { data, updateSettings, reset } = useStore()
  const { connected, disconnect, ensureKey } = useMillisa()
  const [done, setDone] = useState('')

  const download = () => {
    const { accounts, ...rest } = data
    const safe = { ...rest, accounts: accounts.map(({ password: _password, ...a }) => a) }
    const blob = new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hackshift-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetAll = () => {
    if (window.confirm('Reset HackShift to the demo data? Every account, post and change made since then is lost.')) {
      reset()
      setDone('HackShift is back to the demo data.')
    }
  }

  return (
    <>
      <PanelHead title="Settings" intro="Rules for the whole platform." />
      {done && (
        <p className={styles.toast} role="status">
          {done}
        </p>
      )}
      <Section title="Posting">
        <div className={styles.card}>
          <label className={styles.check}>
            <input type="checkbox" checked={data.settings.reviewPosts} onChange={(e) => updateSettings({ reviewPosts: e.target.checked })} />
            Review new roles, challenges, ideas and mentors before they go live
          </label>
          <p className={styles.cardBody}>
            {data.settings.reviewPosts
              ? 'New posts wait in the review queue until you approve them.'
              : 'New posts go live straight away. You can still hide them later.'}
          </p>
        </div>
      </Section>
      <Section title="Millisa">
        <div className={styles.card}>
          <p className={styles.cardBody}>
            {connected ? 'Millisa is connected in this browser.' : 'Millisa is not connected in this browser.'}
          </p>
          <div className={styles.cardFoot}>
            {connected ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={disconnect}>
                Disconnect Millisa
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => ensureKey()}>
                Connect Millisa
              </button>
            )}
          </div>
        </div>
      </Section>
      <Section title="Data">
        <div className={styles.card}>
          <p className={styles.cardBody}>
            All HackShift data lives in this browser. Download a copy before you reset it. Passwords are left out of the download.
          </p>
          <div className={styles.cardFoot}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={download}>
              Download data
            </button>
            <button type="button" className={`btn btn-ghost btn-sm ${own.dangerBtn}`} onClick={resetAll}>
              Reset to demo data
            </button>
          </div>
        </div>
      </Section>
    </>
  )
}

export default function AdminPanel() {
  const rows = useRows()
  const pending = rows.filter((r) => r.status === 'pending').length
  const nav = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/review', label: 'Review queue', icon: Inbox, count: pending },
    { to: '/admin/accounts', label: 'Accounts', icon: Users },
    { to: '/admin/content', label: 'Content', icon: FileStack },
    { to: '/admin/schemes', label: 'Schemes', icon: Landmark },
    { to: '/admin/activity', label: 'Activity', icon: History },
    { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
    { to: '/admin/account', label: 'My account', icon: UserCog },
  ]
  return (
    <PanelShell nav={nav} publicLink={{ to: '/', label: 'See the public site' }}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="review" element={<Review />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="content" element={<Content />} />
        <Route path="content/roles/:id" element={<RoleEditor backTo="/admin/content" />} />
        <Route path="content/challenges/:id" element={<ChallengeEditor backTo="/admin/content" />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="schemes/new" element={<SchemeEditor />} />
        <Route path="schemes/:id" element={<SchemeEditor />} />
        <Route path="activity" element={<Activity />} />
        <Route path="settings" element={<Settings />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </PanelShell>
  )
}
