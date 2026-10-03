-- Submissions go through submit_safety_form (form + photos in one transaction), reviews are
-- stamped server-side, and admins can manage job sites.

-- ---------- Limits ----------

alter table public.safety_forms
  add constraint notes_length check (char_length(notes) <= 2000);

alter table public.job_sites
  add column archived_at timestamptz,
  add constraint name_length check (char_length(name) between 1 and 120),
  add constraint address_length check (char_length(address) between 1 and 250);

-- ---------- Job sites ----------

-- Sites are archived rather than deleted so past forms keep their site. Archived sites stay
-- readable (for history) but can't be chosen for new forms.
create policy "Admins add job sites"
  on public.job_sites for insert to authenticated
  with check (public.is_admin());

create policy "Admins edit job sites"
  on public.job_sites for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke insert, update, delete on public.job_sites from authenticated;
grant insert (name, address) on public.job_sites to authenticated;
grant update (name, address, archived_at) on public.job_sites to authenticated;

-- ---------- Reviews ----------

-- Admins only set status; who reviewed it and when come from the session and the clock.
create function public.stamp_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'reviewed' and old.status <> 'reviewed' then
    new.reviewed_by := (select auth.uid());
    new.reviewed_at := now();
  elsif new.status = 'submitted' then
    new.reviewed_by := null;
    new.reviewed_at := null;
  else
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
  end if;
  return new;
end;
$$;

create trigger stamp_review
  before update on public.safety_forms
  for each row execute function public.stamp_review();

revoke update on public.safety_forms from authenticated;
grant update (status) on public.safety_forms to authenticated;

-- ---------- Submitting ----------

-- Photos are uploaded first, to {worker_id}/{uuid}.{ext} in the safety-photos bucket, then
-- submitted here with the form. Direct inserts are revoked so a form can't exist without photos.
drop policy "Farmers submit forms for themselves" on public.safety_forms;
drop policy "Farmers attach photos to their own forms" on public.safety_form_photos;
revoke insert on public.safety_forms from authenticated;
revoke insert on public.safety_form_photos from authenticated;

-- security definer because callers can no longer insert directly, so every rule RLS used to
-- enforce is checked explicitly below.
create function public.submit_safety_form(
  p_job_site_id bigint,
  p_date date,
  p_hard_hat_worn boolean,
  p_vest_worn boolean,
  p_boots_worn boolean,
  p_eye_protection_worn boolean,
  p_fall_protection_inspected boolean,
  p_scaffolding_inspected boolean,
  p_ladders_inspected boolean,
  p_tools_inspected boolean,
  p_cords_inspected boolean,
  p_hazards_identified boolean,
  p_notes text,
  p_photo_paths text[]
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_form_id bigint;
  v_found integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = v_uid and role = 'farmer') then
    raise exception 'farmers_only' using errcode = '42501';
  end if;

  if not exists (select 1 from public.job_sites where id = p_job_site_id and archived_at is null) then
    raise exception 'invalid_job_site' using errcode = '22023';
  end if;

  -- RAS works in BC, so "today" is local time rather than UTC.
  if p_date is null or p_date > (now() at time zone 'America/Vancouver')::date then
    raise exception 'invalid_date' using errcode = '22023';
  end if;

  if coalesce(cardinality(p_photo_paths), 0) not between 1 and 10
     or cardinality(p_photo_paths) <> (select count(distinct p) from unnest(p_photo_paths) p) then
    raise exception 'invalid_photo_count' using errcode = '22023';
  end if;

  -- Every photo must be an uploaded object in the caller's own folder.
  select count(*) into v_found
  from storage.objects o
  where o.bucket_id = 'safety-photos'
    and o.name = any (p_photo_paths)
    and o.owner_id = v_uid::text
    and (storage.foldername(o.name))[1] = v_uid::text
    and o.archived_at is null
    and not o.is_delete_marker;

  if v_found <> cardinality(p_photo_paths) then
    raise exception 'invalid_photos' using errcode = '22023';
  end if;

  insert into public.safety_forms (
    worker_id, job_site_id, date,
    hard_hat_worn, vest_worn, boots_worn, eye_protection_worn,
    fall_protection_inspected, scaffolding_inspected, ladders_inspected,
    tools_inspected, cords_inspected, hazards_identified,
    notes
  ) values (
    v_uid, p_job_site_id, p_date,
    p_hard_hat_worn, p_vest_worn, p_boots_worn, p_eye_protection_worn,
    p_fall_protection_inspected, p_scaffolding_inspected, p_ladders_inspected,
    p_tools_inspected, p_cords_inspected, p_hazards_identified,
    nullif(btrim(p_notes), '')
  )
  returning id into v_form_id;

  -- Size and type come from Storage's own metadata, not the client. A photo already attached to
  -- another form fails the unique constraint on path and rolls everything back.
  insert into public.safety_form_photos (safety_form_id, path, content_type, size_bytes)
  select v_form_id, o.name, o.metadata ->> 'mimetype', (o.metadata ->> 'size')::integer
  from storage.objects o
  where o.bucket_id = 'safety-photos'
    and o.name = any (p_photo_paths)
    and o.archived_at is null
    and not o.is_delete_marker;

  return v_form_id;
end;
$$;

revoke execute on function public.submit_safety_form from public, anon;
grant execute on function public.submit_safety_form to authenticated;

-- ---------- Storage ----------

-- Lets a farmer remove a photo they took out of the form before submitting. Once a photo is
-- attached to a form it's part of the record and stays.
create policy "Farmers delete their own unattached photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'safety-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.safety_form_photos p where p.path = name)
  );

comment on column public.safety_form_photos.path is
  'Object name in the safety-photos bucket: {worker_id}/{uuid}.{ext}';
