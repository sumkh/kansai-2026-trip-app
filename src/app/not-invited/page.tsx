import { SignOutButton } from '@/components/sign-out-button'
import { createClient } from '@/lib/supabase/server'

/** Signed in with Google, but not on the allow list. RLS would return them
 *  nothing anyway — this just says so politely instead of showing empty pages. */
export default async function NotInvitedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-semibold">This trip is private</h1>
      <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
        {user?.email ? (
          <>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {user.email}
            </span>{' '}
            is not on the guest list for this trip.
          </>
        ) : (
          'That account is not on the guest list for this trip.'
        )}
      </p>
      <p className="max-w-sm text-xs text-neutral-500">
        If you think that is a mistake, ask Brian to add you — then sign in again.
      </p>
      <SignOutButton />
    </main>
  )
}
