# Kansai Trip App — Claude Code Build Guide
### Next.js on Render + Supabase + GitHub · Google-only auth
### 4 fixed users: 2 travellers (read/write) · 2 viewers (read-only)
### Target: deployed and seeded by 31 August 2026, seven weeks before departure

> **v2 — switched to Supabase.** Your four-user requirement is what settled it. See Section 2.1 for the reasoning, including one recommendation from v1 that I've reversed.

---

## 1. The Key Insight

This isn't "put the markdown plan on a website." **It's "turn the plan into a database."**

Everything you asked for falls out of that one decision:

| You want | It becomes |
|---|---|
| Follow the itinerary by day | `Day` → `Activity` rows, ordered |
| Reminders to prepare | `ChecklistItem` rows with `dueDate` |
| Click travel options, plan updates | `TransportOption.isSelected` toggled |
| Places we've visited | `Activity.status` |
| Our remarks | `Note` rows |
| Photos | `Photo` rows |
| End-of-day blog | Generated from a `Day` plus its activities, notes and photos |
| **Claude Code reads it from your phone** | **It queries Postgres — because it's structured data, not prose** |

The last row is the one that matters. Claude Code can't meaningfully "update a markdown file" from your phone mid-trip. It *can* run a query, see that you skipped Kinkaku-ji and left a note saying your feet hurt, and rewrite tomorrow's activities accordingly.

**So: Phase 1 is converting the master plan into seed data. Do that before you write a single component.**

---

## 2. Architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15+, App Router, TypeScript** | Full-stack in one repo. Deploys cleanly on Render |
| Styling | **Tailwind CSS** | Fast, and Claude Code writes it well |
| Database | **Supabase Postgres** | Managed, with RLS — see 2.1 |
| Auth | **Supabase Auth, Google provider** | Built in. No separate auth library |
| Storage | **Supabase Storage** | Replaces Cloudflare R2 entirely |
| Data access | **Supabase JS client + generated TypeScript types** | ⚠️ Not Prisma — see 2.2 |
| Migrations | **Supabase CLI** (`supabase/migrations/*.sql`) | Version-controlled SQL in the repo |
| Maps | **Google Maps Embed API + deep links** | Embed for in-app maps, `maps.google.com` URLs to hand off to the native app |
| Blog generation | **Anthropic API server-side** | Server route reads a day's data, drafts a post |
| Hosting | **Render Web Service**, auto-deploy from GitHub `main` | You already have the account |

### 2.1 Why Supabase is now the right call

You introduced four users with two permission levels. That single requirement flips the decision.

**With Auth.js + a plain allowlist, roles live in application code.** Every Server Action needs its own `if (user.role !== 'traveller') throw` check. Miss one — or have Claude Code write a new action next month and forget one — and a viewer can write. Nothing catches it.

**With Supabase Row Level Security, the database itself refuses the write.** You declare the policy once in SQL, and it holds no matter which code path reaches the table, including any route Claude Code writes later without being reminded. For a 2-write / 2-read split, that's exactly the right tool.

It also genuinely reduces moving parts:

| | Before | After |
|---|---|---|
| Services | GitHub · Render web · Render Postgres · Google Cloud · Cloudflare R2 | GitHub · Render web · **Supabase** · Google Cloud |
| Auth code | Auth.js config, adapters, session callbacks | Built in |
| File storage | S3 SDK, presigned URLs, separate bucket policy | Same client, same RLS model |

### 2.2 The reversal: drop Prisma

In v1 I called Prisma non-negotiable. **With Supabase and RLS, it's the wrong choice**, and I'd rather flag that than quietly leave it in.

The reason is mechanical. RLS works by reading `auth.uid()` from the user's JWT. The Supabase JS client passes that JWT on every query, so policies apply. **Prisma connects as a single fixed database user and passes no JWT**, so RLS never engages — which throws away the entire security argument for switching.

