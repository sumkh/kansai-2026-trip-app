/**
 * Regenerates the generated half of docs/KANSAI-2026-MASTER-PLAN.md.
 *
 * Sections 5 (Day by Day), 9 (Site Index) and 10 (Restaurant Index) are derived
 * from scripts/itinerary.ts and scripts/indexes.ts — the same data the app
 * serves. They were hand-maintained once and drifted badly; this exists so the
 * document cannot silently disagree with what Brian is holding on the trip.
 *
 * Everything else in the plan is prose and is left alone. The script rewrites
 * only the text between a section heading and the next `## ` heading.
 *
 *   npm run plan:sync            preview to stdout
 *   npm run plan:sync -- --write rewrite the document in place
 *
 * Timezone note: the trip is JST and the dev machine is SGT. Weekday names are
 * formatted with an explicit Asia/Tokyo formatter — parsing a JST midnight and
 * reading getUTCDay() lands on the previous day, which is exactly the trap
 * CLAUDE.md warns about, and it silently renamed every day of the trip once.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { DAYS, type SeedActivity, type SeedDay } from './itinerary'
import { SITES, RESTAURANTS, type SeedSite, type SeedRestaurant } from './indexes'

const PLAN = 'docs/KANSAI-2026-MASTER-PLAN.md'

// ── shared helpers ────────────────────────────────────────────────────────

/** Escapes the one character that would split a markdown table cell. */
const cell = (v?: string) => (v ? v.replace(/\|/g, '\\|') : '—')

const link = (s: { url?: string; searchKey?: string }) =>
  s.url ? `[link](${s.url})` : s.searchKey ? `search \`${s.searchKey}\`` : '—'

function mark(name: string, o: { isHighlight?: boolean; isAvoid?: boolean; isOptional?: boolean }) {
  let n = name
  if (o.isHighlight) n = `**${n}**`
  if (o.isAvoid) n = `~~${n}~~`
  if (o.isOptional) n += ' *(optional)*'
  return n
}

/** "Sat 19 Sept". Midday JST so no timezone can move it off the day. */
function tokyoDate(iso: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).formatToParts(new Date(`${iso}T12:00:00+09:00`))
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('weekday')} ${get('day')} ${get('month')}`
}

// ── section 5 · day by day ────────────────────────────────────────────────

function activityLine(a: SeedActivity) {
  const meta = [
    a.start_time,
    a.duration_min ? `${a.duration_min} min` : null,
    a.cost_jpy ? `¥${a.cost_jpy.toLocaleString('en-GB')}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const booked = a.is_booked ? ` ✅${a.booking_ref ? ` *${a.booking_ref}*` : ''}` : ''
  const out = [`- ${meta ? `**${meta}** — ` : ''}${a.title}${booked}`]

  if (a.description) out.push(`  - ${a.description}`)
  for (const t of a.transport_options ?? []) {
    const bits = [
      t.duration_min ? `${t.duration_min} min` : null,
      t.cost_jpy ? `¥${t.cost_jpy.toLocaleString('en-GB')}` : null,
    ].filter(Boolean)
    const label = t.is_selected ? `**${t.label}**` : t.label
    out.push(`  - ${label}${bits.length ? ` — ${bits.join(', ')}` : ''}${t.notes ? `. ${t.notes}` : ''}`)
  }
  return out.join('\n')
}

function dayBlock(d: SeedDay) {
  const lines = [`### Day ${d.day_number} · ${tokyoDate(d.date)} — ${d.title}`, '']
  if (d.summary) lines.push(d.summary, '')
  for (const a of [...d.activities].sort((x, y) => x.order - y.order)) {
    lines.push(activityLine(a))
  }
  return lines.join('\n')
}

function sectionFive() {
  const out = [
    '## 5. Day by Day',
    '',
    '> **Generated from the app** by `npm run plan:sync`. If this section and the',
    '> app ever disagree, the app is right — it is what you will be holding.',
    '> Times are Asia/Tokyo. ✅ marks something already booked.',
    '',
  ]
  for (const d of DAYS) {
    out.push(dayBlock(d), '')
  }
  return out.join('\n').trimEnd() + '\n'
}

// ── sections 9 and 10 · the indexes ───────────────────────────────────────

