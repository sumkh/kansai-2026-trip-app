-- Kansai 2026 — core schema
-- Four users, eight days, one trip. Deliberately not general-purpose.

create type user_role       as enum ('traveller','viewer');
create type activity_type   as enum ('TRANSPORT','ONSEN','FOOD','SIGHT','SHOPPING','LODGING','ADMIN');
create type activity_status as enum ('PLANNED','DONE','SKIPPED');

-- Who is allowed in, and at what level. Pre-seeded with exactly 4 rows.
create table allowed_users (
  email        text primary key,
  role         user_role not null,
  display_name text
);

-- Linked to Supabase's auth.users on first sign-in by the handle_new_user trigger.
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  display_name text,
  role         user_role not null,
  created_at   timestamptz not null default now()
);

create table trips (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  start_date date not null,
  end_date   date not null
);

create table days (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips(id) on delete cascade,
  date       date not null unique,
  day_number int  not null,
  title      text not null,
  summary    text,
  base_city  text not null
);

create table activities (
  id              uuid primary key default gen_random_uuid(),
  day_id          uuid not null references days(id) on delete cascade,
  "order"         int  not null,
  start_time      text,                  -- 'HH:MM' local Asia/Tokyo, or null for "sometime this block"
  duration_min    int,
  title           text not null,
  description     text,
  type            activity_type   not null,
  status          activity_status not null default 'PLANNED',
  place_name      text,
  address         text,
  lat             double precision,
  lng             double precision,
  google_place_id text,
  is_booked       boolean not null default false,
  booking_ref     text,
  cost_jpy        int,
  unique (day_id, "order")
);

create table transport_options (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references activities(id) on delete cascade,
  label        text not null,
  mode         text not null,
  duration_min int  not null,
  cost_jpy     int,
  from_place   text,
  to_place     text,
  notes        text,
  is_selected  boolean not null default false
);

-- At most one selected option per activity. Enforced, not just conventional.
create unique index transport_options_one_selected
  on transport_options (activity_id) where is_selected;

create table checklist_items (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  title       text not null,
  detail      text,
  category    text not null,
  due_date    date,
  is_blocking boolean not null default false,
  done_at     timestamptz,
  done_by     uuid references profiles(id)
);

create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id),
  day_id      uuid references days(id) on delete cascade,
  activity_id uuid references activities(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create table photos (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id),
  day_id           uuid not null references days(id) on delete cascade,
  activity_id      uuid references activities(id) on delete set null,
  storage_path     text not null,
  thumb_path       text,           -- ~400px, what the gallery loads
  pending_local_id text,           -- set while queued on device, cleared on upload
  caption          text,
  taken_at         timestamptz,
  created_at       timestamptz not null default now()
);

create table blog_posts (
  id            uuid primary key default gen_random_uuid(),
  day_id        uuid not null unique references days(id) on delete cascade,
  title         text not null,
  body_markdown text not null,
  is_published  boolean not null default false,
  generated_at  timestamptz not null default now()
);

-- Indexes for the access patterns the app actually has.
create index activities_day_order  on activities (day_id, "order");
create index notes_created_at      on notes (created_at desc);
create index notes_day             on notes (day_id);
create index photos_day            on photos (day_id);
create index checklist_due         on checklist_items (due_date);