My v1 reasoning for Prisma was that `schema.prisma` gives Claude Code a readable description of your data. That reasoning still holds, it just transfers: Claude Code reads `supabase/migrations/*.sql` and the generated `database.types.ts` instead. Equally good documentation, and the SQL is more explicit about the policies.

So: **Supabase client for everything user-facing, service-role key for seeding and admin scripts only.**

### 2.4 Metered data changes the design

You'll be on **roaming, not WiFi**. That makes bytes a first-class design constraint, and it changes three things that were previously optional.

Rough per-person daily numbers:

| | Naive build | Data-aware build |
|---|---|---|
| App shell | reloads each visit | cached by service worker, ~0 |
| Day view data | ~30 KB per load | ~30 KB once, then cached |
| Map embeds | ~0.5-1 MB **every time a day view opens** | 0 unless you tap "Show map" |
| Photo upload | ~25-30 MB/day auto-uploading | 0 on roaming, queued for hotel WiFi |
| **Daily total** | **50-80 MB** | **under 5 MB** |

A 10-15x difference, from three specific choices:

1. **Offline-first is now mandatory, not optional.** Promoted to Phase 3.5 below. Roaming drops in tunnels, on the Shinkansen and in the mountains around Arima, and every failed request costs data in retries. The day view must render with zero network calls.
2. **Photo upload becomes a queue with a manual sync button.** Never auto-upload. Note that iOS Safari doesn't expose `navigator.connection`, so you cannot reliably detect WiFi in-app. It has to be a button you press.
3. **Maps default to deep links, not embeds.** Handing off to the native Google Maps app costs almost nothing if you pre-download offline areas before flying.

> **Do this before you fly. It's worth more than any app feature:** open Google Maps on both phones and download offline areas for **Osaka, Kyoto, Kobe/Arima and Nara**. Navigation, search and directions then work on almost no data.

**One caution on the plan side:** Goshobo is an 800-year-old wooden building. Don't assume its WiFi is good. Plan to flush the photo upload queue at the Dormy Inns in Osaka and Kyoto, not in Arima.

### 2.3 The one thing that's harder

Supabase Auth with the Next.js App Router needs the `@supabase/ssr` package plus middleware to refresh tokens across Server Components. It's well documented but fiddlier than Auth.js, and it's the most likely place you'll lose an afternoon. Have Claude Code follow the official Supabase Next.js SSR guide rather than improvising it.

## 3. Prerequisites

Accounts and keys to have ready before you start:

- [ ] **GitHub** — create an empty private repo, `kansai-2026`
- [ ] **Render** — you have this. Web service only now
- [ ] **Supabase** — free account, one project. Note the project ref, anon key and service-role key
- [ ] **Supabase CLI** — `npm i -g supabase`
- [ ] **Google Cloud Console** — OAuth credentials *and* a Maps API key (billing must be enabled even for the free tier)
- [ ] **The four Google email addresses**, and which two are travellers
- [ ] **Anthropic API key** — for blog generation
- [ ] **Claude Code** — requires a Claude Pro or Max subscription, or an API key
- [ ] **Node.js** on your machine

---

## 4. Phase 0 — Claude Code Setup

```bash
mkdir kansai-2026 && cd kansai-2026
git init
claude
```

Inside the session, in this order:

| Command | What it does |
|---|---|
| `/init` | Generates a starter `CLAUDE.md` — the persistent project briefing |
| `/memory` | Opens it for refinement. Replace with the content in Section 5 |
| `/permissions` | Set your approval rules so it isn't asking on every file write |
| `/mcp` | Set up the Postgres MCP server (Section 10) once the DB exists |

A few commands worth knowing for this project:

- **`/plan`** — switches to plan mode before a large change. Use it before every phase below
- **`/context`** — shows what's filling the context window
- **`/compact`** — summarises the conversation to free space when it gets long
- **`/diff`** then **`/code-review`** — before every push
- **`/background`** — detaches the session to keep running as a background agent, which frees your terminal

**Note on custom commands:** these have been merged into skills. Files in `.claude/commands/` still work, but `.claude/skills/` is now the recommended approach. Section 11 uses skills.

