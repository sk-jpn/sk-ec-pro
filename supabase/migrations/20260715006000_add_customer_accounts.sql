-- Customer My Page: profiles, ownership, orders, and strict RLS.

alter table public.customers add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create index if not exists customers_auth_user_id_idx on public.customers(auth_user_id);
create index if not exists customers_email_lower_idx on public.customers(lower(email));

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  postal_code text,
  prefecture text,
  address_line1 text,
  address_line2 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  estimate_id uuid not null unique references public.estimates(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  shipping_status text not null default '受付',
  carrier text,
  tracking_number text,
  ordered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.claim_customer_account()
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_name text;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;

  select u.email, coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')
    into v_email, v_name
    from auth.users u where u.id = v_user_id;
  if v_email is null then raise exception 'verified email required'; end if;

  insert into public.profiles (id, full_name, email)
  values (v_user_id, v_name, v_email)
  on conflict (id) do update set email = excluded.email;

  update public.customers
    set auth_user_id = v_user_id
    where lower(email) = lower(v_email)
      and (auth_user_id is null or auth_user_id = v_user_id);
end;
$$;

revoke all on function public.claim_customer_account() from public;
grant execute on function public.claim_customer_account() to authenticated;

create or replace function public.sync_order_from_estimate()
returns trigger
language plpgsql
security definer set search_path = public, pg_temp
as $$
begin
  if new.status in ('approved', 'paid', '発注済', '中国発送', '国際配送中', '国内発送', '完了') then
    insert into public.orders (
      order_no, estimate_id, customer_id, payment_status, shipping_status, ordered_at
    ) values (
      'ORD-' || new.estimate_no,
      new.id,
      new.customer_id,
      case when new.status = 'paid' or new.paid_at is not null then 'paid' else 'unpaid' end,
      case new.status
        when '中国発送' then '中国発送'
        when '国際配送中' then '国際配送'
        when '国内発送' then '国内発送'
        when '完了' then '完了'
        else '受付'
      end,
      coalesce(new.approved_at, new.updated_at, now())
    )
    on conflict (estimate_id) do update set
      payment_status = excluded.payment_status,
      shipping_status = excluded.shipping_status,
      updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists estimates_sync_order on public.estimates;
create trigger estimates_sync_order
  after insert or update of status, paid_at, approved_at on public.estimates
  for each row execute function public.sync_order_from_estimate();

insert into public.orders (order_no, estimate_id, customer_id, payment_status, shipping_status, ordered_at)
select
  'ORD-' || e.estimate_no,
  e.id,
  e.customer_id,
  case when e.status = 'paid' or e.paid_at is not null then 'paid' else 'unpaid' end,
  case e.status
    when '中国発送' then '中国発送'
    when '国際配送中' then '国際配送'
    when '国内発送' then '国内発送'
    when '完了' then '完了'
    else '受付'
  end,
  coalesce(e.approved_at, e.updated_at, now())
from public.estimates e
where e.status in ('approved', 'paid', '発注済', '中国発送', '国際配送中', '国内発送', '完了')
on conflict (estimate_id) do nothing;

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.customers enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_items enable row level security;

drop policy if exists "temporary admin read customers" on public.customers;
drop policy if exists "temporary admin read estimates" on public.estimates;
drop policy if exists "temporary admin read estimate items" on public.estimate_items;
drop policy if exists "customers_select_own" on public.customers;
drop policy if exists "estimates_select_own" on public.estimates;
drop policy if exists "estimate_items_select_own" on public.estimate_items;
drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "customers_select_own" on public.customers for select to authenticated
  using ((select auth.uid()) is not null and auth_user_id = (select auth.uid()));
create policy "estimates_select_own" on public.estimates for select to authenticated
  using (customer_id in (select id from public.customers where auth_user_id = (select auth.uid())));
create policy "estimate_items_select_own" on public.estimate_items for select to authenticated
  using (estimate_id in (
    select e.id from public.estimates e
    join public.customers c on c.id = e.customer_id
    where c.auth_user_id = (select auth.uid())
  ));
create policy "orders_select_own" on public.orders for select to authenticated
  using (customer_id in (select id from public.customers where auth_user_id = (select auth.uid())));
create policy "profiles_select_own" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke select on public.customers, public.estimates, public.estimate_items from anon;
grant select on public.customers, public.estimates, public.estimate_items, public.orders to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles, public.orders to service_role;

revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.sync_order_from_estimate() from public;
