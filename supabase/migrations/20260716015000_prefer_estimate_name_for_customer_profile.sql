-- Customer profile names must come from the estimate form, not Google profile
-- metadata. This also fixes legacy anonymous estimates claimed on first login.

create or replace function public.claim_customer_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_customer_name text;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select lower(btrim(u.email))
    into v_email
  from auth.users u
  where u.id = v_user_id
    and u.email_confirmed_at is not null;

  if v_email is null or v_email = '' then
    raise exception 'verified email required' using errcode = '28000';
  end if;

  update public.customers
  set auth_user_id = v_user_id
  where lower(btrim(email)) = v_email
    and (auth_user_id is null or auth_user_id = v_user_id);

  select nullif(btrim(c.name), '')
    into v_customer_name
  from public.customers c
  where c.auth_user_id = v_user_id
  order by c.created_at desc
  limit 1;

  insert into public.profiles (id, full_name, email)
  values (v_user_id, coalesce(v_customer_name, ''), v_email)
  on conflict (id) do update
  set
    full_name = coalesce(v_customer_name, public.profiles.full_name),
    updated_at = now();
end;
$$;

revoke all on function public.claim_customer_account() from public;
revoke all on function public.claim_customer_account() from anon;
grant execute on function public.claim_customer_account() to authenticated;

comment on function public.claim_customer_account() is
  'Claims matching legacy customers and uses the latest estimate form customer name for the profile.';
