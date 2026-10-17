import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Challenge, Mentor, Opportunity, Person, Role, Scheme, Stage, Venture, Visibility } from '../data/types'
import { seed } from './seed'
import type {
  Account,
  AccountKind,
  ApplicationStatus,
  BookingStatus,
  ContentKind,
  Data,
  PipelineEntry,
  Profile,
  Settings,
  SubmissionStatus,
} from './types'

export type {
  Account,
  AccountKind,
  Application,
  ApplicationStatus,
  Booking,
  BookingStatus,
  ContentKind,
  PipelineEntry,
  PipelineStage,
  Profile,
  Submission,
  SubmissionStatus,
} from './types'

const STORAGE_KEY = 'hackshift:v2'

export const kindLabel: Record<AccountKind, string> = {
  seeker: 'Job seeker',
  startup: 'Startup',
  mentor: 'Mentor',
  recruiter: 'Recruiter',
  admin: 'Super admin',
}

function load(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed?.version === 2) return parsed
  } catch {
    return seed()
  }
  return seed()
}

export function today() {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

const isLive = (x: { status?: Visibility }) => (x.status ?? 'live') === 'live'

function withLog(d: Data, text: string): Data {
  const entry = { id: uid('log'), at: new Date().toISOString(), actorId: d.session ?? 'system', text }
  return { ...d, log: [entry, ...d.log].slice(0, 200) }
}

function patchMe(d: Data, fn: (a: Account) => Account): Data {
  return { ...d, accounts: d.accounts.map((a) => (a.id === d.session ? fn(a) : a)) }
}

function nameOf(d: Data) {
  return d.accounts.find((a) => a.id === d.session)?.name ?? 'Someone'
}

export function kindFor(roles: Role[]): AccountKind {
  if (roles.includes('startup')) return 'startup'
  if (roles.includes('recruiter')) return 'recruiter'
  if (roles.includes('mentor') && !roles.includes('seeker') && !roles.includes('founder')) return 'mentor'
  return 'seeker'
}

export function panelPath(kind: AccountKind) {
  return kind === 'admin' ? '/admin' : '/panel'
}

function useAppState() {
  const [data, setData] = useState<Data>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      return
    }
  }, [data])

  return useMemo(() => {
    const update = (fn: (d: Data) => Data) => setData(fn)
    const account = data.accounts.find((a) => a.id === data.session) ?? null
    const myId = account?.id ?? ''

    const visible = (x: { status?: Visibility; ownerId?: string }) =>
      isLive(x) || (!!account && (x.ownerId === myId || account.kind === 'admin'))

    const challengeTitle = (id: string) => {
      const c = data.challenges.find((x) => x.id === id)
      return c ? `${c.company}: ${c.title}` : ''
    }

    const badgesFor = (accountId: string) =>
      data.submissions
        .filter((s) => s.accountId === accountId && s.status === 'Accepted')
        .map((s) => challengeTitle(s.challengeId))
        .filter(Boolean)

    const people: Person[] = [
      ...data.people.flatMap((p) => {
        const acc = data.accounts.find((a) => a.personId === p.id)
        if (acc?.status === 'suspended') return []
        const extra = acc ? badgesFor(acc.id) : []
        const fromProfile = acc
          ? { name: acc.profile.name, city: acc.profile.city, skills: acc.profile.skills, college: acc.profile.college || p.college }
          : {}
        return [{ ...p, ...fromProfile, badges: Array.from(new Set([...p.badges, ...extra])) }]
      }),
      ...data.accounts
        .filter((a) => a.kind === 'seeker' && !a.personId && a.status === 'active')
        .map((a) => ({
          id: a.id,
          name: a.profile.name,
          city: a.profile.city,
          headline: a.profile.goal || 'New on HackShift',
          skills: a.profile.skills,
          badges: badgesFor(a.id),
          available: true,
          college: a.profile.college,
        })),
    ]

    const accountById = (id: string) => data.accounts.find((a) => a.id === id)
    const accountOfPerson = (personId: string) => data.accounts.find((a) => a.personId === personId || a.id === personId)
    const personById = (id: string) => people.find((p) => p.id === id)

    const newStatus = (d: Data): Visibility => (d.settings.reviewPosts ? 'pending' : 'live')

    const signIn = (email: string, password: string) => {
      const acc = data.accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
      if (!acc || acc.password !== password) return 'That email and password do not match an account.'
      if (acc.status === 'suspended') return 'This account has been suspended. Contact the HackShift team to restore it.'
      update((d) => ({ ...d, session: acc.id }))
      return null
    }

    const signUp = (profile: Profile, email: string, password: string) => {
      const clean = email.trim().toLowerCase()
      if (data.accounts.some((a) => a.email.toLowerCase() === clean)) {
        return 'An account with this email already exists. Sign in instead.'
      }
      const kind = kindFor(profile.roles)
      const id = uid('acc')
      const acc: Account = {
        id,
        kind,
        name: profile.name,
        email: clean,
        password,
        status: 'active',
        joinedOn: today(),
        profile,
        lists: { saved: [], interested: [], reviewRequests: [] },
        company: kind === 'startup' || kind === 'recruiter' ? profile.college || profile.name : undefined,
        mentorId: kind === 'mentor' ? `mentor-${id}` : undefined,
      }
      update((d) => {
        let next: Data = { ...d, accounts: [...d.accounts, acc], session: id }
        if (kind === 'mentor') {
          const mentor: Mentor = {
            id: acc.mentorId!,
            name: profile.name,
            title: 'Mentor',
            company: profile.college || 'Independent',
            city: profile.city,
            expertise: profile.skills.slice(0, 4),
            languages: ['English', 'Hindi'],
            bio: profile.goal,
            sessions: 0,
            yearsExp: 0,
            status: newStatus(d),
            ownerId: id,
          }
          next = { ...next, mentors: [...next.mentors, mentor] }
        }
        return withLog(
          next,
          kind === 'mentor' ? `${profile.name} applied to become a mentor` : `${profile.name} joined as a ${kindLabel[kind].toLowerCase()}`,
        )
      })
      return null
    }

    const saveContent = <T extends { id: string; status?: Visibility; ownerId?: string }>(
      kind: ContentKind,
      item: T,
      label: string,
    ) =>
      update((d) => {
        const list = d[kind] as unknown as T[]
        const exists = list.some((x) => x.id === item.id)
        const saved = exists ? item : { ...item, status: newStatus(d), ownerId: item.ownerId ?? d.session ?? undefined }
        const nextList = exists ? list.map((x) => (x.id === item.id ? saved : x)) : [saved, ...list]
        const verb = exists ? 'updated' : saved.status === 'pending' ? 'posted for review' : 'posted'
        return withLog({ ...d, [kind]: nextList }, `${nameOf(d)} ${verb} "${label}"`)
      })

    return {
      data,
      account,
      visible,
      accountById,
      accountOfPerson,
      personById,

      profile: account?.profile ?? null,
      saved: account?.lists.saved ?? [],
      interested: account?.lists.interested ?? [],
      reviewRequests: account?.lists.reviewRequests ?? [],
      applications: data.applications.filter((a) => a.accountId === myId),
      submissions: data.submissions.filter((s) => s.accountId === myId),
      bookings: data.bookings.filter((b) => b.accountId === myId),
      shortlist: data.pipeline.filter((p) => p.recruiterId === myId).map((p) => p.personId),
      myVentures: data.ventures.filter((v) => myId && v.ownerId === myId).map((v) => ({ ...v, mine: true })),

      opportunities: data.opportunities.filter(isLive),
      challenges: data.challenges.filter(isLive),
      mentors: data.mentors.filter(isLive),
      ventures: data.ventures.filter(isLive).map((v) => ({ ...v, mine: !!myId && v.ownerId === myId })),
      schemes: data.schemes.filter((s) => !s.hidden),
      people,

      signIn,
      signUp,
      signInAs: (id: string) => update((d) => ({ ...d, session: id })),
      signOut: () => update((d) => ({ ...d, session: null })),

      saveProfile: (profile: Profile) =>
        update((d) => patchMe(d, (a) => ({ ...a, profile, name: profile.name }))),
      updateAccount: (patch: Partial<Pick<Account, 'company' | 'companyAbout' | 'website' | 'password' | 'email'>>) =>
        update((d) => patchMe(d, (a) => ({ ...a, ...patch }))),

      toggleSaved: (id: string) =>
        update((d) => patchMe(d, (a) => ({ ...a, lists: { ...a.lists, saved: toggle(a.lists.saved, id) } }))),
      toggleInterest: (id: string) =>
        update((d) => patchMe(d, (a) => ({ ...a, lists: { ...a.lists, interested: toggle(a.lists.interested, id) } }))),
      requestReview: (id: string) =>
        update((d) =>
          patchMe(d, (a) =>
            a.lists.reviewRequests.includes(id) ? a : { ...a, lists: { ...a.lists, reviewRequests: [...a.lists.reviewRequests, id] } },
          ),
        ),

      apply: (opportunityId: string, note: string) =>
        update((d) => {
          const o = d.opportunities.find((x) => x.id === opportunityId)
          const others = d.applications.filter((a) => !(a.accountId === d.session && a.opportunityId === opportunityId))
          const app = { id: uid('app'), opportunityId, accountId: d.session!, note, appliedOn: today(), status: 'Sent' as const }
          return withLog({ ...d, applications: [...others, app] }, `${nameOf(d)} applied to ${o?.title} at ${o?.company}`)
        }),
      withdrawApplication: (id: string) =>
        update((d) => ({ ...d, applications: d.applications.filter((a) => a.id !== id) })),
      setApplicationStatus: (id: string, status: ApplicationStatus) =>
        update((d) => {
          const app = d.applications.find((a) => a.id === id)
          const who = app && d.accounts.find((a) => a.id === app.accountId)?.name
          return withLog(
            { ...d, applications: d.applications.map((a) => (a.id === id ? { ...a, status } : a)) },
            `${nameOf(d)} moved ${who}'s application to ${status}`,
          )
        }),

      submit: (challengeId: string, link: string, note: string) =>
        update((d) => {
          const c = d.challenges.find((x) => x.id === challengeId)
          const others = d.submissions.filter((s) => !(s.accountId === d.session && s.challengeId === challengeId))
          const sub = { id: uid('sub'), challengeId, accountId: d.session!, link, note, submittedOn: today(), status: 'In review' as const }
          return withLog({ ...d, submissions: [...others, sub] }, `${nameOf(d)} submitted work for "${c?.title}"`)
        }),
      reviewSubmission: (id: string, status: SubmissionStatus, feedback: string) =>
        update((d) => {
          const sub = d.submissions.find((s) => s.id === id)
          const who = sub && d.accounts.find((a) => a.id === sub.accountId)?.name
          return withLog(
            { ...d, submissions: d.submissions.map((s) => (s.id === id ? { ...s, status, feedback } : s)) },
            `${nameOf(d)} marked ${who}'s submission as ${status.toLowerCase()}`,
          )
        }),

      book: (b: { mentorId: string; day: string; time: string; topic: string }) =>
        update((d) => {
          const m = d.mentors.find((x) => x.id === b.mentorId)
          const booking = { ...b, id: uid('book'), accountId: d.session!, status: 'Requested' as const }
          return withLog({ ...d, bookings: [...d.bookings, booking] }, `${nameOf(d)} asked ${m?.name} for a session`)
        }),
      cancelBooking: (id: string) => update((d) => ({ ...d, bookings: d.bookings.filter((b) => b.id !== id) })),
      setBookingStatus: (id: string, status: BookingStatus, mentorNote?: string) =>
        update((d) => {
          const b = d.bookings.find((x) => x.id === id)
          const who = b && d.accounts.find((a) => a.id === b.accountId)?.name
          const mentors =
            status === 'Done' && b ? d.mentors.map((m) => (m.id === b.mentorId ? { ...m, sessions: m.sessions + 1 } : m)) : d.mentors
          return withLog(
            {
              ...d,
              mentors,
              bookings: d.bookings.map((x) => (x.id === id ? { ...x, status, mentorNote: mentorNote ?? x.mentorNote } : x)),
            },
            `${nameOf(d)} marked the session with ${who} as ${status.toLowerCase()}`,
          )
        }),
      saveMentor: (m: Mentor) =>
        update((d) => withLog({ ...d, mentors: d.mentors.map((x) => (x.id === m.id ? m : x)) }, `${nameOf(d)} updated the mentor profile of ${m.name}`)),

      addVenture: (v: Venture) => saveContent('ventures', v, v.name),
      moveVenture: (id: string, stage: Stage) =>
        update((d) => ({ ...d, ventures: d.ventures.map((v) => (v.id === id ? { ...v, stage } : v)) })),

      saveOpportunity: (o: Opportunity) => saveContent('opportunities', o, o.title),
      saveChallenge: (c: Challenge) => saveContent('challenges', c, c.title),
      setContentStatus: (kind: ContentKind, id: string, status: Visibility) =>
        update((d) => {
          const item = (d[kind] as { id: string; title?: string; name?: string }[]).find((x) => x.id === id)
          const verb = status === 'live' ? 'approved' : status === 'hidden' ? 'hid' : 'sent back for review'
          return withLog(
            { ...d, [kind]: (d[kind] as { id: string }[]).map((x) => (x.id === id ? { ...x, status } : x)) },
            `${nameOf(d)} ${verb} "${item?.title ?? item?.name}"`,
          )
        }),
      deleteContent: (kind: ContentKind, id: string) =>
        update((d) => {
          const item = (d[kind] as { id: string; title?: string; name?: string }[]).find((x) => x.id === id)
          let next: Data = { ...d, [kind]: (d[kind] as { id: string }[]).filter((x) => x.id !== id) }
          if (kind === 'opportunities') next = { ...next, applications: next.applications.filter((a) => a.opportunityId !== id) }
          if (kind === 'challenges') {
            next = {
              ...next,
              submissions: next.submissions.filter((s) => s.challengeId !== id),
              opportunities: next.opportunities.map((o) => (o.challengeId === id ? { ...o, challengeId: undefined } : o)),
            }
          }
          if (kind === 'mentors') next = { ...next, bookings: next.bookings.filter((b) => b.mentorId !== id) }
          return withLog(next, `${nameOf(d)} deleted "${item?.title ?? item?.name}"`)
        }),

      toggleShortlist: (personId: string) =>
        update((d) => {
          const existing = d.pipeline.find((p) => p.recruiterId === d.session && p.personId === personId)
          if (existing) return { ...d, pipeline: d.pipeline.filter((p) => p.id !== existing.id) }
          const entry: PipelineEntry = { id: uid('pipe'), recruiterId: d.session!, personId, stage: 'Shortlisted', note: '', updatedOn: today() }
          return { ...d, pipeline: [...d.pipeline, entry] }
        }),
      updatePipeline: (id: string, patch: Partial<Omit<PipelineEntry, 'id' | 'recruiterId' | 'personId'>>) =>
        update((d) => ({ ...d, pipeline: d.pipeline.map((p) => (p.id === id ? { ...p, ...patch, updatedOn: today() } : p)) })),
      removePipeline: (id: string) => update((d) => ({ ...d, pipeline: d.pipeline.filter((p) => p.id !== id) })),

      setAccountStatus: (id: string, status: Account['status']) =>
        update((d) => {
          const acc = d.accounts.find((a) => a.id === id)
          return withLog(
            { ...d, accounts: d.accounts.map((a) => (a.id === id ? { ...a, status } : a)) },
            `${nameOf(d)} ${status === 'suspended' ? 'suspended' : 'restored'} ${acc?.name}'s account`,
          )
        }),
      deleteAccount: (id: string) =>
        update((d) => {
          const acc = d.accounts.find((a) => a.id === id)
          return withLog(
            {
              ...d,
              accounts: d.accounts.filter((a) => a.id !== id),
              applications: d.applications.filter((a) => a.accountId !== id),
              submissions: d.submissions.filter((s) => s.accountId !== id),
              bookings: d.bookings.filter((b) => b.accountId !== id && b.mentorId !== acc?.mentorId),
              pipeline: d.pipeline.filter((p) => p.recruiterId !== id && p.personId !== id),
              ventures: d.ventures.filter((v) => v.ownerId !== id),
              mentors: d.mentors.filter((m) => m.ownerId !== id),
              people: d.people.filter((p) => p.id !== acc?.personId),
            },
            `${nameOf(d)} deleted ${acc?.name}'s account`,
          )
        }),

      saveScheme: (s: Scheme) =>
        update((d) => {
          const exists = d.schemes.some((x) => x.id === s.id)
          return withLog(
            { ...d, schemes: exists ? d.schemes.map((x) => (x.id === s.id ? s : x)) : [...d.schemes, s] },
            `${nameOf(d)} ${exists ? 'updated' : 'added'} the scheme "${s.name}"`,
          )
        }),
      deleteScheme: (id: string) =>
        update((d) => {
          const s = d.schemes.find((x) => x.id === id)
          return withLog({ ...d, schemes: d.schemes.filter((x) => x.id !== id) }, `${nameOf(d)} deleted the scheme "${s?.name}"`)
        }),

      updateSettings: (patch: Partial<Settings>) =>
        update((d) => withLog({ ...d, settings: { ...d.settings, ...patch } }, `${nameOf(d)} changed platform settings`)),
      reset: () =>
        update((d) => {
          const fresh = seed()
          return { ...fresh, session: fresh.accounts.some((a) => a.id === d.session) ? d.session : null }
        }),
    }
  }, [data])
}

type Store = ReturnType<typeof useAppState>

const StoreContext = createContext<Store | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const store = useAppState()
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside AppStoreProvider')
  return store
}
