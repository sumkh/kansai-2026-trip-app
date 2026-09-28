/**
 * Rebuilds the itinerary in Postgres from scripts/itinerary.ts.
 *
 * Uses the service-role key, which bypasses RLS. Nothing else in this codebase
 * may do that. Run with: npm run db:seed
 *
 * SAFETY: reseeding deletes the trip row, and days/activities cascade from it —
 * which would take notes and photos with them. The script refuses to run if any
 * exist. Pass --force only if you genuinely mean to discard them.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { TRIP, DAYS, CHECKLIST } from "./itinerary";
import { SITES, RESTAURANTS } from "./indexes";
import { slugify, type PhotoRecord } from "./photo-types";
import { LEGS } from "./legs";
import photoManifest from "./photo-manifest.json";

const PHOTOS = new Map(
  (photoManifest as PhotoRecord[]).map((p) => [p.slug, p]),
);

/**
 * Which photo, if any, illustrates an itinerary activity.
 *
 * Three rules, learned by getting them wrong first:
 *
 *  1. The photo must depict THAT activity. An earlier version mapped by
 *     proximity — Dotonbori showed Hozenji Yokocho, Kyoto Station showed
 *     Nishiki Market, an Arima dinner showed the public foot baths. Every
 *     entry below is a picture of its own subject or it is absent.
 *  2. Transport and admin rows get nothing. A card about a 5-minute train is
 *     not improved by a photo of the shrine, and the shrine's own activity is
 *     directly beneath it.
 *  3. No photo repeats within a day. Taiko no Yu appearing at 10:00 and again
 *     at 13:00 reads as a bug even when both rows are genuinely there.
 */
const ACTIVITY_PHOTO: Record<string, string> = {
  // Osaka
  "kuromon ichiba market": "kuromon-ichiba-stalls",
  dotonbori: "dotonbori",
  "hozenji yokocho": "hozenji-yokocho",
  "taima-dera": "taima-dera",
  "shitenno-ji": "shitenno-ji",
  "shitennō-ji": "shitenno-ji",
  "isshin-ji": "isshin-ji",
  // The activity is kushikatsu on the shopping street, so show kushikatsu.
  "tsutenkaku hondori shopping street": "daruma",
  "hankyu sanbangai depachika, umeda": "hankyu-umeda-depachika",

  // Arima
  "arima onsen old town": "ashiyu-foot-baths-old-streets",
  "arima toys and automata museum": "arima-toys-and-automata-museum",
  "tenjin hot spring source": "tenjin-hot-spring-source",
  "gosho hot spring source": "gosho-hot-spring-source",
  "gokuraku hot spring source": "gokuraku-hot-spring-source",
  "onsen-ji": "onsen-ji",
  "nenbutsu-ji": "nenbutsu-ji",
  "gin no yu": "gin-no-yu",
  "kin no yu": "kin-no-yu",
  "arima taiko no yu": "taiko-no-yu",

  // Kyoto
  "nishiki market": "nishiki-market",
  "teramachi shopping arcade": "teramachi-shinkyogoku-arcades",
  "takase river": "takase-river",
  "fushimi inari taisha": "fushimi-inari-taisha",
  sannenzaka: "sannenzaka-ninenzaka",
  "kiyomizu-dera": "kiyomizu-dera",
  ninenzaka: "ninenzaka",
  "kodai-ji": "kodai-ji",
  "kōdai-ji": "kodai-ji",
  gion: "kennin-ji",
  "chion-in": "chion-in",
  "kyoto ramen koji": "honke-daiichi-asahi",
  kyoto: "sanma",

  // Nara
  "nara park": "nara-park-the-deer",
  "todai-ji": "todai-ji-great-buddha-hall",
  "tōdai-ji": "todai-ji-great-buddha-hall",
  "kasuga taisha": "kasuga-taisha-lantern-approach",
  nakatanidou: "nakatanidou",
};


/** Straight-line distance in metres. Honest about what it is: the real route is
 *  longer, which is why the card labels it "direct" and links to live
 *  directions for the actual path. */
function metresBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Under this, an unlisted hop is assumed to be a walk. */
const WALKABLE_M = 1200;

/**
 * How you reach an activity from the one before it.
 *
 * Returns null when there is nothing useful to say: same spot, no coordinates,
 * or the activity IS the journey — a TRANSPORT row already describes the trip,
 * and a leg beneath it would only repeat itself.
 *
 * An unlisted hop too far to walk also returns null. Guessing a subway line is
 * worse than staying quiet; the live directions link still works.
 */
