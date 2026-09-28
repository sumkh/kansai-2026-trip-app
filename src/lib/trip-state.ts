import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Reading the whole trip out, and applying a structured change back.
 *
 * One implementation, two front doors: `scripts/trip.ts` at a keyboard, and
 * /api/trip/* from a phone. They must not drift — the safety rules below are
 * the only thing standing between a replan and a cancelled hotel.
 */

export type Db = SupabaseClient<Database>

export type TripState = {
  exportedAt: string
  trip: Database['public']['Tables']['trips']['Row'] | null
  days: (Database['public']['Tables']['days']['Row'] & {
    activities: (Database['public']['Tables']['activities']['Row'] & {
      transport_options: Database['public']['Tables']['transport_options']['Row'][]
    })[]
  })[]
  checklist: Database['public']['Tables']['checklist_items']['Row'][]
  notes: (Database['public']['Tables']['notes']['Row'] & { author?: string | null })[]
}

/** Everything needed to reason about a replan. Photos and blog posts are
 *  deliberately excluded — they are not built, and they are not signal. */
export async function exportTrip(db: Db): Promise<TripState> {
  const [trip, days, checklist, notes, profiles] = await Promise.all([
    db.from('trips').select('*').limit(1).maybeSingle(),
    db
      .from('days')
      .select('*, activities(*, transport_options(*))')
      .order('day_number')
      .order('order', { referencedTable: 'activities' }),
    db.from('checklist_items').select('*').order('due_date', { nullsFirst: false }),
    db.from('notes').select('*').order('created_at', { ascending: false }),
    db.from('profiles').select('id, display_name, email'),
  ])

  for (const [name, r] of Object.entries({ trip, days, checklist, notes, profiles })) {
    if (r.error) throw new Error(`export ${name}: ${r.error.message}`)
  }

  const nameById = new Map((profiles.data ?? []).map((p) => [p.id, p.display_name ?? p.email]))

  return {
    exportedAt: new Date().toISOString(),
    trip: trip.data,
    days: (days.data ?? []) as TripState['days'],
    checklist: checklist.data ?? [],
    notes: (notes.data ?? []).map((n) => ({ ...n, author: nameById.get(n.user_id) ?? null })),
  }
}

// ── Patches ──────────────────────────────────────────────────────────────

type ActivityUpdatable = Partial<
  Pick<
    Database['public']['Tables']['activities']['Row'],
    | 'start_time' | 'duration_min' | 'title' | 'description' | 'type' | 'status'
    | 'place_name' | 'address' | 'lat' | 'lng' | 'cost_jpy' | 'order'
  >
>

export type TripPatch = {
  /** Free text explaining the change. Stored as a note so the reasoning
   *  survives — a diff six days later is meaningless without it. */
  reason?: string
  updateActivities?: { id: string; set: ActivityUpdatable; force?: boolean }[]
  createActivities?: ({ dayDate: string } & ActivityUpdatable & { title: string })[]
  deleteActivities?: { id: string; force?: boolean }[]
  updateChecklist?: {
    id: string
    set: Partial<Pick<Database['public']['Tables']['checklist_items']['Row'], 'done_at' | 'due_date' | 'title' | 'detail' | 'is_blocking'>>
  }[]
  /** Pre-trip additions. A booking deadline discovered late is still a
   *  deadline, and reseeding to add one would throw away every note and
   *  status the travellers have set. */
  createChecklist?: {
    title: string
    category: string
    detail?: string | null
    due_date?: string | null
    is_blocking?: boolean
  }[]
  deleteChecklist?: { id: string }[]
  updateDays?: {
    date: string
    set: Partial<Pick<Database['public']['Tables']['days']['Row'], 'title' | 'summary' | 'base_city'>>
  }[]
}

export type PatchChange = { kind: string; target: string; detail: string }
export type PatchResult = {
  dryRun: boolean
  changes: PatchChange[]
  blocked: PatchChange[]
}

