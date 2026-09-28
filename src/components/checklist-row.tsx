'use client'

import { useState, useTransition } from 'react'
import { toggleChecklistItem } from '@/app/actions'
import { relativeDays, daysUntil } from '@/lib/tokyo'
import type { ChecklistItem } from '@/lib/data'

export function ChecklistRow({ item, canWrite }: { item: ChecklistItem; canWrite: boolean }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const done = !!item.done_at
  const overdue = !done && item.due_date != null && daysUntil(item.due_date) < 0

  function toggle() {
    setError(null)
    startTransition(async () => {
      const r = await toggleChecklistItem(item.id, !done)
      if (!r.ok) setError(r.error)
    })
  }

  return (
    <li
      className={`rounded-xl border px-4 py-3 transition ${
        done
          ? 'border-stone-200 bg-stone-100/60 opacity-60 dark:border-stone-800 dark:bg-stone-900/40'
          : overdue
            ? 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/20'
            : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
      }`}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!canWrite || pending}
          aria-label={done ? 'Mark not done' : 'Mark done'}
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border text-xs transition disabled:cursor-default ${
            done
              ? 'border-stone-900 bg-stone-900 text-stone-50 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
              : 'border-stone-300 dark:border-stone-600'
          }`}
        >
          {done ? '✓' : ''}
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full text-left"
          >
            <p className={`text-sm font-medium leading-snug ${done ? 'line-through' : ''}`}>
              {item.title}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
              {item.due_date && (
                <span className={overdue ? 'font-medium text-red-600' : 'text-stone-500'}>
                  {done ? 'was due' : 'due'} {relativeDays(item.due_date)}
                </span>
              )}
              {item.is_blocking && !done && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  blocking
                </span>
              )}
              {item.detail && !expanded && <span className="text-stone-400">more…</span>}
            </p>
          </button>

          {expanded && item.detail && (
            <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              {item.detail}
            </p>
          )}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </li>
  )
}