function arrivalLeg(
  prev:
    | { type: string; place_name?: string; lat?: number; lng?: number }
    | undefined,
  cur: { type: string; place_name?: string; lat?: number; lng?: number },
) {
  if (!prev || prev.lat == null || prev.lng == null) return null;
  if (cur.lat == null || cur.lng == null) return null;
  if (cur.type === "TRANSPORT") return null;

  const distance = metresBetween(
    { lat: prev.lat, lng: prev.lng },
    { lat: cur.lat, lng: cur.lng },
  );
  if (distance < 50) return null; // same place

  const listed = LEGS[`${prev.place_name}|${cur.place_name}`];
  if (!listed && distance > WALKABLE_M) return null;

  // ~4.5 km/h, plus 25% because streets are not straight lines.
  const walkMin = Math.max(2, Math.round((distance / 4500) * 60 * 1.25));

  return {
    arrive_mode: listed?.mode ?? "walk",
    arrive_detail: listed?.detail ?? null,
    arrive_distance_m: distance,
    arrive_duration_min: listed?.durationMin ?? walkMin,
    arrive_from_name: prev.place_name ?? null,
    arrive_from_lat: prev.lat,
    arrive_from_lng: prev.lng,
  };
}

/** Rule 2: a photo has to be about somewhere you are, not somewhere you are
 *  travelling towards or a task you are performing. */
const ILLUSTRATED_TYPES = new Set(["SIGHT", "FOOD", "ONSEN", "SHOPPING"]);

function activityPhoto(
  type: string,
  placeName: string | undefined,
  usedToday: Set<string>,
) {
  if (!ILLUSTRATED_TYPES.has(type) || !placeName) return null;

  const slug = ACTIVITY_PHOTO[placeName.toLowerCase().trim()];
  if (!slug || usedToday.has(slug)) return null;

  const photo = PHOTOS.get(slug);
  if (!photo) return null;

  usedToday.add(slug);
  return photo;
}

