import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasServiceKey } from '@/lib/supabase/admin'
import { getAttention } from '@/lib/data'
import { Header, Nav } from '@/components/nav'
import { InviteForm, UserRow } from './user-controls'

export default async function AdminPage() {
  const profile = await requireProfile()
  // RLS returns a non-admin nothing anyway; this just avoids an empty page.
  if (!profile.is_admin) redirect('/')

  const supabase = await createClient()
  const [{ data: allowed }, { data: profiles }, attention] = await Promise.all([
    supabase.from('allowed_users').select('*').order('role').order('email'),
    supabase.from('profiles').select('email'),
    getAttention(),
  ])

  // A profile exists only once the account does — the trigger creates it when
  // the auth user is inserted. So this is an accurate "has an account" check
  // without needing the service-role key on a page render.
  const withAccounts = new Set((profiles ?? []).map((p) => p.email.toLowerCase()))

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-5 py-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">Who has access</h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            Travellers can change the itinerary. Viewers see everything travellers
            see, but cannot edit or add anything. Enforced by the database, not by
            hiding buttons.
          </p>
        </section>

        {!hasServiceKey() && (
          <section className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm leading-relaxed text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <p className="font-semibold">Account management is switched off</p>
            <p className="mt-1">
              <code className="rounded bg-red-100 px-1 dark:bg-red-900/50">
                SUPABASE_SERVICE_ROLE_KEY
              </code>{' '}
              is not set on the server, so creating accounts and setting passwords
              cannot work. Everything else on this page still does.
            </p>
            <p className="mt-2">
              Render → your service → <strong>Environment</strong> → add it, then{' '}
              <strong>Manual Deploy</strong>. Check{' '}
              <code className="rounded bg-red-100 px-1 dark:bg-red-900/50">/api/health</code>{' '}
              to confirm it took.
            </p>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Add someone
          </h2>
          <InviteForm />
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            Creates their account immediately — there is no invitation email and no
            sign-up page, so you have to send them the password yourself. Use
            something long; they only type it once and then save it.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            {allowed?.length ?? 0} with access
          </h2>
          <ul className="space-y-2">
            {(allowed ?? []).map((u) => (
              <UserRow
                key={u.email}
                email={u.email}
                displayName={u.display_name}
                role={u.role}
                isAdmin={u.is_admin}
                isSelf={u.email.toLowerCase() === profile.email.toLowerCase()}
                hasAccount={withAccounts.has(u.email.toLowerCase())}
              />
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-4 text-xs leading-relaxed text-stone-500 dark:border-stone-800 dark:bg-stone-900">
          <p className="font-medium text-stone-700 dark:text-stone-300">
            Public sign-up must stay off
          </p>
          <p className="mt-1">
            Supabase Dashboard → Authentication → Sign In / Providers → Email →
            &ldquo;Allow new users to sign up&rdquo; disabled. With it on, a stranger
            could register — they would still see nothing, because no allow-list row
            means no profile and RLS returns zero rows, but there is no reason to
            let them through the first door at all.
          </p>
        </section>
      </main>
      <Nav attentionCount={attention.filter((a) => a.severity === 'critical').length} />
    </>
  )
}
