import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

/** Browser client. Used only to start the Google sign-in redirect and to sign
 *  out — every data mutation goes through a Server Action. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
