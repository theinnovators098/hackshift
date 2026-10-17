import { roleInfo } from '../data/roles'
import type { Challenge, Mentor, Opportunity, Scheme, Stage, Venture } from '../data/types'
import type { CareerPlan, Profile, Submission } from '../store/types'
import { languageRule, type Lang, type Turn } from './millisa'

const persona = [
  'You are Millisa, the assistant inside HackShift. HackShift is an Indian platform that connects job seekers, founders, startups, mentors and recruiters through real work.',
  'Sound like a senior friend who has done this before: warm, direct and practical. No hype, no emojis, and no filler such as "Great question".',
  'Only use facts from the HackShift data and the user details you are given. Never invent roles, mentors, schemes, amounts, dates or numbers.',
  "If asked what model, company or technology you run on, say you are Millisa, HackShift's assistant, and that you cannot share technical details.",
].join('\n')

function system(lang: Lang, ...rules: string[]) {
  return [persona, languageRule(lang), '', ...rules].join('\n')
}

function ask(text: string): Turn[] {
  return [{ role: 'user', text }]
}

function profileBlock(profile: Profile | null) {
  if (!profile) return 'The user has not created a profile yet.'
  return [
    `Name: ${profile.name}`,
    `City: ${profile.city}`,
    profile.college && `College or company: ${profile.college}`,
    `Here as: ${profile.roles.map((r) => roleInfo[r].short).join(', ')}`,
    `Skills: ${profile.skills.join(', ') || 'none listed'}`,
    profile.goal && `Goal: ${profile.goal}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function roleBlock(o: Opportunity) {
  return [
    `Role: ${o.title}`,
    `Company: ${o.company}, ${o.city}${o.remote ? ' (remote ok)' : ''}`,
    `Type: ${o.kind}`,
    `Pay: ${o.pay}`,
    `About the company: ${o.about}`,
    `The work: ${o.work.join('; ')}`,
    `Skills asked for: ${o.skills.join(', ')}`,
  ].join('\n')
}

export interface Site {
  opportunities: Opportunity[]
  challenges: Challenge[]
  mentors: Mentor[]
  ventures: Venture[]
  schemes: Scheme[]
}

function catalog({ opportunities, challenges, mentors, ventures, schemes }: Site) {
  const groupName = (g: string) => (g === 'women' ? 'women founders' : 'SC/ST founders')
  return [
    'OPPORTUNITIES',
    ...opportunities.map(
      (o) =>
        `- [${o.title} at ${o.company}](/opportunities/${o.id}) | ${o.kind} | ${o.city}${o.remote ? ', remote ok' : ''} | ${o.pay} | skills: ${o.skills.join(', ')} | closes: ${o.closes}${o.challengeId ? ` | has a linked challenge: /challenges/${o.challengeId}` : ''}`,
    ),
    '',
    'CHALLENGES (small paid tasks; accepted work becomes a profile badge)',
    ...challenges.map(
      (c) =>
        `- [${c.title}](/challenges/${c.id}) | ${c.company} | ${c.level} | about ${c.hours} hours | reward: ${c.reward} | skills: ${c.skills.join(', ')} | closes ${c.closes}`,
    ),
    '',
    'MENTORS (sessions are free and last 30 minutes)',
    ...mentors.map(
      (m) =>
        `- [${m.name}](/mentors/${m.id}) | ${m.title} at ${m.company} | ${m.city} | topics: ${m.expertise.join(', ')} | speaks: ${m.languages.join(', ')}`,
    ),
    '',
    'VENTURES',
    ...ventures.map(
      (v) =>
        `- [${v.name}](/ventures/${v.id}) | ${v.oneLiner} | ${v.city} | ${v.sector} | stage: ${v.stage} | looking for: ${v.lookingFor.join(', ') || 'nothing listed'}${v.mine ? ' | posted by this user' : ''}`,
    ),
    '',
    'GOVERNMENT SCHEMES (the finder is at /schemes)',
    ...schemes.map(
      (s) =>
        `- ${s.name} | ${s.runBy} | ${s.amount} | for stages: ${s.stages.join(', ')} | ${s.summary}${s.onlyFor ? ` | only for ${s.onlyFor.map(groupName).join(' and ')}` : ''} | official site: ${s.link}`,
    ),
  ].join('\n')
}

export function chatSystem(profile: Profile | null, site: Site, page: string, lang: Lang) {
  return [
    persona,
    '',
    'You are answering in a chat panel on the HackShift website. Rules:',
    "- Match the script of the user's latest message. If it contains Devanagari, reply in Hindi written in Devanagari. If it is Hindi written in Latin letters (Hinglish), reply in Hinglish. If it is English, reply in English.",
    `- If you cannot tell, follow this: ${languageRule(lang)}`,
    '- Keep replies under 120 words unless the user asks for more detail.',
    '- When you suggest something on HackShift, link it using the markdown link from the data, for example [Frontend intern at Tapri Pay](/opportunities/tapri-frontend-intern).',
    '- Use a short bulleted list when you give two or more options. Use bold sparingly.',
    '- Write natural sentences. Never copy the raw data lines or their | separators into your reply.',
    '- If nothing on HackShift fits, say so plainly and suggest the closest option or a next step.',
    '- When you talk about a government scheme, add that the details should be confirmed on its official website.',
    '',
    `The user is on this page: ${page}`,
    '',
    'ABOUT THE USER',
    profileBlock(profile),
    '',
    'HACKSHIFT DATA',
    catalog(site),
  ].join('\n')
}

export type Verdict = 'Strong fit' | 'Good fit' | 'Stretch'

export interface Fit {
  verdict: Verdict
  summary: string
  strengths: string[]
  gaps: string[]
  firstStep: string
}

const list = (description: string) => ({ type: 'array', items: { type: 'string' }, description })

export const fitSchema = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['Strong fit', 'Good fit', 'Stretch'] },
    summary: { type: 'string', description: 'At most two sentences, speaking to the user as "you"' },
    strengths: list('Up to three short points on what already matches'),
    gaps: list('Up to three short points on what is missing. Empty if nothing important is missing.'),
    firstStep: { type: 'string', description: 'One concrete thing to do this week to improve the chances' },
  },
  required: ['verdict', 'summary', 'strengths', 'gaps', 'firstStep'],
}

export function fitRequest(profile: Profile, o: Opportunity, challenge: Challenge | undefined, submission: Submission | undefined, lang: Lang) {
  const challengeLine = challenge
    ? `This role has a linked challenge: "${challenge.title}" (${challenge.hours} hours). ${submission ? `The user has submitted it (${submission.status}).` : 'The user has not done it yet.'}`
    : 'This role has no linked challenge.'
  return {
    system: system(
      lang,
      'You are checking how well one person fits one role. Be honest and specific. Do not flatter.',
      'Use "Stretch" when they have under half of the skills, and then point to the shortest way to close the gap, such as the linked challenge.',
    ),
    turns: ask(`THE PERSON\n${profileBlock(profile)}\n\nTHE ROLE\n${roleBlock(o)}\n\n${challengeLine}`),
    schema: fitSchema,
  }
}

export function draftRequest(profile: Profile, o: Opportunity, challenge: Challenge | undefined, submission: Submission | undefined, lang: Lang) {
  return {
    system: system(
      lang,
      'Write a short application note that the user will send to a startup. Rules:',
      '- 60 to 90 words, first person, no greeting and no sign-off.',
      '- Do not use clichés such as passionate, hardworking, dream, or "I am writing to apply".',
      "- Mention one or two of the user's skills that match the role, and one specific thing about the company's work.",
      '- If the user lacks a listed skill, say briefly and honestly that they are learning it.',
      '- Mention the linked challenge only if the details below say the user has submitted it.',
      '- Never invent projects, numbers, employers or experience, and do not overstate skill with words like strong, expert or extensive.',
      '- Return only the note, as plain text.',
    ),
    turns: ask(
      `THE PERSON\n${profileBlock(profile)}\n\nTHE ROLE\n${roleBlock(o)}\n\n${
        challenge && submission
          ? `The user has submitted the linked challenge "${challenge.title}".`
          : 'The user has not done any challenge for this role, so do not mention one.'
      }`,
    ),
  }
}

export interface Question {
  question: string
  lookFor: string
}

export const questionsSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      minItems: 5,
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'One sentence' },
          lookFor: { type: 'string', description: 'What a good answer covers, under 15 words' },
        },
        required: ['question', 'lookFor'],
      },
    },
  },
  required: ['questions'],
}

export function questionsRequest(o: Opportunity, profile: Profile | null, lang: Lang) {
  return {
    system: system(
      lang,
      'Write five interview questions for this role, the way the founder of a small Indian startup would ask them in a first call.',
      'Question 1: about the person and why this role. Questions 2 and 3: practical questions on the listed skills and the work described.',
      "Question 4: a real situation from this company's context. Question 5: how they learn something new or handle a setback.",
    ),
    turns: ask(`${roleBlock(o)}\n\nCANDIDATE\n${profileBlock(profile)}`),
    schema: questionsSchema,
  }
}

export interface Feedback {
  score: number
  worked: string
  improve: string
  stronger: string
}

export const feedbackSchema = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 1, maximum: 5 },
    worked: { type: 'string', description: 'What worked in the answer, one or two sentences' },
    improve: { type: 'string', description: 'The single most useful change, one or two sentences' },
    stronger: {
      type: 'string',
      description: 'A stronger version of their answer in first person, two or three sentences',
    },
  },
  required: ['score', 'worked', 'improve', 'stronger'],
}

export function feedbackRequest(o: Opportunity, profile: Profile | null, q: Question, answer: string, lang: Lang) {
  return {
    system: system(
      lang,
      'You are giving feedback on one answer in a practice interview. Be kind but honest.',
      'Score from 1 to 5, where 3 is an acceptable answer and 5 would impress a founder. A very short or off-topic answer scores 1 or 2, and you should say why.',
      'For the stronger version, use only facts from their answer and profile. Where a detail is missing, write a placeholder in square brackets, such as [name the project].',
    ),
    turns: ask(
      `${roleBlock(o)}\n\nCANDIDATE\n${profileBlock(profile)}\n\nQUESTION: ${q.question}\nA GOOD ANSWER COVERS: ${q.lookFor}\n\nTHEIR ANSWER:\n${answer}`,
    ),
    schema: feedbackSchema,
  }
}

export interface IdeaReview {
  verdict: string
  strengths: string[]
  questions: string[]
  stage: Stage
  stageReason: string
  experiments: { title: string; how: string; cost: string }[]
  oneLiner: string
}

export const ideaSchema = {
  type: 'object',
  properties: {
    verdict: { type: 'string', description: 'One honest sentence on how clear and convincing the idea is' },
    strengths: list('Up to three short points that are already strong'),
    questions: list('Up to three questions a co-founder or investor would ask next'),
    stage: { type: 'string', enum: ['Idea', 'Validated', 'MVP', 'Funded'] },
    stageReason: { type: 'string', description: 'One sentence on why this stage fits the proof given' },
    experiments: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Under 8 words' },
          how: { type: 'string', description: 'One or two sentences' },
          cost: { type: 'string', description: 'Rough cost in rupees, such as "Free" or "About ₹2,000"' },
        },
        required: ['title', 'how', 'cost'],
      },
    },
    oneLiner: { type: 'string', description: 'A sharper one-line description, at most 110 characters' },
  },
  required: ['verdict', 'strengths', 'questions', 'stage', 'stageReason', 'experiments', 'oneLiner'],
}

export interface IdeaDraft {
  name: string
  oneLiner: string
  sector: string
  city: string
  stage: Stage
  problem: string
  progress: string
  needs: string[]
}

export function ideaRequest(idea: IdeaDraft, lang: Lang) {
  return {
    system: system(
      lang,
      'Review a startup idea before the founder posts it on HackShift. Be encouraging but honest, and specific to India and their city.',
      'Stage rules: Idea if there is no proof from real people yet. Validated if real people confirmed the problem or paid for a fix. MVP if people use a working version. Funded if money has been raised. Judge only from the proof given.',
      'The three experiments must be cheap (under ₹5,000), doable by one person in two weeks, and test the riskiest assumption first.',
    ),
    turns: ask(
      [
        `Name: ${idea.name || 'not given'}`,
        `One line: ${idea.oneLiner || 'not given'}`,
        `Sector: ${idea.sector || 'not given'}`,
        `City: ${idea.city || 'not given'}`,
        `Stage the founder picked: ${idea.stage}`,
        `Problem: ${idea.problem}`,
        `Proof so far: ${idea.progress.trim() || 'none given'}`,
        `Looking for: ${idea.needs.join(', ') || 'not given'}`,
      ].join('\n'),
    ),
    schema: ideaSchema,
  }
}

export type Readiness = 'Ready' | 'Almost' | 'Not yet'

export interface PreReview {
  readiness: Readiness
  summary: string
  covered: string[]
  missing: string[]
  questions: string[]
  note: string
}

export const preReviewSchema = {
  type: 'object',
  properties: {
    readiness: { type: 'string', enum: ['Ready', 'Almost', 'Not yet'] },
    summary: { type: 'string', description: 'Two sentences at most' },
    covered: list('Deliverables from the brief that the submission clearly covers'),
    missing: list('Deliverables or details that are missing or unclear'),
    questions: list('Up to three questions the reviewer is likely to ask'),
    note: { type: 'string', description: 'A clearer version of their note for the reviewer, 50 to 90 words' },
  },
  required: ['readiness', 'summary', 'covered', 'missing', 'questions', 'note'],
}

export function preReviewRequest(c: Challenge, link: string, note: string, lang: Lang) {
  return {
    system: system(
      lang,
      'Pre-review a challenge submission before it is sent to the startup.',
      'You cannot open the link. Judge only the note, the kind of link (GitHub, Figma, Google Docs, Colab and so on) and whether that matches what the brief asks for. If the note is too thin to judge, say so.',
      'When you rewrite the note, keep every fact they gave and add nothing new. Mark missing information with a placeholder in square brackets.',
    ),
    turns: ask(
      `CHALLENGE: ${c.title} from ${c.company}\nBRIEF: ${c.brief}\nWHAT TO SEND:\n${c.deliverables.map((d) => `- ${d}`).join('\n')}\n\nLINK: ${link || 'not given yet'}\nNOTE FOR THE REVIEWER:\n${note || 'not written yet'}`,
    ),
    schema: preReviewSchema,
  }
}

export interface ResumeRead {
  headline: string
  about: string
  skills: string[]
  education: { school: string; degree: string; years: string }[]
  work: { role: string; org: string; years: string; summary: string }[]
  certificates: { name: string; issuer: string; year: string }[]
  links: { github: string; portfolio: string; linkedin: string; website: string }
}

const row = (fields: string[]) => ({
  type: 'array',
  items: { type: 'object', properties: Object.fromEntries(fields.map((f) => [f, { type: 'string' }])), required: fields },
})

export const resumeSchema = {
  type: 'object',
  properties: {
    headline: { type: 'string', description: 'One line on who they are, under 70 characters. Empty if unclear.' },
    about: { type: 'string', description: 'Two or three sentences in first person, only from facts in the resume' },
    skills: list('Skills named in the resume, short names like React or Excel'),
    education: row(['school', 'degree', 'years']),
    work: row(['role', 'org', 'years', 'summary']),
    certificates: row(['name', 'issuer', 'year']),
    links: {
      type: 'object',
      properties: { github: { type: 'string' }, portfolio: { type: 'string' }, linkedin: { type: 'string' }, website: { type: 'string' } },
      required: ['github', 'portfolio', 'linkedin', 'website'],
    },
  },
  required: ['headline', 'about', 'skills', 'education', 'work', 'certificates', 'links'],
}

export function resumeRequest() {
  return {
    system: system(
      'en',
      'Read the attached resume and pull out the facts into the given fields.',
      'Copy facts exactly. Never guess or add anything that is not written in the resume. Use an empty string or an empty list when something is missing.',
      'Write years like "2021 to 2025" or "2024 to now". Keep work summaries to one sentence.',
    ),
    turns: ask('Here is my resume. Pull out my details.'),
    schema: resumeSchema,
  }
}

export function summaryRequest(profile: Profile, lang: Lang) {
  return {
    system: system(
      lang,
      'Write the "About" paragraph for this person\'s HackShift profile, in first person, 40 to 70 words.',
      'Use only facts from their details. No clichés such as passionate, hardworking or go-getter. End with what they are looking for next.',
      'Return only the paragraph.',
    ),
    turns: ask(
      [
        profileBlock(profile),
        profile.headline && `Headline: ${profile.headline}`,
        profile.work?.length && `Work: ${profile.work.map((w) => `${w.role} at ${w.org} (${w.years}): ${w.summary}`).join('; ')}`,
        profile.education?.length && `Education: ${profile.education.map((e) => `${e.degree}, ${e.school} (${e.years})`).join('; ')}`,
      ]
        .filter(Boolean)
        .join('\n'),
    ),
  }
}

export const planSchema = {
  type: 'object',
  properties: {
    have: list('Skills and experience they already have that help with the target, up to five'),
    gaps: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          skill: { type: 'string' },
          why: { type: 'string', description: 'Why the target role needs it, one sentence' },
          how: { type: 'string', description: 'A free or low-cost way to learn it, such as NPTEL, freeCodeCamp or building a small project. No links.' },
        },
        required: ['skill', 'why', 'how'],
      },
    },
    weeks: {
      type: 'array',
      minItems: 4,
      maxItems: 8,
      items: {
        type: 'object',
        properties: { week: { type: 'integer' }, focus: { type: 'string' }, tasks: list('Two or three concrete tasks for the week') },
        required: ['week', 'focus', 'tasks'],
      },
    },
    challengeIds: list('Up to three challenge ids from the HackShift list that build the missing skills'),
    mentorIds: list('Up to two mentor ids from the HackShift list who could help'),
  },
  required: ['have', 'gaps', 'weeks', 'challengeIds', 'mentorIds'],
}

export function planRequest(profile: Profile, target: string, site: Pick<Site, 'challenges' | 'mentors' | 'opportunities'>, lang: Lang) {
  return {
    system: system(
      lang,
      'Make a realistic career plan for an Indian student or early-career person who can give 6 to 10 hours a week.',
      'Be honest about the gap. Prefer free resources and real projects. Only use challenge and mentor ids from the lists given.',
      'In the week tasks, name challenges and mentors by their title or name, never by their id.',
    ),
    turns: ask(
      [
        `TARGET ROLE: ${target}`,
        '',
        'THE PERSON',
        profileBlock(profile),
        profile.work?.length ? `Work: ${profile.work.map((w) => `${w.role} at ${w.org}`).join('; ')}` : '',
        '',
        'CHALLENGES',
        ...site.challenges.map((c) => `- ${c.id}: ${c.title} (${c.skills.join(', ')}, ${c.hours} hours)`),
        '',
        'MENTORS',
        ...site.mentors.map((m) => `- ${m.id}: ${m.name}, ${m.title}. Topics: ${m.expertise.join(', ')}`),
        '',
        'ROLES ON HACKSHIFT',
        ...site.opportunities.map((o) => `- ${o.title} at ${o.company}: ${o.skills.join(', ')}`),
      ].join('\n'),
    ),
    schema: planSchema,
  }
}

export type PlanReply = Omit<CareerPlan, 'target' | 'madeOn'>

export interface RoleDraft {
  title: string
  kind: string
  mode: string
  experience: string
  city: string
  pay: string
  monthly: number
  skills: string[]
  work: string[]
}

export const roleDraftSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    kind: { type: 'string', enum: ['Internship', 'Job', 'Part-time', 'Apprenticeship', 'Contract', 'Gig', 'Co-founder'] },
    mode: { type: 'string', enum: ['Remote', 'Hybrid', 'On-site'] },
    experience: { type: 'string', enum: ['Fresher', '1-3 years', '3+ years', ''] },
    city: { type: 'string' },
    pay: { type: 'string', description: 'Pay as people should read it, in rupees, for example ₹18,000 / month. Empty if not given.' },
    monthly: { type: 'integer', description: 'Monthly pay in rupees as a number, 0 if unknown or equity only' },
    skills: list('Three to six skills'),
    work: list('Three to five lines on what the person will actually do, each starting with a verb'),
  },
  required: ['title', 'kind', 'mode', 'experience', 'city', 'pay', 'monthly', 'skills', 'work'],
}

export function roleDraftRequest(instruction: string, company: string, about: string, city: string) {
  return {
    system: system(
      'en',
      `Turn a hiring manager's rough notes into a clear role listing for ${company} on HackShift.`,
      'Use only what the notes say. If pay is not given, leave pay empty and monthly 0, never invent a number. Use plain words and no buzzwords such as rockstar or ninja.',
      `If no city is given, use ${city || 'the company city'}.`,
    ),
    turns: ask(`ABOUT ${company}: ${about || 'not given'}\n\nNOTES FROM THE HIRING MANAGER:\n${instruction}`),
    schema: roleDraftSchema,
  }
}

