/**
 * Tests the replan safety rules against the local database.
 *
 * These are the rules that stand between "propose a change" and a cancelled
 * hotel, so they get asserted rather than assumed:
 *   - dry run is the default, and writes nothing
 *   - booked items are refused without an explicit force
 *   - unknown ids are reported, not silently ignored
 *
 * Run: npm run verify:patch   (local only — it writes and then reverts)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { applyPatch, exportTrip } from '../src/lib/trip-state'
import type { Database } from '../src/lib/database.types'

config({ path: '.env.local', quiet: true })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
  console.error(`✗ Refusing to run against ${url}. This script writes.`)
  process.exit(1)
}

const db = createClient<Database>(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

let failures = 0
const check = (n: string, p: boolean, d = '') => {
  console.log(`  ${p ? '✓' : '✗'} ${n}${d ? ` — ${d}` : ''}`)
  if (!p) failures++
}

async function main() {
  const state = await exportTrip(db)
  const all = state.days.flatMap((d) => d.activities)

  const booked = all.find((a) => a.is_booked)!
  const free = all.find((a) => !a.is_booked && a.type === 'FOOD')!

  console.log(`Booked sample:   ${booked.title}`)
  console.log(`Unbooked sample: ${free.title}\n`)

  // ── Dry run is the default ─────────────────────────────────────────────
  console.log('Dry run')
  const preview = await applyPatch(db, {
    updateActivities: [{ id: free.id, set: { start_time: '23:59' } }],
  })
  check('defaults to dry run', preview.dryRun === true)
  check('reports the change', preview.changes.length === 1, preview.changes[0]?.detail)

  const after = await db.from('activities').select('start_time').eq('id', free.id).single()
  check('wrote NOTHING', after.data?.start_time === free.start_time, `still ${after.data?.start_time}`)

  // ── Booked items are protected ─────────────────────────────────────────
  console.log('\nBooked items')
  const blockedUpdate = await applyPatch(
    db,
    { updateActivities: [{ id: booked.id, set: { start_time: '05:00' } }] },
    { dryRun: false }
  )
  check('refuses to move a booked activity', blockedUpdate.blocked.length === 1)
  check('makes no change alongside it', blockedUpdate.changes.length === 0)
  check(
    'explains why',
    (blockedUpdate.blocked[0]?.detail ?? '').includes('booked'),
    blockedUpdate.blocked[0]?.detail
  )

  const stillThere = await db.from('activities').select('start_time').eq('id', booked.id).single()
  check('booked activity is untouched', stillThere.data?.start_time === booked.start_time)

  const blockedDelete = await applyPatch(
    db,
    { deleteActivities: [{ id: booked.id }] },
    { dryRun: false }
  )
  check('refuses to delete a booked activity', blockedDelete.blocked.length === 1)
  const exists = await db.from('activities').select('id').eq('id', booked.id).maybeSingle()
  check('booked activity still exists', !!exists.data)

  // ── force is an explicit opt-in ────────────────────────────────────────
  const forced = await applyPatch(db, {
    updateActivities: [{ id: booked.id, set: { start_time: '05:00' }, force: true }],
  })
  check('force allows it through in preview', forced.changes.length === 1 && forced.blocked.length === 0)

  // ── Unknown ids are surfaced ───────────────────────────────────────────
  console.log('\nBad input')
  const missing = await applyPatch(db, {
    updateActivities: [{ id: '00000000-0000-0000-0000-000000000000', set: { title: 'ghost' } }],
  })
  check('reports an unknown id', missing.blocked[0]?.detail === 'no such activity')

  const noop = await applyPatch(db, {
    updateActivities: [{ id: free.id, set: { title: free.title } }],
  })
  check('ignores a change that changes nothing', noop.changes.length === 0)

  // ── A real write, then revert ──────────────────────────────────────────
  console.log('\nWriting for real')
  const applied = await applyPatch(
    db,
    {
      reason: 'verify-patch test',
      updateActivities: [{ id: free.id, set: { status: 'SKIPPED' } }],
    },
    { dryRun: false }
  )
  check('applies when dryRun is false', applied.dryRun === false && applied.changes.length === 1)

  const written = await db.from('activities').select('status').eq('id', free.id).single()
  check('the change landed', written.data?.status === 'SKIPPED')

  await applyPatch(
    db,
    { updateActivities: [{ id: free.id, set: { status: free.status } }] },
    { dryRun: false }
  )
  const reverted = await db.from('activities').select('status').eq('id', free.id).single()
  check('reverted cleanly', reverted.data?.status === free.status)

  // ── Checklist creation ─────────────────────────────────────────────────
  // Added so a booking deadline discovered late can be inserted without
  // reseeding, which would throw away every note and status on the trip.
  console.log('\nChecklist')
  const probe = 'verify-patch probe — delete me'

  const clPreview = await applyPatch(db, { createChecklist: [{ title: probe, category: 'admin' }] })
  check('create defaults to dry run', clPreview.dryRun === true && clPreview.changes.length === 1)
  const notYet = await db.from('checklist_items').select('id').eq('title', probe).maybeSingle()
  check('wrote NOTHING', !notYet.data)

  await applyPatch(
    db,
    { createChecklist: [{ title: probe, category: 'admin', due_date: '2026-08-21', is_blocking: true }] },
    { dryRun: false }
  )
  const made = await db
    .from('checklist_items')
    .select('id, due_date, is_blocking')
    .eq('title', probe)
    .maybeSingle()
  check('creates when dryRun is false', !!made.data, made.data?.due_date ?? 'missing')
  check('carries the deadline and the blocking flag', made.data?.is_blocking === true)

  const dupe = await applyPatch(db, { createChecklist: [{ title: probe, category: 'admin' }] })
  check('refuses a duplicate title', dupe.blocked[0]?.detail === 'already exists')
  check('and makes no change alongside it', dupe.changes.length === 0)

  // A ticked item is a record that it was done. Deleting it destroys that.
  await db.from('checklist_items').update({ done_at: new Date().toISOString() }).eq('title', probe)
  const delDone = await applyPatch(db, { deleteChecklist: [{ id: made.data!.id }] }, { dryRun: false })
  check('refuses to delete a DONE item', delDone.blocked[0]?.detail === 'already done — leave it')
  const survived = await db.from('checklist_items').select('id').eq('title', probe).maybeSingle()
  check('the done item survives', !!survived.data)

  await db.from('checklist_items').update({ done_at: null }).eq('title', probe)
  await applyPatch(db, { deleteChecklist: [{ id: made.data!.id }] }, { dryRun: false })
  const gone = await db.from('checklist_items').select('id').eq('title', probe).maybeSingle()
  check('deletes an untouched item, and cleans up', !gone.data)

  console.log(
    failures === 0
      ? '\n✓ Replan safety rules hold.'
      : `\n✗ ${failures} check(s) FAILED. Do not replan with this.`
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
