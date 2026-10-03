-- Keeps profiles.role in step with the role in app_metadata.
-- The auth server inserts a new user and only then sets app_metadata in a separate update, so
-- on_auth_user_created never sees the role of a user made through the admin API or dashboard.
-- This trigger picks it up from that update, and from any later role change.

create function public.handle_user_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set role = coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'farmer')
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_role_changed
  after update of raw_app_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data ->> 'role' is distinct from new.raw_app_meta_data ->> 'role')
  execute function public.handle_user_role_change();
