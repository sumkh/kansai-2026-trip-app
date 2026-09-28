import { hasServiceKey } from '@/lib/supabase/admin'

/**
 * Render's health check target, and a deploy sanity check.
 *
 * Deliberately does not touch the database — a paused Supabase project should
 * not take the web service down with it.
 *
 * Reports which env vars are PRESENT, never their values. Getting one of these
 * wrong produces a silent, confusing failure (account management that does
 * nothing, a maps button that never appears), so being able to see it from a
 * phone is worth more than the tiny amount it reveals.
 */

export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({
    ok: true,
    at: new Date().toISOString(),
    config: {
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      // Without this, creating accounts and setting passwords cannot work.
      serviceRoleKey: hasServiceKey(),
      mapsKey: Boolean(process.env.NEXT_PUBLIC_MAPS_KEY),
      anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
      tripApiToken: Boolean(process.env.TRIP_API_TOKEN),
    },
  })
}
