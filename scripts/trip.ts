/**
 * Read the trip out of the database, and apply a reviewed change back.
 *
 * This is the workflow when you ask Claude Code to replan: it reads the export,
 * proposes changes in prose, and only then writes a patch file.
 *
 *   npm run trip:export -- --prod              # whole trip as JSON
 *   npm run trip:export -- --prod --notes      # just notes and statuses
 *   npm run trip:apply  -- --prod patch.json   # PREVIEW, writes nothing
 *   npm run trip:apply  -- --prod patch.json --write
 *
 * --prod reads .env.production.local. Without it you are on the local stack,
 * which is the safe default: a replan aimed at the wrong database is not
 * something you notice until the day it matters.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'node:fs'
import { exportTrip, applyPatch, type TripPatch } from '../src/lib/trip-state'
import type { Database } from '../src/lib/database.types'

const args = process.argv.slice(2)
const prod = args.includes('--prod')
const write = args.includes('--write')
const notesOnly = args.includes('--notes')
const files = args.filter((a) => !a.startsWith('--'))

// quiet: dotenv prints a tip to stdout, which would corrupt piped JSON.
config({ path: prod ? '.env.production.local' : '.env.local', quiet: true })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error(
    prod
      ? 'Missing .env.production.local — copy .env.production.local.example and fill it in.'
      : 'Missing .env.local. Run `npx supabase start` first, or pass --prod.'
  )
  process.exit(1)
}

const db = createClient<Database>(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const target = new URL(url).host

async function doExport() {
  const state = await exportTrip(db)

  if (notesOnly) {
    // The replanning signal, without the noise: what was written, and what
    // actually happened versus what was planned.
    const touched = state.days.map((d) => ({
      date: d.date,
      title: d.title,
      activities: d.activities
        .filter((a) => a.status !== 'PLANNED')
        .map((a) => ({ title: a.title, status: a.status, time: a.start_time })),
    }))
    console.log(
      JSON.stringify(
        { exportedAt: state.exportedAt, notes: state.notes, doneOrSkipped: touched },
        null,
        2
      )
    )
    return
  }

  console.log(JSON.stringify(state, null, 2))
}

async function doApply(file: string) {
  const patch = JSON.parse(readFileSync(file, 'utf8')) as TripPatch

  const result = await applyPatch(db, patch, { dryRun: !write })

  console.error(`\n${write ? 'APPLIED to' : 'PREVIEW against'} ${target}`)
  if (patch.reason) console.error(`Reason: ${patch.reason}`)

  console.error(`\n${result.changes.length} change(s):`)
  for (const c of result.changes) console.error(`  ${c.kind.padEnd(9)} ${c.target} — ${c.detail}`)

  if (result.blocked.length) {
    console.error(`\n${result.blocked.length} REFUSED:`)
    for (const b of result.blocked) console.error(`  ${b.kind.padEnd(9)} ${b.target} — ${b.detail}`)
  }

  if (!write) {
    console.error('\nNothing was written. Re-run with --write to apply.')
  }
}

async function main() {
  const mode = files[0] && files[0].endsWith('.json') ? 'apply' : (files[0] ?? 'export')

  if (mode === 'export') {
    console.error(`# exporting from ${target}`)
    await doExport()
  } else {
    await doApply(files[0])
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
