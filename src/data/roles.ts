import type { Role } from './types'

export const roleInfo: Record<Role, { label: string; short: string; hint: string }> = {
  seeker: { label: 'Looking for work', short: 'Job seeker', hint: 'Internships, jobs, gigs and challenges' },
  founder: { label: 'Building an idea', short: 'Founder', hint: 'Co-founders, mentors and schemes' },
  startup: { label: 'Running a startup', short: 'Startup', hint: 'Post challenges and hire from them' },
  mentor: { label: 'Mentoring others', short: 'Mentor', hint: 'Give your time to founders and students' },
  recruiter: { label: 'Hiring for a company', short: 'Recruiter', hint: 'Search people by proof of work' },
}

export const roleOrder: Role[] = ['seeker', 'founder', 'startup', 'mentor', 'recruiter']
