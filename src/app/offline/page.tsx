/** Shown only when a page was requested that has never been cached.
 *  Deliberately static: it must render with no network and no session. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-4xl" aria-hidden>
        ⛩
      </p>
      <h1 className="text-xl font-semibold">No connection</h1>
      <p className="max-w-xs text-sm leading-relaxed text-stone-500">
        This page has not been saved to the device yet. Days you have already
        opened, and anything downloaded for offline use, still work.
      </p>
      <p className="max-w-xs text-xs leading-relaxed text-stone-500">
        On hotel wifi, open the home screen and tap{' '}
        <span className="font-medium">Download the whole trip for offline use</span>.
      </p>
    </main>
  )
}
