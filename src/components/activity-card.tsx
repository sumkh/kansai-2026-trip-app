'use client'

import { useState, useTransition } from 'react'
import { setActivityStatus, selectTransportOption } from '@/app/actions'
import { mapsDirectionsUrl, mapsSearchUrl, mapsEmbedUrl, hasLocation } from '@/lib/maps'
import { Photo } from '@/components/photo'
import type { ActivityWithOptions } from '@/lib/data'

const TYPE_ICON: Record<string, string> = {
  TRANSPORT: '→',
  ONSEN: '♨',
  FOOD: '🍜',
  SIGHT: '⛩',
  SHOPPING: '🛍',
  LODGING: '🛏',
  ADMIN: '✎',
}

export function ActivityCard({
  activity,
  date,
  canWrite,
  mapsKey,
}: {
  activity: ActivityWithOptions
  date: string
  canWrite: boolean
  mapsKey: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)

  const done = activity.status === 'DONE'
  const skipped = activity.status === 'SKIPPED'

  function update(status: 'PLANNED' | 'DONE' | 'SKIPPED') {
    setError(null)
    startTransition(async () => {
      const r = await setActivityStatus(activity.id, status, date)
      if (!r.ok) setError(r.error)
    })
  }

  function choose(optionId: string) {
    setError(null)
    startTransition(async () => {
      const r = await selectTransportOption(optionId, activity.id, date)
      if (!r.ok) setError(r.error)
    })
  }

  const options = [...activity.transport_options].sort((a, b) => a.duration_min - b.duration_min)
  const embedUrl = showMap ? mapsEmbedUrl(activity, mapsKey) : null
  const directions = mapsDirectionsUrl(activity)
  const search = mapsSearchUrl(activity)

  return (
    <li
      className={`rounded-xl border transition ${
        skipped
          ? // Muted, never faded. A skipped plan is still a plan you may want
            // back — dimming the whole card to 60% made people think the app
            // had deleted it.
            'border-dashed border-stone-300 bg-stone-100/50 dark:border-stone-700 dark:bg-stone-900/50'
          : done
            ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
            : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
      }`}
    >
      <div className="flex gap-3 p-4">
        <div className="w-12 shrink-0 pt-0.5">
          <p className="text-xs font-medium tabular-nums text-stone-500">
            {activity.start_time ?? '—'}
          </p>
          <p className="mt-1 text-base leading-none" aria-hidden>
            {TYPE_ICON[activity.type] ?? '•'}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`font-medium leading-snug ${skipped ? 'text-stone-500' : ''}`}>
            {activity.title}
          </p>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
            {skipped && (
              <span className="rounded bg-stone-200 px-1.5 py-0.5 font-medium uppercase tracking-wide text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                Skipped
              </span>
            )}
            {activity.duration_min != null && <span>{formatDuration(activity.duration_min)}</span>}
            {activity.cost_jpy != null && <span>¥{activity.cost_jpy.toLocaleString()}</span>}
            {activity.is_booked && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Booked{activity.booking_ref ? ` · ${activity.booking_ref}` : ''}
              </span>
            )}
          </p>

          {/* Kept when skipped, desaturated rather than removed. If you are
              reconsidering somewhere you dropped, the picture is the fastest
              way to remember what it was. */}
          <Photo
            file={activity.photo_file}
            alt={activity.place_name ?? activity.title}
            credit={activity.photo_credit}
            generic={activity.photo_is_generic}
            className={`mt-2.5 aspect-[16/9] ${skipped ? 'opacity-70 grayscale' : ''}`}
          />

          {activity.description && (
            <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {activity.description}
            </p>
          )}

          {/* Transport alternatives */}
          {options.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {options.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    disabled={!canWrite || pending}
                    onClick={() => choose(o.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition disabled:cursor-default ${
                      o.is_selected
                        ? 'border-stone-900 bg-stone-900 text-stone-50 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                        : 'border-stone-200 bg-stone-50 hover:border-stone-400 disabled:hover:border-stone-200 dark:border-stone-700 dark:bg-stone-800'
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{o.label}</span>
                      <span className="shrink-0 tabular-nums">
                        {formatDuration(o.duration_min)}
                        {o.cost_jpy != null && ` · ¥${o.cost_jpy.toLocaleString()}`}
                      </span>
                    </span>
                    {o.notes && (
                      <span
                        className={`mt-0.5 block leading-snug ${
                          o.is_selected ? 'text-stone-300 dark:text-stone-600' : 'text-stone-500'
                        }`}
                      >
                        {o.notes}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Maps — deep links first, embed only on request */}
          {hasLocation(activity) && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {directions && (
                <a
                  href={directions}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-stone-300 px-3 py-1.5 font-medium dark:border-stone-700"
                >
                  Directions from here
                </a>
              )}
              {search && (
                <a
                  href={search}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-stone-300 px-3 py-1.5 dark:border-stone-700"
                >
                  Open in Maps
                </a>
              )}
              {mapsKey && (
                <button
                  type="button"
                  onClick={() => setShowMap((v) => !v)}
                  className="rounded-full border border-stone-300 px-3 py-1.5 text-stone-500 dark:border-stone-700"
                >
                  {showMap ? 'Hide map' : 'Show map here'}
                </button>
              )}
            </div>
          )}

          {/* Unmounted when closed, so it stops costing data. */}
          {embedUrl && (
            <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
              <iframe
                src={embedUrl}
                title={`Map of ${activity.place_name ?? activity.title}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-56 w-full border-0"
              />
              <p className="bg-stone-100 px-3 py-1.5 text-[11px] text-stone-500 dark:bg-stone-800">
                Uses roaming data. Close it when you are done.
              </p>
            </div>
          )}

          {canWrite && (
            <div className="mt-3 flex gap-2 text-xs">
              {skipped ? (
                // One unambiguous way back. A toggle labelled "Skipped" states
                // the status but not that tapping it undoes anything, which is
                // why skipping felt permanent.
                <StatusButton active={false} disabled={pending} onClick={() => update('PLANNED')}>
                  ↩ Put it back
                </StatusButton>
              ) : (
                <>
                  <StatusButton
                    active={done}
                    disabled={pending}
                    onClick={() => update(done ? 'PLANNED' : 'DONE')}
                  >
                    {done ? '✓ Done' : 'Mark done'}
                  </StatusButton>
                  <StatusButton active={false} disabled={pending} onClick={() => update('SKIPPED')}>
                    Skip
                  </StatusButton>
                </>
              )}
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </li>
  )
}

function StatusButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 font-medium transition disabled:opacity-50 ${
        active
          ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
          : 'border border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-400'
      }`}
    >
      {children}
    </button>
  )
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}
