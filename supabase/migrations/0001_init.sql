-- CivicSnap core schema
-- Tables: profiles, reports, upvotes, status_events, comments
-- plus helper functions and triggers.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created automatically on signup.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role         text not null default 'resident' check (role in ('resident', 'admin')),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- reports: the civic issues themselves.
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid references auth.users (id) on delete set null,
  title         text not null check (char_length(title) between 1 and 140),
  description   text check (char_length(description) <= 2000),
  category      text not null default 'other'
                  check (category in ('pothole','streetlight','graffiti','trash','water','sign','sidewalk','other')),
  severity      text not null default 'medium'
                  check (severity in ('low','medium','high')),
  status        text not null default 'reported'
                  check (status in ('reported','acknowledged','in_progress','fixed','rejected')),
  lat           double precision not null check (lat between -90 and 90),
  lng           double precision not null check (lng between -180 and 180),
  address       text,
  photo_path    text,
  ai_summary    text,
  ai_confidence numeric(3,2),
  upvote_count  integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists reports_status_idx   on public.reports (status);
create index if not exists reports_category_idx on public.reports (category);
create index if not exists reports_created_idx  on public.reports (created_at desc);
create index if not exists reports_reporter_idx on public.reports (reporter_id);

-- ---------------------------------------------------------------------------
-- upvotes: one per (report, user). upvote_count on reports is kept in sync.
-- ---------------------------------------------------------------------------
create table if not exists public.upvotes (
  report_id  uuid not null references public.reports (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

-- ---------------------------------------------------------------------------
-- status_events: immutable audit trail of every status change.
-- ---------------------------------------------------------------------------
create table if not exists public.status_events (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports (id) on delete cascade,
  status     text not null,
  note       text,
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists status_events_report_idx on public.status_events (report_id, created_at);

-- ---------------------------------------------------------------------------
-- comments: public discussion on a report.
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports (id) on delete cascade,
  author_id  uuid references auth.users (id) on delete set null,
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists comments_report_idx on public.comments (report_id, created_at);

-- ===========================================================================
-- Helper functions
-- ===========================================================================

-- True when the current user has the admin role. SECURITY DEFINER so it can
-- read profiles without being blocked by RLS, and is safe because it only
-- ever reads the caller's own role.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep reports.upvote_count in sync with the upvotes table.
create or replace function public.sync_upvote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.reports set upvote_count = upvote_count + 1 where id = new.report_id;
  elsif (tg_op = 'DELETE') then
    update public.reports set upvote_count = greatest(upvote_count - 1, 0) where id = old.report_id;
  end if;
  return null;
end;
$$;

drop trigger if exists upvotes_count_trigger on public.upvotes;
create trigger upvotes_count_trigger
  after insert or delete on public.upvotes
  for each row execute function public.sync_upvote_count();

-- Touch updated_at and log status changes into status_events.
create or replace function public.handle_report_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.status_events (report_id, status, changed_by, note)
    values (new.id, new.status, new.reporter_id, 'Report created');
    return new;
  end if;

  new.updated_at := now();

  -- Only admins may change status, category, severity or location.
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
    values (new.id, new.status, auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists reports_insert_trigger on public.reports;
create trigger reports_insert_trigger
  after insert on public.reports
  for each row execute function public.handle_report_change();

drop trigger if exists reports_update_trigger on public.reports;
create trigger reports_update_trigger
  before update on public.reports
  for each row execute function public.handle_report_change();

-- Stream report changes to connected clients.
alter publication supabase_realtime add table public.reports;
