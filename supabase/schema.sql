-- SK EC Pro schema snapshot (reference only).
-- Production changes must be applied from supabase/migrations with `supabase db push`.

create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text,
  email text not null,
  phone text,
  postal_code text,
  prefecture text not null,
  address_line1 text,
  address_line2 text,
  deposit_balance integer not null default 0 check (deposit_balance >= 0),
  auth_user_id uuid references auth.users(id) on delete set null
);

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  estimate_no text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  status text not null default '新規' check (status in ('新規', '見積作成中', 'お客様確認中', 'approved', 'paid', '発注済', '中国発送', '国際配送中', '国内発送', '完了', 'キャンセル')),
  approved_at timestamptz,
  paid_at timestamptz,
  memo text,
  quote_issue_date date not null default current_date,
  valid_until date,
  payment_method text not null default '銀行振込',
  payment_fee integer not null default 0 check (payment_fee >= 0),
  stripe_checkout_session_id text,
  china_shipping_fee integer not null default 0 check (china_shipping_fee >= 0),
  deposit integer not null default 0 check (deposit >= 0),
  international_shipping_fee integer not null default 0 check (international_shipping_fee >= 0),
  agency_fee integer not null default 0 check (agency_fee >= 0),
  other_fee integer not null default 0 check (other_fee >= 0),
  discount integer not null default 0 check (discount >= 0),
  tax integer not null default 0 check (tax >= 0),
  tax_rate integer not null default 0 check (tax_rate in (0, 8, 10)),
  shipping_method text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 既存環境を新しい案件ステータスへ移行します。
alter table public.estimates add column if not exists memo text;
alter table public.estimates add column if not exists approved_at timestamptz;
alter table public.estimates add column if not exists paid_at timestamptz;
alter table public.estimates add column if not exists quote_issue_date date not null default current_date;
alter table public.estimates add column if not exists valid_until date;
alter table public.estimates add column if not exists payment_method text not null default '銀行振込';
alter table public.estimates add column if not exists payment_fee integer not null default 0;
alter table public.estimates add column if not exists stripe_checkout_session_id text;
alter table public.estimates add column if not exists china_shipping_fee integer not null default 0;
alter table public.estimates add column if not exists deposit integer not null default 0;
alter table public.estimates add column if not exists international_shipping_fee integer not null default 0;
alter table public.estimates add column if not exists agency_fee integer not null default 0;
alter table public.estimates add column if not exists other_fee integer not null default 0;
alter table public.estimates add column if not exists discount integer not null default 0;
alter table public.estimates add column if not exists tax integer not null default 0;
alter table public.estimates add column if not exists tax_rate integer not null default 0;
alter table public.estimates drop constraint if exists estimates_status_check;
alter table public.estimates alter column status set default '新規';
update public.estimates
set status = case status
  when '未対応' then '新規'
  when '対応中' then '見積作成中'
  when '見積送付済' then 'お客様確認中'
  when '注文確定' then '発注済'
  when '購入済' then '発注済'
  when '中国倉庫' then '中国発送'
  when '国際発送済' then '国際配送中'
  else status
end
where status in ('未対応', '対応中', '見積送付済', '注文確定', '購入済', '中国倉庫', '国際発送済');
alter table public.estimates
  add constraint estimates_status_check
  check (status in ('新規', '見積作成中', 'お客様確認中', 'approved', 'paid', '発注済', '中国発送', '国際配送中', '国内発送', '完了', 'キャンセル'));

create table if not exists public.estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  url text not null default '',
  item_index integer not null default 1,
  quantity integer not null check (quantity >= 1),
  color text,
  size text,
  model text,
  request text not null
);

alter table public.estimate_items add column if not exists product_name text;
alter table public.estimate_items add column if not exists unit_price integer not null default 0;

create table if not exists public.estimate_item_images (
  id uuid primary key default gen_random_uuid(),
  estimate_item_id uuid not null references public.estimate_items(id) on delete cascade,
  storage_path text not null unique,
  image_url text,
  original_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  sort_order integer not null check (sort_order between 1 and 10),
  created_at timestamptz not null default now(),
  unique (estimate_item_id, sort_order)
);

create index if not exists estimates_customer_id_idx on public.estimates(customer_id);
create index if not exists estimates_created_at_idx on public.estimates(created_at desc);
create index if not exists estimate_items_estimate_id_idx on public.estimate_items(estimate_id);
create index if not exists customers_auth_user_id_idx on public.customers(auth_user_id);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', email text not null, phone text,
  postal_code text, prefecture text, address_line1 text, address_line2 text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), order_no text not null unique,
  estimate_id uuid not null unique references public.estimates(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  shipping_status text not null default '受付', carrier text, tracking_number text,
  ordered_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

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

-- 顧客・見積・商品を同一トランザクションで登録します。
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
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 10 then
    raise exception 'items must contain between 1 and 10 products';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_prefix));
  select coalesce(max(right(e.estimate_no, 4)::integer), 0) + 1
    into v_sequence
    from public.estimates e
    where e.estimate_no like v_prefix || '%';
  v_estimate_no := v_prefix || lpad(v_sequence::text, 4, '0');

  insert into public.customers (name, company, email, phone, prefecture)
  values (p_name, nullif(p_company, ''), p_email, nullif(p_phone, ''), p_prefecture)
  returning id into v_customer_id;

  insert into public.estimates (estimate_no, customer_id, shipping_method, remarks)
  values (v_estimate_no, v_customer_id, nullif(p_shipping_method, ''), nullif(p_remarks, ''))
  returning id into v_estimate_id;

  insert into public.estimate_items (estimate_id, item_index, url, quantity, color, size, model, request)
  select
    v_estimate_id,
    ordinality::integer,
    coalesce(item->>'url', ''),
    (item->>'quantity')::integer,
    nullif(item->>'color', ''),
    nullif(item->>'size', ''),
    nullif(item->>'model', ''),
    coalesce(item->>'request', '')
  from jsonb_array_elements(p_items) with ordinality as entries(item, ordinality);

  return query select v_estimate_id, v_estimate_no;
end;
$$;

alter table public.customers enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_items enable row level security;
alter table public.estimate_item_images enable row level security;

drop policy if exists "temporary admin read customers" on public.customers;
drop policy if exists "temporary admin read estimates" on public.estimates;
drop policy if exists "temporary admin read estimate items" on public.estimate_items;

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
create policy "customers_select_own" on public.customers for select to authenticated
  using ((select auth.uid()) is not null and auth_user_id = (select auth.uid()));
create policy "estimates_select_own" on public.estimates for select to authenticated
  using (customer_id in (select id from public.customers where auth_user_id = (select auth.uid())));
create policy "estimate_items_select_own" on public.estimate_items for select to authenticated
  using (estimate_id in (select e.id from public.estimates e join public.customers c on c.id = e.customer_id where c.auth_user_id = (select auth.uid())));
create policy "estimate_item_images_select_own" on public.estimate_item_images for select to authenticated
  using (estimate_item_id in (select i.id from public.estimate_items i join public.estimates e on e.id = i.estimate_id join public.customers c on c.id = e.customer_id where c.auth_user_id = (select auth.uid())));
create policy "orders_select_own" on public.orders for select to authenticated
  using (customer_id in (select id from public.customers where auth_user_id = (select auth.uid())));
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke all on function public.create_estimate(text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.create_estimate(text, text, text, text, text, text, text, jsonb) to anon, authenticated;
grant select on public.customers, public.estimates, public.estimate_items, public.orders to authenticated;
grant select on public.estimate_item_images to authenticated;
grant select, insert, update on public.profiles to authenticated;
