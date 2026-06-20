-- Switch identity from Supabase Auth (uuid) to Clerk (text `sub`) via Third-Party Auth.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists reports_insert_own on public.reports;
drop policy if exists reports_update on public.reports;
drop policy if exists reports_delete on public.reports;
drop policy if exists upvotes_insert_own on public.upvotes;
drop policy if exists upvotes_delete_own on public.upvotes;
drop policy if exists comments_insert_own on public.comments;
drop policy if exists comments_delete on public.comments;

alter table public.profiles      drop constraint if exists profiles_id_fkey;
alter table public.reports        drop constraint if exists reports_reporter_id_fkey;
alter table public.upvotes        drop constraint if exists upvotes_user_id_fkey;
alter table public.status_events  drop constraint if exists status_events_changed_by_fkey;
alter table public.comments       drop constraint if exists comments_author_id_fkey;

alter table public.profiles      alter column id          type text using id::text;
alter table public.reports        alter column reporter_id type text using reporter_id::text;
alter table public.upvotes        alter column user_id     type text using user_id::text;
alter table public.status_events  alter column changed_by  type text using changed_by::text;
alter table public.comments       alter column author_id   type text using author_id::text;

create or replace function public.current_user_id()
returns text language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles
    where id = public.current_user_id() and role = 'admin'
  );
$$;

create or replace function public.handle_report_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.status_events (report_id, status, changed_by, note)
    values (new.id, new.status, new.reporter_id, 'Report created');
    return new;
  end if;
  new.updated_at := now();
  if (new.status is distinct from old.status
      or new.category is distinct from old.category
      or new.severity is distinct from old.severity
      or new.lat is distinct from old.lat
      or new.lng is distinct from old.lng)
     and not public.is_admin() then
    raise exception 'Only admins can change status, category, severity, or location';
  end if;
  if (new.status is distinct from old.status) then
    insert into public.status_events (report_id, status, changed_by)
    values (new.id, new.status, public.current_user_id());
  end if;
  return new;
end;
$$;

create policy profiles_update_own on public.profiles
  for update using (id = public.current_user_id())
  with check (id = public.current_user_id() and (role = 'resident' or public.is_admin()));
create policy profiles_insert_own on public.profiles
  for insert with check (id = public.current_user_id());

create policy reports_insert_own on public.reports
  for insert with check (public.current_user_id() = reporter_id);
create policy reports_update on public.reports
  for update using (reporter_id = public.current_user_id() or public.is_admin())
  with check (reporter_id = public.current_user_id() or public.is_admin());
create policy reports_delete on public.reports
  for delete using (reporter_id = public.current_user_id() or public.is_admin());

create policy upvotes_insert_own on public.upvotes
  for insert with check (user_id = public.current_user_id());
create policy upvotes_delete_own on public.upvotes
  for delete using (user_id = public.current_user_id());

create policy comments_insert_own on public.comments
  for insert with check (author_id = public.current_user_id());
create policy comments_delete on public.comments
  for delete using (author_id = public.current_user_id() or public.is_admin());

drop policy if exists report_photos_insert on storage.objects;
create policy report_photos_insert on storage.objects
  for insert to authenticated, anon
  with check (bucket_id = 'report-photos' and (storage.foldername(name))[1] = public.current_user_id());
drop policy if exists report_photos_delete on storage.objects;
create policy report_photos_delete on storage.objects
  for delete to authenticated, anon
  using (bucket_id = 'report-photos' and (storage.foldername(name))[1] = public.current_user_id());
