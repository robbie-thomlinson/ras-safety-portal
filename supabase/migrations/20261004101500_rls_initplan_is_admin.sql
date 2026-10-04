-- Wraps is_admin() in a subquery in the read policies, so Postgres evaluates it once per query
-- (an InitPlan) instead of once per row. Paginated lists count every matching row; at 50k forms the
-- admin count drops from ~160ms to ~4ms. Write policies only ever check one row, so they're unchanged.

alter policy "Users see their own profile; admins see all"
  on public.profiles
  using (id = (select auth.uid()) or (select public.is_admin()));

alter policy "Framers see their own forms; admins see all"
  on public.safety_forms
  using (worker_id = (select auth.uid()) or (select public.is_admin()));

alter policy "Framers read their own photos; admins read all"
  on storage.objects
  using (
    bucket_id = 'safety-photos'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
