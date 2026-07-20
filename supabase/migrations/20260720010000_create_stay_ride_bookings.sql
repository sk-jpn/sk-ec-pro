create table if not exists public.stay_ride_settings (
  id boolean primary key default true check (id),
  discount_percent numeric(5,2) not null default 30 check (discount_percent between 0 and 100),
  initial_distance_meters integer not null default 1000 check (initial_distance_meters > 0),
  initial_fare integer not null default 500 check (initial_fare >= 0),
  additional_distance_meters integer not null default 232 check (additional_distance_meters > 0),
  additional_fare integer not null default 100 check (additional_fare >= 0),
  night_multiplier numeric(4,2) not null default 1.2 check (night_multiplier >= 1),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.stay_ride_settings (id) values (true) on conflict (id) do nothing;

create sequence if not exists public.stay_ride_booking_number_seq;

create or replace function public.next_stay_ride_booking_number(p_ride_date date)
returns text language sql security definer set search_path = public as $$
  select 'RD-' || to_char(p_ride_date, 'YYYYMMDD') || '-' || lpad(nextval('public.stay_ride_booking_number_seq')::text, 4, '0');
$$;
revoke all on function public.next_stay_ride_booking_number(date) from public, anon, authenticated;

create table if not exists public.stay_ride_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique,
  customer_id uuid not null references public.stay_customers(id) on delete cascade,
  stay_booking_id uuid references public.stay_bookings(id) on delete set null,
  ride_date date not null,
  departure_time time not null,
  pickup_address text not null,
  destination_address text not null,
  distance_meters integer not null check (distance_meters >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  meter_fare integer not null check (meter_fare >= 0),
  discount_percent numeric(5,2) not null check (discount_percent between 0 and 100),
  discount_amount integer not null check (discount_amount >= 0),
  total_amount integer not null check (total_amount >= 0),
  is_night boolean not null default false,
  status text not null default 'requested' check (status in ('requested','confirmed','completed','customer_cancelled','admin_cancelled')),
  pricing_snapshot jsonb not null default '{}'::jsonb,
  admin_memo text,
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stay_ride_bookings_customer_idx on public.stay_ride_bookings(customer_id, ride_date desc);
create index if not exists stay_ride_bookings_date_idx on public.stay_ride_bookings(ride_date, departure_time);

alter table public.stay_ride_settings enable row level security;
alter table public.stay_ride_bookings enable row level security;

drop policy if exists "Customers can view own ride bookings" on public.stay_ride_bookings;
create policy "Customers can view own ride bookings" on public.stay_ride_bookings
for select to authenticated using (
  customer_id in (select id from public.stay_customers where auth_user_id = auth.uid())
);

grant select on public.stay_ride_settings to authenticated;
grant select on public.stay_ride_bookings to authenticated;
