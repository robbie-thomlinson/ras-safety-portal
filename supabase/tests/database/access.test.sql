-- RLS, grants and submit_safety_form, checked as each role. Run with `npm run test:db`.
-- Uses the seeded users: Frank (farmer), Priya (farmer), Alex (admin).

begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

-- ---------- Setup (as postgres) ----------

-- Helpers live in a schema the test creates, so they roll back with everything else.
create schema tests;

create function tests.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- Uploaded objects: two for Frank, one for Priya.
insert into storage.objects (bucket_id, name, owner_id, metadata) values
  ('safety-photos', '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001.jpg',
   '11111111-1111-1111-1111-111111111111', '{"mimetype": "image/jpeg", "size": 1234}'),
  ('safety-photos', '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000002.png',
   '11111111-1111-1111-1111-111111111111', '{"mimetype": "image/png", "size": 5678}'),
  ('safety-photos', '33333333-3333-3333-3333-333333333333/bbbbbbbb-0000-0000-0000-000000000001.jpg',
   '33333333-3333-3333-3333-333333333333', '{"mimetype": "image/jpeg", "size": 999}');

-- One existing form for Priya, with her photo.
with f as (
  insert into public.safety_forms (
    worker_id, job_site_id, date, hard_hat_worn, vest_worn, boots_worn, eye_protection_worn,
    fall_protection_inspected, scaffolding_inspected, ladders_inspected, tools_inspected,
    cords_inspected, hazards_identified
  ) values (
    '33333333-3333-3333-3333-333333333333', 1, current_date - 1,
    true, true, true, true, true, true, true, true, true, true
  ) returning id
)
insert into public.safety_form_photos (safety_form_id, path, content_type, size_bytes)
select id, '33333333-3333-3333-3333-333333333333/bbbbbbbb-0000-0000-0000-000000000001.jpg', 'image/jpeg', 999 from f;

insert into public.job_sites (name, address, archived_at) values ('Old Site', '1 Old Rd', now());

-- Submits a form as the current user with the given site, date and photos.
create function tests.submit(site bigint, d date, paths text[]) returns bigint language sql as $$
  select public.submit_safety_form(
    site, d, true, true, true, true, true, true, true, true, true, false, '  some notes  ', paths
  );
$$;

grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;

-- ---------- Signed out ----------

set local role anon;

select is((select count(*) from public.safety_forms), 0::bigint, 'anon sees no forms');
select is((select count(*) from public.job_sites), 0::bigint, 'anon sees no job sites');
select throws_ok(
  $$ select tests.submit(1, current_date - 1, array['x/y.jpg']) $$,
  '42501', null, 'anon cannot call submit_safety_form'
);

reset role;

-- ---------- Farmer ----------

select tests.login('11111111-1111-1111-1111-111111111111');
set local role authenticated;

select throws_like(
  $$ select tests.submit(1, current_date - 1, array[]::text[]) $$,
  'invalid_photo_count', 'zero photos raises invalid_photo_count'
);
select throws_like(
  $$ select tests.submit(1, current_date - 1, array[
       '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001.jpg',
       '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001.jpg']) $$,
  'invalid_photo_count', 'the same photo cannot be listed twice'
);
select throws_like(
  $$ select tests.submit(1, current_date - 1, array['33333333-3333-3333-3333-333333333333/bbbbbbbb-0000-0000-0000-000000000001.jpg']) $$,
  'invalid_photos', 'cannot submit another farmer''s photo'
);
select throws_like(
  $$ select tests.submit(1, current_date - 1, array['11111111-1111-1111-1111-111111111111/cccccccc-0000-0000-0000-000000000009.jpg']) $$,
  'invalid_photos', 'cannot submit a photo that was never uploaded'
);
select throws_like(
  $$ select tests.submit((select id from public.job_sites where name = 'Old Site'), current_date - 1,
       array['11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001.jpg']) $$,
  'invalid_job_site', 'cannot submit for an archived site'
);
select throws_like(
  $$ select tests.submit(1, current_date + 7,
       array['11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001.jpg']) $$,
  'invalid_date', 'cannot submit for a future date'
);

select lives_ok(
  $$ select tests.submit(2, current_date - 1, array[
       '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001.jpg',
       '11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000002.png']) $$,
  'farmer submits a form with two photos'
);

