/**
 * Fetches one representative photo for every site and restaurant.
 *
 * Source is the LEAD IMAGE of the Japanese Wikipedia article, keyed on the
 * Japanese name we already hold. That matters: a Commons keyword search for
 * "Kuromon Ichiba" returns a photo of a completely different market in
 * Kadoma. The ja-wiki article for 黒門市場 is unambiguously the right place.
 *
 * Images are re-encoded small and committed to public/photos/, on purpose:
 *   - same origin, so the service worker caches them like any other asset
 *   - fetched once on wifi during the offline download, then free forever
 *   - no runtime dependency on Wikimedia while standing in Fushimi Inari
 *
 * Run: npm run photos
 */

import { writeFile, mkdir, readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { SITES, RESTAURANTS } from './indexes'
import { slugify, type PhotoRecord } from './photo-types'
import existingManifest from './photo-manifest.json'

const UA = 'kansai-2026-trip-app/1.0 (private itinerary app; contact https://github.com/sumkh/kansai-2026-trip-app)'
const OUT = join(process.cwd(), 'public', 'photos')
const MANIFEST = join(process.cwd(), 'scripts', 'photo-manifest.json')

/** 900px covers a full-bleed card on a 3x phone screen without softness.
 *  Sized for a 10 GB roaming plan: WebP at q76 lands around 80 KB, so the set
 *  is roughly 6 MB — irrelevant against the plan, and downloaded once. */
const WIDTH = 900
const QUALITY = 76

/** Small restaurants have no article of their own. A photo of the dish is
 *  still useful — it tells you what you are ordering — but it must be
 *  labelled as representative rather than passed off as that shop. */
const DISH_FALLBACK: Record<string, string> = {
  Takoyaki: 'たこ焼き',
  Okonomiyaki: 'お好み焼き',
  Kushikatsu: '串カツ',
  'Butaman pork buns': '豚まん',
  'Jiggly cheesecake': 'チーズケーキ',
  Seafood: '海鮮丼',
  Soba: '蕎麦',
  'Soba, tempura': '蕎麦',
  Izakaya: '居酒屋',
  Bakery: 'パン',
  Bento: '駅弁',
  Obanzai: 'おばんざい',
  'Kyoto ramen': 'ラーメン',
  Mochi: '餅',
  'Simmered tofu': '湯豆腐',
  Tamagoyaki: '卵焼き',
  Local: '明石焼き',
  'Dinner alley': '横丁',
  'Complex restaurants': '温泉',
}

/**
 * Explicit article titles for entries whose name is not one.
 *
 * "Kin no Yu & Gin no Yu" and "Sannenzaka & Ninenzaka" are two things joined by
 * an ampersand — no encyclopaedia has an article under that heading. Rather
 * than let a fuzzy search pick something plausible and wrong, name the article.
 */
const ARTICLE_OVERRIDE: Record<string, { title: string; host?: string }> = {
  'umeda-sky-building-floating-garden': { title: '梅田スカイビル' },
  'osaka-castle-nishinomaru-garden': { title: '大阪城' },
  'shinsekai-tsutenkaku': { title: '通天閣' },
  'den-den-town-ota-road': { title: '日本橋 (大阪市)' },
  'ashiyu-foot-baths-old-streets': { title: '足湯' },
  'teramachi-shinkyogoku-arcades': { title: '新京極通' },
  'pontocho-the-kamogawa': { title: '先斗町' },
  'sannenzaka-ninenzaka': { title: '産寧坂' },
  'yasaka-shrine-maruyama-park': { title: '八坂神社' },
  'daikaku-ji-kangetsu-no-yube': { title: '大覚寺' },
  'naramachi-old-quarter': { title: 'ならまち' },
  'saba-zushi': { title: '鯖寿司' },
  'warabimochi-yatsuhashi': { title: '八ツ橋' },
  sanma: { title: 'サンマ' },
}

/**
 * A specific Commons file, pinned by hand.
 *
 * The highest-priority source, and the escape hatch for when an article's lead
 * image is technically correct but useless — 有馬温泉's lead image is a hillside
 * view of the whole town, which tells you nothing about the bathhouse you are
 * standing outside. Reviewed by eye; that is the point of pinning.
 */
const FILE_OVERRIDE: Record<string, string> = {
  // All four replaced 5 Aug after Brian flagged them. Landscape only: the
  // cards crop to 16:9, so a portrait original loses its subject entirely — the
  // first Nara pick was a lovely deer whose head fell outside the crop.
  //
  // Was a distant hillside of Arima. Now the bathhouse itself.
  'kin-no-yu': 'File:Kin-no-yu Arima Onsen 2013.jpg',
  // Was the office-like exterior. Now the spa complex proper.
  'taiko-no-yu': 'File:161112 Taikou-no-yu spa Arima Onsen Kobe Japan01s3.jpg',
  // Was a memorial stone to the merchant who dug the canal, not the canal.
  // Now the water itself at dusk, with Kiyamachi alongside — which is when and
  // where you actually walk it.
  'takase-river': 'File:夕方の高瀬川と木屋町 - panoramio.jpg',
  // Was Sarusawa Pond with no deer at all, on "Nara Park and the deer".
  'nara-park-the-deer': 'File:005 Autumn in Nara Park, Japan - Nara deer CC-BY Creative Commons Attribution.jpg',

  // Arima's small stops, added 5 Aug. Pinned rather than searched because
  // "Nenbutsu-ji" also names two famous KYOTO temples — Adashino and Otagi —
  // and a keyword search happily returns those instead.
  'onsen-ji': 'File:Onsenji Kobe01s3200.jpg',
  'nenbutsu-ji': 'File:161112 Nenbutsu-ji Arima Onsen Kobe Japan01s3.jpg',
  'gosho-hot-spring-source': 'File:Gosho-sengen.jpg',
  // Portrait, and the only image of it on Commons. A cropped springhead still
  // beats no picture of the thing you are standing in front of.
  'tenjin-hot-spring-source': 'File:Arima Onsen Tenjin Sengen.JPG',
}

async function pinnedFile(fileTitle: string): Promise<Found | null> {
  const data = (await api('commons.wikimedia.org', {
    action: 'query',
    titles: fileTitle,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: String(WIDTH),
  })) as { query?: { pages?: Record<string, Record<string, unknown>> } }

  for (const page of Object.values(data.query?.pages ?? {})) {
    const info = (page.imageinfo as { thumburl?: string; descriptionurl?: string }[])?.[0]
    if (!info?.thumburl) continue
    return {
      thumb: info.thumburl,
      fileTitle,
      pageUrl: info.descriptionurl ?? 'https://commons.wikimedia.org',
    }
  }
  return null
}

/**
 * Last resort: a Commons search, for subjects whose article exists but carries
 * no lead image.
 *
 * Used sparingly and only with a term specific enough that the first hit cannot
 * be somewhere else — the Kadoma "Kuromon Ichiba" result is the cautionary
 * case. Dishes are safe; place names generally are not.
 */
const COMMONS_FALLBACK: Record<string, string> = {
  'naramachi-old-quarter': 'Naramachi Nara historic district',
  'saba-zushi': 'Saba sushi mackerel',
  sanma: 'Grilled Pacific saury sanma',
}

type Found = { thumb: string; fileTitle: string; pageUrl: string }

async function commonsSearch(term: string): Promise<Found | null> {
  const data = (await api('commons.wikimedia.org', {
    action: 'query',
    generator: 'search',
    gsrsearch: term,
    gsrnamespace: '6',
    gsrlimit: '1',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: String(WIDTH * 2),
  })) as { query?: { pages?: Record<string, Record<string, unknown>> } }

  const pages = data.query?.pages ?? {}
  for (const page of Object.values(pages)) {
    const info = (page.imageinfo as { thumburl?: string; descriptionurl?: string }[])?.[0]
    if (!info?.thumburl) continue
    return {
      thumb: info.thumburl,
      fileTitle: String(page.title),
      pageUrl: info.descriptionurl ?? 'https://commons.wikimedia.org',
    }
  }
  return null
}

async function api(host: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = `https://${host}/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${host} ${res.status}`)
  return res.json() as Promise<Record<string, unknown>>
}

