import { opportunities } from '../data/opportunities'
import { challenges } from '../data/challenges'
import type { Opportunity } from '../data/types'

const norm = (s: string) => s.trim().toLowerCase()

export function overlap(a: string[], b: string[]) {
  const set = new Set(b.map(norm))
  return a.filter((x) => set.has(norm(x)))
}

export function matchOpportunities(skills: string[], limit = 3): { item: Opportunity; hits: string[] }[] {
  return opportunities
    .map((item) => ({ item, hits: overlap(item.skills, skills) }))
    .sort((x, y) => y.hits.length - x.hits.length || x.item.postedDaysAgo - y.item.postedDaysAgo)
    .slice(0, limit)
}

export function matchChallenges(skills: string[], limit = 2) {
  return challenges
    .map((item) => ({ item, hits: overlap(item.skills, skills) }))
    .sort((x, y) => y.hits.length - x.hits.length)
    .slice(0, limit)
}

export const allSkills = Array.from(
  new Set([...opportunities.flatMap((o) => o.skills), ...challenges.flatMap((c) => c.skills), 'Public speaking', 'Video editing', 'Java', 'C++']),
).sort((a, b) => a.localeCompare(b))

export const indianCities = [
  'Ahmedabad', 'Bengaluru', 'Bhopal', 'Bhubaneswar', 'Chandigarh', 'Chennai', 'Coimbatore', 'Dehradun', 'Delhi',
  'Guwahati', 'Gurugram', 'Hyderabad', 'Indore', 'Jaipur', 'Kanpur', 'Kochi', 'Kolkata', 'Lucknow', 'Ludhiana',
  'Mangaluru', 'Mumbai', 'Nagpur', 'Nashik', 'Noida', 'Patna', 'Pune', 'Raipur', 'Ranchi', 'Srinagar', 'Surat',
  'Thiruvananthapuram', 'Vadodara', 'Varanasi', 'Visakhapatnam', 'Warangal',
]

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
