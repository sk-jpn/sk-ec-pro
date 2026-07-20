alter table public.stay_ride_bookings drop constraint if exists stay_ride_bookings_status_check;
alter table public.stay_ride_bookings alter column status set default 'admin_reviewing';
update public.stay_ride_bookings set status = 'admin_reviewing' where status = 'requested';
alter table public.stay_ride_bookings add constraint stay_ride_bookings_status_check check (status in ('admin_reviewing','awaiting_guest_confirmation','confirmed','payment_pending','paid','completed','customer_cancelled','admin_cancelled'));
alter table public.stay_ride_bookings add column if not exists fixed_route_id text;
alter table public.stay_ride_bookings add column if not exists trip_type text not null default 'one_way' check (trip_type in ('one_way','round_trip'));
alter table public.stay_ride_bookings add column if not exists payment_status text not null default 'unpaid' check (payment_status in ('unpaid','payment_pending','paid','refunded'));
alter table public.stay_ride_bookings add column if not exists payment_method text;
alter table public.stay_ride_bookings add column if not exists card_fee_rate numeric(5,2) not null default 3.6;
alter table public.stay_ride_bookings add column if not exists card_fee_amount integer not null default 0;
alter table public.stay_ride_bookings add column if not exists stripe_checkout_session_id text;
alter table public.stay_ride_bookings add column if not exists paid_at timestamptz;
alter table public.stay_ride_bookings alter column distance_meters drop not null;
alter table public.stay_ride_bookings alter column meter_fare drop not null;

