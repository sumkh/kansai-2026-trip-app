import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Service-role client. BYPASSES RLS COMPLETELY.
 *
 * The `server-only` import above makes the build fail if this file is ever
 * pulled into a Client Component, which is the failure mode that would leak
 * the key into the browser bundle.
 *
 * Only used for things the Auth admin API requires and RLS cannot express:
 * creating an account for someone on the allow list, and resetting a password.
 * Every caller MUST check `profile.is_admin` first — that check runs against
 * the user's own RLS-backed client, so it cannot be spoofed from the browser.
 *
 * Never use this to read or write trip data. That is what RLS is for.
 */
/** Whether account management can work at all in this environment. */
export function hasServiceKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set on the server. Add it in the Render ' +
        'dashboard (Environment → Add Environment Variable) and redeploy. ' +
        'Creating accounts and setting passwords cannot work without it.'
    )
  }

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