---

## 5. Your CLAUDE.md

This file is read at the start of every session. It's the single highest-leverage thing in the whole project — it's what lets you type a short prompt from your phone and get the right result. Paste this in via `/memory` and keep it current.

```markdown
# Kansai 2026 Trip App

A private itinerary app for a 2-person trip to Japan, 19–26 September 2026.
Only two people ever use it. Optimise for clarity and speed of change,
not for scale, multi-tenancy, or generality.

## Users
Exactly four, all Google sign-in, all pre-registered in the allowed_users table.
- 2 TRAVELLERS — full read/write
- 2 VIEWERS — read-only, following along from home
There is no signup, no invite flow, no admin panel. Nobody else ever gets in.

Permissions are enforced by Postgres Row Level Security, NOT in application code.
When adding any table, you MUST also add its RLS policies in the same migration.
A table without RLS enabled is a bug.

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- Supabase: Postgres + Auth (Google) + Storage
- @supabase/ssr for App Router session handling
- Supabase JS client for all user-facing queries — it passes the JWT so RLS applies
- Service-role key ONLY in seed scripts and admin routes, never in a Server Component
- NO Prisma. Migrations are SQL in supabase/migrations/
- Types are generated: `npm run db:types`
- Google Maps Embed API + maps.google.com deep links
- Anthropic API for blog draft generation

## The trip (fixed, do not change without being asked)
- Flights: Peach MM774 SIN→KIX 19 Sep; MM773 KIX→SIN 26 Sep. Booked.
- Osaka: Dormy Inn Premium Namba, 19–21 Sep, 2 single rooms
- Arima: Tocen Goshobo, 21–23 Sep, 1 room. BOOKED, booking 1000000000000002
- Kyoto: Dormy Inn Premium Kyoto Ekimae, 23–26 Sep, 2 single rooms
- Silver Week national holidays: 19–23 Sep
- Harvest moon: Fri 25 Sep

## Data model
See supabase/migrations/*.sql and database.types.ts — those are the source of truth.
Key semantics:
- Activity.status: planned | done | skipped
- TransportOption.isSelected: exactly one true per Activity. Changing the
  selection must update the parent Activity's time and duration.
- Note.body is free text written by the travellers during the trip. It is
  the primary signal for replanning. Read notes before changing an itinerary.
- ChecklistItem.dueDate drives the pre-trip reminder view.

## Commands
- `npm run dev` — local dev
- `supabase start` / `supabase stop` — local Supabase stack
- `supabase migration new <name>` — create a migration
- `supabase db reset` — rebuild local DB from migrations + seed
- `npm run db:types` — regenerate database.types.ts
- `npm run db:seed` — reseed the itinerary (uses service-role key)
- `npm run typecheck` / `npm run lint`

## Conventions
- Server Components by default. Client Components only where there's interaction.
- All mutations go through Server Actions, never client-side fetch to /api.
- Dates are stored UTC, displayed in Asia/Tokyo. Never display raw UTC.
- Money is JPY integer minor units where possible; the trip budget is in SGD.
- Never commit .env. Never log a full database URL or the service-role key.
- Every new table gets `enable row level security` plus read and write policies
  in the same migration. No exceptions.

## When asked to replan
1. Read the Notes and Activity.status for the days already elapsed.
2. Propose changes as a summary FIRST. Do not write to the database
   until the user confirms.
3. Preserve booked, non-refundable items. Hotels and flights are fixed.
```

---

## 6. The Data Model

Same shape as before, expressed as SQL migrations instead of a Prisma schema. The tables are unchanged — what's new is **Section 6.2, the access control layer**, which is the whole reason for the switch.

### 6.1 Core tables

`supabase/migrations/0001_schema.sql`:

