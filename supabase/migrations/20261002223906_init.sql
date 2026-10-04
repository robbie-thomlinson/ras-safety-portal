-- Initial schema: profiles, job sites, safety forms and their photos, plus RLS and the photo bucket.

-- ---------- Types ----------

create type public.user_role as enum ('framer', 'admin');
create type public.form_status as enum ('submitted', 'reviewed');

-- ---------- Tables ----------

-- One row per auth user. Created by the on_auth_user_created trigger below.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'framer',
  first_name text not null,
  last_name text not null,
  created_at timestamptz not null default now()
);

create table public.job_sites (
  id bigint generated always as identity primary key,
  name text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table public.safety_forms (
  id bigint generated always as identity primary key,
  worker_id uuid not null references public.profiles (id),
  job_site_id bigint not null references public.job_sites (id),
  date date not null,
  hard_hat_worn boolean not null,
  vest_worn boolean not null,
  boots_worn boolean not null,
  eye_protection_worn boolean not null,
  fall_protection_inspected boolean not null,
  scaffolding_inspected boolean not null,
  ladders_inspected boolean not null,
  tools_inspected boolean not null,
  cords_inspected boolean not null,
  hazards_identified boolean not null,
  notes text,
  status public.form_status not null default 'submitted',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint review_fields_match_status check (
    (status = 'reviewed') = (reviewed_by is not null and reviewed_at is not null)
  )
);

create index safety_forms_worker_id_idx on public.safety_forms (worker_id);
create index safety_forms_job_site_id_idx on public.safety_forms (job_site_id);
create index safety_forms_date_idx on public.safety_forms (date);

-- `path` is the object name in the safety-photos bucket: {worker_id}/{safety_form_id}/{filename}
create table public.safety_form_photos (
  id bigint generated always as identity primary key,
  safety_form_id bigint not null references public.safety_forms (id) on delete cascade,
  path text not null unique,
  content_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  uploaded_at timestamptz not null default now()
);

create index safety_form_photos_safety_form_id_idx on public.safety_form_photos (safety_form_id);

-- ---------- Functions ----------

-- security definer so policies on profiles can call it without recursing into themselves.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Role comes from app_metadata, which users can't set themselves, so sign-ups are always framers.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, first_name, last_name)
  values (
    new.id,
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'framer'),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row level security ----------

alter table public.profiles enable row level security;
alter table public.job_sites enable row level security;
alter table public.safety_forms enable row level security;
alter table public.safety_form_photos enable row level security;

create policy "Users see their own profile; admins see all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "Signed-in users see all job sites"
  on public.job_sites for select to authenticated
  using (true);

create policy "Framers see their own forms; admins see all"
  on public.safety_forms for select to authenticated
  using (worker_id = (select auth.uid()) or public.is_admin());

create policy "Framers submit forms for themselves"
  on public.safety_forms for insert to authenticated
  with check (
    worker_id = (select auth.uid())
    and not public.is_admin()
  );

-- Framers may only fill in the form itself; status, review and timestamp columns keep their defaults.
revoke insert on public.safety_forms from authenticated;
grant insert (
  worker_id, job_site_id, date,
  hard_hat_worn, vest_worn, boots_worn, eye_protection_worn,
  fall_protection_inspected, scaffolding_inspected, ladders_inspected,
  tools_inspected, cords_inspected, hazards_identified,
  notes
) on public.safety_forms to authenticated;

create policy "Admins review forms"
  on public.safety_forms for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admins may only change the review columns, not what the framer submitted.
revoke update on public.safety_forms from authenticated;
grant update (status, reviewed_by, reviewed_at) on public.safety_forms to authenticated;

-- Visibility follows the parent form (whose own RLS applies inside the subquery).
create policy "Photos are visible with their form"
  on public.safety_form_photos for select to authenticated
  using (exists (select 1 from public.safety_forms f where f.id = safety_form_id));

create policy "Framers attach photos to their own forms"
  on public.safety_form_photos for insert to authenticated
  with check (
    exists (
      select 1 from public.safety_forms f
      where f.id = safety_form_id and f.worker_id = (select auth.uid())
    )
    and (storage.foldername(path))[1] = (select auth.uid())::text
    and (storage.foldername(path))[2] = safety_form_id::text
  );

revoke insert on public.safety_form_photos from authenticated;
grant insert (safety_form_id, path, content_type, size_bytes) on public.safety_form_photos to authenticated;

-- ---------- Storage ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'safety-photos',
  'safety-photos',
  false,
  10 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

create policy "Framers upload photos to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'safety-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Framers read their own photos; admins read all"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'safety-photos'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );
