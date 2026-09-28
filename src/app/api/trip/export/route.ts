import { createAdminClient } from '@/lib/supabase/admin'
import { exportTrip } from '@/lib/trip-state'
import { tokenIsValid, unauthorised } from '../auth'

/**
 * GET /api/trip/export
 *   curl -H "Authorization: Bearer $TRIP_API_TOKEN" https://<app>/api/trip/export
 *
 * The whole trip as JSON. Read-only, and the fallback for any session that
 * cannot reach the database directly.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!tokenIsValid(request)) return unauthorised()

  try {
    const state = await exportTrip(createAdminClient())
    return Response.json(state)
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Export failed' },
      { status: 500 }
    )
  }
}
