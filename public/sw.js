/**
 * Kansai 2026 service worker.
 *
 * The goal is not "works offline" as a nicety — it is that the day view must
 * render on a Shinkansen, in a tunnel, or on a mountain road above Arima with
 * zero network calls, and that a failed request must never cost roaming data
 * in retries.
 *
 * Strategies, deliberately different per resource:
 *   /_next/static/*  cache-first. Hashed filenames, so they can never go stale.
 *   navigations      stale-while-revalidate. The cached page paints instantly;
 *                    a fresh copy replaces it in the background when online.
 *   RSC payloads     same, keyed separately — Next varies on the RSC header, so
 *                    a document and its RSC payload are different resources.
 *   /api/*, POST     never cached. Mutations and health checks are live or not
 *                    at all.
 */

const VERSION = 'v3'
const STATIC_CACHE = `kansai-static-${VERSION}`
const PAGE_CACHE = `kansai-pages-${VERSION}`
const OFFLINE_URL = '/offline'

// Never cached: user management, sign-in, and anything that mutates.
const NEVER_CACHE = ['/api/', '/admin', '/login', '/not-invited']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      await cache.addAll([
        OFFLINE_URL,
        '/manifest.webmanifest',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/icons/apple-touch-icon.png',
      ])
      // Take over immediately rather than waiting for every tab to close —
      // on a phone there is usually only one, and a stale worker during the
      // trip is worse than a slightly abrupt upgrade.
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => k.startsWith('kansai-') && !k.endsWith(VERSION))
          .map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

/** Signing out must not leave readable pages behind on the device. */
self.addEventListener('message', (event) => {
  if (event.data === 'clear-caches') {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('kansai-')).map((k) => caches.delete(k)))
      )
    )
  }
  if (event.data && event.data.type === 'warm') {
    event.waitUntil(warm(event.data.urls || []))
  }
})

/**
 * Pre-fetches the whole itinerary in one go, so all eight days are readable
 * offline. Called explicitly by the app — never on a timer, because the user
 * decides when they are on wifi.
 */
async function warm(urls) {
  const cache = await caches.open(PAGE_CACHE)
  for (const url of urls) {
    try {
      const res = await fetch(url, { credentials: 'same-origin' })
      if (res.ok) await cache.put(url, res.clone())
    } catch {
      // Offline mid-warm. Whatever landed is still useful; stop trying.
      break
    }
  }
  // Then the photos: roughly 6.5 MB against 300 KB of pages. On a 10 GB plan
  // that is under 0.1% of the allowance, which is why this now runs
  // automatically on first load rather than waiting to be asked.
  try {
    const list = await fetch('/photos/index.json').then((r) => r.json())
    const photos = await caches.open(STATIC_CACHE)
    for (const file of list) {
      const href = `/photos/${file}`
      if (await photos.match(href)) continue
      const res = await fetch(href)
      if (res.ok) await photos.put(href, res.clone())
    }
  } catch {
    // Pages are cached either way; images degrade to a caption-only card.
  }

  const clients = await self.clients.matchAll()
  for (const c of clients) c.postMessage({ type: 'warmed' })
}

function isNeverCached(url) {
  return NEVER_CACHE.some((p) => url.pathname.startsWith(p))
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isNeverCached(url)) return

  // Immutable build output.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    // Reference photos never change without a redeploy under a new filename.
    url.pathname.startsWith('/photos/')
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  const isNavigation = request.mode === 'navigate'
  const isRsc = url.searchParams.has('_rsc') || request.headers.get('RSC') === '1'

  if (isNavigation || isRsc) {
    event.respondWith(staleWhileRevalidate(request, isNavigation))
  }
})

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  if (hit) return hit
  try {
    const res = await fetch(request)
    if (res.ok) cache.put(request, res.clone())
    return res
  } catch {
    return new Response('', { status: 504, statusText: 'Offline' })
  }
}

/**
 * Serve the cached copy immediately, then refresh it in the background.
 *
 * The revalidation is fire-and-forget and never retried: a retry loop on a
 * flaky connection is exactly how a day view quietly eats an allowance.
 */
async function staleWhileRevalidate(request, isNavigation) {
  const cache = await caches.open(PAGE_CACHE)
  const cached = await cache.match(request)

  const network = fetch(request)
    .then((res) => {
      // Do not cache redirects — a cached 307 to /login would strand a
      // signed-in user on the sign-in page every time they opened the app.
      if (res.ok && res.type === 'basic') cache.put(request, res.clone())
      return res
    })
    .catch(() => null)

  if (cached) {
    network.catch(() => {})
    return cached
  }

  const fresh = await network
  if (fresh) return fresh

  if (isNavigation) {
    const offline = await caches.match(OFFLINE_URL)
    if (offline) return offline
  }
  return new Response('', { status: 504, statusText: 'Offline' })
}
