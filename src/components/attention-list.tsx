import Link from 'next/link'
import type { AttentionItem, Severity } from '@/lib/attention'

const STYLES: Record<Severity, { dot: string; ring: string; label: string }> = {
  critical: {
    dot: 'bg-red-600',
    ring: 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30',
    label: 'Needs action',
  },
  warning: {
    dot: 'bg-amber-500',
    ring: 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30',
    label: 'Coming up',
  },
  info: {
    dot: 'bg-stone-400',
    ring: 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900',
    label: 'Keep an eye on',
  },
}

export function AttentionList({
  items,
  limit,
  emptyMessage = 'Nothing needs you right now.',
}: {
  items: AttentionItem[]
  limit?: number
  emptyMessage?: string
}) {
  const shown = limit ? items.slice(0, limit) : items

  if (shown.length === 0) {
    return (
      <p className="rounded-xl border border-stone-200 bg-white px-4 py-6 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {shown.map((item) => {
        const s = STYLES[item.severity]
        const content = (
          <div className={`flex gap-3 rounded-xl border px-4 py-3 ${s.ring}`}>
            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${s.dot}`} aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">{item.title}</p>
              {item.detail && (
                <p className="mt-0.5 text-xs text-stone-500">{item.detail}</p>
              )}
            </div>
          </div>
        )
        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className="block transition active:scale-[0.99]">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        )
      })}
      {limit && items.length > limit && (
        <li>
          <Link
            href="/attention"
            className="block px-4 py-2 text-sm text-stone-500 underline underline-offset-4"
          >
            {items.length - limit} more
          </Link>
        </li>
      )}
    </ul>
  )
}
