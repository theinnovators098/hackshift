import type { Profile } from '../store/types'

export function profileScore(p: Profile, hasResume: boolean) {
  const checks = [
    { done: !!p.headline?.trim(), text: 'Add a one-line headline', weight: 10 },
    { done: (p.about?.trim().length ?? 0) >= 60, text: 'Write a short About paragraph', weight: 15 },
    { done: p.skills.length >= 3, text: 'List at least three skills', weight: 15 },
    { done: (p.education?.length ?? 0) > 0, text: 'Add your education', weight: 15 },
    { done: (p.work?.length ?? 0) > 0, text: 'Add work, internships or projects', weight: 15 },
    { done: !!(p.links?.github || p.links?.portfolio || p.links?.linkedin || p.links?.website), text: 'Link your GitHub, portfolio or LinkedIn', weight: 10 },
    { done: (p.certificates?.length ?? 0) > 0, text: 'Add a certificate or course', weight: 5 },
    { done: hasResume, text: 'Upload your resume', weight: 10 },
    { done: !!p.goal.trim(), text: 'Say what you want next', weight: 5 },
  ]
  const score = checks.reduce((n, c) => n + (c.done ? c.weight : 0), 0)
  return { score, missing: checks.filter((c) => !c.done) }
}
