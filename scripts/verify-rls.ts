/**
 * Proves the access control actually holds, at the database, not in the UI.
 *
 * The build guide is blunt about this: if a viewer can force a write from the
 * browser console, everything built on top is sand. This script is that test,
 * automated, so it can be re-run after every migration.
 *
 * Run against LOCAL Supabase: npm run db:verify-rls
 *
 * It creates and deletes three auth users, so never point it at production.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
  console.error(`✗ Refusing to run against ${url}. This script creates and deletes users.`)
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const PASSWORD = 'verify-rls-throwaway-password'
const ACTORS = {
  traveller: 'traveller@example.com',     // traveller + admin
  viewer: 'viewer@example.com',     // viewer, not admin
  stranger: 'nobody@example.com',    // NOT in allowed_users
}

let failures = 0

function check(name: string, passed: boolean, detail = '') {
  console.log(`  ${passed ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!passed) failures++
}

async function signIn(email: string): Promise<SupabaseClient> {
  const existing = await admin.auth.admin.listUsers()
  const found = existing.data.users.find((u) => u.email === email)
  if (found) await admin.auth.admin.deleteUser(found.id)

  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  })
  if (createErr) throw new Error(`create ${email}: ${createErr.message}`)

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (error) throw new Error(`sign in ${email}: ${error.message}`)
  return client
}

async function cleanup() {
  const { data } = await admin.auth.admin.listUsers()
  for (const u of data.users) {
    if (Object.values(ACTORS).includes(u.email ?? '')) {
      await admin.auth.admin.deleteUser(u.id)
    }
  }
}

async function main() {
  console.log(`Verifying RLS on ${new URL(url).host}\n`)

  const { count: dayCount } = await admin
    .from('days')
    .select('*', { count: 'exact', head: true })
  if (!dayCount) {
    console.error('✗ No days in the database. Run `npm run db:seed` first.')
    process.exit(1)
  }

  // ── Anonymous ──────────────────────────────────────────────────────────
  console.log('Anonymous (not signed in)')
  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const anonRead = await anon.from('days').select('id')
  check('cannot read days', (anonRead.data?.length ?? 0) === 0, anonRead.error?.code ?? 'empty')

  // ── Stranger: signed in with Google, but not on the allow list ─────────
  console.log('\nStranger (signed in, not in allowed_users)')
  const stranger = await signIn(ACTORS.stranger)
  const strangerProfile = await stranger.from('profiles').select('id')
  check('gets no profile row', (strangerProfile.data?.length ?? 0) === 0)
  const strangerDays = await stranger.from('days').select('id')
  check('cannot read days', (strangerDays.data?.length ?? 0) === 0)
  const strangerWrite = await stranger
    .from('activities')
    .update({ status: 'DONE' })
    .eq('status', 'PLANNED')
    .select('id')
  check(
    'cannot write activities',
    !!strangerWrite.error || (strangerWrite.data?.length ?? 0) === 0,
    strangerWrite.error?.code ?? 'zero rows affected'
  )

  // ── Viewer: read-only ──────────────────────────────────────────────────
  console.log('\nViewer (in allowed_users, role=viewer)')
  const viewer = await signIn(ACTORS.viewer)
  const viewerDays = await viewer.from('days').select('id')
  check('CAN read days', (viewerDays.data?.length ?? 0) === dayCount, `${viewerDays.data?.length} rows`)

  const viewerUpdate = await viewer
    .from('activities')
    .update({ status: 'SKIPPED' })
    .eq('status', 'PLANNED')
    .select('id')
  check(
    'CANNOT update an activity',
    !!viewerUpdate.error || (viewerUpdate.data?.length ?? 0) === 0,
    viewerUpdate.error?.code ?? 'zero rows affected'
  )

  // Look these up as admin. We are testing whether the WRITE is refused, so the
  // test must not depend on the viewer's own reads succeeding.
  const { data: aDay } = await admin.from('days').select('id').limit(1).single()
  const { data: viewerProfile } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', ACTORS.viewer)
    .single()
  check('viewer got a profile row', !!viewerProfile)

  const viewerInsert = await viewer
    .from('notes')
    .insert({ user_id: viewerProfile!.id, day_id: aDay!.id, body: 'viewer should not be able to write this' })
    .select('id')
  check(
    'CANNOT insert a note',
    !!viewerInsert.error,
    viewerInsert.error?.code ?? 'INSERT SUCCEEDED — RLS IS BROKEN'
  )

  const viewerDelete = await viewer.from('checklist_items').delete().neq('title', '').select('id')
  check(
    'CANNOT delete checklist items',
    !!viewerDelete.error || (viewerDelete.data?.length ?? 0) === 0,
    viewerDelete.error?.code ?? 'zero rows affected'
  )

  const viewerAllowList = await viewer.from('allowed_users').select('email')
  check(
    'CANNOT read the allow list',
    !!viewerAllowList.error || (viewerAllowList.data?.length ?? 0) === 0,
    viewerAllowList.error?.code ?? 'empty'
  )

  // ── Traveller: full read/write ─────────────────────────────────────────
  console.log('\nTraveller (in allowed_users, role=traveller)')
  const traveller = await signIn(ACTORS.traveller)
  const travellerDays = await traveller.from('days').select('id')
  check('CAN read days', (travellerDays.data?.length ?? 0) === dayCount, `${travellerDays.data?.length} rows`)

  const { data: tProfile } = await traveller
    .from('profiles')
    .select('id')
    .ilike('email', ACTORS.traveller)
    .single()
  const travellerInsert = await traveller
    .from('notes')
    .insert({ user_id: tProfile!.id, day_id: aDay!.id, body: 'traveller write test' })
    .select('id')
    .single()
  check('CAN insert a note', !travellerInsert.error, travellerInsert.error?.message ?? 'ok')

  if (travellerInsert.data) {
    const del = await traveller.from('notes').delete().eq('id', travellerInsert.data.id)
    check('CAN delete their note', !del.error, del.error?.message ?? 'ok')
  }

  const travellerUpdate = await traveller
    .from('activities')
    .update({ status: 'PLANNED' })
    .eq('status', 'PLANNED')
    .select('id')
  check('CAN update activities', !travellerUpdate.error, travellerUpdate.error?.message ?? 'ok')

  // ── Admin: manages the allow list, and only the allow list ─────────────
  console.log('\nAdmin (traveller, is_admin = true)')
  const adminAllowList = await traveller.from('allowed_users').select('email')
  check(
    'CAN read the allow list',
    !adminAllowList.error && (adminAllowList.data?.length ?? 0) > 0,
    `${adminAllowList.data?.length ?? 0} rows`
  )

  const adminAdd = await traveller
    .from('allowed_users')
    .insert({ email: 'newviewer@example.com', role: 'viewer', display_name: 'Added by admin' })
    .select('email')
    .single()
  check('CAN add someone to the allow list', !adminAdd.error, adminAdd.error?.message ?? 'ok')
  if (adminAdd.data) {
    const rm = await traveller.from('allowed_users').delete().eq('email', adminAdd.data.email)
    check('CAN remove them again', !rm.error, rm.error?.message ?? 'ok')
  }

  const selfDemote = await traveller
    .from('profiles')
    .update({ is_admin: false })
    .ilike('email', ACTORS.traveller)
    .select('id')
  check(
    'CANNOT demote the last admin',
    !!selfDemote.error,
    selfDemote.error?.message ?? 'DEMOTION SUCCEEDED — lockout is possible'
  )

  console.log('\nViewer against the allow list')
  const viewerAdd = await viewer
    .from('allowed_users')
    .insert({ email: 'sneaky@example.com', role: 'traveller' })
    .select('email')
  check(
    'CANNOT add themselves as a traveller',
    !!viewerAdd.error,
    viewerAdd.error?.code ?? 'INSERT SUCCEEDED — RLS IS BROKEN'
  )

  const viewerPromote = await viewer
    .from('profiles')
    .update({ role: 'traveller' })
    .ilike('email', ACTORS.viewer)
    .select('id')
  check(
    'CANNOT promote themselves to traveller',
    !!viewerPromote.error || (viewerPromote.data?.length ?? 0) === 0,
    viewerPromote.error?.code ?? 'zero rows affected'
  )

  await cleanup()

  console.log(
    failures === 0
      ? '\n✓ All RLS checks passed.'
      : `\n✗ ${failures} RLS check(s) FAILED. Do not build on this.`
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(async (e) => {
  await cleanup().catch(() => {})
  console.error(e)
  process.exit(1)
})
