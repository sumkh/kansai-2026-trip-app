import { legDirectionsUrl } from '@/lib/maps'
import type { Activity } from '@/lib/data'

/**
 * The hop between two stops: how, how far, how long, and a directions link
 * that routes from the PREVIOUS stop rather than from wherever you happen to
 * be standing.
 *
 * Rendered as a connector between cards rather than inside one, because that
 * is what it describes — the gap, not either end.
 */

const MODE_ICON: Record<string, string> = {
  walk: '🚶',
  subway: '🚇',
  train: '🚉',
  bus: '🚌',
  taxi: '🚕',
  mixed: '🔀',
}

const MODE_LABEL: Record<string, string> = {
  walk: 'Walk',
  subway: 'Subway',
  train: 'Train',
  bus: 'Bus',
  taxi: 'Taxi',
  mixed: 'Train + walk',
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

export function Leg({ activity }: { activity: Activity }) {
  if (!activity.arrive_mode || activity.arrive_from_lat == null) return null

  const mode = activity.arrive_mode
  const href = legDirectionsUrl(
    {
      lat: activity.arrive_from_lat,
      lng: activity.arrive_from_lng!,
      name: activity.arrive_from_name,
    },
    activity,
    mode
  )

  return (
    <li className="flex gap-3 px-1" aria-label="How to get there">
      {/* Aligns with the time gutter on the cards above and below. */}
      <div className="flex w-12 shrink-0 justify-center">
        <span className="h-full w-px bg-stone-300 dark:bg-stone-700" aria-hidden />
      </div>

      <div className="min-w-0 flex-1 text-xs text-stone-500">
        <p className="flex flex-wrap items-center gap-x-2">
          <span aria-hidden>{MODE_ICON[mode] ?? '→'}</span>
          <span className="font-medium text-stone-600 dark:text-stone-400">
            {MODE_LABEL[mode] ?? mode}
          </span>
          {activity.arrive_duration_min != null && (
            <span>{activity.arrive_duration_min} min</span>
          )}
          {activity.arrive_distance_m != null && (
            // Labelled "direct" because it is straight-line: the walked route
            // is longer, and the directions link is the authority.
            <span>{formatDistance(activity.arrive_distance_m)} direct</span>
          )}
        </p>

        {activity.arrive_detail && (
          <p className="mt-0.5 leading-relaxed">{activity.arrive_detail}</p>
        )}

        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block underline underline-offset-4"
          >
            Directions from {activity.arrive_from_name ?? 'the last stop'} ↗
          </a>
        )}
      </div>
    </li>
  )
}
