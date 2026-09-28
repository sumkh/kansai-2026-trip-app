/**
 * A reference photo.
 *
 * Plain <img>, not next/image, on purpose. These files are already sized for
 * the display (900px wide WebP, ~80 KB) and committed to
 * public/photos/. Running them back through the optimiser would burn CPU on
 * Render and, worse, serve them from /_next/image — a different URL the
 * service worker's /photos/ rule would not catch, so they would miss the
 * offline cache entirely.
 *
 * Always lazy: a day view has up to eleven of these, and only the first two
 * are on screen.
 */
export function Photo({
  file,
  alt,
  credit,
  generic = false,
  className = '',
}: {
  file: string | null
  alt: string
  credit?: string | null
  generic?: boolean
  className?: string
}) {
  if (!file) return null

  return (
    <figure className={`relative overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element --
          Intentional: these are pre-sized static WebP. next/image would serve
          them from /_next/image, which the service worker's /photos/ rule does
          not match, so they would never reach the offline cache. */}
      <img
        src={`/photos/${file}`}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={900}
        height={506}
        className="h-full w-full object-cover"
      />
      {(credit || generic) && (
        <figcaption className="absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-2 bg-gradient-to-t from-black/65 to-transparent px-2 pb-1 pt-4 text-[10px] leading-tight text-white/85">
          {/* Attribution is a licence condition of the Wikimedia images, not
              decoration — it has to render even when it is inconvenient. */}
          <span className="truncate">{credit}</span>
          {generic && <span className="shrink-0 italic">representative</span>}
        </figcaption>
      )}
    </figure>
  )
}
