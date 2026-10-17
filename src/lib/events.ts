import type { HackEvent } from '../data/types'

const dayMs = 86400000

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function eventTiming(e: HackEvent, now = new Date()) {
  const start = new Date(e.starts)
  const end = new Date(e.ends)
  const live = now >= start && now <= end
  const days = Math.round((startOfDay(start) - startOfDay(now)) / dayMs)
  const label = live ? 'Happening now' : days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`
  const sameDay = startOfDay(start) === startOfDay(end)
  const date = sameDay
    ? `${start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, ${start.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
    : `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} to ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
  return { live, days, label, date, start, end }
}
