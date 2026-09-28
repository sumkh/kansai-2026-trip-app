-- Admin capability.
--
-- Deliberately a flag, not a third role. Being an admin is orthogonal to being
-- a traveller: it controls who may edit the allow list, not what trip data you
-- can touch. Brian is both a traveller and the admin.

alter table public.allowed_users add column is_admin boolean not null default false;
alter table public.profiles      add column is_admin boolean not null default false;

update public.allowed_users set is_admin = true where lower(email) = 'traveller@example.com';

-- The known viewer. The second viewer slot is added through the admin UI.
insert into public.allowed_users (email, role, display_name) values
  ('viewer@example.com', 'viewer', 'Viewer')
on conflict (email) do update
  set role = excluded.role, display_name = excluded.display_name;

delete from public.allowed_users where email in ('VIEWER-1@gmail.com','VIEWER-2@gmail.com');

-- Carry the flag onto the profile at first sign-in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare r public.user_role; a boolean;
begin
  select role, is_admin into r, a from public.allowed_users
   where lower(email) = lower(new.email);
  if r is not null then
    insert into public.profiles (id, email, display_name, role, is_admin)
    values (new.id, new.email, new.raw_user_meta_data->>'name', r, coalesce(a, false))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_admin
  );
$$;

-- The allow list becomes readable and writable — but only by an admin.
-- Everyone else still has no policy, so they get nothing.
grant select, insert, update, delete on public.allowed_users to authenticated;
create policy "admins manage the allow list" on public.allowed_users
  for all using (public.is_admin()) with check (public.is_admin());

-- An admin can change someone's role after they have already signed in,
-- which the allow list alone cannot do.
grant update, delete on public.profiles to authenticated;
create policy "admins update profiles" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admins delete profiles" on public.profiles
  for delete using (public.is_admin());

-- Guard rail: an admin must not be able to demote or delete themselves and
-- lock the whole group out of user management.
create or replace function public.protect_last_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (tg_op = 'DELETE' and old.is_admin)
     or (tg_op = 'UPDATE' and old.is_admin and not new.is_admin) then
    if (select count(*) from public.profiles where is_admin) <= 1 then
      raise exception 'Cannot remove the last admin';
    end if;
  end if;
  return case tg_op when 'DELETE' then old else new end;
end;
$$;

create trigger profiles_protect_last_admin
  before update or delete on public.profiles
  for each row execute function public.protect_last_admin();
