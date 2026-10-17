import type { Person, Venture } from '../data/types'
import type { Profile } from '../store/types'

const needSkills: Record<string, string[]> = {
  'Technical co-founder': ['React', 'Node.js', 'Python', 'Kotlin', 'Android', 'Flutter', 'MongoDB', 'Firebase', 'TypeScript', 'Machine learning'],
  'Business co-founder': ['Sales', 'Operations', 'Marketing', 'Negotiation', 'Supply chain', 'Communication'],
  Designer: ['Figma', 'Illustration', 'Branding', 'UX'],
  'Growth marketer': ['Marketing', 'Instagram', 'Writing', 'Sales'],
  'First customers': ['Sales', 'Communication'],
}

function wanted(v: Venture) {
  const text = v.lookingFor.join(' ').toLowerCase()
  const skills = new Set<string>()
  for (const [need, list] of Object.entries(needSkills)) {
    if (text.includes(need.toLowerCase().split(' ')[0])) list.forEach((s) => skills.add(s.toLowerCase()))
  }
  if (text.includes('technical') || text.includes('full-stack') || text.includes('developer')) needSkills['Technical co-founder'].forEach((s) => skills.add(s.toLowerCase()))
  return skills
}

export interface Match {
  person: Person
  score: number
  reasons: string[]
}

export function cofounderMatches(v: Venture, founder: Profile | null, people: Person[], interestedIds: Set<string>, limit = 6): Match[] {
  const want = wanted(v)
  const mine = new Set((founder?.skills ?? []).map((s) => s.toLowerCase()))
  return people
    .filter((p) => p.name !== founder?.name)
    .map((p) => {
      const reasons: string[] = []
      let score = 0
      const needed = p.skills.filter((s) => want.has(s.toLowerCase()))
      const fresh = p.skills.filter((s) => !mine.has(s.toLowerCase()))
      if (interestedIds.has(p.id)) {
        score += 5
        reasons.push('Said they want to help build this')
      }
      if (needed.length) {
        score += needed.length * 2
        reasons.push(`Has ${needed.slice(0, 3).join(', ')}, which you said you need`)
      } else if (fresh.length && want.size === 0) {
        score += 1
        reasons.push(`Brings ${fresh.slice(0, 2).join(' and ')}, which you do not list`)
      }
      if (p.city === v.city) {
        score += 2
        reasons.push(`Also in ${v.city}`)
      }
      if (p.badges.length) {
        score += 1
        reasons.push(`${p.badges.length} verified ${p.badges.length === 1 ? 'challenge' : 'challenges'}`)
      }
      if (p.available) score += 1
      else reasons.push('Not looking right now')
      return { person: p, score, reasons }
    })
    .filter((m) => m.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
