import { createAdminClient } from '@/lib/supabase/admin'
import { applyPatch, type TripPatch } from '@/lib/trip-state'
import { tokenIsValid, unauthorised } from '../auth'

/**
 * POST /api/trip/replan
 *
 * Previews by default. Writing requires `"dryRun": false` in the body — the
 * safe thing must be what happens when a field is forgotten, because the
 * caller here is often an agent assembling JSON from prose.
 *
 *   curl -X POST https://<app>/api/trip/replan \
 *     -H "Authorization: Bearer $TRIP_API_TOKEN" \
 *     -H "Content-Type: application/json" \
 *     -d '{"reason":"feet hurt","updateActivities":[{"id":"...","set":{"status":"SKIPPED"}}]}'
 */

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!tokenIsValid(request)) return unauthorised()

  let body: TripPatch & { dryRun?: boolean }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Body must be JSON' }, { status: 400 })
  }

  const { dryRun, ...patch } = body

  try {
    const result = await applyPatch(createAdminClient(), patch, { dryRun: dryRun !== false })
    return Response.json(result)
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Patch failed' },
      { status: 500 }
    )
  }
}
