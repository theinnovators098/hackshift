import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUp, Square, Trash2, X } from 'lucide-react'
import { askWithTools, errorText, FAST, MillisaError, type Turn } from '../lib/millisa'
import { chatSystem } from '../lib/millisaPrompts'
import { useStore } from '../store/AppStore'
import { useMillisa } from './MillisaProvider'
import { LangToggle, MillisaMark, Problem, Reply, Thinking } from './parts'
import TaskCard from './TaskCard'
import { toolLabels, useMillisaTools } from './tools'

type ChatItem = Turn & { taskIds?: string[] }
import styles from './MillisaPanel.module.css'

function suggestionsFor(roles: string[]) {
  const list: string[] = []
  if (roles.includes('founder')) list.push('मेरे आइडिया के लिए कौन सी सरकारी योजना सही है?')
  if (roles.includes('recruiter') || roles.includes('startup')) list.push('Who on HackShift has verified frontend work?')
  list.push('Which internship fits my skills best?')
  list.push('I have 4 hours this weekend. Which challenge should I try?')
  list.push('मुझे इंटरव्यू की तैयारी के लिए किस मेंटर से बात करनी चाहिए?')
  return list.slice(0, 4)
}

export default function MillisaPanel() {
  const { panelOpen, openPanel, closePanel, lang, ensureKey, keyRejected } = useMillisa()
  const { profile, myVentures, opportunities, challenges, mentors, ventures, schemes } = useStore()
  const { pathname } = useLocation()
  const [turns, setTurns] = useState<ChatItem[]>([])
  const [step, setStep] = useState('')
  const kit = useMillisaTools()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ctrl = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (panelOpen) inputRef.current?.focus()
  }, [panelOpen])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [turns, error])

  useEffect(() => () => ctrl.current?.abort(), [])

  const ask = async (text: string) => {
    const question = text.trim()
    if (!question || busy) return
    if (!(await ensureKey())) return

    const history: ChatItem[] = [...turns.filter((t) => t.text), { role: 'user', text: question }]
    const recent: Turn[] = history.slice(-12).map((t) => ({ role: t.role, text: t.text }))
    while (recent[0]?.role === 'model') recent.shift()

    setTurns([...history, { role: 'model', text: '' }])
    setDraft('')
    setError('')
    setBusy(true)
    const c = new AbortController()
    ctrl.current = c

    try {
      const taskIds: string[] = []
      const reply = await askWithTools({
        model: FAST,
        system: `${chatSystem(
          profile,
          {
            opportunities,
            challenges,
            mentors,
            schemes,
            ventures: [...myVentures.filter((v) => v.status !== 'live'), ...ventures],
          },
          pathname,
          lang,
        )}\n\nTOOLS\n${kit.rules}`,
        turns: recent,
        temperature: 0.5,
        signal: c.signal,
        tools: kit.tools,
        onStep: (name) => setStep(toolLabels[name] ?? 'Working on it'),
        run: (name, args) => {
          const result = kit.run(name, args) as { taskId?: string }
          if (result.taskId) taskIds.push(result.taskId)
          return result
        },
      })
      if (!c.signal.aborted) setTurns([...history, { role: 'model', text: reply, taskIds }])
    } catch (e) {
      if (!c.signal.aborted) {
        if (e instanceof MillisaError && e.kind === 'bad-key') keyRejected()
        setError(errorText(e))
      }
      setTurns((list) => list.filter((t, i) => !(i === list.length - 1 && t.role === 'model' && !t.text)))
    } finally {
      setBusy(false)
      setStep('')
      ctrl.current = null
    }
  }

  const send = (e: FormEvent) => {
    e.preventDefault()
    ask(draft)
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      ask(draft)
    }
  }

  const clear = () => {
    ctrl.current?.abort()
    setTurns([])
    setError('')
  }

  const closeOnSmallScreens = () => {
    if (window.matchMedia('(max-width: 640px)').matches) closePanel()
  }

  const lastUser = [...turns].reverse().find((t) => t.role === 'user')
  const waitingForFirstWord = busy && turns[turns.length - 1]?.text === ''

  return (
    <>
      {!panelOpen && (
        <button type="button" className={styles.launcher} onClick={openPanel}>
          <MillisaMark size={24} />
          <span>Ask Millisa</span>
        </button>
      )}

      <section
        className={styles.panel}
        hidden={!panelOpen}
        aria-label="Ask Millisa"
        onKeyDown={(e) => {
          if (e.key === 'Escape') closePanel()
        }}
      >
        <header className={styles.head}>
          <MillisaMark size={30} />
          <div className={styles.title}>
            <h2>Millisa</h2>
            <p>Ask about roles, challenges, mentors or schemes</p>
          </div>
          <button type="button" className={styles.icon} onClick={closePanel} aria-label="Close Millisa">
            <X size={20} />
          </button>
        </header>

        <div className={styles.tools}>
          <LangToggle dark />
          {turns.length > 0 && (
            <button type="button" className={styles.clear} onClick={clear}>
              <Trash2 size={14} /> New chat
            </button>
          )}
        </div>

        <div className={styles.list} ref={listRef} aria-live="polite">
          {turns.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.hello}>
                {profile ? `Hi ${profile.name.split(' ')[0]}, I'm Millisa.` : "Hi, I'm Millisa."} I know every role,
                challenge, mentor and scheme on HackShift. Ask in English or Hindi.
              </p>
              <ul className={styles.suggestions}>
                {suggestionsFor(profile?.roles ?? []).map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => ask(s)} lang={/[ऀ-ॿ]/.test(s) ? 'hi' : undefined}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            turns.map((t, i) =>
              t.role === 'user' ? (
                <p key={i} className={styles.user}>
                  {t.text}
                </p>
              ) : (
                t.text && (
                  <div key={i} className={styles.bot}>
                    <Reply text={t.text} onNavigate={closeOnSmallScreens} />
                    {t.taskIds?.map((id) => (
                      <TaskCard key={id} id={id} compact />
                    ))}
                  </div>
                )
              ),
            )
          )}
          {waitingForFirstWord && <Thinking>{step || 'Millisa is looking through HackShift'}</Thinking>}
          {error && <Problem message={error} onRetry={lastUser ? () => ask(lastUser.text) : undefined} />}
        </div>

        <form className={styles.form} onSubmit={send}>
          <label htmlFor="millisa-input" className="visually-hidden">
            Message Millisa
          </label>
          <textarea
            id="millisa-input"
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder={lang === 'hi' ? 'अपना सवाल लिखें' : 'Type your question'}
          />
          {busy ? (
            <button type="button" className={styles.send} onClick={() => ctrl.current?.abort()} aria-label="Stop">
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button type="submit" className={styles.send} disabled={!draft.trim()} aria-label="Send">
              <ArrowUp size={18} />
            </button>
          )}
        </form>
        <p className={styles.fine}>Millisa can get things wrong. Check the details before you apply or sign anything.</p>
      </section>
    </>
  )
}