/** The article's lead image, which is the editorially chosen representative
 *  photo — far better than picking the first search hit. */
async function leadImage(host: string, title: string): Promise<Found | null> {
  const data = (await api(host, {
    action: 'query',
    prop: 'pageimages',
    piprop: 'thumbnail|original|name',
    pithumbsize: String(WIDTH * 2),
    titles: title,
    redirects: '1',
  })) as { query?: { pages?: Record<string, Record<string, unknown>> } }

  const pages = data.query?.pages ?? {}
  for (const [pageId, page] of Object.entries(pages)) {
    if (pageId === '-1') continue
    const thumb = page.thumbnail as { source?: string } | undefined
    if (!thumb?.source) continue
    return {
      thumb: thumb.source,
      fileTitle: `File:${String(page.pageimage ?? '')}`,
      pageUrl: `https://${host}/wiki/${encodeURIComponent(String(page.title))}`,
    }
  }
  return null
}

/** Attribution is a licence condition, not a nicety. */
async function credits(fileTitle: string): Promise<{ credit: string; license: string }> {
  try {
    const data = (await api('commons.wikimedia.org', {
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'extmetadata',
      titles: fileTitle,
    })) as { query?: { pages?: Record<string, Record<string, unknown>> } }

    const pages = data.query?.pages ?? {}
    for (const page of Object.values(pages)) {
      const info = (page.imageinfo as { extmetadata?: Record<string, { value?: string }> }[])?.[0]
      const meta = info?.extmetadata
      if (!meta) continue
      const artist = stripHtml(meta.Artist?.value ?? '')
      const license = stripHtml(meta.LicenseShortName?.value ?? '')
      return { credit: artist || 'Wikimedia Commons', license: license || 'see source' }
    }
  } catch {
    // Attribution lookup failing should not lose the photo; fall through.
  }
  return { credit: 'Wikimedia Commons', license: 'see source' }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

async function download(url: string, slug: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`download ${res.status}`)
  const input = Buffer.from(await res.arrayBuffer())

  // The cards crop to 16:9 with object-cover, so a portrait original has its
  // subject sliced out of the frame. Warn rather than fail — some entries have
  // no landscape option and a bad crop still beats no picture — but say so, so
  // it can be pinned to something better.
  const meta = await sharp(input).metadata()
  if (meta.width && meta.height && meta.width / meta.height < 1.25) {
    console.warn(
      `      ⚠ ${slug}: portrait source (${meta.width}×${meta.height}) — will crop badly at 16:9`
    )
  }

  const output = await sharp(input)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer()

  const file = `${slug}.webp`
  await writeFile(join(OUT, file), output)
  return file
}

