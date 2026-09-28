import Link from 'next/link'
import { requireProfile, canWrite } from '@/lib/auth'
import { getNotes, getTrip, getAttention } from '@/lib/data'
import { formatDay } from '@/lib/tokyo'
import { NoteList } from '@/components/notes'
import { Header, Nav } from '@/components/nav'

/** Everything chronologically. This is the view — and the table — that
 *  /replan reads to work out what actually happened. */
export default async function NotesPage() {
  const profile = await requireProfile()
  const [notes, days, attention] = await Promise.all([getNotes(), getTrip(), getAttention()])

  const dayById = new Map(days.map((d) => [d.id, d]))

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-5 py-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="mt-1 text-sm text-stone-500">
            {notes.length === 0 ? 'Nothing written yet.' : `${notes.length} in total`}
          </p>
        </section>

        {notes.length > 0 && (
          <ul className="space-y-4">
            {notes.map((n) => {
              const day = n.day_id ? dayById.get(n.day_id) : null
              return (
                <li key={n.id}>
                  {day && (
                    <Link
                      href={`/day/${day.date}`}
                      className="text-xs text-stone-500 underline underline-offset-4"
                    >
                      {formatDay(day.date)} · {day.title}
                    </Link>
                  )}
                  <div className="mt-1">
                    <NoteList notes={[n]} canWrite={canWrite(profile)} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
      <Nav
        attentionCount={attention.filter((a) => a.severity === 'critical').length}
      />
    </>
  )
}
