import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * The signed-in user's profile, or a redirect.
 *
 * A user with no profile row signed in with Google successfully but is not on
 * the allow list. They see /not-invited, and RLS would return them nothing
 * anyway — this is the friendly face on top of that, not the enforcement.
 *
 * cache() so multiple components on one page share a single query.
 */
export const requireProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/not-invited')
  return profile
})

/** True if this profile may write. The database enforces it regardless —
 *  this only decides whether to render the control. */
export function canWrite(profile: Profile) {
  return profile.role === 'traveller'
}
