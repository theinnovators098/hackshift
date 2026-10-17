const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const KEY_STORE = 'hackshift:millisa-key'
const CACHE_STORE = 'hackshift:millisa-cache'

export const FAST = 'gemini-flash-lite-latest'
export const SMART = 'gemini-flash-latest'

export type Lang = 'en' | 'hi'

export type ErrorKind = 'no-key' | 'bad-key' | 'busy' | 'offline' | 'blocked' | 'failed'

const messages: Record<ErrorKind, string> = {
  'no-key': 'Connect Millisa to use this.',
  'bad-key': 'Millisa could not connect because the access key was not accepted. Paste the key again.',
  busy: 'Millisa has had a lot of questions in the last minute. Wait a moment and try again.',
  offline: 'Millisa could not reach the internet. Check your connection and try again.',
  blocked: 'Millisa cannot answer that one. Try asking in a different way.',
  failed: 'Millisa could not finish that answer. Try again.',
}

export class MillisaError extends Error {
  kind: ErrorKind

  constructor(kind: ErrorKind) {
    super(messages[kind])
    this.kind = kind
  }
}

export function errorText(e: unknown) {
  return e instanceof MillisaError ? e.message : messages.failed
}

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    return
  }
}

export function getKey() {
  const local = import.meta.env.DEV ? (import.meta.env.VITE_MILLISA_KEY as string | undefined) : undefined
  return local || read(KEY_STORE) || ''
}

export function saveKey(key: string) {
  write(KEY_STORE, key.trim())
}

export function forgetKey() {
  write(KEY_STORE, null)
}

export async function testKey(key: string) {
  try {
    const res = await fetch(`${BASE}?pageSize=1`, { headers: { 'x-goog-api-key': key.trim() } })
    return res.ok
  } catch {
    throw new MillisaError('offline')
  }
}

export function looksHindi(text: string) {
  return /[ऀ-ॿ]/.test(text)
}

export function languageRule(lang: Lang) {
  return lang === 'hi'
    ? 'Write in simple, everyday Hindi in Devanagari script. Keep names, skills and technical words such as React, SQL, UPI, MVP or LPA in English.'
    : 'Write in simple, plain Indian English.'
}

export interface Turn {
  role: 'user' | 'model'
  text: string
}

interface Request {
  model?: string
  system: string
  turns: Turn[]
  schema?: object
  temperature?: number
  signal?: AbortSignal
}

interface Part {
  text?: string
  thought?: boolean
}

interface Payload {
  candidates?: { content?: { parts?: Part[] }; finishReason?: string }[]
  promptFeedback?: { blockReason?: string }
}

function body({ model = FAST, system, turns, schema, temperature }: Request) {
  const generationConfig: Record<string, unknown> = {}
  if (temperature !== undefined) generationConfig.temperature = temperature
  if (model === SMART) generationConfig.thinkingConfig = { thinkingLevel: 'low' }
  if (schema) {
    generationConfig.responseMimeType = 'application/json'
    generationConfig.responseJsonSchema = schema
  }
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig,
  }
}

async function send(req: Request, stream: boolean) {
  const key = getKey()
  if (!key) throw new MillisaError('no-key')
  const model = req.model ?? FAST
  const url = `${BASE}/${model}:${stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body(req)),
      signal: req.signal,
    })
  } catch (e) {
    if (req.signal?.aborted) throw e
    throw new MillisaError('offline')
  }

  if (res.ok) return res
  if (res.status === 429 || res.status === 503) throw new MillisaError('busy')
  const detail = await res.text().catch(() => '')
  if (/api.?key|unauthenticated|permission/i.test(detail)) throw new MillisaError('bad-key')
  throw new MillisaError('failed')
}

function textOf(p: Payload) {
  if (p.promptFeedback?.blockReason) throw new MillisaError('blocked')
  const first = p.candidates?.[0]
  if (first?.finishReason === 'SAFETY' || first?.finishReason === 'PROHIBITED_CONTENT') throw new MillisaError('blocked')
  return (first?.content?.parts ?? [])
    .filter((part) => part.text && !part.thought)
    .map((part) => part.text)
    .join('')
}

export async function askText(req: Request) {
  const res = await send(req, false)
  const text = textOf(await res.json())
  if (!text.trim()) throw new MillisaError('failed')
  return text.trim()
}

export async function* streamText(req: Request) {
  const res = await send(req, true)
  const reader = res.body?.getReader()
  if (!reader) throw new MillisaError('failed')
  const decoder = new TextDecoder()
  let buffer = ''
  let gotText = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const chunk = textOf(JSON.parse(line.slice(5)))
      if (chunk) {
        gotText = true
        yield chunk
      }
    }
  }

  if (!gotText) throw new MillisaError('failed')
}

function hash(s: string) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return (h >>> 0).toString(36)
}

function readCache(): Record<string, unknown> {
  try {
    return JSON.parse(read(CACHE_STORE) ?? '{}')
  } catch {
    return {}
  }
}

export async function askJson<T>(req: Request & { schema: object }): Promise<{ data: T; saved: boolean }> {
  const id = hash(JSON.stringify([req.model, req.system, req.turns, req.schema]))
  try {
    const data = JSON.parse(await askText(req)) as T
    const cache = readCache()
    cache[id] = data
    const ids = Object.keys(cache)
    if (ids.length > 40) delete cache[ids[0]]
    write(CACHE_STORE, JSON.stringify(cache))
    return { data, saved: false }
  } catch (e) {
    const cached = readCache()[id]
    if (cached && e instanceof MillisaError && (e.kind === 'offline' || e.kind === 'busy')) {
      return { data: cached as T, saved: true }
    }
    if (e instanceof SyntaxError) throw new MillisaError('failed')
    throw e
  }
}
