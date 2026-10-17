import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useStore } from '../store/AppStore'
import styles from './SearchDialog.module.css'

interface Hit {
  group: string
  title: string
  sub: string
  to: string
}

const pages: Hit[] = [
  { group: 'Pages', title: 'Opportunities', sub: 'Jobs, internships, gigs and co-founder roles', to: '/opportunities' },
  { group: 'Pages', title: 'Challenges', sub: 'Small paid tasks from startups', to: '/challenges' },
  { group: 'Pages', title: 'Ventures', sub: 'Ideas and early startups by stage', to: '/ventures' },
  { group: 'Pages', title: 'Mentors', sub: 'Free 30 minute sessions', to: '/mentors' },
  { group: 'Pages', title: 'Government schemes', sub: 'Grants, loans and incubators that fit you', to: '/schemes' },
  { group: 'Pages', title: 'Post your idea', sub: 'Find a co-founder and track your stage', to: '/ventures/new' },
]

function has(text: string, q: string) {
  return text.toLowerCase().includes(q)
}

export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const { opportunities, challenges, mentors, ventures, schemes, people, account } = useStore()
  const navigate = useNavigate()
  const ref = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const canSeePeople = !!account && ['startup', 'recruiter', 'admin'].includes(account.kind)

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return pages
    const list: Hit[] = [
      ...opportunities
        .filter((o) => has(`${o.title} ${o.company} ${o.city} ${o.skills.join(' ')} ${o.kind}`, q))
        .map((o) => ({ group: 'Roles', title: o.title, sub: `${o.company}, ${o.city}. ${o.pay}`, to: `/opportunities/${o.id}` })),
      ...challenges
        .filter((c) => has(`${c.title} ${c.company} ${c.skills.join(' ')}`, q))
        .map((c) => ({ group: 'Challenges', title: c.title, sub: `${c.company}. About ${c.hours} hours`, to: `/challenges/${c.id}` })),
      ...mentors
        .filter((m) => has(`${m.name} ${m.title} ${m.company} ${m.expertise.join(' ')} ${m.languages.join(' ')} ${m.city}`, q))
        .map((m) => ({ group: 'Mentors', title: m.name, sub: `${m.title} at ${m.company}`, to: `/mentors/${m.id}` })),
      ...ventures
        .filter((v) => has(`${v.name} ${v.oneLiner} ${v.sector} ${v.city}`, q))
        .map((v) => ({ group: 'Ventures', title: v.name, sub: `${v.stage}. ${v.oneLiner}`, to: `/ventures/${v.id}` })),
      ...schemes
        .filter((s) => has(`${s.name} ${s.runBy} ${s.summary}`, q))
        .map((s) => ({ group: 'Schemes', title: s.name, sub: s.amount, to: '/schemes' })),
      ...(canSeePeople
        ? people
            .filter((p) => has(`${p.name} ${p.city} ${p.skills.join(' ')} ${p.headline}`, q))
            .map((p) => ({ group: 'People', title: p.name, sub: `${p.city}. ${p.skills.slice(0, 3).join(', ')}`, to: '/talent' }))
        : []),
      ...pages.filter((p) => has(`${p.title} ${p.sub}`, q)),
    ]
    return list.slice(0, 30)
  }, [query, opportunities, challenges, mentors, ventures, schemes, people, canSeePeople])

  const open = (hit: Hit) => {
    onClose()
    navigate(hit.to)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(hits.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && hits[active]) {
      e.preventDefault()
      open(hits[active])
    }
  }

  let lastGroup = ''

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label="Search HackShift"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className={styles.box}>
        <label className={styles.field}>
          <Search size={18} aria-hidden="true" />
          <span className="visually-hidden">Search</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKey}
            placeholder="Search roles, challenges, mentors, ideas or schemes"
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={hits[active] ? `hit-${active}` : undefined}
          />
          <kbd>Esc</kbd>
        </label>
        {hits.length === 0 ? (
          <p className={styles.none}>Nothing matches “{query}”. Try a skill, a city or a company name.</p>
        ) : (
          <ul id="search-results" role="listbox" className={styles.list}>
            {hits.map((hit, i) => {
              const showGroup = hit.group !== lastGroup
              lastGroup = hit.group
              return (
                <li key={`${hit.group}-${hit.to}-${i}`} role="presentation">
                  {showGroup && <p className={styles.group}>{hit.group}</p>}
                  <button
                    type="button"
                    id={`hit-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={i === active ? styles.on : undefined}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => open(hit)}
                  >
                    <span className={styles.title}>{hit.title}</span>
                    <span className={styles.sub}>{hit.sub}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </dialog>
  )
}
