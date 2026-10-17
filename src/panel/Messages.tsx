import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import Verified from '../components/Verified'
import { kindLabel, useStore } from '../store/AppStore'
import { Empty, PanelHead, initials, timeAgo } from './ui'
import styles from './Messages.module.css'

export default function Messages() {
  const { otherId } = useParams()
  const { account, threads, conversation, sendMessage, markThreadRead, accountById, data } = useStore()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [text, setText] = useState((state as { draft?: string } | null)?.draft ?? '')
  const [picking, setPicking] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const base = account?.kind === 'admin' ? '/admin/messages' : '/panel/messages'

  const other = otherId ? accountById(otherId) : undefined
  const messages = other ? conversation(other.id) : []

  useEffect(() => {
    if (other) markThreadRead(other.id)
  }, [other?.id, messages.length, markThreadRead])

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, other?.id])

  if (!account) return null

  const send = (e?: FormEvent) => {
    e?.preventDefault()
    if (!other || !text.trim()) return
    sendMessage(other.id, text.trim())
    setText('')
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  const contacts = data.accounts.filter((a) => a.id !== account.id && a.status === 'active' && !threads.some((t) => t.otherId === a.id))
  const label = (id: string) => {
    const a = accountById(id)
    if (!a) return 'Former member'
    return a.company && (a.kind === 'startup' || a.kind === 'recruiter') ? `${a.name}, ${a.company}` : a.name
  }

  return (
    <>
      <PanelHead title="Messages" intro="Talk to startups, mentors, recruiters and the HackShift team. Keep it about work." />
      <div className={`${styles.layout} ${other ? styles.reading : ''}`}>
        <aside className={styles.threads} aria-label="Conversations">
          <div className={styles.threadsHead}>
            <p>Conversations</p>
            <button type="button" onClick={() => setPicking((p) => !p)}>
              {picking ? 'Close' : 'New message'}
            </button>
          </div>
          {picking && (
            <label className={styles.picker}>
              <span className="visually-hidden">Who do you want to write to?</span>
              <select
                className="input"
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return
                  setPicking(false)
                  navigate(`${base}/${e.target.value}`)
                }}
              >
                <option value="">Pick a person or company</option>
                {contacts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {label(a.id)} ({kindLabel[a.kind]})
                  </option>
                ))}
              </select>
            </label>
          )}
          {threads.length === 0 && !other ? (
            <p className={styles.none}>No conversations yet.</p>
          ) : (
            <ul>
              {other && !threads.some((t) => t.otherId === other.id) && (
                <li>
                  <Link to={`${base}/${other.id}`} className={styles.on}>
                    <span className={styles.avatar}>{initials(other.name)}</span>
                    <span className={styles.threadText}>
                      <span className={styles.threadName}>{label(other.id)}</span>
                      <span className={styles.preview}>New conversation</span>
                    </span>
                  </Link>
                </li>
              )}
              {threads.map((t) => (
                <li key={t.otherId}>
                  <Link to={`${base}/${t.otherId}`} className={t.otherId === other?.id ? styles.on : undefined}>
                    <span className={styles.avatar}>{initials(accountById(t.otherId)?.name ?? '?')}</span>
                    <span className={styles.threadText}>
                      <span className={styles.threadName}>{label(t.otherId)}</span>
                      <span className={styles.preview}>
                        {t.last.from === account.id ? 'You: ' : ''}
                        {t.last.text}
                      </span>
                    </span>
                    {t.unread > 0 && <span className={styles.unread}>{t.unread}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className={styles.thread} aria-label={other ? `Conversation with ${other.name}` : 'Conversation'}>
          {!other ? (
            <Empty title="Pick a conversation">Or start a new one with someone you want to work with.</Empty>
          ) : (
            <>
              <header className={styles.threadHead}>
                <Link to={base} className={styles.back} aria-label="All conversations">
                  <ArrowLeft size={18} />
                </Link>
                <span className={styles.avatar}>{initials(other.name)}</span>
                <div>
                  <p className={styles.threadName}>
                    {label(other.id)}
                    {other.verified && <Verified />}
                  </p>
                  <p className={styles.preview}>{kindLabel[other.kind]}</p>
                </div>
              </header>
              <div className={styles.messages} aria-live="polite">
                {messages.length === 0 && <p className={styles.none}>Say hello. Mention what you want to talk about in the first line.</p>}
                {messages.map((m) => (
                  <div key={m.id} className={m.from === account.id ? styles.mine : styles.theirs}>
                    <p>{m.text}</p>
                    <time dateTime={m.at}>{timeAgo(m.at)}</time>
                  </div>
                ))}
                <div ref={end} />
              </div>
              <form className={styles.compose} onSubmit={send}>
                <label htmlFor="message-text" className="visually-hidden">
                  Write a message
                </label>
                <textarea
                  id="message-text"
                  rows={2}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onKey}
                  placeholder={`Write to ${other.name.split(' ')[0]}`}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!text.trim()}>
                  <Send size={15} /> Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </>
  )
}
