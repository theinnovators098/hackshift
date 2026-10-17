import type { Challenge, Mentor, Opportunity, Person, Role, Scheme, Venture } from '../data/types'

export type AccountKind = 'seeker' | 'startup' | 'mentor' | 'recruiter' | 'admin'

export interface Profile {
  name: string
  city: string
  college: string
  roles: Role[]
  skills: string[]
  goal: string
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
}

export type ApplicationStatus = 'Sent' | 'Shortlisted' | 'Interview' | 'Hired' | 'Not selected'

export interface Application {
  id: string
  opportunityId: string
  accountId: string
  note: string
  appliedOn: string
  status: ApplicationStatus
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