```sql
create type user_role      as enum ('traveller','viewer');
create type activity_type  as enum ('TRANSPORT','ONSEN','FOOD','SIGHT','SHOPPING','LODGING','ADMIN');
create type activity_status as enum ('PLANNED','DONE','SKIPPED');

-- Who is allowed in, and at what level. Pre-seeded with exactly 4 rows.
create table allowed_users (
  email text primary key,
  role  user_role not null,
  display_name text
);

-- Linked to Supabase's auth.users on first sign-in.
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  display_name text,
  role         user_role not null,
  created_at   timestamptz default now()
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date   date not null
);

create table days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  date date not null unique,
  day_number int not null,
  title text not null,
  summary text,
  base_city text not null
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references days(id) on delete cascade,
  "order" int not null,
  start_time text,
  duration_min int,
  title text not null,
  description text,
  type activity_type not null,
  status activity_status not null default 'PLANNED',
  place_name text,
  address text,
  lat double precision,
  lng double precision,
  google_place_id text,
  is_booked boolean not null default false,
  booking_ref text,
  cost_jpy int
);

create table transport_options (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  label text not null,
  mode text not null,
  duration_min int not null,
  cost_jpy int,
  from_place text,
  to_place text,
  notes text,
  is_selected boolean not null default false
);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  title text not null,
  detail text,
  category text not null,
  due_date date,
  is_blocking boolean not null default false,
  done_at timestamptz,
  done_by uuid references profiles(id)
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  day_id uuid references days(id) on delete cascade,
  activity_id uuid references activities(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  day_id uuid not null references days(id) on delete cascade,
  activity_id uuid references activities(id) on delete set null,
  storage_path text not null,
  thumb_path text,                       -- ~400px, what the gallery loads
  pending_local_id text,                 -- set while queued on device, cleared on upload
  caption text,
  taken_at timestamptz,
  created_at timestamptz default now()
);

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null unique references days(id) on delete cascade,
  title text not null,
  body_markdown text not null,
  is_published boolean not null default false,
  generated_at timestamptz default now()
);
```

### 6.2 Access control — the part that matters

`supabase/migrations/0002_rls.sql`:

```sql
-- On first Google sign-in, create a profile ONLY if the email is on the list.
-- Anyone else ends up with no profile, and therefore sees nothing at all.
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare r user_role;
begin
  select role into r from allowed_users where email = new.email;
  if r is not null then
    insert into profiles (id, email, display_name, role)
    values (new.id, new.email, new.raw_user_meta_data->>'name', r);
  end if;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Helpers
create or replace function is_member() returns boolean
language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;

create or replace function is_traveller() returns boolean
language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'traveller');
$$;

-- Apply to every table: members read, travellers write.
do $$
declare t text;
begin
  foreach t in array array[
    'trips','days','activities','transport_options',
    'checklist_items','notes','photos','blog_posts'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "members read" on %I for select using (is_member())', t);
    execute format(
      'create policy "travellers write" on %I for all
       using (is_traveller()) with check (is_traveller())', t);
  end loop;
end $$;

-- Profiles: everyone in the group can see who's who; nobody can self-promote.
alter table profiles enable row level security;
create policy "members read profiles" on profiles for select using (is_member());

-- Storage
insert into storage.buckets (id, name, public) values ('trip-photos','trip-photos',false);

create policy "members read photos" on storage.objects
  for select using (bucket_id = 'trip-photos' and is_member());
create policy "travellers upload photos" on storage.objects
  for insert with check (bucket_id = 'trip-photos' and is_traveller());
create policy "travellers delete photos" on storage.objects
  for delete using (bucket_id = 'trip-photos' and is_traveller());
```

Then seed the four users:

```sql
insert into allowed_users (email, role, display_name) values
  ('you@gmail.com',        'traveller', 'Brian'),
  ('companion@gmail.com',  'traveller', 'Companion'),
  ('viewer1@gmail.com',    'viewer',    'Viewer One'),
  ('viewer2@gmail.com',    'viewer',    'Viewer Two');
```

**Defence in depth.** Three independent layers have to fail before a stranger gets in:
1. Google's OAuth consent screen is in Testing mode with those four emails as the only test users — Google refuses everyone else at the door
2. No matching `allowed_users` row means the trigger creates no profile
3. No profile means `is_member()` is false, and RLS returns zero rows from every table

