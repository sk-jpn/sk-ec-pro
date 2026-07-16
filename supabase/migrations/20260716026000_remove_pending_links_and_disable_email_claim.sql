drop table if exists public.pending_customer_links;

create or replace function public.claim_customer_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_auth_email text;
  v_customer record;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select lower(btrim(u.email))
    into v_auth_email
  from auth.users u
  where u.id = v_user_id
    and u.email_confirmed_at is not null;

  if v_auth_email is null or v_auth_email = '' then
    raise exception 'verified email required' using errcode = '28000';
  end if;

  select
    nullif(btrim(c.name), '') as name,
    lower(btrim(c.email)) as contact_email,
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

  if not found then
    raise exception 'customer account not linked' using errcode = '28000';
  end if;

  insert into public.profiles (
    id, full_name, email, phone, postal_code, prefecture,
    address_line1, address_line2
  )
  values (
    v_user_id,
    coalesce(v_customer.name, ''),
    coalesce(v_customer.contact_email, v_auth_email),
    v_customer.phone,
    v_customer.postal_code,
    v_customer.prefecture,
    v_customer.address_line1,
    v_customer.address_line2
  )
  on conflict (id) do update
  set
    full_name = coalesce(v_customer.name, public.profiles.full_name),
    email = coalesce(v_customer.contact_email, public.profiles.email),
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

create or replace function public.change_estimate_customer(
  p_estimate_id uuid,
  p_customer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.customers
    where id = p_customer_id and auth_user_id is not null
  ) then
    raise exception 'linked customer not found';
  end if;

  update public.estimates
  set customer_id = p_customer_id
  where id = p_estimate_id;
  if not found then raise exception 'estimate not found'; end if;

  update public.orders
  set customer_id = p_customer_id, updated_at = now()
  where estimate_id = p_estimate_id;
end;
$$;

revoke all on function public.change_estimate_customer(uuid, uuid) from public;
revoke all on function public.change_estimate_customer(uuid, uuid) from anon;
revoke all on function public.change_estimate_customer(uuid, uuid) from authenticated;
grant execute on function public.change_estimate_customer(uuid, uuid) to service_role;
