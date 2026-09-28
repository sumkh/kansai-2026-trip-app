/**
 * Every date in this app is displayed in Asia/Tokyo, never in the device's
 * timezone. The dev machine is SGT (UTC+8) and the trip is JST (UTC+9), so a
 * date rendered without an explicit zone is silently wrong for exactly the
 * hours that matter — late evening, when you are planning tomorrow.
 */

export const TOKYO = 'Asia/Tokyo'
export const TRIP_START = '2026-09-19'
export const TRIP_END = '2026-09-26'

/** Today in Tokyo, as 'YYYY-MM-DD'. */
export function tokyoToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TOKYO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Parse 'YYYY-MM-DD' as a date at Tokyo midnight, safe from UTC drift. */
function atTokyoMidnight(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00+09:00`)
}

/** Whole days from today (Tokyo) until the given date. Negative once past. */
export function daysUntil(isoDate: string, now = new Date()): number {
  const from = atTokyoMidnight(tokyoToday(now)).getTime()
  const to = atTokyoMidnight(isoDate).getTime()
  return Math.round((to - from) / 86_400_000)
}

export function formatDay(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TOKYO,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(atTokyoMidnight(isoDate))
}

export function formatDayLong(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TOKYO,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(atTokyoMidnight(isoDate))
}

/** 'in 12 days' / 'today' / '3 days ago' — for deadlines, so be unambiguous. */
export function relativeDays(isoDate: string, now = new Date()): string {
  const d = daysUntil(isoDate, now)
  if (d === 0) return 'today'
  if (d === 1) return 'tomorrow'
  if (d === -1) return 'yesterday'
  if (d > 0) return `in ${d} days`
  return `${Math.abs(d)} days overdue`
}

/** Current Tokyo wall-clock as 'HH:MM', for deciding what is "now" on a day. */
export function tokyoTimeNow(now = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TOKYO,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)
}

export function isDuringTrip(now = new Date()): boolean {
  const today = tokyoToday(now)
  return today >= TRIP_START && today <= TRIP_END
}
