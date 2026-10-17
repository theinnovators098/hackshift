import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { errorText, forgetKey, gateMillisa, getKey, MillisaError, watchMillisa, type Lang } from '../lib/millisa'
import { useStore } from '../store/AppStore'
import KeyDialog from './KeyDialog'

const LANG_STORE = 'hackshift:millisa-lang'

function savedLang(): Lang {
  try {
    return localStorage.getItem(LANG_STORE) === 'hi' ? 'hi' : 'en'
  } catch {
    return 'en'
  }
}

interface Millisa {
  lang: Lang
  setLang: (lang: Lang) => void
  connected: boolean
  ensureKey: () => Promise<boolean>
  disconnect: () => void
  keyRejected: () => void
  panelOpen: boolean
  openPanel: () => void
  closePanel: () => void
}

const MillisaContext = createContext<Millisa | null>(null)

export function MillisaProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(savedLang)
  const [connected, setConnected] = useState(() => Boolean(getKey()))
  const [asking, setAsking] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const waiting = useRef<((ok: boolean) => void) | null>(null)
  const { recordUsage, usedToday, data, account } = useStore()
  const live = useRef({ recordUsage, usedToday, limit: data.settings.millisaDailyLimit, admin: account?.kind === 'admin' })
  live.current = { recordUsage, usedToday, limit: data.settings.millisaDailyLimit, admin: account?.kind === 'admin' }

  useEffect(() => {
    watchMillisa((e) => live.current.recordUsage(e))
    gateMillisa(() => live.current.admin || live.current.usedToday < live.current.limit)
    return () => {
      watchMillisa(null)
      gateMillisa(null)
    }
  }, [])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(LANG_STORE, next)
    } catch {
      return
    }
  }, [])

  const ensureKey = useCallback(() => {
    if (getKey()) return Promise.resolve(true)
    setAsking(true)
    return new Promise<boolean>((resolve) => {
      waiting.current = resolve
    })
  }, [])

  const finish = useCallback((ok: boolean) => {
    setAsking(false)
    if (ok) setConnected(true)
    waiting.current?.(ok)
    waiting.current = null
  }, [])

  const disconnect = useCallback(() => {
    forgetKey()
    setConnected(false)
  }, [])

  const keyRejected = useCallback(() => {
    forgetKey()
    setConnected(Boolean(getKey()))
  }, [])

  const openPanel = useCallback(() => setPanelOpen(true), [])
  const closePanel = useCallback(() => setPanelOpen(false), [])

  const value = useMemo(
    () => ({ lang, setLang, connected, ensureKey, disconnect, keyRejected, panelOpen, openPanel, closePanel }),
    [lang, setLang, connected, ensureKey, disconnect, keyRejected, panelOpen, openPanel, closePanel],
  )

  return (
    <MillisaContext.Provider value={value}>
      {children}
      {asking && <KeyDialog onDone={finish} />}
    </MillisaContext.Provider>
  )
}

export function useMillisa() {
  const ctx = useContext(MillisaContext)
  if (!ctx) throw new Error('useMillisa must be used inside MillisaProvider')
  return ctx
}

type Status = 'idle' | 'loading' | 'done' | 'error'

interface TaskState<T> {
  status: Status
  data?: T
  error?: string
  saved?: boolean
}

export function useMillisaTask<T>() {
  const { ensureKey, keyRejected } = useMillisa()
  const [state, setState] = useState<TaskState<T>>({ status: 'idle' })
  const current = useRef<AbortController | null>(null)

  useEffect(() => () => current.current?.abort(), [])

  const run = useCallback(
    async (task: (signal: AbortSignal) => Promise<{ data: T; saved: boolean }>) => {
      if (!(await ensureKey())) return
      current.current?.abort()
      const ctrl = new AbortController()
      current.current = ctrl
      setState((s) => ({ status: 'loading', data: s.data }))
      try {
        const { data, saved } = await task(ctrl.signal)
        if (!ctrl.signal.aborted) setState({ status: 'done', data, saved })
      } catch (e) {
        if (ctrl.signal.aborted) return
        if (e instanceof MillisaError && e.kind === 'bad-key') keyRejected()
        setState({ status: 'error', error: errorText(e) })
      }
    },
    [ensureKey, keyRejected],
  )

  const reset = useCallback(() => {
    current.current?.abort()
    setState({ status: 'idle' })
  }, [])

  return { ...state, run, reset }
}
