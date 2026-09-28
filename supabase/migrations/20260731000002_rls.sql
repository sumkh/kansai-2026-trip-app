-- Kansai 2026 — access control.
-- Permissions live HERE, in the database, not in application code.
-- Members read. Travellers write. Everyone else sees nothing at all.

-- On first Google sign-in, create a profile ONLY if the email is on the allow list.
-- Anyone else ends up with no profile, and therefore no rows from any table.
--
-- The comparison is case-insensitive on purpose. Supabase lowercases the email
-- on signup, so a single capital letter in allowed_users would silently lock
-- that person out with no error anywhere — they would just see an empty app.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare r public.user_role;
begin
  select role into r from public.allowed_users
   where lower(email) = lower(new.email);
  if r is not null then
    insert into public.profiles (id, email, display_name, role)
    values (new.id, new.email, new.raw_user_meta_data->>'name', r)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers. security definer so they can read profiles without tripping its own RLS.
create or replace function public.is_member() returns boolean
language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create or replace function public.is_traveller() returns boolean
language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'traveller'
  );
$$;

-- Grants are a separate layer from RLS and both are required: without a GRANT
-- every query fails with "permission denied for table" before RLS is ever
-- consulted. Do NOT rely on default privileges — they do not reliably cover
-- tables created inside a migration.
--
-- `anon` is deliberately omitted. Nobody unauthenticated ever reads this app,
-- and a grant that does not exist cannot be undone by a policy mistake.
grant usage on schema public to authenticated, service_role;

-- Apply to every content table: members read, travellers write.
-- Permissive policies OR together, so travellers get read via "members read".
do $$
declare t text;
begin
  foreach t in array array[
    'trips','days','activities','transport_options',
    'checklist_items','notes','photos','blog_posts'
  ] loop
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

-- Profiles: everyone in the group can see who's who. Nobody can self-promote,
-- because there is no insert/update/delete policy at all — only the
-- security-definer trigger writes here.
grant select on public.profiles to authenticated;
grant all    on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "members read profiles" on public.profiles
  for select using (public.is_member());

-- allowed_users is the allow list itself. RLS on, no policies, and no grant to
-- authenticated: unreachable by any signed-in user. Only the security-definer
-- trigger and the service-role key can read it.
grant all on public.allowed_users to service_role;
alter table public.allowed_users enable row level security;

-- Storage: one private bucket.
insert into storage.buckets (id, name, public)
values ('trip-photos','trip-photos',false)
on conflict (id) do nothing;

create policy "members read photos" on storage.objects
  for select using (bucket_id = 'trip-photos' and public.is_member());
create policy "travellers upload photos" on storage.objects
  for insert with check (bucket_id = 'trip-photos' and public.is_traveller());
create policy "travellers update photos" on storage.objects
  for update using (bucket_id = 'trip-photos' and public.is_traveller());
create policy "travellers delete photos" on storage.objects
  for delete using (bucket_id = 'trip-photos' and public.is_traveller());