/**
 * Applies a patch, or previews it.
 *
 * `dryRun` defaults to TRUE. Every path that can write must opt in explicitly:
 * an agent that misreads an instruction should produce a preview, not a
 * rearranged itinerary.
 *
 * Booked items are refused unless the caller sets `force` on that entry. The
 * flights and Goshobo are non-refundable, and "move dinner an hour later" must
 * never be able to touch them by accident.
 */
export async function applyPatch(
  db: Db,
  patch: TripPatch,
  opts: { dryRun?: boolean; actorId?: string } = {}
): Promise<PatchResult> {
  const dryRun = opts.dryRun !== false
  const changes: PatchChange[] = []
  const blocked: PatchChange[] = []

  const ids = [
    ...(patch.updateActivities ?? []).map((u) => u.id),
    ...(patch.deleteActivities ?? []).map((d) => d.id),
  ]

  const existing = new Map<string, Database['public']['Tables']['activities']['Row']>()
  if (ids.length) {
    const { data, error } = await db.from('activities').select('*').in('id', ids)
    if (error) throw new Error(`patch lookup: ${error.message}`)
    for (const a of data ?? []) existing.set(a.id, a)
  }

  // ── Activity updates ───────────────────────────────────────────────────
  for (const u of patch.updateActivities ?? []) {
    const current = existing.get(u.id)
    if (!current) {
      blocked.push({ kind: 'update', target: u.id, detail: 'no such activity' })
      continue
    }
    if (current.is_booked && !u.force) {
      blocked.push({
        kind: 'update',
        target: current.title,
        detail: `booked${current.booking_ref ? ` (${current.booking_ref})` : ''} — pass force to override`,
      })
      continue
    }

    const fields = Object.entries(u.set)
      .filter(([k, v]) => current[k as keyof typeof current] !== v)
      .map(([k, v]) => `${k}: ${JSON.stringify(current[k as keyof typeof current])} → ${JSON.stringify(v)}`)
    if (fields.length === 0) continue

    changes.push({ kind: 'update', target: current.title, detail: fields.join(', ') })

    if (!dryRun) {
      const { error } = await db.from('activities').update(u.set).eq('id', u.id)
      if (error) throw new Error(`update ${current.title}: ${error.message}`)
    }
  }

  // ── Activity creation ──────────────────────────────────────────────────
  for (const c of patch.createActivities ?? []) {
    const { data: day, error: dayErr } = await db
      .from('days')
      .select('id, title')
      .eq('date', c.dayDate)
      .maybeSingle()
    if (dayErr) throw new Error(`create lookup: ${dayErr.message}`)
    if (!day) {
      blocked.push({ kind: 'create', target: c.title, detail: `no day on ${c.dayDate}` })
      continue
    }

    const { dayDate: _dayDate, ...fields } = c
    void _dayDate

    // "order" is unique per day, so append rather than collide.
    let order = fields.order
    if (order == null) {
      const { data: last } = await db
        .from('activities')
        .select('order')
        .eq('day_id', day.id)
        .order('order', { ascending: false })
        .limit(1)
        .maybeSingle()
      order = (last?.order ?? 0) + 1
    }

    changes.push({ kind: 'create', target: c.title, detail: `on ${day.title} at position ${order}` })

    if (!dryRun) {
      const { error } = await db.from('activities').insert({
        ...fields,
        order,
        day_id: day.id,
        type: fields.type ?? 'SIGHT',
      })
      if (error) throw new Error(`create ${c.title}: ${error.message}`)
    }
  }

  // ── Activity deletion ──────────────────────────────────────────────────
  for (const d of patch.deleteActivities ?? []) {
    const current = existing.get(d.id)
    if (!current) {
      blocked.push({ kind: 'delete', target: d.id, detail: 'no such activity' })
      continue
    }
    if (current.is_booked && !d.force) {
      blocked.push({ kind: 'delete', target: current.title, detail: 'booked — pass force to override' })
      continue
    }

    changes.push({ kind: 'delete', target: current.title, detail: 'removed' })
    if (!dryRun) {
      const { error } = await db.from('activities').delete().eq('id', d.id)
      if (error) throw new Error(`delete ${current.title}: ${error.message}`)
    }
  }

  // ── Checklist ──────────────────────────────────────────────────────────
  for (const u of patch.updateChecklist ?? []) {
    changes.push({ kind: 'checklist', target: u.id, detail: JSON.stringify(u.set) })
    if (!dryRun) {
      const { error } = await db.from('checklist_items').update(u.set).eq('id', u.id)
      if (error) throw new Error(`checklist ${u.id}: ${error.message}`)
    }
  }

  for (const c of patch.createChecklist ?? []) {
    // One trip, always. Read it rather than taking it from the patch: a
    // trip_id supplied by the caller is a way to write into nothing.
    const { data: trip, error: tripErr } = await db.from('trips').select('id').limit(1).maybeSingle()
    if (tripErr) throw new Error(`checklist create lookup: ${tripErr.message}`)
    if (!trip) {
      blocked.push({ kind: 'checklist-create', target: c.title, detail: 'no trip row' })
      continue
    }

    // Titles are how these are recognised on the home screen, so a duplicate
    // is worse than a no-op: two near-identical blocking items and no way to
    // tell which one you already actioned.
    const { data: clash } = await db
      .from('checklist_items')
      .select('id')
      .eq('title', c.title)
      .maybeSingle()
    if (clash) {
      blocked.push({ kind: 'checklist-create', target: c.title, detail: 'already exists' })
      continue
    }

    changes.push({
      kind: 'checklist-create',
      target: c.title,
      detail: `${c.category}${c.due_date ? `, due ${c.due_date}` : ''}${c.is_blocking ? ', BLOCKING' : ''}`,
    })
    if (!dryRun) {
      const { error } = await db.from('checklist_items').insert({ ...c, trip_id: trip.id })
      if (error) throw new Error(`checklist create ${c.title}: ${error.message}`)
    }
  }

  for (const d of patch.deleteChecklist ?? []) {
    const { data: current } = await db
      .from('checklist_items')
      .select('title, done_at')
      .eq('id', d.id)
      .maybeSingle()
    if (!current) {
      blocked.push({ kind: 'checklist-delete', target: d.id, detail: 'no such item' })
      continue
    }
    // Deleting something already ticked destroys the record that it was done.
    if (current.done_at) {
      blocked.push({ kind: 'checklist-delete', target: current.title, detail: 'already done — leave it' })
      continue
    }

    changes.push({ kind: 'checklist-delete', target: current.title, detail: 'removed' })
    if (!dryRun) {
      const { error } = await db.from('checklist_items').delete().eq('id', d.id)
      if (error) throw new Error(`checklist delete ${current.title}: ${error.message}`)
    }
  }

  // ── Days ───────────────────────────────────────────────────────────────
  for (const u of patch.updateDays ?? []) {
    changes.push({ kind: 'day', target: u.date, detail: JSON.stringify(u.set) })
    if (!dryRun) {
      const { error } = await db.from('days').update(u.set).eq('date', u.date)
      if (error) throw new Error(`day ${u.date}: ${error.message}`)
    }
  }

  // ── Leave a trail ──────────────────────────────────────────────────────
  // A replan with no explanation is impossible to unpick later, so the reason
  // is recorded alongside the notes the travellers wrote themselves.
  if (!dryRun && patch.reason && opts.actorId && changes.length > 0) {
    await db.from('notes').insert({
      user_id: opts.actorId,
      body: `[replan] ${patch.reason}\n\n${changes.map((c) => `• ${c.target}: ${c.detail}`).join('\n')}`,
    })
  }

  return { dryRun, changes, blocked }
}