export interface CandidateRead {
  summary: string
  strengths: string[]
  gaps: string[]
  ask: string[]
}

export const candidateSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'Two sentences on how their background lines up with the role' },
    strengths: list('Up to three points backed by their profile or work'),
    gaps: list('Up to three things the profile does not show yet'),
    ask: list('Three questions to ask them in the interview to check the gaps'),
  },
  required: ['summary', 'strengths', 'gaps', 'ask'],
}

export function candidateRequest(o: Opportunity, candidate: Profile, note: string, workStatus: string) {
  return {
    system: system(
      'en',
      'You help a hiring manager understand one applicant. You explain, you do not decide.',
      'Never recommend rejecting someone, never give a score or a ranking, and never mention age, gender, religion, caste or where someone is from as a reason.',
      'Base every point on the profile, the note and the challenge status given. If something is not shown, say it is not shown, not that it is missing from the person.',
    ),
    turns: ask(
      `${roleBlock(o)}\n\nAPPLICANT\n${profileBlock(candidate)}${
        candidate.work?.length ? `\nWork: ${candidate.work.map((w) => `${w.role} at ${w.org}: ${w.summary}`).join('; ')}` : ''
      }${candidate.education?.length ? `\nEducation: ${candidate.education.map((e) => `${e.degree}, ${e.school}`).join('; ')}` : ''}\n\nTHEIR NOTE: ${
        note || 'none'
      }\nLINKED CHALLENGE: ${workStatus}`,
    ),
    schema: candidateSchema,
  }
}

