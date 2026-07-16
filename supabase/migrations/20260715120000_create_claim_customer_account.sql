-- Link existing customer records to the currently authenticated Supabase user.
--
-- A customer may have submitted multiple estimates before signing in, so every
-- unclaimed customer row with the same verified email address is linked at once.

alter table public.customers
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create index if not exists customers_auth_user_id_idx
  on public.customers (auth_user_id);

create index if not exists customers_email_lower_idx
  on public.customers (lower(btrim(email)));

create or replace function public.claim_customer_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_full_name text;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select
    lower(btrim(u.email)),
    coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
      ''
    )
  into v_email, v_full_name
  from auth.users as u
  where u.id = v_user_id
    and u.email_confirmed_at is not null;

  if v_email is null or v_email = '' then
    raise exception 'verified email required' using errcode = '28000';
  end if;

  -- Keep the profile in sync even if it was not created by the Auth trigger.
  insert into public.profiles (id, full_name, email)
  values (v_user_id, v_full_name, v_email)
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = case
      when public.profiles.full_name = '' then excluded.full_name
      else public.profiles.full_name
    end,
    updated_at = now();

  -- Never take a customer row that is already owned by another Auth user.
  update public.customers
  set auth_user_id = v_user_id
  where lower(btrim(email)) = v_email
    and (auth_user_id is null or auth_user_id = v_user_id);
end;
$$;

revoke all on function public.claim_customer_account() from public;
revoke all on function public.claim_customer_account() from anon;
grant execute on function public.claim_customer_account() to authenticated;

comment on function public.claim_customer_account() is
  'Claims unowned customer rows whose email matches the current authenticated user verified email.';
