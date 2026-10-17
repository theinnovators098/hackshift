import { roleInfo } from '../data/roles'
import type { Challenge, Mentor, Opportunity, Scheme, Stage, Venture } from '../data/types'
import type { Profile, Submission } from '../store/AppStore'
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
