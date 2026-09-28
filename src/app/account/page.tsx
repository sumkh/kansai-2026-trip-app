import { requireProfile } from '@/lib/auth'
import { getAttention } from '@/lib/data'
import { Header, Nav } from '@/components/nav'
import { PasswordForm } from './password-form'

export default async function AccountPage() {
  const profile = await requireProfile()
  const attention = await getAttention()

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-5 py-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
          <p className="mt-1 text-sm text-stone-500">
            {profile.display_name ? `${profile.display_name} · ` : ''}
            {profile.email}
          </p>
          <p className="mt-2 text-xs text-stone-500">
            {profile.role === 'traveller'
              ? 'Traveller — you can change the itinerary, tick things off and write notes.'
              : 'Viewer — you see everything the travellers see, but cannot change it.'}
            {profile.is_admin && ' You are also the admin, so you manage who has access.'}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Change your password
          </h2>
          <PasswordForm />
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            Your current password is required, so an unlocked phone left on a
            table cannot be used to lock you out. If you have forgotten it, ask
            Brian to set a new one — there is no reset email.
          </p>
        </section>
      </main>
      <Nav attentionCount={attention.filter((a) => a.severity === 'critical').length} />
    </>
  )
}
