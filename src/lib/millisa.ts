const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const KEY_STORE = 'hackshift:millisa-key'
const CACHE_STORE = 'hackshift:millisa-cache'

export const FAST = 'gemini-flash-lite-latest'
export const SMART = 'gemini-flash-latest'

export type Lang = 'en' | 'hi'

export type ErrorKind = 'no-key' | 'bad-key' | 'busy' | 'offline' | 'blocked' | 'failed' | 'limit' | 'signin'

const messages: Record<ErrorKind, string> = {
  'no-key': 'Connect Millisa to use this.',
  'bad-key': 'Millisa could not connect because the access key was not accepted. Paste the key again.',
  busy: 'Millisa has had a lot of questions in the last minute. Wait a moment and try again.',
  offline: 'Millisa could not reach the internet. Check your connection and try again.',
  blocked: 'Millisa cannot answer that one. Try asking in a different way.',
  failed: 'Millisa could not finish that answer. Try again.',
  limit: 'You have reached today’s Millisa limit on HackShift. It resets tomorrow morning.',
  signin: 'Sign in to use Millisa. It is free for everyone with a HackShift account.',
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

export interface ToolDecl {
  name: string
  description: string
  parameters: object
}

interface Request {
  model?: string
  system: string
  turns: Turn[]
  schema?: object
  temperature?: number
  signal?: AbortSignal
  tools?: ToolDecl[]
  contents?: unknown[]
  files?: { mimeType: string; data: string }[]
}

interface Part {
  text?: string
  thought?: boolean
  functionCall?: { name: string; args?: Record<string, unknown>; id?: string }
}

interface Payload {
  candidates?: { content?: { role?: string; parts?: Part[] }; finishReason?: string }[]
  promptFeedback?: { blockReason?: string }
}

function body({ model = FAST, system, turns, schema, temperature, tools, contents, files }: Request) {
  const generationConfig: Record<string, unknown> = {}
  if (temperature !== undefined) generationConfig.temperature = temperature
  if (model === SMART) generationConfig.thinkingConfig = { thinkingLevel: 'low' }
  if (schema) {
    generationConfig.responseMimeType = 'application/json'
    generationConfig.responseJsonSchema = schema
  }
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents:
      contents ??
      turns.map((t, i) => ({
        role: t.role,
        parts: [
          ...(i === turns.length - 1 && files ? files.map((f) => ({ inlineData: { mimeType: f.mimeType, data: f.data } })) : []),
          { text: t.text },
        ],
      })),
    generationConfig,
    ...(tools?.length ? { tools: [{ functionDeclarations: tools }] } : {}),
  }
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Watcher = (event: { model: string; ok: boolean; ms: number; kind: ErrorKind | null }) => void
let watcher: Watcher | null = null

export function watchMillisa(fn: Watcher | null) {
  watcher = fn
}

let gate: (() => ErrorKind | null) | null = null

export function gateMillisa(fn: (() => ErrorKind | null) | null) {
  gate = fn
}

async function send(req: Request, stream: boolean) {
  const key = getKey()
  if (!key) throw new MillisaError('no-key')
  const blocked = gate?.()
  if (blocked) throw new MillisaError(blocked)
  const first = req.model ?? FAST
  const attempts = first === SMART ? [SMART, FAST] : [first, first]
  const started = Date.now()

  for (let i = 0; i < attempts.length; i++) {
    const model = attempts[i]
    const url = `${BASE}/${model}:${stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`
    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(body({ ...req, model })),
        signal: req.signal,
      })
    } catch (e) {
      if (req.signal?.aborted) throw e
      watcher?.({ model, ok: false, ms: Date.now() - started, kind: 'offline' })
      throw new MillisaError('offline')
    }

    if (res.ok) {
      watcher?.({ model, ok: true, ms: Date.now() - started, kind: null })
      return res
    }
    if ((res.status === 429 || res.status === 503) && i < attempts.length - 1) {
      await pause(700)
      continue
    }
    const detail = await res.text().catch(() => '')
    const kind: ErrorKind =
      res.status === 429 || res.status === 503 ? 'busy' : /api.?key|unauthenticated|permission/i.test(detail) ? 'bad-key' : 'failed'
    watcher?.({ model, ok: false, ms: Date.now() - started, kind })
    throw new MillisaError(kind)
  }
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

export async function askWithTools(
  req: Request & {
    tools: ToolDecl[]
    run: (name: string, args: Record<string, unknown>) => Promise<object> | object
    onStep?: (name: string) => void
  },
) {
  const contents: unknown[] = req.turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] }))
  for (let round = 0; round < 6; round++) {
    const res = await send({ ...req, contents }, false)
    const payload: Payload = await res.json()
    const content = payload.candidates?.[0]?.content
    const calls = (content?.parts ?? []).filter((p) => p.functionCall)
    if (calls.length === 0) {
      const text = textOf(payload).trim()
      if (!text) throw new MillisaError('failed')
      return text
    }
    contents.push(content)
    const responses = []
    for (const part of calls) {
      const call = part.functionCall!
      req.onStep?.(call.name)
      let result: object
      try {
        result = await req.run(call.name, call.args ?? {})
      } catch (e) {
        result = { error: e instanceof Error ? e.message : 'The tool failed' }
      }
      responses.push({ functionResponse: { name: call.name, id: call.id, response: result } })
    }
    contents.push({ role: 'user', parts: responses })
  }
  throw new MillisaError('failed')
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
  const id = hash(JSON.stringify([req.model, req.system, req.turns, req.schema, req.files?.map((f) => f.data.length)]))
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
