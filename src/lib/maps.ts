/**
 * Maps handling is a data-budget decision, not a UI one.
 *
 * An auto-loading embed iframe is ~0.5–1 MB every time a day view opens. Ten
 * opens a day is most of a roaming allowance gone. So: deep links by default,
 * handing off to the native Google Maps app, which costs almost nothing once
 * offline areas are downloaded. The embed is opt-in, behind a tap.
 */

type Place = {
  place_name?: string | null
  address?: string | null
  lat?: number | null
  lng?: number | null
  google_place_id?: string | null
}

export function hasLocation(p: Place): boolean {
  return Boolean(p.google_place_id || (p.lat != null && p.lng != null) || p.place_name)
}

/** Opens the native app at the place. */
export function mapsSearchUrl(p: Place): string | null {
  const params = new URLSearchParams({ api: '1' })

  if (p.lat != null && p.lng != null) {
    params.set('query', `${p.lat},${p.lng}`)
    if (p.google_place_id) params.set('query_place_id', p.google_place_id)
  } else if (p.place_name) {
    params.set('query', [p.place_name, p.address].filter(Boolean).join(', '))
  } else {
    return null
  }

  return `https://www.google.com/maps/search/?${params}`
}

/** Transit directions to the place, from wherever the phone currently is. */
export function mapsDirectionsUrl(p: Place, from?: Place | null): string | null {
  const dest =
    p.lat != null && p.lng != null
      ? `${p.lat},${p.lng}`
      : p.place_name
        ? [p.place_name, p.address].filter(Boolean).join(', ')
        : null
  if (!dest) return null

  const params = new URLSearchParams({
    api: '1',
    destination: dest,
    travelmode: 'transit',
  })
  if (p.google_place_id) params.set('destination_place_id', p.google_place_id)

  if (from) {
    const origin =
      from.lat != null && from.lng != null
        ? `${from.lat},${from.lng}`
        : (from.place_name ?? null)
    if (origin) params.set('origin', origin)
  }

  return `https://www.google.com/maps/dir/?${params}`
}

/**
 * Directions for one leg of the day: from the previous stop to this one.
 *
 * Distinct from mapsDirectionsUrl above, which routes from wherever the phone
 * is standing. That is the right answer when you have wandered off; it is the
 * wrong one when you are sitting in Nishiki Market wondering how to reach the
 * gym, which is the question the itinerary is actually answering.
 */
export function legDirectionsUrl(
  from: { lat: number; lng: number; name?: string | null },
  to: Place,
  mode: string | null
): string | null {
  const dest =
    to.lat != null && to.lng != null
      ? `${to.lat},${to.lng}`
      : (to.place_name ?? null)
  if (!dest) return null

  const params = new URLSearchParams({
    api: '1',
    origin: `${from.lat},${from.lng}`,
    destination: dest,
    // Walking legs routed as transit get sent to a bus stop for a 400 m hop.
    travelmode: mode === 'walk' ? 'walking' : 'transit',
  })
  if (to.google_place_id) params.set('destination_place_id', to.google_place_id)

  return `https://www.google.com/maps/dir/?${params}`
}

/** The iframe src. Only ever rendered after an explicit tap. */
export function mapsEmbedUrl(p: Place, apiKey: string): string | null {
  if (!apiKey) return null

  if (p.google_place_id) {
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${p.google_place_id}`
  }
  if (p.lat != null && p.lng != null) {
    return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${p.lat},${p.lng}&zoom=16`
  }
  if (p.place_name) {
    const q = encodeURIComponent([p.place_name, p.address].filter(Boolean).join(', '))
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${q}`
  }
  return null
}
