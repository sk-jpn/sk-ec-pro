-- Initial SK EC Pro schema.
-- This migration intentionally contains only the original core tables.
-- Later migrations add the current estimate, account, payment, and image features.

create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text,
  email text not null,
  phone text,
  prefecture text not null
);

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  estimate_no text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  status text not null default '未対応',
  shipping_method text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  url text not null,
  quantity integer not null check (quantity >= 1),
  color text,
  size text,
  model text,
  request text not null default ''
);

create index if not exists estimates_customer_id_idx
  on public.estimates (customer_id);

create index if not exists estimates_created_at_idx
  on public.estimates (created_at desc);

create index if not exists estimate_items_estimate_id_idx
  on public.estimate_items (estimate_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists estimates_set_updated_at on public.estimates;
create trigger estimates_set_updated_at
  before update on public.estimates
  for each row execute function public.set_updated_at();

create or replace function public.create_estimate(
  p_name text,
  p_company text,
  p_email text,
  p_phone text,
  p_prefecture text,
  p_shipping_method text,
  p_remarks text,
  p_items jsonb
)
returns table (estimate_id uuid, estimate_no text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
  v_estimate_id uuid;
  v_estimate_no text;
  v_prefix text := 'SK' || to_char(timezone('Asia/Tokyo', now()), 'YYMMDD') || '-';
  v_sequence integer;
begin
  if p_name is null or btrim(p_name) = '' or p_email is null or btrim(p_email) = '' then
    raise exception 'name and email are required';
  end if;

  if jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 10 then
    raise exception 'items must contain between 1 and 10 products';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_prefix));

  select coalesce(max(right(e.estimate_no, 4)::integer), 0) + 1
  into v_sequence
  from public.estimates as e
  where e.estimate_no like v_prefix || '%';

  v_estimate_no := v_prefix || lpad(v_sequence::text, 4, '0');

  insert into public.customers (name, company, email, phone, prefecture)
  values (
    btrim(p_name),
    nullif(btrim(p_company), ''),
    lower(btrim(p_email)),
    nullif(btrim(p_phone), ''),
    btrim(p_prefecture)
  )
  returning id into v_customer_id;

  insert into public.estimates (
    estimate_no,
    customer_id,
    shipping_method,
    remarks
  )
  values (
    v_estimate_no,
    v_customer_id,
    nullif(btrim(p_shipping_method), ''),
    nullif(btrim(p_remarks), '')
  )
  returning id into v_estimate_id;

  insert into public.estimate_items (
    estimate_id,
    url,
    quantity,
    color,
    size,
    model,
    request
  )
  select
    v_estimate_id,
    item ->> 'url',
    (item ->> 'quantity')::integer,
    nullif(item ->> 'color', ''),
    nullif(item ->> 'size', ''),
    nullif(item ->> 'model', ''),
    coalesce(item ->> 'request', '')
  from jsonb_array_elements(p_items) as entries(item);

  return query select v_estimate_id, v_estimate_no;
end;
$$;

revoke all on function public.create_estimate(
  text, text, text, text, text, text, text, jsonb
) from public;

grant execute on function public.create_estimate(
  text, text, text, text, text, text, text, jsonb
) to anon, authenticated;