### 6.3 Optional refinement

If you'd rather your viewers not see half-formed plans or booking references, tighten two policies:

```sql
-- Viewers only see days that have already started
create policy "viewers read elapsed days" on days
  for select using (
    is_traveller() or (is_member() and date <= current_date)
  );

-- Viewers only see published blog posts
create policy "viewers read published" on blog_posts
  for select using (is_traveller() or (is_member() and is_published));
```

Worth it if the viewers are family who'd enjoy the reveal. Skip it if they're helping you plan.

## 7. Build Order

Seven phases. Run `/plan` before each, review the plan, then let it work. Commit after each phase.

### Phase 1 — Scaffold and seed ⭐ do this first

> **Prompt:**
> "Scaffold a Next.js 15 App Router project with TypeScript and Tailwind. Run `supabase init` and create the two migrations I'm about to paste. Then read `docs/KANSAI-2026-MASTER-PLAN.md` and write `scripts/seed.ts` that populates the entire 8-day itinerary as `days` and `activities` rows, every transport leg as an activity with its `transport_options` alternatives, and the whole action list as `checklist_items` with correct due dates. The seed script uses the service-role key; nothing else does. Show me the seed file for review before running it."

Drop the master plan markdown into `docs/` in the repo first. **Review the seed output carefully** — this is where errors get baked in.

### Phase 2 — Auth

> **Prompt:**
> "Set up Supabase Auth with Google as the only provider, following the official Supabase Next.js App Router SSR guide — use `@supabase/ssr` and add the session-refresh middleware. Protect every route except sign-in. If a signed-in user has no `profiles` row, show a clean 'not invited' page and sign them out. Add a `useRole()` helper and hide write controls from viewers — but rely on RLS as the actual enforcement, never the UI."

> ⚠️ **Test this properly before moving on.** Sign in as a viewer account and confirm that (a) write controls are hidden, and (b) forcing a write from the browser console is *rejected by the database*. If (b) succeeds, your RLS is wrong and everything after this is built on sand.

### Phase 3 — The day view and checklist

> **Prompt:**
> "Build the main UI. Home shows a countdown to 19 Sep and the checklist items due soonest, with blocking ones highlighted. `/day/[date]` shows one day's activities in order, with type icons, times and a status control. `/checklist` is the full pre-trip list grouped by category, with checkboxes that write through Server Actions. Mobile-first — we'll use this on phones, one-handed, walking."

### Phase 3.5 — Offline shell ⭐ promoted, do not skip

> **Prompt:**
> "Make this an installable PWA. Register a service worker that precaches the app shell and uses stale-while-revalidate for day and checklist data, so `/day/[date]` renders fully with no network. Show a small offline indicator when requests are failing. On first sign-in after install, prefetch and cache **all eight days** in one request so the whole itinerary is available offline. Add an app icon and splash screen."

Test it by putting the phone in aeroplane mode and opening the day view. If it's blank, this phase isn't done.

### Phase 4 — Transport options and maps

> **Prompt:**
> "On each TRANSPORT activity, show all `transport_options` rows as tappable cards with duration and cost. Tapping selects one — a Server Action sets `is_selected`, clears the siblings, and updates the parent activity's duration. **Do not auto-load map embeds — we're on metered roaming data.** The default for every activity with coordinates is an 'Open in Maps' deep link using `maps.google.com/maps/dir/?api=1` with `travelmode=transit`, handing off to the native app. Load the Google Maps Embed iframe only behind an explicit 'Show map here' tap, and unload it when closed."

### Phase 5 — Notes

> **Prompt:**
> "Add a note composer on each day and each activity. **Notes must survive being written offline** — save to IndexedDB first, sync when connectivity returns, never lose a draft. Notes show author and timestamp. Also add a `/notes` view listing everything chronologically — this is what I'll ask Claude Code to read when replanning."

### Phase 6 — Photos

