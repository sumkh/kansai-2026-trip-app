/**
 * Shared between the fetcher and the seed.
 *
 * These live apart from fetch-photos.ts on purpose: that module runs on import,
 * so seed.ts importing it for a slug function meant every `npm run db:seed`
 * silently re-downloaded 69 images from Wikimedia.
 */

export type PhotoRecord = {
  slug: string
  file: string
  credit: string
  license: string
  source: string
  /** True when the photo shows the dish or category, not that exact shop. */
  generic: boolean
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}