function sectionNine() {
  const out = [
    "## 9. Site Index — Everything You're Visiting",
    '',
    '> **Generated from the app.** Every URL here is one that was verified. Where a',
    '> cell says *search*, there is no confirmed link and the exact Japanese name is',
    '> given instead — a guessed URL that dead-ends in Japan is worse than none.',
    '> **The Japanese name is the better search key**: paste it into Google Maps.',
    '',
  ]

  const cities: Array<[SeedSite['city'], string]> = [
    ['Osaka', 'Osaka · 19–21 Sep'],
    ['Arima', 'Arima Onsen · 21–23 Sep'],
    ['Kyoto', 'Kyoto · 23–26 Sep'],
    ['Nara', 'Nara · Fri 25 Sep'],
    ['Transport', 'Transport & booking references'],
  ]

  for (const [city, heading] of cities) {
    const rows = SITES.filter((s) => s.city === city)
    if (!rows.length) continue
    out.push(`### ${heading}`, '')
    out.push('| Site | Japanese | Day | Link | Note |', '|---|---|---|---|---|')
    for (const s of rows) {
      out.push(
        `| ${mark(s.name, s)} | ${cell(s.nameJa)} | ${cell(s.dayHint)} | ${link(s)} | ${cell(s.note)} |`
      )
    }
    out.push('')
  }
  return out.join('\n').trimEnd() + '\n'
}

function sectionTen() {
  const out = [
    '## 10. Restaurant Index',
    '',
    '> **Generated from the app.** Most of these are small independent places with',
    '> no English website. **Tabelog (食べログ) is the definitive directory** — search',
    '> the Japanese name there or in Google Maps for hours, holiday closures and',
    '> reservations. 21, 22 and 23 September are national holidays, so **verify',
    '> opening hours before relying on any of them**. 📞 = book ahead.',
    '',
  ]

  const cities: Array<[SeedRestaurant['city'], string]> = [
    ['Arima', "⚠️ Arima — book or plan these, don't wing it"],
    ['Osaka', 'Osaka'],
    ['Kyoto', 'Kyoto'],
    ['Nara', 'Nara'],
    ['Seasonal', '🍂 Order these if you see them'],
  ]

  for (const [city, heading] of cities) {
    const rows = RESTAURANTS.filter((r) => r.city === city)
    if (!rows.length) continue
    out.push(`### ${heading}`, '')
    out.push('| Place | Japanese | For | Hours | Note |', '|---|---|---|---|---|')
    for (const r of rows) {
      const name = mark(r.name, r) + (r.needsBooking ? ' 📞' : '')
      const note = [r.note, r.url].filter(Boolean).join(' · ')
      out.push(
        `| ${name} | ${cell(r.nameJa)} | ${cell(r.cuisine)} | ${cell(r.hours)} | ${cell(note)} |`
      )
    }
    out.push('')
  }
  return out.join('\n').trimEnd() + '\n'
}

// ── splice ────────────────────────────────────────────────────────────────

/**
 * Replaces one `## ` section, from its heading to the next `## ` heading.
 * Throws rather than guessing: a section that has been renamed should stop the
 * run, not quietly leave stale text in a document nobody re-reads.
 */
function spliceSection(doc: string, headingPrefix: string, body: string) {
  const start = doc.indexOf(`\n${headingPrefix}`)
  if (start === -1) throw new Error(`Section not found: ${headingPrefix}`)
  const after = doc.indexOf('\n## ', start + 1)
  if (after === -1) throw new Error(`No section follows: ${headingPrefix}`)

  // Keep whatever separator the prose used between sections.
  const tail = doc.slice(start + 1, after)
  const sep = tail.trimEnd().endsWith('---') ? '\n---\n\n' : '\n'
  return doc.slice(0, start + 1) + body + sep + doc.slice(after + 1)
}

const write = process.argv.includes('--write')
const raw = readFileSync(PLAN, 'utf8')

// The document is CRLF on this machine. Splice in LF throughout and restore the
// document's own ending at the end — otherwise every line of three sections
// shows as changed and the diff is useless for reviewing an actual edit.
const crlf = raw.includes('\r\n')
const before = raw.replace(/\r\n/g, '\n')

let doc = before
doc = spliceSection(doc, '## 5. Day by Day', sectionFive())
doc = spliceSection(doc, '## 9. Site Index', sectionNine())
doc = spliceSection(doc, '## 10. Restaurant Index', sectionTen())

if (!write) {
  console.log(`${PLAN} would ${doc === before ? 'NOT change' : 'change'}.`)
  console.log(`  ${DAYS.length} days, ${SITES.length} sites, ${RESTAURANTS.length} restaurants`)
  console.log('  Re-run with --write to apply.')
  process.exit(0)
}

writeFileSync(PLAN, crlf ? doc.replace(/\n/g, '\r\n') : doc)
console.log(`Rewrote sections 5, 9 and 10 of ${PLAN}.`)