> **Prompt:**
> "Add photos with a **deferred upload queue**, because we're on metered roaming.
> - Selecting photos resizes them client-side to 2000px long edge as JPEG, plus a ~400px thumbnail, and stores both in IndexedDB. Nothing uploads yet.
> - A persistent badge shows 'N photos pending'.
> - An explicit **'Upload now'** button flushes the queue to Supabase Storage, bucket `trip-photos`, with per-file progress and resume on failure. Never upload automatically — iOS Safari cannot reliably detect WiFi.
> - The gallery loads `thumb_path` only; full size loads on tap.
> - Handle iPhone HEIC. The bucket is private, so use signed URLs."

### Phase 7 — Blog generation

> **Prompt:**
> "Add `/day/[date]/blog`. A 'Generate' button calls a Server Action that gathers the day's completed activities, all notes, and photo captions, sends them to the Anthropic API with a prompt to draft a warm first-person travel blog post in markdown, and saves it to `blog_posts`. It must be editable afterwards. Add a public `/blog` index rendering published posts."

---

## 8. Google Cloud Setup

**OAuth credentials:**
1. Google Cloud Console → new project → APIs & Services → OAuth consent screen
2. **External** user type, but keep it in **Testing** mode. This avoids Google's verification review entirely, which you do not want to sit through
3. Credentials → Create OAuth client ID → Web application
4. **Add all four emails as test users** — Google then refuses everyone else outright
5. Authorised redirect URI — with Supabase there is only **one**, and it points at Supabase, not your app:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
6. Paste the client ID and secret into **Supabase Dashboard → Authentication → Providers → Google**
7. Set **Site URL** and **Redirect URLs** in Supabase Auth settings to your Render domain and `http://localhost:3000`

**Maps API key:**
1. Enable **Maps Embed API** and **Places API**
2. Create an API key, then **restrict it** to HTTP referrers matching your Render domain and localhost
3. Billing must be enabled even to use the free tier. Set a budget alert at a low figure — the embed API is generous but an unrestricted key is a real risk

---

## 9. Render Deployment

Commit a `render.yaml` blueprint so the infrastructure lives in the repo:

```yaml
services:
  - type: web
    name: kansai-2026
    runtime: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY      # server-only, never NEXT_PUBLIC_
        sync: false
      - key: NEXT_PUBLIC_MAPS_KEY
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: TRIP_API_TOKEN
        sync: false
```

No database block — Supabase holds the data now. Render only runs the Next.js app.

Set the `sync: false` values in the Render dashboard, not in the repo. Push to `main` and Render auto-deploys.

**Migrations** run via the Supabase CLI, not the Render build. Either `supabase db push` from your machine after merging, or add a GitHub Action. Keep them out of the web build so a failed migration can't take the site down.

---

## 10. Wiring Claude Code to the Database

This is the part that makes the mobile workflow work. Set up **both** routes — they fail differently.

### Route A — the official Supabase MCP server (primary)

Supabase maintains its own MCP server, and as of 2026 it uses **OAuth — there is no personal access token to paste anywhere**.

```bash
claude mcp add --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=<your-ref>&read_only=true"
```

Then start Claude Code, type `/mcp`, and complete the browser sign-in.

Three flags, all of which matter:

| Flag | Why |
|---|---|
| `project_ref` | Without it, the agent can reach **every project your Supabase login owns**. Always scope it |
| `read_only=true` | Runs every query as a read-only Postgres user and disables migrations, project creation and edge-function deploys |
| OAuth, not a token | Nothing secret ends up in a config file |

> **Keep `read_only=true` on.** Supabase's own guidance is not to point a write-enabled MCP server at production data — the risk is prompt injection, where text the agent reads (a note you typed, a page it fetched) gets treated as an instruction. Your trip notes are exactly the kind of free text that could carry one. Reads through MCP, writes through Route B.

Two operational notes: if you see "Server Disconnected" after authorising, **fully quit and reopen the client** — a reload isn't enough. And you can generate a ready-made MCP URL from the **MCP connection tab in the Supabase dashboard** rather than assembling it by hand.

