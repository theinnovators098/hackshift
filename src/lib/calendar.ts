const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function parseSlot(day: string, time: string) {
  const m = /(\d{1,2})\s+([A-Za-z]{3})/.exec(day)
  const t = /(\d{1,2}):(\d{2})\s*(am|pm)/i.exec(time)
  if (!m || !t) return null
  const now = new Date()
  let hour = Number(t[1]) % 12
  if (t[3].toLowerCase() === 'pm') hour += 12
  const d = new Date(now.getFullYear(), months.indexOf(m[2]), Number(m[1]), hour, Number(t[2]))
  if (d.getTime() < now.getTime() - 180 * 86400000) d.setFullYear(d.getFullYear() + 1)
  return d
}

function stamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function googleLink(title: string, start: Date, minutes: number, details: string) {
  const end = new Date(start.getTime() + minutes * 60000)
  const p = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${stamp(start)}/${stamp(end)}`, details })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}
