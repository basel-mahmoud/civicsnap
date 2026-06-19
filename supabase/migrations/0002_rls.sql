-- Row Level Security for all CivicSnap tables.
-- Principle: reports are public to read; writing is tightly scoped.

alter table public.profiles      enable row level security;
alter table public.reports       enable row level security;
alter table public.upvotes       enable row level security;
alter table public.status_events enable row level security;
alter table public.comments      enable row level security;

-- ----- profiles -----------------------------------------------------------
-- Public can read display names (to label reports/comments).
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);

-- Users may update their own display name (role is never client-editable;
-- the WITH CHECK keeps role unchanged unless the caller is already admin).
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and (role = 'resident' or public.is_admin()));

-- ----- reports ------------------------------------------------------------
drop policy if exists reports_select_public on public.reports;
create policy reports_select_public on public.reports
  for select using (true);

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert with check (auth.uid() = reporter_id);

-- Owner or admin may update; the report-change trigger enforces that only
-- admins can move status/category/severity/location.
drop policy if exists reports_update on public.reports;
create policy reports_update on public.reports
  for update using (reporter_id = auth.uid() or public.is_admin())
  with check (reporter_id = auth.uid() or public.is_admin());

drop policy if exists reports_delete on public.reports;
create policy reports_delete on public.reports
  for delete using (reporter_id = auth.uid() or public.is_admin());

-- ----- upvotes ------------------------------------------------------------
drop policy if exists upvotes_select on public.upvotes;
create policy upvotes_select on public.upvotes
  for select using (true);

drop policy if exists upvotes_insert_own on public.upvotes;
create policy upvotes_insert_own on public.upvotes
  for insert with check (user_id = auth.uid());

drop policy if exists upvotes_delete_own on public.upvotes;
create policy upvotes_delete_own on public.upvotes
  for delete using (user_id = auth.uid());

-- ----- status_events ------------------------------------------------------
-- Public audit trail; rows are written only by the SECURITY DEFINER trigger
-- or directly by admins. No update/delete policies => immutable.
drop policy if exists status_events_select on public.status_events;
create policy status_events_select on public.status_events
  for select using (true);

drop policy if exists status_events_insert_admin on public.status_events;
create policy status_events_insert_admin on public.status_events
  for insert with check (public.is_admin());

-- ----- comments -----------------------------------------------------------
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments
  for select using (true);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
  for insert with check (author_id = auth.uid());

drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments
  for delete using (author_id = auth.uid() or public.is_admin());
