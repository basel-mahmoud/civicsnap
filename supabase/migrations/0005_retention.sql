-- Data retention: purge rejected reports after 90 days. Callable by a scheduled
-- job (pg_cron) or an admin task. SECURITY DEFINER so it can delete past RLS.
create or replace function public.purge_expired()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.reports
   where status = 'rejected'
     and updated_at < now() - interval '90 days';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.purge_expired() from public, anon, authenticated;

-- To schedule (after enabling pg_cron):
--   select cron.schedule('purge-expired', '0 3 * * *', 'select public.purge_expired()');
