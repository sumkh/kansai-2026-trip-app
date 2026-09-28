import { requireProfile } from '@/lib/auth'
import { getRestaurants, getAttention, type Restaurant } from '@/lib/data'
import { Header, Nav } from '@/components/nav'
import { ReferenceTabs } from '@/components/reference-tabs'
import { JapaneseName } from '@/components/japanese-name'
import { Photo } from '@/components/photo'

/**
 * Master plan section 9.
 *
 * Arima comes first, always. It is the only place on the trip where dinner has
 * to be solved in advance rather than found on the night — everyone eats inside
 * their ryokan, so the town shuts early, and 21–23 Sep are all public holidays.
 */
const CITY_ORDER = ['Arima', 'Osaka', 'Kyoto', 'Nara', 'Seasonal']

const CITY_NOTE: Record<string, string> = {
  Arima:
    'The one that needs planning. Restaurants shut early and all three nights fall on national holidays — verify hours before relying on any of these.',
  Osaka: 'Kuidaore — eat until you drop.',
  Kyoto: 'Refinement and restraint.',
  Nara: '',
  Seasonal: 'Order these if you see them, anywhere.',
}

function linkFor(r: Restaurant): string | null {
  if (r.url) return r.url
  const query = r.search_key ?? r.name_ja
  if (!query) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export default async function RestaurantsPage() {
  const profile = await requireProfile()
  const [restaurants, attention] = await Promise.all([getRestaurants(), getAttention()])

  const byCity = new Map<string, Restaurant[]>()
  for (const r of restaurants) {
    const list = byCity.get(r.city) ?? []
    list.push(r)
    byCity.set(r.city, list)
  }
  const ordered = [...byCity.entries()].sort(
    ([a], [b]) => CITY_ORDER.indexOf(a) - CITY_ORDER.indexOf(b)
  )

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-5 py-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">Restaurant index</h1>
          <p className="mt-1 text-sm text-stone-500">
            {restaurants.length} places and dishes. Most are small independents
            with no English site — Tabelog (食べログ) or Google Maps on the
            Japanese name is the way in.
          </p>
        </section>

        <ReferenceTabs active="/restaurants" />

        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <strong>No beef</strong>, both travellers — every suggestion here works
          without it. And 21, 22 and 23 September are all national holidays, when
          small places shift their closing day unpredictably.
        </p>

        {ordered.map(([city, list]) => (
          <section key={city}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              {city} · {list.length}
            </h2>
            {CITY_NOTE[city] && (
              <p className="mb-3 mt-0.5 text-xs leading-relaxed text-stone-500">
                {CITY_NOTE[city]}
              </p>
            )}
            <ul className={`space-y-2 ${CITY_NOTE[city] ? '' : 'mt-3'}`}>
              {list.map((r) => {
                const href = linkFor(r)
                return (
                  <li
                    key={r.id}
                    className={`rounded-xl border px-4 py-3 ${
                      r.is_avoid
                        ? 'border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/20'
                        : r.needs_booking
                          ? 'border-amber-300 bg-white dark:border-amber-900/60 dark:bg-stone-900'
                          : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                    }`}
                  >
                    <Photo
                      file={r.is_avoid ? null : r.photo_file}
                      alt={r.name}
                      credit={r.photo_credit}
                      generic={r.photo_is_generic}
                      className="mb-3 aspect-[16/9]"
                    />
                    <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium leading-snug">
                      <span className={r.is_avoid ? 'line-through' : ''}>{r.name}</span>
                      {r.kind === 'DISH' && (
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-normal text-stone-500 dark:bg-stone-800">
                          dish
                        </span>
                      )}
                      {r.needs_booking && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          book ahead
                        </span>
                      )}
                      {r.is_avoid && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                          avoid
                        </span>
                      )}
                    </p>

                    {(r.cuisine || r.hours) && (
                      <p className="mt-0.5 text-xs text-stone-500">
                        {[r.cuisine, r.hours].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    {r.name_ja && (
                      <div className="mt-1">
                        <JapaneseName text={r.name_ja} />
                      </div>
                    )}

                    {r.note && (
                      <p className="mt-1.5 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                        {r.note}
                      </p>
                    )}

                    {href && !r.is_avoid && (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block rounded-full border border-stone-300 px-3 py-1 text-xs dark:border-stone-700"
                      >
                        {r.url ? 'Website' : 'Find on Maps'} ↗
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </main>
      <Nav attentionCount={attention.filter((a) => a.severity === 'critical').length} />
    </>
  )
}
