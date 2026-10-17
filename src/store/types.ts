import type { Challenge, Experience, Mentor, Opportunity, OpportunityKind, Person, Role, Scheme, Venture, WorkMode } from '../data/types'

export type AccountKind = 'seeker' | 'startup' | 'mentor' | 'recruiter' | 'admin'

export interface Education {
  school: string
  degree: string
  years: string
}

export interface Work {
  role: string
  org: string
  years: string
  summary: string
}

export interface Certificate {
  name: string
  issuer: string
  year: string
}

export interface Profile {
  name: string
  city: string
  college: string
  roles: Role[]
  skills: string[]
  goal: string
  headline?: string
  about?: string
  education?: Education[]
  work?: Work[]
  certificates?: Certificate[]
  links?: { github?: string; portfolio?: string; linkedin?: string; website?: string }
  visibility?: 'public' | 'hiring' | 'private'
  allowMessages?: boolean
}

export interface JobFilters {
  query?: string
  kind?: OpportunityKind | 'All'
  city?: string
  mode?: WorkMode | ''
  experience?: Experience | ''
  minPay?: number
  mineOnly?: boolean
}

export interface SavedSearch {
  id: string
  label: string
  filters: JobFilters
  createdOn: string
}

export interface CareerPlan {
  target: string
  madeOn: string
  have: string[]
  gaps: { skill: string; why: string; how: string }[]
  weeks: { week: number; focus: string; tasks: string[] }[]
  challengeIds: string[]
  mentorIds: string[]
}

export interface Account {
  id: string
  kind: AccountKind
  name: string
  email: string
  password: string
  status: 'active' | 'suspended'
  joinedOn: string
  profile: Profile
  lists: { saved: string[]; interested: string[]; reviewRequests: string[] }
  company?: string
  companyAbout?: string
  website?: string
  mentorId?: string
  personId?: string
  kinds: AccountKind[]
  verified?: boolean
  verifyRequested?: boolean
  savedSearches?: SavedSearch[]
  careerPlan?: CareerPlan
  resume?: { name: string; readOn: string }
}

export type ApplicationStatus = 'Applied' | 'Under review' | 'Shortlisted' | 'Interview' | 'Offer' | 'Hired' | 'Rejected'

export interface Interview {
  when: string
  mode: 'Video' | 'Phone' | 'In person'
  where: string
  status: 'Proposed' | 'Accepted' | 'New time asked'
  reply?: string
}

export interface Evaluation {
  score: number
  notes: string
  by: string
  on: string
}

export interface Application {
  id: string
  opportunityId: string
  accountId: string
  note: string
  appliedOn: string
  status: ApplicationStatus
  rejectReason?: string
  interview?: Interview
  notes?: { by: string; text: string; on: string }[]
  evaluation?: Evaluation
}

export type SubmissionStatus = 'In review' | 'Accepted' | 'Not selected'

export interface Submission {
  id: string
  challengeId: string
  accountId: string
  link: string
  note: string
  submittedOn: string
  status: SubmissionStatus
  feedback?: string
}

export type BookingStatus = 'Requested' | 'Confirmed' | 'Done' | 'Declined'

export interface Booking {
  id: string
  mentorId: string
  accountId: string
  day: string
  time: string
  topic: string
  status: BookingStatus
  mentorNote?: string
}

export type PipelineStage = 'Shortlisted' | 'Contacted' | 'Interview' | 'Offer' | 'Hired' | 'Not a fit'

export interface PipelineEntry {
  id: string
  recruiterId: string
  personId: string
  stage: PipelineStage
  note: string
  interviewOn?: string
  updatedOn: string
}

export interface LogEntry {
  id: string
  at: string
  actorId: string
  text: string
}

export interface Notice {
  id: string
  accountId: string
  at: string
  text: string
  link?: string
  read: boolean
}

export interface Message {
  id: string
  from: string
  to: string
  text: string
  at: string
  read: boolean
}

export type TaskStatus = 'waiting' | 'done' | 'declined' | 'failed'

export interface MillisaTask {
  id: string
  accountId: string
  at: string
  tool: string
  summary: string
  args: Record<string, unknown>
  status: TaskStatus
  result?: string
}

export interface UsageEntry {
  at: string
  accountId: string
  model: string
  ok: boolean
  ms: number
  kind: string | null
}

export interface Settings {
  reviewPosts: boolean
  millisaDailyLimit: number
}

export interface Data {
  version: 3
  session: string | null
  accounts: Account[]
  opportunities: Opportunity[]
  challenges: Challenge[]
  mentors: Mentor[]
  people: Person[]
  ventures: Venture[]
  schemes: Scheme[]
  applications: Application[]
  submissions: Submission[]
  bookings: Booking[]
  pipeline: PipelineEntry[]
  log: LogEntry[]
  notices: Notice[]
  messages: Message[]
  tasks: MillisaTask[]
  usage: UsageEntry[]
  settings: Settings
}

export type ContentKind = 'opportunities' | 'challenges' | 'ventures' | 'mentors'
