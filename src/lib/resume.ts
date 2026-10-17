import type { Profile } from '../store/types'
import type { ResumeRead } from './millisaPrompts'

export const resumeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
export const resumeAccept = '.pdf,image/png,image/jpeg,image/webp'
const MAX_BYTES = 4 * 1024 * 1024
const DRAFT_KEY = 'hackshift:resume-draft'

export function checkResumeFile(file: File) {
  if (!resumeTypes.includes(file.type)) return 'Upload your resume as a PDF, or a clear photo of it (JPG or PNG).'
  if (file.size > MAX_BYTES) return 'That file is over 4 MB. Save a smaller copy and try again.'
  return null
}

export function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

function known(list: object[] = [], key: string, value: string) {
  return list.some((x) => String((x as Record<string, unknown>)[key] ?? '').trim().toLowerCase() === value.trim().toLowerCase())
}

export function mergeResume(base: Profile, found: ResumeRead): Profile {
  return {
    ...base,
    name: base.name.trim() ? base.name : found.name,
    city: base.city.trim() ? base.city : found.city,
    college: base.college.trim() ? base.college : found.education[0]?.school ?? '',
    headline: base.headline?.trim() ? base.headline : found.headline,
    about: base.about?.trim() ? base.about : found.about,
    skills: Array.from(new Set([...base.skills, ...found.skills.filter(Boolean)])),
    education: [...(base.education ?? []), ...found.education.filter((x) => x.school && !known(base.education, 'school', x.school))],
    work: [...(base.work ?? []), ...found.work.filter((x) => x.role && !known(base.work, 'role', x.role))],
    certificates: [...(base.certificates ?? []), ...found.certificates.filter((x) => x.name && !known(base.certificates, 'name', x.name))],
    links: {
      github: base.links?.github || found.links.github,
      portfolio: base.links?.portfolio || found.links.portfolio,
      linkedin: base.links?.linkedin || found.links.linkedin,
      website: base.links?.website || found.links.website,
    },
  }
}

export function keepResumeDraft(found: ResumeRead) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(found))
  } catch {
    return
  }
}

export function takeResumeDraft(): ResumeRead | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    sessionStorage.removeItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
