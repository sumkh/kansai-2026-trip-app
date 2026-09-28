-- Fix: the last-admin guard was also blocking cascade deletes.
--
-- profiles.id references auth.users on delete cascade. Deleting the admin's
-- auth account — from the Supabase dashboard, or by any admin API client —
-- fired this trigger and failed with "Cannot remove the last admin", which is
-- both confusing and wrong: at that level the account is already gone.
--
-- During a cascade the parent auth.users row no longer exists, which is how we
-- tell the two cases apart. Demotion and deletion through the app still hit the
-- guard, which is what it was for.

create or replace function public.protect_last_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Cascade from auth.users: the account itself is being removed. Let it go.
  if tg_op = 'DELETE' and not exists (select 1 from auth.users where id = old.id) then
    return old;
  end if;

  if (tg_op = 'DELETE' and old.is_admin)
     or (tg_op = 'UPDATE' and old.is_admin and not new.is_admin) then
    if (select count(*) from public.profiles where is_admin) <= 1 then
      raise exception 'Cannot remove the last admin';
    end if;
  end if;

  return case tg_op when 'DELETE' then old else new end;
end;
$$;
