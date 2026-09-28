'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import type { ActionResult } from '@/lib/action-result'
import type { Database } from '@/lib/database.types'

type ActivityStatus = Database['public']['Enums']['activity_status']

/**
 * All mutations live here. Every one of them goes through the user's own
 * Supabase client, so RLS is the thing that actually refuses a viewer — the
 * profile checks below are for a decent error message, not for security.
 */

function denied(): ActionResult {
  return { ok: false, error: 'Viewers cannot change the itinerary.' }
}

export async function setActivityStatus(
  activityId: string,
  status: ActivityStatus,
  date: string
): Promise<ActionResult> {
  const profile = await requireProfile()
  if (profile.role !== 'traveller') return denied()

  const supabase = await createClient()
  const { error } = await supabase.from('activities').update({ status }).eq('id', activityId)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/day/${date}`)
  revalidatePath('/')
  revalidatePath('/attention')
  return { ok: true }
}

/**
 * Choosing a transport option clears its siblings and pushes the chosen
 * duration onto the parent activity, so the day's timings stay honest.
 *
 * A partial unique index enforces one-selected-per-activity at the database,
 * so the clear MUST land before the set.
 */
export async function selectTransportOption(
  optionId: string,
  activityId: string,
  date: string
): Promise<ActionResult> {
  const profile = await requireProfile()
  if (profile.role !== 'traveller') return denied()

  const supabase = await createClient()

  const { data: option, error: readErr } = await supabase
    .from('transport_options')
    .select('duration_min')
    .eq('id', optionId)
    .single()
  if (readErr) return { ok: false, error: readErr.message }

  const { error: clearErr } = await supabase
    .from('transport_options')
    .update({ is_selected: false })
    .eq('activity_id', activityId)
    .eq('is_selected', true)
  if (clearErr) return { ok: false, error: clearErr.message }

  const { error: setErr } = await supabase
    .from('transport_options')
    .update({ is_selected: true })
    .eq('id', optionId)
  if (setErr) return { ok: false, error: setErr.message }

  const { error: durErr } = await supabase
    .from('activities')
    .update({ duration_min: option.duration_min })
    .eq('id', activityId)
  if (durErr) return { ok: false, error: durErr.message }

  revalidatePath(`/day/${date}`)
  revalidatePath('/attention')
  return { ok: true }
}

export async function toggleChecklistItem(
  itemId: string,
  done: boolean
): Promise<ActionResult> {
  const profile = await requireProfile()
  if (profile.role !== 'traveller') return denied()

  const supabase = await createClient()
  const { error } = await supabase
    .from('checklist_items')
    .update({
      done_at: done ? new Date().toISOString() : null,
      done_by: done ? profile.id : null,
    })
    .eq('id', itemId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/checklist')
  revalidatePath('/')
  revalidatePath('/attention')
  return { ok: true }
}

export async function addNote(input: {
  body: string
  dayId?: string
  activityId?: string
  date?: string
}): Promise<ActionResult> {
  const profile = await requireProfile()
  if (profile.role !== 'traveller') return denied()

  const body = input.body.trim()
  if (!body) return { ok: false, error: 'Empty note.' }

  const supabase = await createClient()
  const { error } = await supabase.from('notes').insert({
    user_id: profile.id,
    day_id: input.dayId ?? null,
    activity_id: input.activityId ?? null,
    body,
  })
  if (error) return { ok: false, error: error.message }

  if (input.date) revalidatePath(`/day/${input.date}`)
  revalidatePath('/notes')
  return { ok: true }
}

export async function deleteNote(noteId: string, date?: string): Promise<ActionResult> {
  const profile = await requireProfile()
  if (profile.role !== 'traveller') return denied()

  const supabase = await createClient()
  const { error } = await supabase.from('notes').delete().eq('id', noteId)
  if (error) return { ok: false, error: error.message }

  if (date) revalidatePath(`/day/${date}`)
  revalidatePath('/notes')
  return { ok: true }
}
