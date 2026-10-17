export type Role = 'seeker' | 'founder' | 'startup' | 'mentor' | 'recruiter'

export type OpportunityKind = 'Internship' | 'Job' | 'Gig' | 'Co-founder'

export interface Opportunity {
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
}

export type Level = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Challenge {
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

export interface Venture {
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

export interface Mentor {
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