config({ path: ".env.local", quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const force = process.argv.includes("--force");
const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function die(step: string, error: { message: string } | null): never | void {
  if (!error) return;
  console.error(`✗ ${step}: ${error.message}`);
  process.exit(1);
}

async function main() {
  console.log(`Seeding "${TRIP.name}" → ${new URL(url!).host}\n`);

  // ── Guard: never silently destroy trip content ─────────────────────────
  const [{ count: noteCount }, { count: photoCount }] = await Promise.all([
    db.from("notes").select("*", { count: "exact", head: true }),
    db.from("photos").select("*", { count: "exact", head: true }),
  ]);

  if ((noteCount || photoCount) && !force) {
    console.error(
      `✗ Refusing to reseed: ${noteCount ?? 0} note(s) and ${photoCount ?? 0} photo(s) exist.\n` +
        "  Days cascade-delete, so these would be lost.\n" +
        "  Re-run with --force if you really mean to discard them.",
    );
    process.exit(1);
  }
  if (force && (noteCount || photoCount)) {
    console.warn(
      `⚠ --force: discarding ${noteCount ?? 0} note(s) and ${photoCount ?? 0} photo(s).\n`,
    );
  }

  // ── Wipe and rebuild. Everything cascades from trips. ──────────────────
  die(
    "delete trip",
    (await db.from("trips").delete().eq("name", TRIP.name)).error,
  );

  const { data: trip, error: tripErr } = await db
    .from("trips")
    .insert(TRIP)
    .select("id")
    .single();
  die("insert trip", tripErr);
  console.log(`  trip           ${trip!.id}`);

  // ── Days ───────────────────────────────────────────────────────────────
  const { data: days, error: daysErr } = await db
    .from("days")
    .insert(
      DAYS.map((d) => ({
        trip_id: trip!.id,
        date: d.date,
        day_number: d.day_number,
        title: d.title,
        summary: d.summary,
        base_city: d.base_city,
      })),
    )
    .select("id, date");
  die("insert days", daysErr);

  const dayIdByDate = new Map(
    days!.map((d) => [d.date as string, d.id as string]),
  );
  console.log(`  days           ${days!.length}`);

  // ── Activities ─────────────────────────────────────────────────────────
  //
  // The "where were you last" pointer deliberately crosses midnight. The first
  // activity of a day is reached from wherever the previous day ended — which
  // is the hotel — and that is exactly the leg someone needs at 08:00. Days
  // that start where they left off produce no leg, so nothing spurious appears.
  let lastLocated:
    | { type: string; place_name?: string; lat?: number; lng?: number }
    | undefined;

  const activityRows = DAYS.flatMap((day) => {
    // Reset per day: the same place on two different days is fine.
    const usedToday = new Set<string>();
    return day.activities.map((a) => {
      const photo = activityPhoto(a.type, a.place_name, usedToday);
      const leg = arrivalLeg(lastLocated, a);
      if (a.lat != null && a.lng != null) lastLocated = a;
      return {
        // Nulls for every leg column, so an activity that loses its leg on a
        // reseed is actually cleared rather than keeping a stale one.
        arrive_mode: null,
        arrive_detail: null,
        arrive_distance_m: null,
        arrive_duration_min: null,
        arrive_from_name: null,
        arrive_from_lat: null,
        arrive_from_lng: null,
        ...leg,
        day_id: dayIdByDate.get(day.date)!,
        order: a.order,
        start_time: a.start_time ?? null,
        duration_min: a.duration_min ?? null,
        title: a.title,
        description: a.description ?? null,
        type: a.type,
        place_name: a.place_name ?? null,
        address: a.address ?? null,
        lat: a.lat ?? null,
        lng: a.lng ?? null,
        is_booked: a.is_booked ?? false,
        booking_ref: a.booking_ref ?? null,
        cost_jpy: a.cost_jpy ?? null,
        photo_file: photo?.file ?? null,
        photo_credit: photo?.credit ?? null,
        photo_is_generic: photo?.generic ?? false,
      };
    });
  });

  const { data: activities, error: actErr } = await db
    .from("activities")
    .insert(activityRows)
    .select("id, day_id, order");
  die("insert activities", actErr);

  // Key by day+order, which is unique, to attach transport options.
  const activityIdByKey = new Map(
    activities!.map((a) => [`${a.day_id}:${a.order}`, a.id as string]),
  );
  console.log(`  activities     ${activities!.length}`);

  // A leg keyed on a place name that no longer appears is silent dead config —
  // it looks configured but never renders.
  const usedLegKeys = new Set<string>();
  let prevLocated: { place_name?: string } | undefined;
  for (const day of DAYS) {
    for (const a of day.activities) {
      if (prevLocated) usedLegKeys.add(`${prevLocated.place_name}|${a.place_name}`);
      if (a.lat != null && a.lng != null) prevLocated = a;
    }
  }
  const orphanLegs = Object.keys(LEGS).filter((k) => !usedLegKeys.has(k));
  if (orphanLegs.length) {
    console.warn(`  ⚠ ${orphanLegs.length} leg(s) match no pair in the itinerary:`);
    for (const k of orphanLegs) console.warn(`      ${k}`);
  }

  // ── Transport options ──────────────────────────────────────────────────
  const optionRows = DAYS.flatMap((day) =>
    day.activities.flatMap((a) =>
      (a.transport_options ?? []).map((o) => ({
        activity_id: activityIdByKey.get(
          `${dayIdByDate.get(day.date)}:${a.order}`,
        )!,
        label: o.label,
        mode: o.mode,
        duration_min: o.duration_min,
        cost_jpy: o.cost_jpy ?? null,
        from_place: o.from_place ?? null,
        to_place: o.to_place ?? null,
        notes: o.notes ?? null,
        is_selected: o.is_selected ?? false,
      })),
    ),
  );

  if (optionRows.length) {
    die(
      "insert transport_options",
      (await db.from("transport_options").insert(optionRows)).error,
    );
  }
  console.log(`  transport      ${optionRows.length} options`);

  // ── Checklist ──────────────────────────────────────────────────────────
  const { data: checklist, error: clErr } = await db
    .from("checklist_items")
    .insert(
      CHECKLIST.map((c) => ({
        trip_id: trip!.id,
        title: c.title,
        detail: c.detail ?? null,
        category: c.category,
        due_date: c.due_date ?? null,
        is_blocking: c.is_blocking ?? false,
      })),
    )
    .select("id");
  die("insert checklist_items", clErr);
  console.log(`  checklist      ${checklist!.length} items`);

  // ── Site Index ─────────────────────────────────────────────────────────
  const { data: sites, error: siteErr } = await db
    .from("sites")
    .insert(
      SITES.map((s, i) => ({
        trip_id: trip!.id,
        name: s.name,
        name_ja: s.nameJa ?? null,
        city: s.city,
        kind: s.kind,
        day_hint: s.dayHint ?? null,
        url: s.url ?? null,
        search_key: s.searchKey ?? null,
        note: s.note ?? null,
        is_optional: s.isOptional ?? false,
        is_highlight: s.isHighlight ?? false,
        is_avoid: s.isAvoid ?? false,
        sort: i,
        photo_file: PHOTOS.get(slugify(s.name))?.file ?? null,
        photo_credit: PHOTOS.get(slugify(s.name))?.credit ?? null,
        photo_license: PHOTOS.get(slugify(s.name))?.license ?? null,
        photo_source: PHOTOS.get(slugify(s.name))?.source ?? null,
      })),
    )
    .select("id");
  die("insert sites", siteErr);
  console.log(`  sites          ${sites!.length}`);

  // ── Restaurant Index ───────────────────────────────────────────────────
  const { data: restaurants, error: restErr } = await db
    .from("restaurants")
    .insert(
      RESTAURANTS.map((r, i) => ({
        trip_id: trip!.id,
        name: r.name,
        name_ja: r.nameJa ?? null,
        city: r.city,
        kind: r.kind ?? "PLACE",
        cuisine: r.cuisine ?? null,
        hours: r.hours ?? null,
        note: r.note ?? null,
        url: r.url ?? null,
        search_key: r.searchKey ?? null,
        needs_booking: r.needsBooking ?? false,
        is_avoid: r.isAvoid ?? false,
        is_highlight: r.isHighlight ?? false,
        sort: i,
        photo_file: PHOTOS.get(slugify(r.name))?.file ?? null,
        photo_credit: PHOTOS.get(slugify(r.name))?.credit ?? null,
        photo_license: PHOTOS.get(slugify(r.name))?.license ?? null,
        photo_is_generic: PHOTOS.get(slugify(r.name))?.generic ?? false,
        photo_source: PHOTOS.get(slugify(r.name))?.source ?? null,
      })),
    )
    .select("id");
  die("insert restaurants", restErr);
  console.log(`  restaurants    ${restaurants!.length}`);

  console.log("\n✓ Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
