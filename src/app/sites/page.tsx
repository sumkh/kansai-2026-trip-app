import { requireProfile } from '@/lib/auth'
import { getSites, getAttention, type Site } from '@/lib/data'
import { Header, Nav } from '@/components/nav'
import { ReferenceTabs } from '@/components/reference-tabs'
import { JapaneseName } from '@/components/japanese-name'
import { Photo } from '@/components/photo'

/** Master plan section 8. Grouped by city, in trip order. */
const CITY_ORDER = ['Osaka', 'Arima', 'Kyoto', 'Nara', 'Transport']

const KIND_ICON: Record<string, string> = {
  SIGHT: '⛩',
  ONSEN: '♨',
  MARKET: '🐟',
  SHOPPING: '🛍',
  THEATRE: '🎭',
  FESTIVAL: '🎊',
  GARDEN: '🌿',
  GYM: '🏋',
  REFERENCE: '🔖',
}

/**
 * Where a site has no verified URL, fall back to a Google Maps search on the
 * Japanese name. The master plan is explicit that a guessed URL which
 * dead-ends in Japan is worse than none — a maps search on 黒門市場 always
 * resolves, and it is what you actually want on a phone anyway.
 */
function linkFor(site: Site): { href: string; label: string } | null {
  if (site.url) return { href: site.url, label: 'Website' }
  const query = site.search_key ?? site.name_ja ?? site.name
  return {
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    label: 'Find on Maps',
  }
}

export default async function SitesPage() {
  const profile = await requireProfile()
  const [sites, attention] = await Promise.all([getSites(), getAttention()])

  const byCity = new Map<string, Site[]>()
  for (const s of sites) {
    const list = byCity.get(s.city) ?? []
    list.push(s)
    byCity.set(s.city, list)
  }
  const ordered = [...byCity.entries()].sort(
    ([a], [b]) => CITY_ORDER.indexOf(a) - CITY_ORDER.indexOf(b)
  )

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-5 py-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">Site index</h1>
          <p className="mt-1 text-sm text-stone-500">
            {sites.length} places. Tap a Japanese name to copy it — it is the
            search key that actually works here.
          </p>
        </section>

        <ReferenceTabs active="/sites" />

        {ordered.map(([city, list]) => (
          <section key={city}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
              {city} · {list.length}
            </h2>
            <ul className="space-y-2">
              {list.map((site) => {
                const link = linkFor(site)
                return (
                  <li
                    key={site.id}
                    className={`rounded-xl border px-4 py-3 ${
                      site.is_avoid
                        ? 'border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/20'
                        : site.is_highlight
                          ? 'border-stone-400 bg-white dark:border-stone-600 dark:bg-stone-900'
                          : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                    }`}
                  >
                    <Photo
                      file={site.photo_file}
                      alt={site.name}
                      credit={site.photo_credit}
                      className="mb-3 aspect-[16/9]"
                    />
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0 text-base" aria-hidden>
                        {KIND_ICON[site.kind] ?? '•'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium leading-snug">
                          <span className={site.is_avoid ? 'line-through' : ''}>{site.name}</span>
                          {site.is_avoid && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                              avoid
                            </span>
                          )}
                          {site.day_hint && (
                            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-normal text-stone-500 dark:bg-stone-800">
                              {site.day_hint}
                            </span>
                          )}
                          {site.is_optional && (
                            <span className="text-[10px] uppercase tracking-wide text-stone-400">
                              optional
                            </span>
                          )}
                        </p>

                        {site.name_ja && (
                          <div className="mt-1">
                            <JapaneseName text={site.name_ja} />
                          </div>
                        )}

                        {site.note && (
                          <p className="mt-1.5 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                            {site.note}
                          </p>
                        )}

                        {link && !site.is_avoid && (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block rounded-full border border-stone-300 px-3 py-1 text-xs dark:border-stone-700"
                          >
                            {link.label} ↗
                          </a>
                        )}
                      </div>
                    </div>
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
