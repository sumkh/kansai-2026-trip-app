import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { getAttention, getFocusDay, getTrip } from '@/lib/data'
import { daysUntil, formatDay, TRIP_START, isDuringTrip } from '@/lib/tokyo'
import { AttentionList } from '@/components/attention-list'
import { Header, Nav } from '@/components/nav'
import { Pwa } from '@/components/pwa'

export default async function HomePage() {
  const profile = await requireProfile()
  const [attention, focus, days] = await Promise.all([
    getAttention(),
    getFocusDay(),
    getTrip(),
  ])

  const away = daysUntil(TRIP_START)
  const onTrip = isDuringTrip()
  const critical = attention.filter((a) => a.severity === 'critical').length

  return (
    <>
      <Pwa dayPaths={days.map((d) => `/day/${d.date}`)} />
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-5 py-6">
        <section>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Osaka · Arima · Kyoto
          </p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">
            {onTrip ? focus?.title : away > 0 ? `${away} days to go` : 'Kansai 2026'}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {onTrip && focus ? formatDay(focus.date) : '19–26 September 2026'}
          </p>
        </section>

        {/* The point of the home screen: what needs you, before anything else. */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Needs attention
            </h2>
            {critical > 0 && (
              <span className="text-xs font-medium text-red-600">{critical} urgent</span>
            )}
          </div>
          <AttentionList
            items={attention}
            limit={4}
            emptyMessage="Nothing outstanding. Everything with a deadline is ticked off."
          />
        </section>

        {focus && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
              {onTrip ? 'Today' : 'First day'}
            </h2>
            <Link
              href={`/day/${focus.date}`}
              className="block rounded-xl border border-stone-200 bg-white p-4 transition active:scale-[0.99] dark:border-stone-800 dark:bg-stone-900"
            >
              <p className="text-xs text-stone-500">
                Day {focus.day_number} · {formatDay(focus.date)} · {focus.base_city}
              </p>
              <p className="mt-1 font-medium">{focus.title}</p>
              {focus.summary && (
                <p className="mt-1 text-sm leading-relaxed text-stone-500">{focus.summary}</p>
              )}
              <p className="mt-3 text-xs text-stone-500">
                {focus.activities.length} things planned →
              </p>
            </Link>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            The trip
          </h2>
          <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
            {days.map((d) => (
              <li key={d.id}>
                <Link href={`/day/${d.date}`} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-8 shrink-0 text-xs text-stone-400">D{d.day_number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{d.title}</span>
                    <span className="block text-xs text-stone-500">
                      {formatDay(d.date)} · {d.base_city}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-stone-400">
                    {d.activities.filter((a) => a.status === 'DONE').length}/
                    {d.activities.length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Nav attentionCount={critical} />
    </>
  )
}
