import { useCallback } from 'react'
import { defaultSaturdaySlots, defaultWeekdaySlots } from '../pages/MentorDetail'
import type { Opportunity, OpportunityKind } from '../data/types'
import type { ToolDecl } from '../lib/millisa'
import { overlap } from '../lib/match'
import { kindLabel, useStore, type ApplicationStatus } from '../store/AppStore'

const str = (description: string) => ({ type: 'string', description })
const obj = (properties: Record<string, object>, required: string[] = []) => ({ type: 'object', properties, required })

const decls: Record<string, ToolDecl> = {
  search_opportunities: {
    name: 'search_opportunities',
    description: 'Search live jobs, internships, gigs and co-founder roles on HackShift. Returns ids you can use with other tools.',
    parameters: obj({
      query: str('Words to match against title, company, city or skills. Empty for everything.'),
      kind: { type: 'string', enum: ['Internship', 'Job', 'Part-time', 'Apprenticeship', 'Contract', 'Gig', 'Co-founder'] },
      city: str('City name'),
      remote: { type: 'boolean', description: 'Only roles that can be done remotely' },
    }),
  },
  search_challenges: {
    name: 'search_challenges',
    description: 'Search live paid challenges from startups.',
    parameters: obj({ query: str('Words to match'), maxHours: { type: 'number', description: 'Longest time the user can give' } }),
  },
  search_mentors: {
    name: 'search_mentors',
    description: 'Search mentors by topic or language. Results include each mentor id and their open times.',
    parameters: obj({ topic: str('Topic such as Fundraising or Career switch'), language: str('Language such as Hindi') }),
  },
  search_people: {
    name: 'search_people',
    description: 'Search people with verified work on HackShift. Only for hiring accounts. Results include accountId for messages.',
    parameters: obj({ skill: str('A skill'), city: str('A city') }),
  },
  my_overview: {
    name: 'my_overview',
    description: "The signed-in user's own applications, challenge submissions, mentor sessions, saved roles and ventures with their status.",
    parameters: obj({}),
  },
  list_applicants: {
    name: 'list_applicants',
    description: "Applicants to the signed-in employer's own roles, with status and skill match. Includes applicationId.",
    parameters: obj({ roleId: str('Only this role') }),
  },
  save_opportunity: {
    name: 'save_opportunity',
    description: "Add a role to the user's saved list. Safe to do without asking.",
    parameters: obj({ id: str('Opportunity id') }, ['id']),
  },
  apply_to_opportunity: {
    name: 'apply_to_opportunity',
    description: 'Prepare an application with a short note. The user must approve it before it is sent.',
    parameters: obj({ id: str('Opportunity id'), note: str('A short, honest note in first person, 40 to 90 words') }, ['id', 'note']),
  },
  request_mentor_session: {
    name: 'request_mentor_session',
    description: 'Prepare a 30 minute session request with a mentor. The user must approve it. Leave day and time empty to use the next open slot.',
    parameters: obj(
      { mentorId: str('Mentor id'), topic: str('What the user wants to talk about, one or two sentences'), day: str('Day label from the mentor results'), time: str('Time label') },
      ['mentorId', 'topic'],
    ),
  },
  send_message: {
    name: 'send_message',
    description: 'Prepare a direct message to another account. The user must approve it before it is sent.',
    parameters: obj({ accountId: str('Account id of the person or company'), text: str('The message') }, ['accountId', 'text']),
  },
  create_role_draft: {
    name: 'create_role_draft',
    description: "Prepare a new role for the employer's company. The user must approve it, then it goes to HackShift review.",
    parameters: obj(
      {
        title: str('Role title'),
        kind: { type: 'string', enum: ['Internship', 'Job', 'Part-time', 'Apprenticeship', 'Contract', 'Gig', 'Co-founder'] },
        city: str('City'),
        remote: { type: 'boolean', description: 'True only if the user said the role can be remote' },
        pay: str('Pay in rupees, for example ₹15,000 / month'),
        skills: { type: 'array', items: { type: 'string' } },
        work: { type: 'array', items: { type: 'string' }, description: 'Three to five lines on what the person will do' },
      },
      ['title', 'kind', 'city', 'pay', 'skills', 'work'],
    ),
  },
  move_applicant: {
    name: 'move_applicant',
    description: 'Prepare to move an applicant forward to Under review, Shortlisted or Interview. The user must approve it. You can never reject anyone.',
    parameters: obj({ applicationId: str('Application id'), status: { type: 'string', enum: ['Under review', 'Shortlisted', 'Interview'] } }, ['applicationId', 'status']),
  },
}

