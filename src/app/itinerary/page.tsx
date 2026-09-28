import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { getTrip, getAttention } from '@/lib/data'
import { formatDay } from '@/lib/tokyo'
import { Header, Nav } from '@/components/nav'

export default async function ItineraryPage() {
  const profile = await requireProfile()
  const [days, attention] = await Promise.all([getTrip(), getAttention()])

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-5 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">The whole trip</h1>

        {days.map((d) => (
          <section key={d.id}>
            <Link href={`/day/${d.date}`} className="group block">
              <p className="text-xs uppercase tracking-[0.15em] text-stone-500">
                Day {d.day_number} · {formatDay(d.date)} · {d.base_city}
              </p>
              <h2 className="mt-0.5 font-semibold group-hover:underline">{d.title}</h2>
            </Link>
            <ul className="mt-2 space-y-1">
              {d.activities.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="w-11 shrink-0 tabular-nums text-xs text-stone-400">
                    {a.start_time ?? ''}
                  </span>
                  <span
                    className={
                      a.status === 'DONE'
                        ? 'text-stone-400'
                        : a.status === 'SKIPPED'
                          ? 'text-stone-500'
                          : 'text-stone-700 dark:text-stone-300'
                    }
                  >
                    {a.title}
                    {/* Labelled rather than struck through: skipped items stay
                        readable because they are the ones most likely to be
                        reconsidered. */}
                    {a.status === 'SKIPPED' && (
                      <span className="ml-1.5 rounded bg-stone-200 px-1 py-0.5 text-[10px] uppercase tracking-wide text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                        skipped
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <Nav
        attentionCount={attention.filter((a) => a.severity === 'critical').length}
      />
    </>
  )
}
