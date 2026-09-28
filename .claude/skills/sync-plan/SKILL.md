---
name: sync-plan
description: Report drift between docs/KANSAI-2026-MASTER-PLAN.md and what is actually in the database. Use after editing either one, and before departure.
---

# Sync plan

The markdown is the human source of truth. The database is the machine source of
truth. `scripts/itinerary.ts` sits between them and is what `npm run db:seed`
actually writes.

## What to compare

1. Read `docs/KANSAI-2026-MASTER-PLAN.md`.
2. Read `scripts/itinerary.ts`.
3. Read the live `days`, `activities`, `transport_options` and `checklist_items`.

Report drift in three directions, separately:

- **Plan → seed file.** Something in the markdown that never made it into
  `itinerary.ts`. Usually a missed activity or a checklist item.
- **Seed file → database.** The seed file has been edited but not re-run, or the
  database was edited live and the seed file would overwrite it.
- **Database only.** Changes made during the trip via the app or a replan that
  exist nowhere in the documents. These are the interesting ones.

## Output

A table per direction. Empty tables are a fine result — say "no drift" rather
than inventing findings.

Flag separately anything that touches a **booked** item, a **due date**, or a
**deadline** — those are the discrepancies that cost money.

**Do not fix anything.** Report only. The user decides which direction wins, and
a wrong guess here silently overwrites live trip data.
