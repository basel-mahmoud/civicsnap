-- Idempotency for report creation: a per-reporter key makes retries safe.
alter table public.reports
  add column if not exists idempotency_key uuid not null default gen_random_uuid();

-- Unique per reporter so a retried submission upserts the same row instead of
-- creating a duplicate. (Null reporter_id rows are treated as distinct.)
create unique index if not exists reports_reporter_idem_idx
  on public.reports (reporter_id, idempotency_key);

comment on column public.reports.idempotency_key is
  'Client-generated key; (reporter_id, idempotency_key) is unique so create is idempotent under retry.';
