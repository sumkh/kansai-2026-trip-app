import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

/**
 * Supabase client for Server Components and Server Actions.
 *
 * Passes the user's JWT, so RLS applies. This is the ONLY client anything
 * user-facing should use — the service-role key bypasses RLS entirely and
 * belongs in seed scripts and token-protected admin routes, nowhere else.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component, which cannot set cookies.
            // The middleware refreshes the session instead, so this is safe.
          }
        },
      },
    }
  )
}
