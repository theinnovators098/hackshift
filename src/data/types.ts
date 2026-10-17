export type Role = 'seeker' | 'founder' | 'startup' | 'mentor' | 'recruiter'

export type Visibility = 'live' | 'pending' | 'hidden'

interface Owned {
  status?: Visibility
  ownerId?: string
}

export type OpportunityKind = 'Internship' | 'Job' | 'Part-time' | 'Apprenticeship' | 'Contract' | 'Gig' | 'Co-founder'

export type WorkMode = 'Remote' | 'Hybrid' | 'On-site'

export type Experience = 'Fresher' | '1-3 years' | '3+ years'

export interface Opportunity extends Owned {
  id: string
  title: string
  company: string
  kind: OpportunityKind
  city: string
  remote: boolean
  pay: string
  skills: string[]
  postedDaysAgo: number
  closes: string
  about: string
  work: string[]
  challengeId?: string
  mode?: WorkMode
  experience?: Experience
  monthly?: number
}

export type Level = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Challenge extends Owned {
  id: string
  title: string
  company: string
  brief: string
  deliverables: string[]
  skills: string[]
  level: Level
  hours: number
  reward: string
  closes: string
  submissions: number
  fastTrack: boolean
}

export type Stage = 'Idea' | 'Validated' | 'MVP' | 'Funded'

export interface Venture extends Owned {
  id: string
  name: string
  oneLiner: string
  founder: string
  city: string
  sector: string
  stage: Stage
  problem: string
  progress: string[]
  lookingFor: string[]
  team: number
  mine?: boolean
}

export interface Mentor extends Owned {
  id: string
  name: string
  title: string
  company: string
  city: string
  expertise: string[]
  languages: string[]
  bio: string
  sessions: number
  yearsExp: number
  weekdaySlots?: string[]
  saturdaySlots?: string[]
}

export interface Person {
  id: string
  name: string
  city: string
  headline: string
  skills: string[]
  badges: string[]
  available: boolean
  college: string
}

export type SchemeNeed = 'grant' | 'loan' | 'incubation' | 'recognition'
export type FounderGroup = 'women' | 'scst'

export interface Scheme {
  hidden?: boolean
  id: string
  name: string
  runBy: string
  amount: string
  summary: string
  stages: Stage[]
  needs: SchemeNeed[]
  onlyFor?: FounderGroup[]
  link: string
}

export interface Shift {
  name: string
  city: string
  from: string
  to: string
  via: string
}