export type DraftPurpose = 'update' | 'interview' | 'offer' | 'rejection'

export function employerMessageRequest(purpose: DraftPurpose, company: string, role: string, candidate: string, extra: string) {
  const goals: Record<DraftPurpose, string> = {
    update: 'Tell them where their application stands and what happens next.',
    interview: 'Invite them to an interview. Include the time and place given.',
    offer: 'Tell them the team wants to make an offer and ask for a time to talk through it. Do not mention salary numbers unless given.',
    rejection: 'Tell them kindly that the team will not go ahead this time, share the reason given, and suggest one thing that would help next time.',
  }
  return {
    system: system(
      'en',
      `Write a short direct message from ${company} to ${candidate} about the ${role} role. ${goals[purpose]}`,
      'Warm, specific and under 90 words. No subject line and no placeholders. Sign off with the company name.',
    ),
    turns: ask(extra || 'No extra details.'),
  }
}

export function pipelineRequest(rows: string[]) {
  return {
    system: system(
      'en',
      'Summarise this hiring pipeline for a busy founder in under 110 words.',
      'Say what needs attention first, such as people waiting longest or interviews without feedback, then the next three actions as a short list. Do not judge candidates.',
    ),
    turns: ask(rows.join('\n') || 'No applicants yet.'),
  }
}