export const approvalTools = new Set(['apply_to_opportunity', 'request_mentor_session', 'send_message', 'create_role_draft', 'move_applicant'])

export const toolLabels: Record<string, string> = {
  search_opportunities: 'Looking through roles',
  search_challenges: 'Looking through challenges',
  search_mentors: 'Looking through mentors',
  search_people: 'Looking through people',
  my_overview: 'Checking your activity',
  list_applicants: 'Checking your applicants',
  save_opportunity: 'Saving the role',
  apply_to_opportunity: 'Preparing your application',
  request_mentor_session: 'Preparing a session request',
  send_message: 'Preparing a message',
  create_role_draft: 'Drafting the role',
  move_applicant: 'Preparing the change',
}

function has(text: string, q?: unknown) {
  return !q || text.toLowerCase().includes(String(q).toLowerCase())
}

function nextDays(count: number, weekday: string[], saturday: string[]) {
  const out: { day: string; times: string[] }[] = []
  const d = new Date()
  while (out.length < count) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0) continue
    out.push({
      day: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      times: d.getDay() === 6 ? saturday : weekday,
    })
  }
  return out
}

function newId() {
  return `task-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function useMillisaTools() {
  const store = useStore()
  const { account, data, opportunities, challenges, mentors, people, profile } = store
  const kind = account?.kind
  const hiring = kind === 'startup' || kind === 'recruiter'

  const names = [
    'search_opportunities',
    'search_challenges',
    'search_mentors',
    ...(account ? ['my_overview'] : []),
    ...(hiring || kind === 'admin' ? ['search_people'] : []),
    ...(hiring ? ['list_applicants', 'create_role_draft', 'move_applicant'] : []),
    ...(account && !hiring && kind !== 'admin' ? ['save_opportunity', 'apply_to_opportunity', 'request_mentor_session'] : []),
    ...(account ? ['send_message'] : []),
  ]
  const tools = names.map((n) => decls[n])

  const openSlots = (mentorId: string) => {
    const m = data.mentors.find((x) => x.id === mentorId)
    if (!m) return []
    return nextDays(5, m.weekdaySlots ?? defaultWeekdaySlots, m.saturdaySlots ?? defaultSaturdaySlots).map((d) => ({
      day: d.day,
      times: d.times.filter((t) => !data.bookings.some((b) => b.mentorId === mentorId && b.day === d.day && b.time === t && b.status !== 'Declined')),
    }))
  }

  const queue = (tool: string, summary: string, args: Record<string, unknown>) => {
    const id = newId()
    store.addTask({ id, tool, summary, args, status: 'waiting' })
    return {
      status: 'waiting_for_user_approval',
      taskId: id,
      note: 'Nothing has been done yet. Tell the user it is ready and that they need to press Approve under your message. Do not say it is done.',
    }
  }

  const run = (name: string, args: Record<string, unknown>): object => {
    const myRoles = data.opportunities.filter((o) => o.ownerId === account?.id)
    switch (name) {
      case 'search_opportunities':
        return {
          results: opportunities
            .filter(
              (o) =>
                has(`${o.title} ${o.company} ${o.city} ${o.skills.join(' ')}`, args.query) &&
                (!args.kind || o.kind === args.kind) &&
                has(o.city, args.city) &&
                (args.remote !== true || o.remote),
            )
            .slice(0, 6)
            .map((o) => ({
              id: o.id,
              title: o.title,
              company: o.company,
              companyAccountId: o.ownerId,
              kind: o.kind,
              city: o.city,
              remote: o.remote,
              pay: o.pay,
              closes: o.closes,
              skills: o.skills,
              matchingSkills: profile ? overlap(o.skills, profile.skills) : [],
              link: `/opportunities/${o.id}`,
            })),
        }
      case 'search_challenges':
        return {
          results: challenges
            .filter((c) => has(`${c.title} ${c.company} ${c.skills.join(' ')}`, args.query) && (!args.maxHours || c.hours <= Number(args.maxHours)))
            .slice(0, 6)
            .map((c) => ({ id: c.id, title: c.title, company: c.company, hours: c.hours, level: c.level, reward: c.reward, link: `/challenges/${c.id}` })),
        }
      case 'search_mentors':
        return {
          results: mentors
            .filter((m) => has(m.expertise.join(' '), args.topic) && has(m.languages.join(' '), args.language))
            .slice(0, 5)
            .map((m) => ({
              id: m.id,
              accountId: m.ownerId,
              name: m.name,
              title: `${m.title} at ${m.company}`,
              topics: m.expertise,
              languages: m.languages,
              openTimes: openSlots(m.id).slice(0, 3),
              link: `/mentors/${m.id}`,
            })),
        }
      case 'search_people':
        if (!hiring && kind !== 'admin') return { error: 'Only hiring accounts can search people.' }
        return {
          results: people
            .filter((p) => has(p.skills.join(' '), args.skill) && has(p.city, args.city))
            .slice(0, 8)
            .map((p) => ({ name: p.name, accountId: store.accountOfPerson(p.id)?.id, city: p.city, skills: p.skills, verifiedWork: p.badges, openToOffers: p.available })),
        }
      case 'my_overview':
        return {
          applications: store.applications.map((a) => {
            const o = data.opportunities.find((x) => x.id === a.opportunityId)
            return { role: o?.title, company: o?.company, status: a.status, appliedOn: a.appliedOn }
          }),
          challenges: store.submissions.map((s) => ({ challenge: data.challenges.find((c) => c.id === s.challengeId)?.title, status: s.status, feedback: s.feedback })),
          sessions: store.bookings.map((b) => ({ mentor: data.mentors.find((m) => m.id === b.mentorId)?.name, when: `${b.day}, ${b.time}`, status: b.status })),
          saved: store.saved.map((id) => data.opportunities.find((o) => o.id === id)?.title).filter(Boolean),
          ventures: store.myVentures.map((v) => ({ name: v.name, stage: v.stage, status: v.status ?? 'live' })),
          ...(hiring ? { myRoles: myRoles.map((o) => ({ id: o.id, title: o.title, status: o.status ?? 'live' })) } : {}),
        }
      case 'list_applicants': {
        const ids = new Set(myRoles.filter((o) => !args.roleId || o.id === args.roleId).map((o) => o.id))
        return {
          applicants: data.applications
            .filter((a) => ids.has(a.opportunityId))
            .map((a) => {
              const who = store.accountById(a.accountId)
              const o = data.opportunities.find((x) => x.id === a.opportunityId)!
              return { applicationId: a.id, name: who?.name, accountId: who?.id, role: o.title, status: a.status, matchingSkills: who ? overlap(o.skills, who.profile.skills) : [], note: a.note }
            }),
        }
      }
      case 'save_opportunity': {
        const o = opportunities.find((x) => x.id === args.id)
        if (!o) return { error: 'No live role with that id.' }
        if (!store.saved.includes(o.id)) store.toggleSaved(o.id)
        store.addTask({ id: newId(), tool: name, summary: `Saved ${o.title} at ${o.company}`, args, status: 'done', result: 'Saved' })
        return { status: 'done', saved: o.title }
      }
      case 'apply_to_opportunity': {
        const o = opportunities.find((x) => x.id === args.id)
        if (!o) return { error: 'No live role with that id.' }
        if (store.applications.some((a) => a.opportunityId === o.id)) return { error: 'The user has already applied to this role.' }
        return queue(name, `Apply to ${o.title} at ${o.company}`, { id: o.id, note: String(args.note ?? '').trim() })
      }
      case 'request_mentor_session': {
        const m = mentors.find((x) => x.id === args.mentorId)
        if (!m) return { error: 'No mentor with that id.' }
        const slots = openSlots(m.id)
        const day = slots.find((s) => s.day === args.day && s.times.includes(String(args.time))) ? String(args.day) : slots.find((s) => s.times.length)?.day
        const time = day === args.day && args.time ? String(args.time) : slots.find((s) => s.day === day)?.times[0]
        if (!day || !time) return { error: `${m.name} has no open times this week.` }
        return queue(name, `Ask ${m.name} for a session on ${day}, ${time}`, { mentorId: m.id, day, time, topic: String(args.topic ?? '').trim() })
      }
      case 'send_message': {
        const to = store.accountById(String(args.accountId))
        if (!to || to.id === account?.id) return { error: 'That account cannot be messaged. Use an accountId from a search result.' }
        const label = to.company && (to.kind === 'startup' || to.kind === 'recruiter') ? `${to.name} at ${to.company}` : to.name
        return queue(name, `Message ${label}`, { accountId: to.id, text: String(args.text ?? '').trim() })
      }
      case 'create_role_draft': {
        if (!hiring) return { error: 'Only startups and recruiters can post roles.' }
        return queue(name, `Post "${args.title}" at ${account?.company}`, args)
      }
      case 'move_applicant': {
        const app = data.applications.find((a) => a.id === args.applicationId)
        const o = app && data.opportunities.find((x) => x.id === app.opportunityId)
        if (!app || !o || o.ownerId !== account?.id) return { error: 'That application is not for one of your roles.' }
        if (!['Under review', 'Shortlisted', 'Interview'].includes(String(args.status))) return { error: 'Millisa can only move people forward.' }
        return queue(name, `Move ${store.accountById(app.accountId)?.name} to ${args.status} for ${o.title}`, { applicationId: app.id, status: args.status })
      }
      default:
        return { error: `Unknown tool ${name}` }
    }
  }

  const approve = useCallback(
    (taskId: string) => {
      const task = data.tasks.find((t) => t.id === taskId)
      if (!task || task.status !== 'waiting') return
      const a = task.args
      try {
        if (task.tool === 'apply_to_opportunity') store.apply(String(a.id), String(a.note ?? ''))
        else if (task.tool === 'request_mentor_session')
          store.book({ mentorId: String(a.mentorId), day: String(a.day), time: String(a.time), topic: String(a.topic ?? '') })
        else if (task.tool === 'send_message') store.sendMessage(String(a.accountId), String(a.text ?? ''))
        else if (task.tool === 'move_applicant') store.setApplicationStatus(String(a.applicationId), a.status as ApplicationStatus)
        else if (task.tool === 'create_role_draft') {
          const role: Opportunity = {
            id: `${String(a.title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
            title: String(a.title),
            company: account?.company ?? '',
            kind: (a.kind as OpportunityKind) ?? 'Job',
            city: String(a.city ?? account?.profile.city ?? ''),
            remote: !!a.remote,
            pay: String(a.pay ?? ''),
            skills: (a.skills as string[]) ?? [],
            work: (a.work as string[]) ?? [],
            about: account?.companyAbout ?? '',
            closes: 'Open',
            postedDaysAgo: 0,
          }
          store.saveOpportunity(role)
        }
        store.setTask(taskId, { status: 'done', result: 'Approved and done' })
      } catch {
        store.setTask(taskId, { status: 'failed', result: 'Something went wrong while doing this' })
      }
    },
    [data.tasks, store, account],
  )

  const decline = useCallback((taskId: string) => store.setTask(taskId, { status: 'declined', result: 'Declined' }), [store])

  const rules = [
    'You can use tools. Look things up with tools instead of guessing, and use ids exactly as tools return them.',
    'Tools that apply, book, message, post or move an applicant only prepare the action. The app shows an Approve button under your reply. Never say these are done, sent or booked. Say they are ready to approve.',
    'You can never reject, rank out or filter away a person. Explain fit honestly and leave decisions to people.',
    'Saving a role is safe to do directly when the user asks.',
    account ? `The user is signed in as a ${kindLabel[account.kind].toLowerCase()}.` : 'The user is not signed in, so you can only search. Suggest signing in to apply or book.',
  ].join('\n')

  return { tools, run, approve, decline, rules }
}
