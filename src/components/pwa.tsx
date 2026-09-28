'use client'

import { useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react'

/**
 * Registers the service worker, shows connection state, and saves the trip for
 * offline use.
 *
 * The download used to be a button, because on a per-megabyte roaming plan the
 * app could not tell wifi from cellular and guessing wrong was expensive. On a
 * 10 GB plan that reasoning no longer holds: the whole trip is ~7 MB, under
 * 0.1% of the allowance, and a traveller who never notices the button ends up
 * in a tunnel outside Arima with nothing cached. So it now runs itself, once
 * per device, and the button remains for refreshing it.
 */

const WARMED_KEY = 'kansai:offline-warmed'

/** Online/offline is external browser state, so it is read rather than mirrored. */
function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true // assume online while server-rendering
  )
}

/**
 * Android exposes an explicit "reduce data usage" preference. iOS does not, so
 * this cannot be relied on — but where someone HAS asked for less data, doing
 * an unprompted 7 MB download anyway would be rude.
 */
function saveDataRequested(): boolean {
  const c = (navigator as { connection?: { saveData?: boolean } }).connection
  return c?.saveData === true
}

export function Pwa({ dayPaths }: { dayPaths: string[] }) {
  const online = useOnline()
  const [ready, setReady] = useState(false)
  const [warming, setWarming] = useState(false)
  const [warmedAt, setWarmedAt] = useState<string | null>(null)
  const [auto, setAuto] = useState(false)
  const started = useRef(false)

  const download = useCallback(
    (automatic = false) => {
      const sw = navigator.serviceWorker?.controller
      if (!sw || started.current) return
      started.current = true
      setWarming(true)
      setAuto(automatic)
      sw.postMessage({
        type: 'warm',
        urls: ['/', '/checklist', '/itinerary', '/sites', '/restaurants', '/guide', ...dayPaths],
      })
    },
    [dayPaths]
  )

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let cancelled = false

    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        if (cancelled) return
        setReady(true)
        const seen = localStorage.getItem(WARMED_KEY)
        setWarmedAt(seen)

        // First run on this device: save everything without being asked.
        if (!seen && navigator.onLine && !saveDataRequested()) {
          download(true)
        }
      })
      .catch(() => {})

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'warmed') {
        const now = new Date().toISOString()
        localStorage.setItem(WARMED_KEY, now)
        setWarmedAt(now)
        setWarming(false)
        started.current = false
      }
    }
    navigator.serviceWorker.addEventListener('message', onMessage)

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('message', onMessage)
    }
  }, [download])

  return (
    <>
      {!online && (
        <div className="sticky top-0 z-20 bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-amber-950">
          Offline — showing the last saved copy
        </div>
      )}

      {ready && (
        <div className="mx-auto w-full max-w-2xl px-5 pt-4">
          <button
            type="button"
            onClick={() => download(false)}
            disabled={warming || !online}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs text-stone-600 disabled:opacity-60 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400"
          >
            {warming
              ? auto
                ? 'Saving the trip for offline use…'
                : 'Downloading the trip…'
              : warmedAt
                ? `Saved for offline · ${new Date(warmedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })} · tap to refresh`
                : 'Save the whole trip for offline use'}
          </button>
          {warming && auto && (
            <p className="mt-1 text-center text-[11px] leading-relaxed text-stone-500">
              About 7 MB, once, so the itinerary works with no signal.
            </p>
          )}
        </div>
      )}
    </>
  )
}

/** Clears cached pages so a signed-out device holds nothing readable. */
export async function clearOfflineCaches() {
  if (!('serviceWorker' in navigator)) return
  localStorage.removeItem(WARMED_KEY)
  const reg = await navigator.serviceWorker.getRegistration()
  reg?.active?.postMessage('clear-caches')
}
