create table if not exists public.form_submission_rate_limits (
  form_key text not null check (form_key in ('contact', 'estimate')),
  ip_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (form_key, ip_hash, window_started_at)
);

alter table public.form_submission_rate_limits enable row level security;
revoke all on table public.form_submission_rate_limits from public, anon, authenticated;

create or replace function public.check_form_submission_rate_limit(
  p_form_key text,
  p_ip_hash text,
  p_limit integer default 3
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_window timestamptz := date_trunc('minute', clock_timestamp());
  accepted integer;
begin
  if p_form_key not in ('contact', 'estimate') or p_ip_hash !~ '^[0-9a-f]{64}$' or p_limit < 1 then
    return false;
  end if;

  delete from public.form_submission_rate_limits where window_started_at < current_window - interval '1 day';

  insert into public.form_submission_rate_limits (form_key, ip_hash, window_started_at, request_count)
  values (p_form_key, p_ip_hash, current_window, 1)
  on conflict (form_key, ip_hash, window_started_at)
  do update set request_count = public.form_submission_rate_limits.request_count + 1
  where public.form_submission_rate_limits.request_count < p_limit
  returning request_count into accepted;

  return accepted is not null;
end;
$$;

revoke all on function public.check_form_submission_rate_limit(text, text, integer) from public, anon, authenticated;
grant execute on function public.check_form_submission_rate_limit(text, text, integer) to service_role;
