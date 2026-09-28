'use client'

import { useState, useTransition, useRef } from 'react'
import { addNote, deleteNote } from '@/app/actions'
import type { Note } from '@/lib/data'

/**
 * Notes are the primary signal for replanning, so losing one is worse than
 * almost any other bug here. The draft is kept in local state until the write
 * confirms, and the textarea is only cleared on success — a failed save on a
 * train with no signal leaves the text exactly where you typed it.
 */
export function NoteComposer({
  dayId,
  activityId,
  date,
}: {
  dayId?: string
  activityId?: string
  date: string
}) {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLTextAreaElement>(null)

  function submit() {
    if (!body.trim()) return
    setError(null)
    startTransition(async () => {
      const r = await addNote({ body, dayId, activityId, date })
      if (r.ok) {
        setBody('')
        ref.current?.blur()
      } else {
        setError(r.error)
      }
    })
  }

  return (
    <div className="mb-3">
      <textarea
        ref={ref}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="What happened, what to remember…"
        className="w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:border-stone-400 focus:outline-none dark:border-stone-800 dark:bg-stone-900"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-red-600">{error}</p>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !body.trim()}
          className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-stone-50 disabled:opacity-40 dark:bg-stone-100 dark:text-stone-900"
        >
          {pending ? 'Saving…' : 'Add note'}
        </button>
      </div>
    </div>
  )
}

export function NoteList({
  notes,
  date,
  canWrite,
}: {
  notes: Note[]
  date?: string
  canWrite: boolean
}) {
  if (notes.length === 0) {
    return <p className="text-sm text-stone-500">No notes yet.</p>
  }

  return (
    <ul className="space-y-2">
      {notes.map((n) => (
        <NoteRow key={n.id} note={n} date={date} canWrite={canWrite} />
      ))}
    </ul>
  )
}

function NoteRow({ note, date, canWrite }: { note: Note; date?: string; canWrite: boolean }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <li className="rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.body}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
        <time dateTime={note.created_at}>
          {new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Tokyo',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }).format(new Date(note.created_at))}
        </time>
        {canWrite && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await deleteNote(note.id, date)
                if (!r.ok) setError(r.error)
              })
            }
            className="underline underline-offset-4 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </li>
  )
}
