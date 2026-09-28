/**
 * End-to-end smoke test against a running local server.
 *
 * Signs in as a traveller and as a viewer, forges the @supabase/ssr session
 * cookie, and fetches the real pages — so this catches the things a build
 * cannot: RLS blocking a query the page depends on, a nested select that does
 * not return what the component expects, or write controls leaking to viewers.
 *
 *   Terminal 1: npm run build && PORT=3100 npm start
 *   Terminal 2: npm run verify:smoke
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })

const APP = process.env.SMOKE_URL ?? 'http://localhost:3100'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const PASSWORD = 'smoke-test-throwaway'
const TRAVELLER = 'traveller@example.com'
const VIEWER = 'viewer@example.com'

let failures = 0
function check(name: string, passed: boolean, detail = '') {
  console.log(`  ${passed ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!passed) failures++
}

/** @supabase/ssr names the cookie after the first hostname label. */
function cookieName(): string {
  return `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
}

async function sessionCookie(email: string): Promise<string> {
  const { data: list } = await admin.auth.admin.listUsers()
  const existing = list.users.find((u) => u.email === email)
  if (existing) await admin.auth.admin.deleteUser(existing.id)

  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  })
  if (createErr) throw new Error(`create ${email}: ${createErr.message}`)

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (error) throw new Error(`sign in ${email}: ${error.message}`)

  const encoded = 'base64-' + Buffer.from(JSON.stringify(data.session)).toString('base64url')
  return `${cookieName()}=${encoded}`
}

/** Distinct day links in the markup. Counting rendered text is brittle:
 *  React SSR inserts <!-- --> between static and dynamic text nodes. */
function dayLinks(html: string): string[] {
  return [...new Set(html.match(/\/day\/2026-09-\d\d/g) ?? [])]
}

/** Entity-decoded, comment-stripped HTML. React escapes & to &amp; and splits
 *  static text from interpolated values with <!-- -->; asserting on raw markup
 *  produces false failures, which it has done here more than once. */
function plain(html: string): string {
  return html.replace(/<!-- -->/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'")
}

async function get(path: string, cookie: string) {
  const res = await fetch(`${APP}${path}`, {
    headers: { cookie },
    redirect: 'manual',
  })
  return { status: res.status, html: await res.text() }
}

/** Every JS file Next serves to the browser. */
async function clientBundles(): Promise<{ name: string; body: string }[]> {
  const { readdir, readFile } = await import('node:fs/promises')
  const { join } = await import('node:path')
  const root = '.next/static'
  const out: { name: string; body: string }[] = []

  async function walk(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) await walk(full)
      else if (entry.name.endsWith('.js')) {
        out.push({ name: full, body: await readFile(full, 'utf8') })
      }
    }
  }

  await walk(root).catch(() => {})
  return out
}

async function cleanup() {
  const { data } = await admin.auth.admin.listUsers()
  for (const u of data.users) {
    if ([TRAVELLER, VIEWER].includes(u.email ?? '')) await admin.auth.admin.deleteUser(u.id)
  }
}

async function main() {
  console.log(`Smoke testing ${APP}\n`)

  const health = await fetch(`${APP}/api/health`).catch(() => null)
  if (!health?.ok) {
    console.error(`✗ No server at ${APP}. Run: npm run build && PORT=3100 npm start`)
    process.exit(1)
  }

  // ── Traveller ──────────────────────────────────────────────────────────
  console.log('Traveller')
  const tCookie = await sessionCookie(TRAVELLER)

  const home = await get('/', tCookie)
  check('home renders', home.status === 200, `status ${home.status}`)
  check('shows the countdown', home.html.includes('days to go'))
  check('shows all 8 days', dayLinks(home.html).length === 8, `${dayLinks(home.html).length} days`)
  check('shows the attention section', home.html.includes('Needs attention'))

  const day = await get('/day/2026-09-19', tCookie)
  check('day view renders', day.status === 200, `status ${day.status}`)
  check('shows the flight', day.html.includes('MM774'))
  check('shows the booking reference', day.html.includes('ABC123'))
  check('shows transport alternatives', day.html.includes('Nankai Airport Express') && day.html.includes('Rapi:t'))
  check('offers maps deep links', day.html.includes('google.com/maps/dir/'))
  check('does NOT auto-load a map embed', !day.html.includes('maps/embed/v1'))
  check('shows write controls', day.html.includes('Mark done'))
  check('shows the note composer', day.html.includes('What happened'))

  check('day view shows photos', day.html.includes('/photos/'), 'itinerary images')

  const sun = await get('/day/2026-09-20', tCookie)
  check('Sunday runs the Taima-dera excursion', sun.html.includes('Taima-dera'))
  check('Sunday has a gym session', sun.html.includes('Gold') && sun.html.includes('Shinsaibashi'))
  check('Sunday flags the early Sunday closing', sun.html.includes('CLOSES EARLY'))
  const thu = await get('/day/2026-09-24', tCookie)
  check('Thursday covers the Higashiyama ridge', thu.html.includes('Chion-in') && thu.html.includes('dai-ji'))
  check('Thursday ends at the 24-hour gym', thu.html.includes('Kyoto Nijo'))

  // ── Getting between stops ──────────────────────────────────────────────
  // The directions link used to carry no origin, so it routed from wherever
  // the phone was standing rather than from the previous stop.
  const sunday = plain((await get('/day/2026-09-20', tCookie)).html)
  check('names the subway line', sunday.includes('Sakaisuji line') && sunday.includes('Nagahoribashi'))
  check('gives time and distance', sunday.includes('20 min') && sunday.includes('direct'))
  check('directions route FROM the previous stop', sunday.includes('dir/?api=1&origin='))
  check('says where you are coming from', sunday.includes('Directions from Shitenn'))
  check('walking legs use travelmode=walking', sunday.includes('travelmode=walking'))

  const wed = plain((await get('/day/2026-09-23', tCookie)).html)
  check('names the line and stop count', wed.includes('JR Sagano') && wed.includes('2 stops'))
  check(
    'the Kyoto gym is the 24-hour Nijo branch',
    wed.includes('Kyoto Nijo') && /24 hours/i.test(wed)
  )
  check('the Wednesday gym is the afternoon slot', wed.includes('14:00'))

  const thurs = plain((await get('/day/2026-09-24', tCookie)).html)
  check('spells out a multi-leg route', thurs.includes('Keihan line') && thurs.includes('Tofukuji'))
  check('does not invent a bus number', thurs.includes('varies by timetable'))

  // Both hotels are booked now; the refs must reach the day view.
  const sat = plain((await get('/day/2026-09-19', tCookie)).html)
  check('Namba booking reference shows', sat.includes('1000000000000001'))
  const wed2 = plain((await get('/day/2026-09-23', tCookie)).html)
  check('Kyoto booking reference shows', wed2.includes('1000000000000003'))

  // Dropped from the trip on 4 August.
  const fri = plain((await get('/day/2026-09-25', tCookie)).html)
  check('no moon-viewing on Friday', !fri.includes('Kangetsu') && !fri.includes('Daikaku'))
  const last = plain((await get('/day/2026-09-26', tCookie)).html)
  check('no Arashiyama on the last day', !last.includes('Bamboo Grove') && !last.includes('Tenryu'))
  check('last day is Kyoto Station shopping', last.includes('Isetan') && last.includes('Porta'))

  const arima = await get('/day/2026-09-21', tCookie)
  check('Arima day shows the Goshobo booking', arima.html.includes('1000000000000002'))

  // Skipping must not feel like deleting. This was reported as items
  // "becoming hidden": the photo was dropped, the card faded to 60%, and the
  // only way back was a toggle labelled "Skipped".
  const { data: skipDay } = await admin.from('days').select('id').eq('date', '2026-09-24').single()
  const { data: dayActs } = await admin.from('activities').select('id, title, photo_file').eq('day_id', skipDay!.id)
  const victim = dayActs!.find((a) => a.photo_file)!
  await admin.from('activities').update({ status: 'SKIPPED' }).eq('id', victim.id)

  const skipped = await get('/day/2026-09-24', tCookie)
  check('a skipped item is still listed', skipped.html.includes(victim.title))
  check('a skipped item keeps its photo', skipped.html.includes(victim.photo_file!))
  check('the photo is desaturated, not removed', skipped.html.includes('grayscale'))
  check('it is labelled Skipped', skipped.html.includes('>Skipped<'))
  check('it offers an obvious way back', skipped.html.includes('Put it back'))
  check('the day header counts it', skipped.html.includes('1 skipped'))
  check('the card is not faded out', !skipped.html.includes('opacity-60'))

  await admin.from('activities').update({ status: 'PLANNED' }).eq('id', victim.id)
  const restored = await get('/day/2026-09-24', tCookie)
  check('restoring puts it back to normal', !restored.html.includes('Put it back'))

  const checklist = await get('/checklist', tCookie)
  check('checklist renders', checklist.status === 200)
  check('shows the Goshobo no-beef item', checklist.html.includes('NO-BEEF'))
  check('marks blocking items', checklist.html.includes('blocking'))

  const attention = await get('/attention', tCookie)
  check('flags page renders', attention.status === 200)

  const admin1 = await get('/admin', tCookie)
  check('admin page renders for the admin', admin1.status === 200, `status ${admin1.status}`)
  check('lists the allow list', admin1.html.includes(VIEWER))
  check('offers the invite form', admin1.html.includes('their.email@gmail.com'))
  // The companion is on the allow list but has no account — the state that has to be
  // actionable, because it is how every real person gets added.
  check('flags allow-list entries with no account', admin1.html.includes('no account yet'))
  check('offers to create the missing account', admin1.html.includes('Create account'))

  // ── Reference pages ────────────────────────────────────────────────────
  console.log('\nReference')
  const sites = await get('/sites', tCookie)
  check('site index renders', sites.status === 200, `status ${sites.status}`)
  check('groups by city', ['Osaka', 'Arima', 'Kyoto', 'Nara'].every((c) => sites.html.includes(c)))
  check('carries Japanese names', sites.html.includes('黒門市場') && sites.html.includes('太閤の湯'))
  check('links verified URLs', sites.html.includes('arimaspa-kingin.jp') && sites.html.includes('inari.jp'))
  check('falls back to a maps search', sites.html.includes('google.com/maps/search/'))
  // Removed from the trip: no show runs during the travel window.
  check('no trace of the dropped 2.5D plan', !sites.html.includes('Cool Japan Park') && !sites.html.includes('j25musical'))
  check('lists the gyms', sites.html.includes("Gold") && sites.html.includes('Torque Gym'))
  check('flags the gym to avoid', sites.html.includes('Sanjokarasuma') && sites.html.includes('avoid'))
  check(
    'does not link the gym it says to avoid',
    !sites.html.includes('%E4%B8%89%E6%9D%A1%E7%83%8F%E4%B8%B8'),
    'no maps link for Sanjokarasuma'
  )

  check('shows photos', (sites.html.match(/\/photos\/[a-z0-9-]+\.webp/g) ?? []).length > 20,
    `${(sites.html.match(/\/photos\/[a-z0-9-]+\.webp/g) ?? []).length} images`)
  check('photos are lazy-loaded', sites.html.includes('loading="lazy"'))
  check('photos carry attribution', sites.html.includes('Saigen Jiro') || sites.html.includes('663highland'))

  const food = await get('/restaurants', tCookie)
  check('restaurant index renders', food.status === 200, `status ${food.status}`)
  check('puts Arima first', food.html.indexOf('Soba Dosanjin') < food.html.indexOf('Wanaka'))
  check('flags what to book', food.html.includes('book ahead'))
  check('flags what to avoid', food.html.includes('avoid') && food.html.includes('Gekkoen'))
  check('warns about no beef', food.html.includes('No beef'))
  check('carries seasonal dishes', food.html.includes('秋刀魚'))

  check('food photos render', (food.html.match(/\/photos\//g) ?? []).length > 20)
  check('marks representative food photos', food.html.includes('representative'))

  const guide = await get('/guide', tCookie)
  check('master plan renders', guide.status === 200, `status ${guide.status}`)
  check('renders the whole document', guide.html.includes('Site Index') && guide.html.includes('Read This Before You Pack'))
  check('renders tables', guide.html.includes('md-table'))
  // Deliberately NOT pinned to a section number: the master plan gets renumbered
  // whenever a section is inserted, and a test that breaks on that is noise.
  const anchors = [...new Set(guide.html.match(/href="#\d+-[a-z-]+"/g) ?? [])]
  check('builds a contents list', guide.html.includes('Contents') && anchors.length >= 10,
    `${anchors.length} section links`)
  check('includes the gym plan', guide.html.includes('Gym Plan') && guide.html.includes('gym-plan'))

  const account = await get('/account', tCookie)
  check('account page renders', account.status === 200, `status ${account.status}`)
  check('offers a password change', account.html.includes('Change your password'))
  check('asks for the current password', account.html.includes('Current password'))

  // ── Viewer ─────────────────────────────────────────────────────────────
  console.log('\nViewer')
  const vCookie = await sessionCookie(VIEWER)

  const vHome = await get('/', vCookie)
  check('home renders', vHome.status === 200, `status ${vHome.status}`)
  check(
    'sees all 8 days, same as a traveller',
    dayLinks(vHome.html).length === 8,
    `${dayLinks(vHome.html).length} days`
  )

  const vDay = await get('/day/2026-09-19', vCookie)
  check('day view renders', vDay.status === 200)
  check('sees the same itinerary content', vDay.html.includes('MM774'))
  check('does NOT see write controls', !vDay.html.includes('Mark done'))
  check('does NOT see the note composer', !vDay.html.includes('What happened'))

  const vChecklist = await get('/checklist', vCookie)
  check('checklist renders read-only', vChecklist.status === 200)

  const vSites = await get('/sites', vCookie)
  check('sees the site index', vSites.status === 200 && vSites.html.includes('黒門市場'))
  const vFood = await get('/restaurants', vCookie)
  check('sees the restaurant index', vFood.status === 200 && vFood.html.includes('Soba Dosanjin'))
  const vGuide = await get('/guide', vCookie)
  check('sees the master plan', vGuide.status === 200 && vGuide.html.includes('Site Index'))
  const vAccount = await get('/account', vCookie)
  check('can reach their own account page', vAccount.status === 200)

  const vAdmin = await get('/admin', vCookie)
  check(
    'admin page is refused',
    vAdmin.status === 307 || vAdmin.status === 302,
    `status ${vAdmin.status}`
  )

  // ── Sign-in page ───────────────────────────────────────────────────────
  console.log('\nSign-in')
  const login = await fetch(`${APP}/login`).then((r) => r.text())
  check('offers email and password fields', login.includes('type="password"'))
  check('does not offer Google', !login.includes('Continue with Google'))
  check('says there is no sign-up', login.includes('no sign-up'))

  // ── Offline shell ──────────────────────────────────────────────────────
  // These must be reachable WITHOUT a session. A middleware matcher that
  // redirects sw.js to /login disables offline support with no other symptom.
  console.log('\nOffline shell')
  const sw = await fetch(`${APP}/sw.js`, { redirect: 'manual' })
  const swBody = await sw.text()
  check('sw.js is served unauthenticated', sw.status === 200, `status ${sw.status}`)
  check(
    'sw.js is JavaScript, not a redirect',
    swBody.includes('addEventListener') && swBody.includes('staleWhileRevalidate')
  )
  check('sw.js never caches /api or /admin', swBody.includes("'/api/', '/admin'"))

  const manifest = await fetch(`${APP}/manifest.webmanifest`, { redirect: 'manual' })
  check('manifest is served unauthenticated', manifest.status === 200, `status ${manifest.status}`)
  const manifestJson = await manifest.json()
  check('manifest is installable', manifestJson.display === 'standalone' && manifestJson.icons.length >= 2)
  check('manifest icons are maskable', manifestJson.icons.every((i: { purpose?: string }) => i.purpose?.includes('maskable')))

  const photoIndex = await fetch(`${APP}/photos/index.json`, { redirect: 'manual' })
  check('photo index is served unauthenticated', photoIndex.status === 200, `status ${photoIndex.status}`)
  const photoList = await photoIndex.json()
  check('photo index lists every image', Array.isArray(photoList) && photoList.length > 40, `${photoList.length} files`)
  const onePhoto = await fetch(`${APP}/photos/${photoList[0]}`)
  check('photos are served as webp', onePhoto.headers.get('content-type') === 'image/webp')
  check('sw caches /photos/', swBody.includes("'/photos/'"))

  const offlinePage = await fetch(`${APP}/offline`, { redirect: 'manual' })
  check('offline page renders without a session', offlinePage.status === 200, `status ${offlinePage.status}`)

  const icon = await fetch(`${APP}/icons/icon-512.png`)
  check('icons are served', icon.status === 200 && icon.headers.get('content-type') === 'image/png')

  check('home links the manifest', home.html.includes('manifest.webmanifest'))
  check('home links an apple-touch-icon', home.html.includes('apple-touch-icon'))

  // ── Trip API ───────────────────────────────────────────────────────────
  // Bearer token, not session. The middleware must let these through, or they
  // are useless from curl and from a phone session with no cookies.
  console.log('\nTrip API')
  const token = process.env.TRIP_API_TOKEN
  const bearer = { Authorization: `Bearer ${token}` }

  const noAuth = await fetch(`${APP}/api/trip/export`, { redirect: 'manual' })
  check('export refuses a request with no token', noAuth.status === 401, `status ${noAuth.status}`)

  const badAuth = await fetch(`${APP}/api/trip/export`, {
    headers: { Authorization: 'Bearer ' + 'x'.repeat((token ?? '').length) },
    redirect: 'manual',
  })
  check('export refuses a same-length wrong token', badAuth.status === 401)

  const good = await fetch(`${APP}/api/trip/export`, { headers: bearer })
  check('export succeeds with the token', good.status === 200, `status ${good.status}`)
  const state = await good.json()
  check('export carries the whole trip', state.days?.length === 8, `${state.days?.length} days`)
  check('export excludes photos and blog', !('photos' in state) && !('blog' in state))

  const allActivities = state.days.flatMap((d: { activities: unknown[] }) => d.activities)
  const bookedActivity = allActivities.find((a: { is_booked: boolean }) => a.is_booked)
  const freeActivity = allActivities.find((a: { is_booked: boolean }) => !a.is_booked)

  const preview = await fetch(`${APP}/api/trip/replan`, {
    method: 'POST',
    headers: { ...bearer, 'Content-Type': 'application/json' },
    body: JSON.stringify({ updateActivities: [{ id: freeActivity.id, set: { start_time: '23:45' } }] }),
  }).then((r) => r.json())
  check('replan previews unless told otherwise', preview.dryRun === true)
  check('preview reports the change', preview.changes.length === 1)

  const unchanged = await fetch(`${APP}/api/trip/export`, { headers: bearer }).then((r) => r.json())
  const stillFree = unchanged.days
    .flatMap((d: { activities: { id: string; start_time: string }[] }) => d.activities)
    .find((a: { id: string }) => a.id === freeActivity.id)
  check('preview wrote nothing', stillFree.start_time === freeActivity.start_time)

  const refused = await fetch(`${APP}/api/trip/replan`, {
    method: 'POST',
    headers: { ...bearer, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dryRun: false,
      updateActivities: [{ id: bookedActivity.id, set: { start_time: '04:00' } }],
    }),
  }).then((r) => r.json())
  check('replan refuses a booked activity', refused.blocked.length === 1 && refused.changes.length === 0)
  check('and says why', String(refused.blocked[0]?.detail).includes('booked'))

  const replanNoAuth = await fetch(`${APP}/api/trip/replan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dryRun: false }),
    redirect: 'manual',
  })
  check('replan refuses a request with no token', replanNoAuth.status === 401)

  // ── The secret key must never reach the browser ────────────────────────
  console.log('\nSecret containment')
  const bundles = await clientBundles()
  const leaked = bundles.filter((b) => b.body.includes(serviceKey))
  check(
    'service-role key is absent from every client bundle',
    leaked.length === 0,
    leaked.length ? `LEAKED IN ${leaked.map((b) => b.name).join(', ')}` : `${bundles.length} files scanned`
  )
  const htmlLeak = [home.html, day.html, admin1.html].some((h) => h.includes(serviceKey))
  check('service-role key is absent from rendered HTML', !htmlLeak)

  await cleanup()
  console.log(failures === 0 ? '\n✓ Smoke test passed.' : `\n✗ ${failures} check(s) FAILED.`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(async (e) => {
  await cleanup().catch(() => {})
  console.error(e)
  process.exit(1)
})
