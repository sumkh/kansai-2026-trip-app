import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase session on every request and gates the whole app.
 *
 * Server Components cannot write cookies, so token refresh has to happen here
 * or sessions silently expire mid-trip. This is the fiddly part of Supabase
 * Auth on the App Router — follow the official SSR guide before changing it.
 */

// Public to the SESSION gate, not to the world. /api/trip/* authenticates with
// a bearer token instead of a cookie, so redirecting it to /login would make it
// unusable from curl or a phone session — which is the entire point of it.
// Those routes fail closed on their own: an unset TRIP_API_TOKEN denies all.
const PUBLIC_PATHS = ['/login', '/not-invited', '/api/health', '/api/trip', '/offline']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Must be getUser(), not getSession() — getSession() trusts the cookie
  // without revalidating it against the auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // sw.js must be served from the root to claim the whole scope, and must
  // never be redirected to /login or the app has no offline support at all.
  //
  // photos/ likewise: the service worker fetches /photos/index.json without
  // credentials during the offline download, so a session redirect there means
  // no image is ever cached. They are Wikimedia photographs, not trip data —
  // nothing is disclosed by serving them to an unauthenticated request.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|photos/).*)',
  ],
}
