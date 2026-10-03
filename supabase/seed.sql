-- Local development data. Runs after migrations on `supabase db reset`.
-- Demo logins (password for all: password123):
--   farmers: farmer@ras.test, priya.sandhu@ras.test, tom.bergstrom@ras.test, mei.chen@ras.test
--   admins:  admin@ras.test, dana.whitfield@ras.test

insert into public.job_sites (name, address) values
  ('Saanichton Dairy Barn', '1824 Mount Newton Cross Rd, Saanichton, BC'),
  ('Keating Equipment Yard', '2140 Keating Cross Rd, Saanichton, BC'),
  ('Metchosin Hay Barn', '4450 Happy Valley Rd, Metchosin, BC');

-- Creating the auth users fires on_auth_user_created, which inserts their profiles.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id,
  'authenticated', 'authenticated', u.email, crypt('password123', gen_salt('bf')), now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', u.role),
  jsonb_build_object('first_name', u.first_name, 'last_name', u.last_name),
  now(), now(), '', '', '', ''
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'farmer@ras.test', 'farmer', 'Frank', 'Farmer'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'priya.sandhu@ras.test', 'farmer', 'Priya', 'Sandhu'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'tom.bergstrom@ras.test', 'farmer', 'Tom', 'Bergstrom'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'mei.chen@ras.test', 'farmer', 'Mei', 'Chen'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'admin@ras.test', 'admin', 'Alex', 'Admin'),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'dana.whitfield@ras.test', 'admin', 'Dana', 'Whitfield')
) as u (id, email, role, first_name, last_name);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id, id, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users
where email like '%@ras.test';