function ventureBlock(v: Venture) {
  return [
    `Name: ${v.name}`,
    `One line: ${v.oneLiner}`,
    `Sector: ${v.sector}, city: ${v.city}, stage: ${v.stage}, team of ${v.team}`,
    `Problem: ${v.problem}`,
    v.solution && `Solution: ${v.solution}`,
    v.customer && `Target customer: ${v.customer}`,
    v.model && `How it makes money: ${v.model}`,
    `Proof so far: ${v.progress.join('; ') || 'none yet'}`,
    `Looking for: ${v.lookingFor.join(', ') || 'not given'}`,
  ]
    .filter(Boolean)
    .join('\n')
}

const ventureRules = [
  'Write for a first-time founder in India. Be concrete and honest, and keep every section short.',
  'Never invent market sizes, revenue numbers, customers or funding. Where a number is needed, say how the founder can find it, for example "count shops in two wards".',
]

export const businessPlanSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'Three sentences: problem, solution, why now' },
    customer: { type: 'string', description: 'Who pays and who uses it, two sentences' },
    market: { type: 'string', description: 'How to size the first market in their city, without made-up numbers' },
    model: { type: 'string', description: 'How it makes money and a simple first price to test' },
    operations: { type: 'string', description: 'What the first team does every week' },
    risks: list('The three biggest risks'),
    first90: list('Five things to do in the first 90 days'),
  },
  required: ['summary', 'customer', 'market', 'model', 'operations', 'risks', 'first90'],
}