### Route B — a token-protected write API (writes, and the fallback)

Add two routes to the app, authenticated by `Authorization: Bearer $TRIP_API_TOKEN` and using the service-role key server-side:

- `GET  /api/trip/export` → full trip state as JSON
- `POST /api/trip/replan` → accepts a structured patch and applies it

Why bother when MCP exists? Two reasons. It's your write path, keeping MCP read-only. And when you're standing in Kyoto Station on hotel wifi and the MCP server won't start, `curl` always works.

### The mobile workflow

Claude Code is reachable from the Claude mobile app. Start a session on your machine — `/background` detaches it so it keeps running — then from your phone:

> *"Read the notes and activity statuses for 24 September. We're running late and skipped Kiyomizu-dera. Propose a revised plan for tomorrow that fits it in without breaking the Nara trip or the moon viewing. Summarise the changes before writing anything."*

The `CLAUDE.md` rule about proposing before writing is what keeps that safe.

---

## 11. Skills to Create

Put these in `.claude/skills/`. They turn multi-paragraph prompts into two words, which matters when you're typing on a phone.

| Skill | Does |
|---|---|
| `daily-brief` | Reads tomorrow's day record, the weather, and any blocking checklist items. Outputs a short brief |
| `replan` | Reads notes + statuses for elapsed days, proposes itinerary changes, waits for confirmation, then applies |
| `write-blog` | Generates the blog draft for a given date from activities, notes and photos |
| `sync-plan` | Re-reads `docs/KANSAI-2026-MASTER-PLAN.md` and reports drift between the document and the database |

Example — `.claude/skills/replan/SKILL.md`:

```markdown
---
description: Propose itinerary changes based on trip notes and what we actually did
allowed-tools: Read, Bash, Grep
---

Read from the trip database:
1. All Note rows created in the last 48 hours
2. All Activity rows with status DONE or SKIPPED
3. The remaining days' activities

Then propose changes. Rules:
- Never move a booked item. Hotels and flights are fixed.
- Respect the Goshobo check-in window (15:00–21:00) and check-out (before 10:00).
- Silver Week runs 19–23 Sep; assume crowds.
- Present changes as a numbered list with reasoning. WAIT for confirmation
  before writing anything to the database.
```

---

## 12. Costs

| Item | Monthly |
|---|---|
| Render Web Service (Starter) | ~US$7 |
| Supabase Free | US$0 |
| Google Maps Embed API | free under quota |
| Anthropic API (blog generation) | pennies at this volume |
| **Total** | **~US$7/mo** |

Half the v1 estimate, because Supabase's free tier replaces the paid Render database.

**The free tier in 2026 gives you** 500MB database, 1GB file storage, 5GB outbound bandwidth, 50,000 monthly active users and unlimited API requests. Your database will use a few megabytes. The binding constraint is **file storage**, which is why Phase 6 resizes on upload — at 2000px JPEG you'll fit a few thousand photos in 1GB.

**The one real catch: free projects pause after 7 days of inactivity.** You'll build in August, not touch it for a fortnight, and find it paused. Unpausing is one click in the dashboard and no data is lost — but you don't want to discover it at Changi at 1am.

> **My recommendation: upgrade to Pro (US$25) for September only, then downgrade.** It removes the pause entirely and adds daily backups for exactly the month when the app has to work. Total spend for the whole project, roughly **US$45–50**.

### 12.1 A note on the roaming plan itself

Singapore roaming passes for Japan are usually priced per day with a daily cap. Before you commit, compare against a **Japan eSIM** — for a modern iPhone these install in minutes and typically cost a fraction of telco roaming for several GB across the whole trip. Either works with this app; the eSIM route just removes the anxiety about the photo queue.

Whichever you choose, download the Google Maps offline areas before you leave. That single step does more for your data budget than anything in the codebase.

## 13. Timeline

Seven weeks. Comfortable, but the trip won't wait.

