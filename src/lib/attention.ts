/**
 * Works out what needs a traveller's attention right now.
 *
 * Deliberately a pure function over already-fetched rows: no database, no
 * clock of its own. That makes it testable (scripts/verify-attention.ts) and
 * means the same logic can answer "what should I chase today?" in August and
 * "what did we not tick off yesterday?" in September.
 *
 * This is the deterministic half. Judgement calls — is this itinerary still
 * sensible given the notes — are what /replan is for.
 */

import type { Database } from '@/lib/database.types'
import { daysUntil, relativeDays, TRIP_START } from '@/lib/tokyo'

type Day = Database['public']['Tables']['days']['Row']
type Activity = Database['public']['Tables']['activities']['Row']
type ChecklistItem = Database['public']['Tables']['checklist_items']['Row']
type TransportOption = Database['public']['Tables']['transport_options']['Row']

export type Severity = 'critical' | 'warning' | 'info'

export type AttentionItem = {
  id: string
  severity: Severity
  kind: 'deadline' | 'booking' | 'itinerary' | 'transport' | 'review'
  title: string
  detail?: string
  href?: string
  /** Sorts within a severity band. Lower is more urgent. */
  rank: number
}

export type AttentionInput = {
  today: string
  days: Day[]
  activities: Activity[]
  checklist: ChecklistItem[]
  transportOptions: TransportOption[]
}

/** Blocking items get chased this far ahead; everything else half as far. */
const BLOCKING_HORIZON_DAYS = 14
const ROUTINE_HORIZON_DAYS = 7

export function computeAttention(input: AttentionInput): AttentionItem[] {
  const { today, days, activities, checklist, transportOptions } = input
  const items: AttentionItem[] = []
  const now = new Date(`${today}T12:00:00+09:00`)

  // ── Checklist deadlines ────────────────────────────────────────────────
  for (const c of checklist) {
    if (c.done_at) continue
    if (!c.due_date) continue

    const d = daysUntil(c.due_date, now)
    const horizon = c.is_blocking ? BLOCKING_HORIZON_DAYS : ROUTINE_HORIZON_DAYS
    if (d > horizon) continue

    // Overdue blocking items are the only thing that can cost real money.
    const severity: Severity =
      d < 0 && c.is_blocking ? 'critical' : d < 0 || c.is_blocking ? 'warning' : 'info'

    items.push({
      id: `checklist:${c.id}`,
      severity,
      kind: 'deadline',
      title: c.title,
      detail: `${c.category} · due ${relativeDays(c.due_date, now)}`,
      href: '/checklist',
      rank: d,
    })
  }

  // ── Unbooked things, as their day approaches ───────────────────────────
  const dayById = new Map(days.map((d) => [d.id, d]))
  for (const a of activities) {
    const day = dayById.get(a.day_id)
    if (!day) continue

    const needsBooking = a.type === 'LODGING' || a.type === 'TRANSPORT'
    if (!needsBooking || a.is_booked) continue
    // Local hops do not get booked; only things with a real cost do.
    if (!a.cost_jpy && a.type === 'TRANSPORT') continue

    const d = daysUntil(day.date, now)
    if (d < 0 || d > 21) continue

    items.push({
      id: `booking:${a.id}`,
      severity: d <= 7 ? 'warning' : 'info',
      kind: 'booking',
      title: `Not booked — ${a.title}`,
      detail: `${day.title} · ${relativeDays(day.date, now)}`,
      href: `/day/${day.date}`,
      rank: d,
    })
  }

  // ── Transport with alternatives but nothing chosen ─────────────────────
  const optionsByActivity = new Map<string, TransportOption[]>()
  for (const o of transportOptions) {
    const list = optionsByActivity.get(o.activity_id) ?? []
    list.push(o)
    optionsByActivity.set(o.activity_id, list)
  }
  for (const [activityId, options] of optionsByActivity) {
    if (options.length < 2) continue
    if (options.some((o) => o.is_selected)) continue

    const a = activities.find((x) => x.id === activityId)
    const day = a ? dayById.get(a.day_id) : undefined
    if (!a || !day) continue

    const d = daysUntil(day.date, now)
    if (d < 0) continue

    items.push({
      id: `transport:${activityId}`,
      severity: d <= 3 ? 'warning' : 'info',
      kind: 'transport',
      title: `No route chosen — ${a.title}`,
      detail: `${options.length} options · ${day.title}`,
      href: `/day/${day.date}`,
      rank: 100 + d,
    })
  }

  // ── Days that have been and gone but were never marked up ──────────────
  // Only meaningful once the trip starts. This is what makes the end-of-day
  // review and the blog generation work.
  for (const day of days) {
    const d = daysUntil(day.date, now)
    if (d >= 0) continue // not finished yet
    if (daysUntil(TRIP_START, now) > 0) continue // trip has not started

    const dayActivities = activities.filter((a) => a.day_id === day.id)
    const unreviewed = dayActivities.filter((a) => a.status === 'PLANNED')
    if (unreviewed.length === 0) continue

    items.push({
      id: `review:${day.id}`,
      severity: d === -1 ? 'warning' : 'info',
      kind: 'review',
      title: `${unreviewed.length} unreviewed on ${day.title}`,
      detail: `${relativeDays(day.date, now)} · mark what you did and skipped`,
      href: `/day/${day.date}`,
      rank: 200 - d,
    })
  }

  const order: Record<Severity, number> = { critical: 0, warning: 1, info: 2 }
  return items.sort(
    (a, b) => order[a.severity] - order[b.severity] || a.rank - b.rank || a.title.localeCompare(b.title)
  )
}

export function countBySeverity(items: AttentionItem[]) {
  return {
    critical: items.filter((i) => i.severity === 'critical').length,
    warning: items.filter((i) => i.severity === 'warning').length,
    info: items.filter((i) => i.severity === 'info').length,
  }
}
