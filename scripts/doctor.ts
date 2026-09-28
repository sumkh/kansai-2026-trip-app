/**
 * Checks whether a Supabase project is actually ready to serve the app.
 *
 * Read-only. Reports what is missing and what to do about it, in the order
 * things have to happen. Useful against the hosted project before a deploy,
 * because the failure modes are all silent: no trigger means no profile, and
 * no profile means a working sign-in that shows you nothing.
 *
 *   npm run doctor                      # uses .env.local
 *   SUPABASE_URL=... SUPABASE_SECRET=... npm run doctor
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Need SUPABASE_URL and SUPABASE_SECRET (or the NEXT_PUBLIC_/SERVICE_ROLE pair).')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const ok = (s: string, d = '') => console.log(`  ✓ ${s}${d ? ` — ${d}` : ''}`)
const bad = (s: string, d = '') => console.log(`  ✗ ${s}${d ? ` — ${d}` : ''}`)
const todo: string[] = []

async function main() {
  console.log(`Checking ${new URL(url!).host}\n`)

  // ── Migrations ─────────────────────────────────────────────────────────
  console.log('Schema')
  const tables = [
    'allowed_users', 'profiles', 'trips', 'days', 'activities',
    'transport_options', 'checklist_items', 'notes', 'photos', 'blog_posts',
  ] as const

  // NOT head:true — a HEAD response has no body, so supabase-js cannot parse
  // the PostgREST error and hands back error:null on a 404. A missing table
  // then looks present, which is the one mistake this script must not make.
  const missing: string[] = []
  for (const t of tables) {
    const { error } = await db.from(t).select('*').limit(1)
    if (error) missing.push(t)
  }

  if (missing.length === tables.length) {
    bad('no tables at all', 'migrations have not been pushed')
    todo.push('supabase link --project-ref <ref> && supabase db push')
    console.log('\nNothing else can be checked until the schema exists.')
    return report()
  }
  if (missing.length) {
    bad(`${missing.length} table(s) missing`, missing.join(', '))
    todo.push('supabase db push')
  } else {
    ok(`all ${tables.length} tables present`)
  }

  // is_admin arrives in migration 4 — a good proxy for "fully migrated".
  const { error: adminColErr } = await db.from('allowed_users').select('is_admin').limit(1)
  if (adminColErr) {
    bad('allowed_users.is_admin missing', 'admin migration not applied')
    todo.push('supabase db push  (migrations 0004/0005 not applied)')
  } else {
    ok('admin migrations applied')
  }

  // ── Allow list ─────────────────────────────────────────────────────────
  console.log('\nAllow list')
  const { data: allowed } = await db.from('allowed_users').select('email, role, is_admin')
  if (!allowed?.length) {
    bad('nobody on the allow list')
    todo.push('Apply migration 0003/0004, or add rows at /admin')
  } else {
    for (const a of allowed) {
      ok(`${a.email}`, `${a.role}${a.is_admin ? ' · admin' : ''}`)
    }
    if (!allowed.some((a) => a.is_admin)) {
      bad('no admin', 'nobody can manage access')
      todo.push("update allowed_users set is_admin = true where email = '<you>'")
    }
  }

  // ── Accounts and profiles: the silent failure ──────────────────────────
  console.log('\nAccounts')
  const { data: userList, error: authErr } = await db.auth.admin.listUsers({ perPage: 200 })
  if (authErr) {
    bad('cannot list auth users', authErr.message)
  } else if (!userList.users.length) {
    bad('no accounts exist yet')
    todo.push('Supabase Dashboard → Authentication → Users → Add user (auto-confirm)')
  } else {
    const { data: profiles } = await db.from('profiles').select('email, role, is_admin')
    const profiled = new Set((profiles ?? []).map((p) => p.email.toLowerCase()))
    const allowedSet = new Set((allowed ?? []).map((a) => a.email.toLowerCase()))

    for (const u of userList.users) {
      const email = (u.email ?? '').toLowerCase()
      const hasProfile = profiled.has(email)
      const isAllowed = allowedSet.has(email)
      const confirmed = !!u.email_confirmed_at

      if (hasProfile && confirmed) {
        ok(email, 'account + profile, confirmed')
      } else if (hasProfile && !confirmed) {
        bad(email, 'has a profile but the email is NOT confirmed — cannot sign in')
        todo.push(`Confirm ${email}, or recreate the user with auto-confirm ticked`)
      } else if (isAllowed) {
        bad(email, 'on the allow list but HAS NO PROFILE — will see "This trip is private"')
        todo.push(
          `Profile missing for ${email}: the trigger did not run, almost certainly ` +
            `because the account was created before the migrations. Delete the user in ` +
            `the dashboard and add them again — the trigger will fire on the new insert.`
        )
      } else {
        bad(email, 'not on the allow list — this account sees nothing')
        todo.push(`Either add ${email} to allowed_users, or delete the account`)
      }
    }
  }

  // ── Itinerary ──────────────────────────────────────────────────────────
  console.log('\nItinerary')
  const [{ count: days }, { count: acts }, { count: checks }] = await Promise.all([
    db.from('days').select('*', { count: 'exact' }).limit(1),
    db.from('activities').select('*', { count: 'exact' }).limit(1),
    db.from('checklist_items').select('*', { count: 'exact' }).limit(1),
  ])

  if (!days) {
    bad('not seeded')
    todo.push('npm run db:seed  (with .env.local pointing at this project)')
  } else {
    ok(`${days} days, ${acts} activities, ${checks} checklist items`)
    if (days !== 8) bad(`expected 8 days, found ${days}`)
  }

  // ── Storage ────────────────────────────────────────────────────────────
  console.log('\nStorage')
  const { data: buckets } = await db.storage.listBuckets()
  const photos = buckets?.find((b) => b.id === 'trip-photos')
  if (!photos) {
    bad('trip-photos bucket missing')
    todo.push('supabase db push  (bucket is created by migration 0002)')
  } else {
    ok('trip-photos bucket exists', photos.public ? 'PUBLIC — should be private!' : 'private')
    if (photos.public) todo.push('Make the trip-photos bucket private')
  }

  report()
}

function report() {
  if (todo.length === 0) {
    console.log('\n✓ Ready. Sign in and you should see the itinerary.')
    return
  }
  console.log('\nTo do, in order:')
  todo.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
