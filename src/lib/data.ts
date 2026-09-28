import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { computeAttention, type AttentionItem } from '@/lib/attention'
import { tokyoToday } from '@/lib/tokyo'
import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']
export type Day = Tables['days']['Row']
export type Activity = Tables['activities']['Row']
export type TransportOption = Tables['transport_options']['Row']
export type ChecklistItem = Tables['checklist_items']['Row']
export type Note = Tables['notes']['Row']
export type Site = Tables['sites']['Row']
export type Restaurant = Tables['restaurants']['Row']

export type ActivityWithOptions = Activity & {
  transport_options: TransportOption[]
}

export type DayWithActivities = Day & {
  activities: ActivityWithOptions[]
}

/**
 * The whole trip in one round trip.
 *
 * Deliberately not paginated or lazily loaded: the entire itinerary is roughly
 * 30 KB, and one request on hotel wifi beats eight on roaming. This is also
 * what makes the offline cache a single entry rather than a per-day matrix.
 */
export const getTrip = cache(async (): Promise<DayWithActivities[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('days')
    .select('*, activities(*, transport_options(*))')
    .order('day_number')
    .order('order', { referencedTable: 'activities' })

  if (error) throw new Error(`getTrip: ${error.message}`)
  return (data ?? []) as DayWithActivities[]
})

export const getDay = cache(async (date: string): Promise<DayWithActivities | null> => {
  const days = await getTrip()
  return days.find((d) => d.date === date) ?? null
})

export const getChecklist = cache(async (): Promise<ChecklistItem[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) throw new Error(`getChecklist: ${error.message}`)
  return data ?? []
})

export const getNotes = cache(async (dayId?: string): Promise<Note[]> => {
  const supabase = await createClient()
  let q = supabase.from('notes').select('*').order('created_at', { ascending: false })
  if (dayId) q = q.eq('day_id', dayId)

  const { data, error } = await q
  if (error) throw new Error(`getNotes: ${error.message}`)
  return data ?? []
})

/** Everything that needs a traveller's attention, computed from live data. */
export const getAttention = cache(async (): Promise<AttentionItem[]> => {
  const [days, checklist] = await Promise.all([getTrip(), getChecklist()])

  return computeAttention({
    today: tokyoToday(),
    days,
    activities: days.flatMap((d) => d.activities),
    checklist,
    transportOptions: days.flatMap((d) => d.activities.flatMap((a) => a.transport_options)),
  })
})

/** Master plan section 8. Reference data: somewhere you MIGHT go, as opposed
 *  to an activity, which is a decision to go there at a time. */
export const getSites = cache(async (): Promise<Site[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sites').select('*').order('sort')
  if (error) throw new Error(`getSites: ${error.message}`)
  return data ?? []
})

/** Master plan section 9. */
export const getRestaurants = cache(async (): Promise<Restaurant[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('restaurants').select('*').order('sort')
  if (error) throw new Error(`getRestaurants: ${error.message}`)
  return data ?? []
})

/** The day to open by default: today if we are on the trip, otherwise day 1. */
export const getFocusDay = cache(async (): Promise<DayWithActivities | null> => {
  const days = await getTrip()
  if (days.length === 0) return null
  const today = tokyoToday()
  return days.find((d) => d.date >= today) ?? days[days.length - 1]
})
