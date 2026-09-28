-- Backfill profiles for accounts that already existed.
--
-- handle_new_user() fires on INSERT into auth.users. Anyone created BEFORE the
-- migrations ran — which is the natural order if you set up the project in the
-- dashboard first — never triggered it, so they have no profile. They can sign
-- in perfectly well and then see "This trip is private", with nothing in any
-- log to explain why.
--
-- Idempotent, so it is safe on every deploy. Re-run it by hand after adding
-- someone to allowed_users who already has an account.

insert into public.profiles (id, email, display_name, role, is_admin)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'name', a.display_name),
  a.role,
  a.is_admin
from auth.users u
join public.allowed_users a on lower(a.email) = lower(u.email)
where u.email is not null
on conflict (id) do nothing;