type Target = { slug: string; name: string; ja?: string; fallbackJa?: string }

async function resolve(t: Target): Promise<PhotoRecord | null> {
  // A hand-picked file wins over everything else.
  const pinned = FILE_OVERRIDE[t.slug]
  if (pinned) {
    try {
      const found = await pinnedFile(pinned)
      if (found) {
        const file = await download(found.thumb, t.slug)
        const { credit, license } = await credits(found.fileTitle)
        return { slug: t.slug, file, credit, license, source: found.pageUrl, generic: false }
      }
    } catch {
      // Fall through to the usual sources rather than losing the photo.
    }
  }

  // Japanese article first — it is the most specific and most likely to exist.
  const attempts: { title: string; host: string; generic: boolean }[] = []
  const override = ARTICLE_OVERRIDE[t.slug]
  if (override) {
    attempts.push({ title: override.title, host: override.host ?? 'ja.wikipedia.org', generic: false })
  }
  if (t.ja) attempts.push({ title: t.ja, host: 'ja.wikipedia.org', generic: false })
  attempts.push({ title: t.name, host: 'en.wikipedia.org', generic: false })
  if (t.fallbackJa) attempts.push({ title: t.fallbackJa, host: 'ja.wikipedia.org', generic: true })

  for (const a of attempts) {
    try {
      const found = await leadImage(a.host, a.title)
      if (!found) continue
      const file = await download(found.thumb, t.slug)
      const { credit, license } = await credits(found.fileTitle)
      return {
        slug: t.slug,
        file,
        credit,
        license,
        source: found.pageUrl,
        generic: a.generic,
      }
    } catch {
      // Try the next source rather than failing the whole run.
    }
  }

  const term = COMMONS_FALLBACK[t.slug]
  if (term) {
    try {
      const found = await commonsSearch(term)
      if (found) {
        const file = await download(found.thumb, t.slug)
        const { credit, license } = await credits(found.fileTitle)
        return { slug: t.slug, file, credit, license, source: found.pageUrl, generic: false }
      }
    } catch {
      // Fall through to "no photo", which the UI handles.
    }
  }

  return null
}

