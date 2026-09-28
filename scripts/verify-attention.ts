/**
 * Tests the flagging rules against fixed dates.
 *
 * computeAttention is pure and takes `today` as input, so we can ask what the
 * app would show in August, on the eve of the Goshobo deadline, and mid-trip —
 * without waiting for those dates or touching a database.
 *
 * Run: npm run verify:attention
 */

import { computeAttention, type AttentionInput } from '../src/lib/attention'
import type { Database } from '../src/lib/database.types'

type Day = Database['public']['Tables']['days']['Row']
type Activity = Database['public']['Tables']['activities']['Row']
type ChecklistItem = Database['public']['Tables']['checklist_items']['Row']
type TransportOption = Database['public']['Tables']['transport_options']['Row']

let failures = 0
function check(name: string, passed: boolean, detail = '') {
  console.log(`  ${passed ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!passed) failures++
}

// ── Fixtures ─────────────────────────────────────────────────────────────
const day = (over: Partial<Day> & Pick<Day, 'id' | 'date'>): Day => ({
  trip_id: 'trip', day_number: 1, title: 'A day', summary: null, base_city: 'Osaka', ...over,
})

const activity = (over: Partial<Activity> & Pick<Activity, 'id' | 'day_id'>): Activity => ({
  order: 1, start_time: null, duration_min: null, title: 'Something', description: null,
  type: 'SIGHT', status: 'PLANNED', place_name: null, address: null, lat: null, lng: null,
  google_place_id: null, is_booked: false, booking_ref: null, cost_jpy: null,
  photo_file: null, photo_credit: null, photo_is_generic: false,
  arrive_mode: null, arrive_detail: null, arrive_distance_m: null,
  arrive_duration_min: null, arrive_from_name: null,
  arrive_from_lat: null, arrive_from_lng: null, ...over,
})

const item = (over: Partial<ChecklistItem> & Pick<ChecklistItem, 'id'>): ChecklistItem => ({
  trip_id: 'trip', title: 'Do a thing', detail: null, category: 'admin', due_date: null,
  is_blocking: false, done_at: null, done_by: null, ...over,
})

const option = (
  over: Partial<TransportOption> & Pick<TransportOption, 'id' | 'activity_id'>
): TransportOption => ({
  label: 'Some route', mode: 'train', duration_min: 30, cost_jpy: null, from_place: null,
  to_place: null, notes: null, is_selected: false, ...over,
})

function run(today: string, over: Partial<AttentionInput> = {}) {
  return computeAttention({
    today, days: [], activities: [], checklist: [], transportOptions: [], ...over,
  })
}

// ── Deadlines ────────────────────────────────────────────────────────────
console.log('Checklist deadlines')
{
  const goshobo = item({
    id: 'goshobo', title: 'Message Goshobo about meals', due_date: '2026-09-04',
    is_blocking: true, category: 'dining',
  })

  const farOut = run('2026-08-01', { checklist: [goshobo] })
  check('a blocking item 34 days out is not raised yet', farOut.length === 0)

  const approaching = run('2026-08-25', { checklist: [goshobo] })
  check(
    'raised as a warning 10 days out',
    approaching.length === 1 && approaching[0].severity === 'warning',
    approaching[0]?.severity
  )

  const overdue = run('2026-09-07', { checklist: [goshobo] })
  check(
    'CRITICAL once overdue and blocking',
    overdue.length === 1 && overdue[0].severity === 'critical',
    overdue[0]?.detail
  )

  const done = run('2026-09-07', {
    checklist: [{ ...goshobo, done_at: '2026-09-01T00:00:00Z' }],
  })
  check('silent once ticked off', done.length === 0)

  const routine = item({ id: 'icoca', title: 'Add ICOCA to Apple Pay', due_date: '2026-09-05' })
  check(
    'a non-blocking item 10 days out stays quiet',
    run('2026-08-26', { checklist: [routine] }).length === 0
  )
  check(
    'but appears inside a week',
    run('2026-09-01', { checklist: [routine] }).length === 1
  )
  check(
    'overdue non-blocking is a warning, not critical',
    run('2026-09-10', { checklist: [routine] })[0]?.severity === 'warning'
  )
}

// ── Unbooked lodging ─────────────────────────────────────────────────────
console.log('\nUnbooked things')
{
  const d = day({ id: 'd1', date: '2026-09-19', title: 'Arrival, Osaka' })
  const hotel = activity({
    id: 'a1', day_id: 'd1', title: 'Check in at Dormy Inn Namba', type: 'LODGING',
    is_booked: false,
  })
  const booked = { ...hotel, id: 'a2', is_booked: true }

  check(
    'unbooked lodging is silent 60 days out',
    run('2026-07-20', { days: [d], activities: [hotel] }).length === 0
  )
  check(
    'raised 3 weeks out',
    run('2026-09-01', { days: [d], activities: [hotel] }).length === 1
  )
  check(
    'becomes a warning inside a week',
    run('2026-09-15', { days: [d], activities: [hotel] })[0]?.severity === 'warning'
  )
  check(
    'a booked one is never raised',
    run('2026-09-15', { days: [d], activities: [booked] }).length === 0
  )

  const freeHop = activity({
    id: 'a3', day_id: 'd1', title: 'Walk to Dotonbori', type: 'TRANSPORT', cost_jpy: null,
  })
  check(
    'a free local hop is not treated as a booking',
    run('2026-09-15', { days: [d], activities: [freeHop] }).length === 0
  )
}

// ── Undecided transport ──────────────────────────────────────────────────
console.log('\nUndecided routes')
{
  const d = day({ id: 'd1', date: '2026-09-19' })
  const a = activity({ id: 'a1', day_id: 'd1', title: 'KIX → Namba', type: 'TRANSPORT' })
  const two = [option({ id: 'o1', activity_id: 'a1' }), option({ id: 'o2', activity_id: 'a1' })]
  const chosen = [two[0], { ...two[1], is_selected: true }]

  check(
    'two options and none chosen is flagged',
    run('2026-09-15', { days: [d], activities: [a], transportOptions: two }).some(
      (i) => i.kind === 'transport'
    )
  )
  check(
    'silent once one is chosen',
    run('2026-09-15', { days: [d], activities: [a], transportOptions: chosen }).every(
      (i) => i.kind !== 'transport'
    )
  )
  check(
    'a single option needs no decision',
    run('2026-09-15', { days: [d], activities: [a], transportOptions: [two[0]] }).every(
      (i) => i.kind !== 'transport'
    )
  )
  check(
    'not flagged after the day has passed',
    run('2026-09-25', { days: [d], activities: [a], transportOptions: two }).every(
      (i) => i.kind !== 'transport'
    )
  )
}

// ── Unreviewed elapsed days ──────────────────────────────────────────────
console.log('\nDays gone by without being marked up')
{
  const d = day({ id: 'd1', date: '2026-09-20', title: 'Castle and Den Den Town' })
  const planned = [
    activity({ id: 'a1', day_id: 'd1' }),
    activity({ id: 'a2', day_id: 'd1', status: 'DONE' }),
  ]
  const allMarked = [
    { ...planned[0], status: 'SKIPPED' as const },
    planned[1],
  ]

  check(
    'nothing before the trip starts',
    run('2026-08-01', { days: [d], activities: planned }).every((i) => i.kind !== 'review')
  )
  check(
    'flagged the day after',
    run('2026-09-21', { days: [d], activities: planned }).some((i) => i.kind === 'review')
  )
  check(
    'counts only the unreviewed ones',
    run('2026-09-21', { days: [d], activities: planned }).find((i) => i.kind === 'review')
      ?.title === '1 unreviewed on Castle and Den Den Town'
  )
  check(
    'silent when everything is marked done or skipped',
    run('2026-09-21', { days: [d], activities: allMarked }).every((i) => i.kind !== 'review')
  )
}

// ── Ordering ─────────────────────────────────────────────────────────────
console.log('\nOrdering')
{
  const items = run('2026-09-07', {
    checklist: [
      item({ id: 'later', title: 'Later thing', due_date: '2026-09-12' }),
      item({ id: 'overdue', title: 'Overdue blocker', due_date: '2026-09-01', is_blocking: true }),
      item({ id: 'soon', title: 'Soon thing', due_date: '2026-09-09', is_blocking: true }),
    ],
  })
  check('most urgent first', items[0]?.title === 'Overdue blocker', items[0]?.title)
  check('critical before warning', items[0].severity === 'critical' && items[1].severity !== 'critical')
}

console.log(
  failures === 0
    ? '\n✓ All attention rules behave as intended.'
    : `\n✗ ${failures} rule(s) FAILED.`
)
process.exit(failures === 0 ? 0 : 1)
