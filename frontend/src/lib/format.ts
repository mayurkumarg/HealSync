import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday } from 'date-fns'

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy') {
  if (!date) return '—'
  return format(new Date(date), pattern)
}

export function formatDateTime(date: string | Date) {
  if (!date) return '—'
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a")
}

export function formatTime(date: string | Date) {
  if (!date) return '—'
  return format(new Date(date), 'h:mm a')
}

/** Friendly relative label used for reminders / activity: "Today", "Tomorrow", or a date. */
export function friendlyDay(date: string | Date) {
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEE, MMM d')
}

export function timeAgo(date: string | Date) {
  if (!date) return ''
  return `${formatDistanceToNowStrict(new Date(date))} ago`
}

/** Countdown string toward a future date, e.g. "2d 4h left" or "Expired". */
export function countdown(target: string | Date | null) {
  if (!target) return 'No expiry'
  const ms = new Date(target).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const mins = Math.floor(ms / 60000)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${m}m left`
  return `${m}m left`
}

export function initials(name?: string) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
}

export function currency(value: number, symbol = '₹') {
  return `${symbol}${value.toFixed(2)}`
}

export function titleCase(s: string) {
  return s.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
