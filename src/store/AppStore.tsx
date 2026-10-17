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
  Message,
  MillisaTask,
  Notice,
  PipelineEntry,
  Profile,
  Settings,
  UsageEntry,
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
  Message,
  MillisaTask,
  Notice,
  PipelineEntry,
  PipelineStage,
  Profile,
  Submission,
  SubmissionStatus,
} from './types'

const STORAGE_KEY = 'hackshift:v3'

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
    if (parsed?.version === 3) return normalize(parsed)
  } catch {
    return seed()
  }
  return seed()
}

function normalize(d: Data): Data {
  const fresh = seed()
  const filled = { ...fresh, ...d, settings: { ...fresh.settings, ...d.settings } }
  return { ...filled, accounts: filled.accounts.map((a) => ({ ...a, kinds: a.kinds?.length ? a.kinds : [a.kind] })) }
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

function notify(d: Data, accountId: string | undefined, text: string, link?: string): Data {
  if (!accountId || accountId === d.session) return d
  const notice: Notice = { id: uid('n'), accountId, at: new Date().toISOString(), text, link, read: false }
  return { ...d, notices: [notice, ...d.notices].slice(0, 300) }
}

function mentorAccountId(d: Data, mentorId: string) {
  return d.accounts.find((a) => a.mentorId === mentorId)?.id
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
        kinds: [kind],
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
          const next = notify({ ...d, applications: [...others, app] }, o?.ownerId, `${nameOf(d)} applied to ${o?.title}`, '/panel/applicants')
          return withLog(next, `${nameOf(d)} applied to ${o?.title} at ${o?.company}`)
        }),
      withdrawApplication: (id: string) =>
        update((d) => ({ ...d, applications: d.applications.filter((a) => a.id !== id) })),
      setApplicationStatus: (id: string, status: ApplicationStatus) =>
        update((d) => {
          const app = d.applications.find((a) => a.id === id)
          const who = app && d.accounts.find((a) => a.id === app.accountId)?.name
          const o = app && d.opportunities.find((x) => x.id === app.opportunityId)
          const next = notify(
            { ...d, applications: d.applications.map((a) => (a.id === id ? { ...a, status } : a)) },
            app?.accountId,
            `${o?.company}: your application for ${o?.title} is now ${status.toLowerCase()}`,
            '/panel/applications',
          )
          return withLog(next, `${nameOf(d)} moved ${who}'s application to ${status}`)
        }),

      submit: (challengeId: string, link: string, note: string) =>
        update((d) => {
          const c = d.challenges.find((x) => x.id === challengeId)
          const others = d.submissions.filter((s) => !(s.accountId === d.session && s.challengeId === challengeId))
          const sub = { id: uid('sub'), challengeId, accountId: d.session!, link, note, submittedOn: today(), status: 'In review' as const }
          const next = notify({ ...d, submissions: [...others, sub] }, c?.ownerId, `${nameOf(d)} sent work for "${c?.title}"`, '/panel/submissions')
          return withLog(next, `${nameOf(d)} submitted work for "${c?.title}"`)
        }),
      reviewSubmission: (id: string, status: SubmissionStatus, feedback: string) =>
        update((d) => {
          const sub = d.submissions.find((s) => s.id === id)
          const who = sub && d.accounts.find((a) => a.id === sub.accountId)?.name
          const c = sub && d.challenges.find((x) => x.id === sub.challengeId)
          const next = notify(
            { ...d, submissions: d.submissions.map((s) => (s.id === id ? { ...s, status, feedback } : s)) },
            sub?.accountId,
            status === 'Accepted' ? `${c?.company} accepted your work on "${c?.title}". It is now a badge on your profile.` : `${c?.company} reviewed your work on "${c?.title}"`,
            '/panel/challenges',
          )
          return withLog(next, `${nameOf(d)} marked ${who}'s submission as ${status.toLowerCase()}`)
        }),

      book: (b: { mentorId: string; day: string; time: string; topic: string }) =>
        update((d) => {
          const m = d.mentors.find((x) => x.id === b.mentorId)
          const booking = { ...b, id: uid('book'), accountId: d.session!, status: 'Requested' as const }
          const next = notify({ ...d, bookings: [...d.bookings, booking] }, mentorAccountId(d, b.mentorId), `${nameOf(d)} asked you for a session on ${b.day}, ${b.time}`, '/panel/sessions')
          return withLog(next, `${nameOf(d)} asked ${m?.name} for a session`)
        }),
      cancelBooking: (id: string) => update((d) => ({ ...d, bookings: d.bookings.filter((b) => b.id !== id) })),
      setBookingStatus: (id: string, status: BookingStatus, mentorNote?: string) =>
        update((d) => {
          const b = d.bookings.find((x) => x.id === id)
          const who = b && d.accounts.find((a) => a.id === b.accountId)?.name
          const mentors =
            status === 'Done' && b ? d.mentors.map((m) => (m.id === b.mentorId ? { ...m, sessions: m.sessions + 1 } : m)) : d.mentors
          const m = b && d.mentors.find((x) => x.id === b.mentorId)
          const words: Record<BookingStatus, string> = {
            Requested: 'is waiting',
            Confirmed: 'is confirmed',
            Done: 'is marked done. Read their note',
            Declined: 'cannot go ahead at that time',
          }
          const next = notify(
            {
              ...d,
              mentors,
              bookings: d.bookings.map((x) => (x.id === id ? { ...x, status, mentorNote: mentorNote ?? x.mentorNote } : x)),
            },
            b?.accountId,
            `Your session with ${m?.name} on ${b?.day} ${words[status]}`,
            '/panel/sessions',
          )
          return withLog(next, `${nameOf(d)} marked the session with ${who} as ${status.toLowerCase()}`)
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
          const item = (d[kind] as { id: string; title?: string; name?: string; ownerId?: string }[]).find((x) => x.id === id)
          const verb = status === 'live' ? 'approved' : status === 'hidden' ? 'hid' : 'sent back for review'
          const label = item?.title ?? item?.name
          let next: Data = { ...d, [kind]: (d[kind] as { id: string }[]).map((x) => (x.id === id ? { ...x, status } : x)) }
          const admin = d.accounts.find((a) => a.id === d.session)?.kind === 'admin'
          if (admin && status === 'live') next = notify(next, item?.ownerId, `"${label}" is approved and live on HackShift`, '/panel')
          if (admin && status === 'hidden') next = notify(next, item?.ownerId, `"${label}" was not approved. Write to the HackShift team to know why.`, '/panel')
          return withLog(next, `${nameOf(d)} ${verb} "${label}"`)
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

      notices: data.notices.filter((n) => n.accountId === myId),
      markNoticesRead: () =>
        update((d) => ({ ...d, notices: d.notices.map((n) => (n.accountId === d.session ? { ...n, read: true } : n)) })),
      openNotice: (id: string) => update((d) => ({ ...d, notices: d.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

      threads: Object.values(
        data.messages
          .filter((m) => m.from === myId || m.to === myId)
          .reduce<Record<string, { otherId: string; last: Message; unread: number }>>((acc, m) => {
            const otherId = m.from === myId ? m.to : m.from
            const prev = acc[otherId]
            acc[otherId] = {
              otherId,
              last: !prev || m.at > prev.last.at ? m : prev.last,
              unread: (prev?.unread ?? 0) + (m.to === myId && !m.read ? 1 : 0),
            }
            return acc
          }, {}),
      ).sort((a, b) => (a.last.at < b.last.at ? 1 : -1)),
      conversation: (otherId: string) =>
        data.messages
          .filter((m) => (m.from === myId && m.to === otherId) || (m.from === otherId && m.to === myId))
          .sort((a, b) => (a.at < b.at ? -1 : 1)),
      sendMessage: (to: string, text: string) =>
        update((d) => {
          const msg: Message = { id: uid('m'), from: d.session!, to, text, at: new Date().toISOString(), read: false }
          return notify({ ...d, messages: [...d.messages, msg] }, to, `New message from ${nameOf(d)}`, `/panel/messages/${d.session}`)
        }),
      markThreadRead: (otherId: string) =>
        update((d) =>
          d.messages.some((m) => m.from === otherId && m.to === d.session && !m.read)
            ? { ...d, messages: d.messages.map((m) => (m.from === otherId && m.to === d.session ? { ...m, read: true } : m)) }
            : d,
        ),

      switchRole: (kind: AccountKind) => update((d) => patchMe(d, (a) => (a.kinds.includes(kind) ? { ...a, kind } : a))),
      addRole: (kind: Exclude<AccountKind, 'admin'>, company?: string) =>
        update((d) => {
          const me = d.accounts.find((a) => a.id === d.session)
          if (!me || me.kinds.includes(kind)) return d
          let next = patchMe(d, (a) => ({
            ...a,
            kinds: [...a.kinds, kind],
            kind,
            company: company?.trim() || a.company,
            mentorId: kind === 'mentor' ? a.mentorId ?? `mentor-${a.id}` : a.mentorId,
            profile: { ...a.profile, roles: Array.from(new Set([...a.profile.roles, kind === 'seeker' ? 'seeker' : kind])) },
          }))
          if (kind === 'mentor' && !d.mentors.some((m) => m.ownerId === me.id)) {
            const mentor: Mentor = {
              id: me.mentorId ?? `mentor-${me.id}`,
              name: me.name,
              title: 'Mentor',
              company: me.profile.college || 'Independent',
              city: me.profile.city,
              expertise: me.profile.skills.slice(0, 4),
              languages: ['English', 'Hindi'],
              bio: me.profile.goal,
              sessions: 0,
              yearsExp: 0,
              status: newStatus(d),
              ownerId: me.id,
            }
            next = { ...next, mentors: [...next.mentors, mentor] }
          }
          return withLog(next, `${me.name} added the ${kindLabel[kind].toLowerCase()} role`)
        }),

      requestVerification: () =>
        update((d) => {
          const me = d.accounts.find((a) => a.id === d.session)
          let next = patchMe(d, (a) => ({ ...a, verifyRequested: true }))
          for (const admin of d.accounts.filter((a) => a.kind === 'admin' || a.kinds.includes('admin'))) {
            next = notify(next, admin.id, `${me?.company && me.kind !== 'mentor' ? me.company : me?.name} asked to be verified`, '/admin/verification')
          }
          return withLog(next, `${me?.name} asked to be verified`)
        }),
      setVerified: (id: string, verified: boolean) =>
        update((d) => {
          const acc = d.accounts.find((a) => a.id === id)
          const next = notify(
            { ...d, accounts: d.accounts.map((a) => (a.id === id ? { ...a, verified, verifyRequested: false } : a)) },
            id,
            verified ? 'Your account is verified. People now see a verified badge next to your name.' : 'Your verification request was not approved this time.',
            '/panel/account',
          )
          return withLog(next, `${nameOf(d)} ${verified ? 'verified' : 'declined verification for'} ${acc?.name}`)
        }),
      isVerified: (ownerId?: string) => !!ownerId && !!data.accounts.find((a) => a.id === ownerId)?.verified,

      tasks: data.tasks.filter((t) => t.accountId === myId),
      addTask: (task: Omit<MillisaTask, 'accountId' | 'at'>) =>
        update((d) => ({ ...d, tasks: [{ ...task, accountId: d.session ?? '', at: new Date().toISOString() }, ...d.tasks].slice(0, 400) })),
      setTask: (id: string, patch: Partial<Pick<MillisaTask, 'status' | 'result'>>) =>
        update((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      clearTaskHistory: () =>
        update((d) => ({ ...d, tasks: d.tasks.filter((t) => t.accountId !== d.session || t.status === 'waiting') })),
      recordUsage: (entry: Omit<UsageEntry, 'at' | 'accountId'>) =>
        update((d) => ({ ...d, usage: [{ ...entry, at: new Date().toISOString(), accountId: d.session ?? 'guest' }, ...d.usage].slice(0, 1000) })),
      usedToday: data.usage.filter((u) => u.accountId === (myId || 'guest') && u.at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,

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
              notices: d.notices.filter((n) => n.accountId !== id),
              messages: d.messages.filter((m) => m.from !== id && m.to !== id),
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