export function businessPlanRequest(v: Venture, lang: Lang) {
  return { system: system(lang, 'Write a one-page business plan for this venture.', ...ventureRules), turns: ask(ventureBlock(v)), schema: businessPlanSchema }
}

export const mvpSchema = {
  type: 'object',
  properties: {
    must: list('Three to five features the first version cannot ship without'),
    should: list('Up to four features for soon after'),
    later: list('Up to four ideas to leave out for now'),
    journey: list('The first user journey as five to seven short steps'),
    milestones: {
      type: 'array',
      minItems: 4,
      maxItems: 6,
      items: { type: 'object', properties: { week: { type: 'integer' }, goal: { type: 'string' } }, required: ['week', 'goal'] },
    },
  },
  required: ['must', 'should', 'later', 'journey', 'milestones'],
}

export function mvpRequest(v: Venture, lang: Lang) {
  return {
    system: system(
      lang,
      'Plan the smallest first version that tests whether people want this. Prefer no-code, WhatsApp or a spreadsheet when it is enough.',
      ...ventureRules,
    ),
    turns: ask(ventureBlock(v)),
    schema: mvpSchema,
  }
}

export const deckSchema = {
  type: 'object',
  properties: {
    slides: {
      type: 'array',
      minItems: 8,
      maxItems: 10,
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, points: list('Two to four short points') },
        required: ['title', 'points'],
      },
    },
  },
  required: ['slides'],
}