select results_eq(
  $$ select worker_id, status::text, notes from public.safety_forms where job_site_id = 2 $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid, 'submitted', 'some notes') $$,
  'the form is stamped with the caller as worker, defaults to submitted, and notes are trimmed'
);
select results_eq(
  $$ select content_type, size_bytes from public.safety_form_photos p
     join public.safety_forms f on f.id = p.safety_form_id where f.job_site_id = 2 order by size_bytes $$,
  $$ values ('image/jpeg', 1234), ('image/png', 5678) $$,
  'photo type and size come from Storage metadata'
);

select throws_ok(
  $$ select tests.submit(1, current_date - 1, array['11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001.jpg']) $$,
  '23505', null, 'a photo cannot be attached to a second form'
);

select is(
  (select count(*) from public.safety_forms where worker_id <> '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'farmer sees only their own forms'
);
select is(
  (select count(*) from public.safety_form_photos where path like '3333%'),
  0::bigint, 'farmer cannot see another farmer''s photo rows'
);
select is(
  (select count(*) from storage.objects where name like '3333%'),
  0::bigint, 'farmer cannot see another farmer''s stored photos'
);
select is(
  (select count(*) from public.profiles), 1::bigint, 'farmer sees only their own profile'
);

select throws_ok(
  $$ insert into public.safety_forms (worker_id, job_site_id, date, hard_hat_worn, vest_worn, boots_worn,
       eye_protection_worn, fall_protection_inspected, scaffolding_inspected, ladders_inspected,
       tools_inspected, cords_inspected, hazards_identified)
     values ('11111111-1111-1111-1111-111111111111', 1, current_date,
       true, true, true, true, true, true, true, true, true, true) $$,
  '42501', null, 'farmer cannot insert a form directly (bypassing the photo check)'
);
select throws_ok(
  $$ insert into public.safety_form_photos (safety_form_id, path, content_type, size_bytes)
     select id, '11111111-1111-1111-1111-111111111111/x.jpg', 'image/jpeg', 1 from public.safety_forms limit 1 $$,
  '42501', null, 'farmer cannot attach photos directly'
);
update public.safety_forms set status = 'reviewed';
select is(
  (select count(*) from public.safety_forms where status = 'reviewed'),
  0::bigint, 'farmer cannot review their own form'
);
select throws_ok(
  $$ update public.safety_forms set hard_hat_worn = false $$,
  '42501', null, 'farmer cannot edit a submitted form'
);
select throws_ok(
  $$ insert into public.job_sites (name, address) values ('Sneaky', '1 Road') $$,
  '42501', null, 'farmer cannot add job sites'
);

reset role;

-- ---------- Admin ----------

select tests.login('22222222-2222-2222-2222-222222222222');
set local role authenticated;

select is((select count(*) from public.safety_forms), 2::bigint, 'admin sees every farmer''s forms');
select is((select count(*) from public.safety_form_photos), 3::bigint, 'admin sees every photo row');

select throws_like(
  $$ select tests.submit(1, current_date - 1, array['11111111-1111-1111-1111-111111111111/aaaaaaaa-0000-0000-0000-000000000001.jpg']) $$,
  'farmers_only', 'admin cannot submit forms'
);

update public.safety_forms set status = 'reviewed' where job_site_id = 2;
select results_eq(
  $$ select reviewed_by, reviewed_at is not null from public.safety_forms where job_site_id = 2 $$,
  $$ values ('22222222-2222-2222-2222-222222222222'::uuid, true) $$,
  'reviewing stamps the admin and time server-side'
);
select throws_ok(
  $$ update public.safety_forms set reviewed_by = '66666666-6666-6666-6666-666666666666' $$,
  '42501', null, 'admin cannot set the reviewer to someone else'
);
select throws_ok(
  $$ update public.safety_forms set notes = 'edited' $$,
  '42501', null, 'admin cannot change what the farmer submitted'
);

update public.safety_forms set status = 'submitted' where job_site_id = 2;
select results_eq(
  $$ select reviewed_by is null and reviewed_at is null from public.safety_forms where job_site_id = 2 $$,
  $$ values (true) $$,
  'moving back to submitted clears the review'
);

select lives_ok(
  $$ insert into public.job_sites (name, address) values ('New Barn', '9 Farm Rd');
     update public.job_sites set archived_at = now() where name = 'New Barn' $$,
  'admin can add and archive job sites'
);
select throws_ok(
  $$ delete from public.job_sites where name = 'New Barn' $$,
  '42501', null, 'admin cannot hard-delete job sites'
);

reset role;

select * from finish();
rollback;
