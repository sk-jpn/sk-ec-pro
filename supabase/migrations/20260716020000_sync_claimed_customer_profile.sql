create or replace function public.claim_customer_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_customer record;
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

  select
    nullif(btrim(c.name), '') as name,
    nullif(btrim(c.phone), '') as phone,
    nullif(btrim(c.postal_code), '') as postal_code,
    nullif(btrim(c.prefecture), '') as prefecture,
    nullif(btrim(c.address_line1), '') as address_line1,
    nullif(btrim(c.address_line2), '') as address_line2
  into v_customer
  from public.customers c
  where c.auth_user_id = v_user_id
  order by c.created_at desc
  limit 1;

  insert into public.profiles (
    id, full_name, email, phone, postal_code, prefecture,
    address_line1, address_line2
  )
  values (
    v_user_id,
    coalesce(v_customer.name, ''),
    v_email,
    v_customer.phone,
    v_customer.postal_code,
    v_customer.prefecture,
    v_customer.address_line1,
    v_customer.address_line2
  )
  on conflict (id) do update
  set
    full_name = coalesce(v_customer.name, public.profiles.full_name),
    email = v_email,
    phone = coalesce(v_customer.phone, public.profiles.phone),
    postal_code = coalesce(v_customer.postal_code, public.profiles.postal_code),
    prefecture = coalesce(v_customer.prefecture, public.profiles.prefecture),
    address_line1 = coalesce(v_customer.address_line1, public.profiles.address_line1),
    address_line2 = coalesce(v_customer.address_line2, public.profiles.address_line2),
    updated_at = now();
end;
$$;

revoke all on function public.claim_customer_account() from public;
revoke all on function public.claim_customer_account() from anon;
grant execute on function public.claim_customer_account() to authenticated;