async function main() {
  await mkdir(OUT, { recursive: true })

  const targets: Target[] = [
    ...SITES
      // REFERENCE rows are links, not places. Gyms have no encyclopaedia
      // article and a stock gym interior would be a lie, so neither is worth
      // asking Wikimedia about on every run.
      .filter((s) => s.kind !== 'REFERENCE' && s.kind !== 'GYM')
      .map((s) => ({
        slug: slugify(s.name),
        name: s.name,
        ja: s.nameJa,
      })),
    ...RESTAURANTS.filter((r) => !r.isAvoid).map((r) => ({
      slug: slugify(r.name),
      name: r.name,
      ja: r.nameJa,
      fallbackJa: r.cuisine ? DISH_FALLBACK[r.cuisine] : undefined,
    })),
  ]

  // Anything already downloaded is kept as-is.
  //
  // This used to refetch everything and then delete whatever it had not just
  // written — so one flaky Wikimedia response destroyed a perfectly good photo.
  // A run lost 20 images that way. Now the network is only touched for entries
  // that have none, and `--refresh` is the explicit way to redo the lot.
  const refresh = process.argv.includes('--refresh')
  const existing = new Map<string, PhotoRecord>(
    refresh ? [] : (existingManifest as PhotoRecord[]).map((r) => [r.slug, r])
  )

  const wanted = new Set(targets.map((t) => t.slug))
  const onDisk = new Set(await readdir(OUT))

  console.log(
    `${targets.length} entries · ${existing.size} already have a photo · ` +
      `fetching ${targets.filter((t) => !existing.has(t.slug)).length}\n`
  )

  const manifest: PhotoRecord[] = []
  let exact = 0
  let generic = 0
  let reused = 0

  for (const t of targets) {
    const cached = existing.get(t.slug)
    if (cached && onDisk.has(cached.file)) {
      manifest.push(cached)
      if (cached.generic) generic++
      else exact++
      reused++
      continue
    }

    const rec = await resolve(t)
    if (rec) {
      manifest.push(rec)
      if (rec.generic) generic++
      else exact++
      console.log(`  ✓ ${t.name.padEnd(46).slice(0, 46)} ${rec.generic ? '~' : ' '} ${rec.file}`)
    } else {
      console.log(`  · ${t.name.padEnd(46).slice(0, 46)}   no photo`)
    }
    // Be a good citizen with a shared free API.
    await new Promise((r) => setTimeout(r, 120))
  }

  if (reused) console.log(`  (${reused} kept from the previous run)`)

  // Delete only images whose entry is gone from the itinerary — keyed on the
  // TARGET list, never on "what this run happened to download". That
  // distinction is the whole fix: a failed fetch must not be able to remove a
  // photo that is still wanted.
  const keep = new Set([...wanted].map((slug) => `${slug}.webp`))
  keep.add('index.json')
  for (const f of await readdir(OUT)) {
    if (!keep.has(f)) {
      console.log(`  ✕ ${f} — no longer in the itinerary`)
      await unlink(join(OUT, f))
    }
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')

  // The service worker warms these during the offline download. It cannot read
  // the database, so the list travels alongside the images themselves.
  await writeFile(
    join(OUT, 'index.json'),
    JSON.stringify(manifest.map((m) => m.file)) + '\n'
  )

  const bytes = (
    await Promise.all(
      manifest.map(async (m) =>
        (await import('node:fs/promises')).stat(join(OUT, m.file)).then((s) => s.size)
      )
    )
  ).reduce((a, b) => a + b, 0)

  console.log(
    `\n✓ ${manifest.length}/${targets.length} photos ` +
      `(${exact} of the place itself, ${generic} representative) · ` +
      `${(bytes / 1024 / 1024).toFixed(2)} MB total`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