export function deckRequest(v: Venture, lang: Lang) {
  return {
    system: system(
      lang,
      'Draft a first pitch deck outline: problem, solution, customer, proof, business model, market approach, competition, team, the ask, and what the money is for.',
      ...ventureRules,
      'Where the founder must add a real number or name, write it in square brackets, such as [number of pilot shops].',
    ),
    turns: ask(`${ventureBlock(v)}${v.plan ? `\nPlan summary: ${v.plan.summary}` : ''}`),
    schema: deckSchema,
  }
}

export function agendaRequest(mentee: Profile, topic: string, mentorName: string, lang: Lang) {
  return {
    system: system(
      lang,
      `Prepare a 30 minute session agenda for ${mentorName}, a mentor on HackShift.`,
      'Return a short plan: one line on what the person really needs, then four timed steps that add up to 30 minutes, then two questions to ask first. Plain text with a short list.',
    ),
    turns: ask(`THE PERSON\n${profileBlock(mentee)}\n\nWHAT THEY WANT TO TALK ABOUT: ${topic}`),
  }
}

export interface FollowUp {
  note: string
  actions: string[]
}

export const followUpSchema = {
  type: 'object',
  properties: {
    note: { type: 'string', description: 'Two or three sentences from the mentor to the mentee, in first person' },
    actions: list('Two to four action items for the mentee, each starting with a verb and small enough to do this week'),
  },
  required: ['note', 'actions'],
}

export function followUpRequest(roughNotes: string, topic: string, menteeName: string) {
  return {
    system: system(
      'en',
      `Turn a mentor's rough notes from a session with ${menteeName} into a short follow-up note and clear action items.`,
      'Keep every piece of advice from the notes and add nothing new.',
    ),
    turns: ask(`SESSION TOPIC: ${topic}\n\nMENTOR NOTES:\n${roughNotes}`),
    schema: followUpSchema,
  }
}
