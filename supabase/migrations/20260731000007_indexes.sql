-- Site Index and Restaurant Index, from master plan sections 8 and 9.
--
-- Reference data rather than schedule: a site is somewhere you might go, an
-- activity is a decision to go there at a time. They are separate on purpose —
-- Shinsekai stays in the Site Index even on a day the 2.5D matinee displaces it.
--
-- name_ja earns its place. Half of these have no English website, and the
-- Japanese name is what actually works in Google Maps, on a taxi driver's
-- screen, or held up in a shop.

create type site_kind as enum (
  'SIGHT','ONSEN','MARKET','SHOPPING','THEATRE','FESTIVAL','GARDEN','REFERENCE'
);

create type food_kind as enum ('PLACE','DISH');

create table sites (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  name        text not null,
  name_ja     text,
  city        text not null,          -- Osaka | Arima | Kyoto | Nara | Transport
  kind        site_kind not null,
  day_hint    text,                   -- 'Sat 19', 'Tue 22', 'any'
  url         text,                   -- only ever a verified link
  search_key  text,                   -- Japanese search string when there is no URL
  note        text,
  is_optional  boolean not null default false,
  is_highlight boolean not null default false,
  sort        int not null default 0
);

create table restaurants (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references trips(id) on delete cascade,
  name          text not null,
  name_ja       text,
  city          text not null,        -- Arima | Osaka | Kyoto | Nara | Seasonal
  kind          food_kind not null default 'PLACE',
  cuisine       text,
  hours         text,
  note          text,
  url           text,
  search_key    text,
  needs_booking boolean not null default false,
  -- Gekkoen: dinner is reservation-only and not served on public holidays,
  -- which rules out both Arima nights. Recorded so it cannot be rediscovered
  -- as a good idea at 18:00 on the 22nd.
  is_avoid      boolean not null default false,
  is_highlight  boolean not null default false,
  sort          int not null default 0
);

create index sites_city on sites (city, sort);
create index restaurants_city on restaurants (city, sort);

-- Same access model as every other table: members read, travellers write.
do $$
declare t text;
begin
  foreach t in array array['sites','restaurants'] loop
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);

    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "members read" on public.%I for select using (public.is_member())', t);
    execute format(
      'create policy "travellers write" on public.%I for all
         using (public.is_traveller()) with check (public.is_traveller())', t);
  end loop;
end $$;
