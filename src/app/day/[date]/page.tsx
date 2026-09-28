import { Fragment } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile, canWrite } from '@/lib/auth'
import { getDay, getTrip, getNotes } from '@/lib/data'
import { formatDayLong } from '@/lib/tokyo'
import { ActivityCard } from '@/components/activity-card'
import { Leg } from '@/components/leg'
import { NoteComposer, NoteList } from '@/components/notes'
import { Header, Nav } from '@/components/nav'
import { getAttention } from '@/lib/data'

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const profile = await requireProfile()

  const [day, days, attention] = await Promise.all([getDay(date), getTrip(), getAttention()])
  if (!day) notFound()

  const notes = await getNotes(day.id)
  const writable = canWrite(profile)
  const mapsKey = process.env.NEXT_PUBLIC_MAPS_KEY ?? ''

  const index = days.findIndex((d) => d.date === date)
  const prev = index > 0 ? days[index - 1] : null
  const next = index < days.length - 1 ? days[index + 1] : null

  const doneCount = day.activities.filter((a) => a.status === 'DONE').length
  const skippedCount = day.activities.filter((a) => a.status === 'SKIPPED').length

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-5 py-6">
        <section>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Day {day.day_number} · {day.base_city}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{day.title}</h1>
          <p className="mt-1 text-sm text-stone-500">{formatDayLong(day.date)}</p>
          {day.summary && (
            <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {day.summary}
            </p>
          )}
          {/* Skipped items are counted, not quietly dropped from the total —
              otherwise the numbers stop adding up and it looks like something
              went missing. */}
          <p className="mt-3 text-xs text-stone-500">
            {doneCount} of {day.activities.length} done
            {skippedCount > 0 && ` · ${skippedCount} skipped`}
          </p>
        </section>

        <ul className="space-y-2">
          {day.activities.map((a) => (
            <Fragment key={a.id}>
              <Leg activity={a} />
              <ActivityCard
                activity={a}
                date={day.date}
                canWrite={writable}
                mapsKey={mapsKey}
              />
            </Fragment>
          ))}
        </ul>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Notes
          </h2>
          {writable && <NoteComposer dayId={day.id} date={day.date} />}
          <NoteList notes={notes} date={day.date} canWrite={writable} />
        </section>

        <nav className="flex justify-between gap-3 pt-2 text-sm">
          {prev ? (
            <Link href={`/day/${prev.date}`} className="text-stone-500 underline underline-offset-4">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/day/${next.date}`}
              className="text-right text-stone-500 underline underline-offset-4"
            >
              {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>
      <Nav
        attentionCount={attention.filter((a) => a.severity === 'critical').length}
      />
    </>
  )
}
