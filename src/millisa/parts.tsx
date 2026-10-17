import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { useMillisa } from './MillisaProvider'
import styles from './Millisa.module.css'

export function MillisaMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={styles.mark}>
      <rect width="24" height="24" rx="6" fill="#1B1F3B" />
      <path
        d="M6 17v-5.6a2.4 2.4 0 0 1 4.8 0V17m0-5.6a2.4 2.4 0 0 1 4.8 0V17"
        stroke="#fff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="18.6" cy="6" r="2.3" fill="#F4A300" />
    </svg>
  )
}

export function LangToggle({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useMillisa()
  return (
    <div className={`${styles.lang} ${dark ? styles.langDark : ''}`} role="group" aria-label="Millisa replies in">
      <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
        English
      </button>
      <button type="button" aria-pressed={lang === 'hi'} onClick={() => setLang('hi')} lang="hi">
        हिंदी
      </button>
    </div>
  )
}

export function MillisaBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.box}>
      <header className={styles.boxHead}>
        <MillisaMark />
        <h2>{title}</h2>
        <LangToggle />
      </header>
      <div className={styles.boxBody}>{children}</div>
    </section>
  )
}

export function Thinking({ children }: { children: ReactNode }) {
  return (
    <p className={styles.thinking} role="status">
      <span className={styles.dots} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {children}
    </p>
  )
}

export function Problem({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={styles.problem} role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          <RotateCcw size={14} /> Try again
        </button>
      )}
    </div>
  )
}

export function SavedNote() {
  return <p className={styles.saved}>Millisa is offline, so this is the answer it gave earlier for the same question.</p>
}

export function Points({ title, items, tone }: { title: string; items: string[]; tone: 'good' | 'gap' | 'plain' }) {
  if (items.length === 0) return null
  return (
    <div className={styles.points}>
      <h3>{title}</h3>
      <ul className={styles[tone]}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

const inlinePattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g
const linkPattern = /^\[([^\]]+)\]\(([^)\s]+)\)$/

function inline(text: string, onNavigate?: () => void) {
  return text.split(inlinePattern).map((part, i) => {
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    const link = linkPattern.exec(part)
    if (!link) return part
    const [, label, href] = link
    if (href.startsWith('/')) {
      return (
        <Link key={i} to={href} onClick={onNavigate}>
          {label}
        </Link>
      )
    }
    if (/^https?:\/\//.test(href)) {
      return (
        <a key={i} href={href} target="_blank" rel="noreferrer">
          {label}
        </a>
      )
    }
    return label
  })
}

type Block = { kind: 'p'; lines: string[] } | { kind: 'ul' | 'ol'; items: string[] }

function blocks(text: string) {
  const out: Block[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const last = out[out.length - 1]
    if (!line) {
      out.push({ kind: 'p', lines: [] })
      continue
    }
    const bullet = /^[-*•]\s+(.*)$/.exec(line)
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line)
    const kind = bullet ? 'ul' : numbered ? 'ol' : 'p'
    const content = (bullet ?? numbered)?.[1] ?? line.replace(/^#+\s*/, '')
    if (kind === 'p') {
      if (last?.kind === 'p') last.lines.push(content)
      else out.push({ kind: 'p', lines: [content] })
    } else if (last?.kind === kind) {
      last.items.push(content)
    } else {
      out.push({ kind, items: [content] })
    }
  }
  return out.filter((b) => (b.kind === 'p' ? b.lines.length > 0 : true))
}

export function Reply({ text, onNavigate }: { text: string; onNavigate?: () => void }) {
  return (
    <div className={styles.reply}>
      {blocks(text).map((b, i) => {
        if (b.kind === 'p') return <p key={i}>{inline(b.lines.join(' '), onNavigate)}</p>
        const Tag = b.kind
        return (
          <Tag key={i}>
            {b.items.map((item, j) => (
              <li key={j}>{inline(item, onNavigate)}</li>
            ))}
          </Tag>
        )
      })}
    </div>
  )
}
