import type { Opportunity, OpportunityKind, WorkMode } from '../data/types'
import type { JobFilters, Profile } from '../store/types'
import { overlap } from './match'

export const jobKinds: OpportunityKind[] = ['Internship', 'Job', 'Part-time', 'Apprenticeship', 'Contract', 'Gig', 'Co-founder']
export const workModes: WorkMode[] = ['Remote', 'Hybrid', 'On-site']
export const payFloors = [10000, 20000, 40000]

export function modeOf(o: Opportunity): WorkMode {
  return o.mode ?? (o.remote ? 'Remote' : 'On-site')
}

export function matches(o: Opportunity, f: JobFilters, profile?: Profile | null) {
  if (f.kind && f.kind !== 'All' && o.kind !== f.kind) return false
  if (f.city && o.city !== f.city) return false
  if (f.mode && modeOf(o) !== f.mode) return false
  if (f.experience && o.experience && o.experience !== f.experience) return false
  if (f.minPay && (!o.monthly || o.monthly < f.minPay)) return false
  if (f.mineOnly && profile && overlap(o.skills, profile.skills).length === 0) return false
  if (f.query) {
    const text = [o.title, o.company, o.city, o.kind, ...o.skills].join(' ').toLowerCase()
    if (!text.includes(f.query.toLowerCase())) return false
  }
  return true
}

export function describe(f: JobFilters) {
  const parts = [
    f.query && `“${f.query}”`,
    f.kind && f.kind !== 'All' && f.kind,
    f.mode,
    f.city && `in ${f.city}`,
    f.experience,
    f.minPay && `₹${(f.minPay / 1000).toFixed(0)}k+ a month`,
    f.mineOnly && 'matching my skills',
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : 'All roles'
}

export function toParams(f: JobFilters) {
  const p = new URLSearchParams()
  if (f.query) p.set('q', f.query)
  if (f.kind && f.kind !== 'All') p.set('kind', f.kind)
  if (f.city) p.set('city', f.city)
  if (f.mode) p.set('mode', f.mode)
  if (f.experience) p.set('exp', f.experience)
  if (f.minPay) p.set('pay', String(f.minPay))
  if (f.mineOnly) p.set('mine', '1')
  return p.toString()
}
