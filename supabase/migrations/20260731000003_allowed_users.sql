-- ⚠️ EDIT THIS FILE BEFORE RUNNING `supabase db push`.
--
-- These four rows are the entire access control list for the app. An email that
-- is not here gets no profile on sign-in, and therefore sees zero rows from
-- every table. Getting a Gmail address wrong here locks that person out.
--
-- Must be the exact Google account address each person signs in with.

insert into allowed_users (email, role, display_name) values
  ('traveller@example.com',       'traveller', 'Brian'),
  ('companion@example.com',   'traveller', 'Companion'),
  ('VIEWER-1@gmail.com',     'viewer',    'Viewer One'),   -- ⬅ still a placeholder
  ('VIEWER-2@gmail.com',     'viewer',    'Viewer Two')    -- ⬅ still a placeholder
on conflict (email) do update
  set role = excluded.role,
      display_name = excluded.display_name;
