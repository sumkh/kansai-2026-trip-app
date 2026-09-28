import 'server-only'

/**
 * Bearer-token guard for the trip API.
 *
 * These routes exist for the case where there is no browser session — a
 * Claude Code session on a phone, or plain curl from a hotel lobby. They use
 * the service-role key, so the token is the ONLY thing standing in front of
 * full read/write access to the trip.
 */

export function tokenIsValid(request: Request): boolean {
  const expected = process.env.TRIP_API_TOKEN
  // An unset token must deny everything. Defaulting to open here would turn a
  // forgotten environment variable into a public read/write endpoint.
  if (!expected) return false

  const header = request.headers.get('authorization') ?? ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (provided.length !== expected.length) return false

  // Constant-time-ish: compare every byte regardless of where it diverges.
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

export function unauthorised() {
  return Response.json({ error: 'Unauthorised' }, { status: 401 })
}
