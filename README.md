# Kansai 2026 — a private trip itinerary app

A small Next.js + Supabase app built for one trip: eight days in Osaka, Arima
Onsen and Kyoto, 19–26 September 2026. Four users, two roles, built to work on
roaming data from a phone.

**Status: the trip is over and the app is retired.** There is no live
deployment; this repository is kept as a reference.

## What is interesting here

- **Row Level Security as the only permission layer.** Travellers read and
  write, viewers read only, strangers get nothing — enforced in Postgres
  (`supabase/migrations/`), not in application code. `scripts/verify-rls.ts`
  signs in as each role and asserts what it can and cannot do.
- **Designed for metered data.** The day view renders with zero network calls
  once cached (`public/sw.js`); maps are deep links, never auto-loaded embeds.
- **Replanning by patch.** `npm run trip:apply` previews an itinerary change
  and writes only with `--write`, refusing booked items unless forced.
- **Built with Claude Code.** `CLAUDE.md`, `.claude/skills/` and `docs/` show
  how the project was specified and operated, including from a phone mid-trip.

## Running it

```bash
cp .env.example .env.local   # fill in a Supabase project's URL and keys
supabase start && supabase db reset
npm install
npm run db:seed
npm run dev
```

The allow-list emails in `supabase/migrations/` are placeholders
(`@example.com`); replace them with your own before creating real accounts.

## Privacy note

Personal details — emails, booking references, amounts paid and the names of
other people — have been replaced with placeholders. Hotel and restaurant
names, addresses and dates are public information and are left as planned.

Photos in `public/photos/` are from Wikipedia / Wikimedia Commons under CC0,
CC BY, CC BY-SA or public domain; the author, licence and source for each are
in `scripts/photo-manifest.json`.