| By | Do |
|---|---|
| **Week 1 (early Aug)** | Phases 0–2. Repo, CLAUDE.md, schema, seed, auth. Deploy something ugly to Render — get the pipeline working early |
| **Week 2** | Phase 3. Day view and checklist. **This alone is already useful** — the checklist has real deadlines on it |
| **Week 3** | Phase 3.5 offline shell, then Phase 4 transport options and maps |
| **Week 4** | Phases 5–6. Notes and photos |
| **Week 5** | Phase 7. Blog generation |
| **Week 6** | Polish. **Test both phones on roaming data with WiFi switched off, and in aeroplane mode** |
| **Week 7 (mid Sep)** | Freeze. Verify the MCP connection works from your phone. Do a dry run: pretend it's Day 3 and replan |

> **Ship Phase 3 by mid-August regardless of what else slips.** The 6 September Goshobo cancellation deadline and the 19 August JR-West booking window are both in the checklist. An app that only does reminders still earns its keep.

---

## 14. Gotchas

**RLS on a table you forgot** — the classic Supabase mistake. A table without `enable row level security` is readable and writable by anyone with your anon key, which is public in the browser bundle. The CLAUDE.md rule in Section 5 exists for this. Before you ship, run `select tablename from pg_tables where schemaname='public'` and confirm every one has policies.

**The service-role key** — it bypasses RLS entirely. It must never appear in a Client Component, never be prefixed `NEXT_PUBLIC_`, and never be logged. Seed scripts and admin API routes only.

**Supabase free tier pause** — 7 days of inactivity. See Section 12.

**Roaming, tunnels and retries** — a failed request retried three times costs three times the data. Set short timeouts, cap retries, and fail to cached data rather than a spinner. The Osaka Metro and the stretch between Sannomiya and Arima are where you'll notice.

**Map embeds are the silent data drain** — an auto-loading iframe on a day view you open ten times a day is most of your daily allowance gone. Behind a tap, always.

**Render cold starts** — Starter instances spin down when idle. First load after a gap is slow. Fine for two people; just don't be surprised in a Kyoto station with one bar of signal.

**Timezones** — the single most likely source of bugs. Store UTC, render `Asia/Tokyo`. Your phones will be on JST but your dev machine is on SGT (+1 hour difference), so a date rendered without an explicit timezone will silently be wrong for exactly the hours you care about.

**iPhone HEIC uploads** — Safari will hand you `.heic` files that most browsers can't display. Convert on upload.

**Google OAuth in Testing mode** — refresh tokens expire after 7 days in testing mode. Fine here, because Supabase manages its own session tokens; just don't build anything relying on long-lived Google refresh tokens.

**Viewers seeing write buttons** — hiding controls in the UI is cosmetic. The enforcement is RLS. Always test by signing in as a viewer and trying to force a write.

**Secrets and Claude Code** — `.env.local` in `.gitignore` from commit one. Add a `/permissions` rule blocking reads of `.env*`. Keep the MCP server `read_only=true`.

**Don't over-build.** Four users, eight days, one trip. No pagination, no search, no soft deletes, no roles. Every hour spent on generality is an hour not spent on the thing you'll actually use at 7am in Fushimi Inari.

---

## 15. First Session Script

```bash
mkdir kansai-2026 && cd kansai-2026
git init
mkdir docs
# copy KANSAI-2026-MASTER-PLAN.md into docs/
claude
```

Then, in order:

1. `/init`
2. `/memory` → paste Section 5
3. `/permissions` → allow file writes in the project, block `.env*`
4. `/plan` → paste the Phase 1 prompt
5. Review the plan, approve, let it run
6. **Read `scripts/seed.ts` yourself before running it.** Everything downstream inherits its mistakes
7. `supabase start && npm run db:seed && npm run dev`
8. `/diff`, `/code-review`, commit, push

Then set up MCP once the Supabase project exists:
```bash
claude mcp add --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=<ref>&read_only=true"
```

You should have a working local itinerary viewer within a couple of hours.
