alter table public.stay_ride_bookings add column if not exists distance_fare integer not null default 0 check (distance_fare >= 0);
alter table public.stay_ride_bookings add column if not exists highway_fee integer not null default 0 check (highway_fee >= 0);
alter table public.stay_ride_bookings add column if not exists other_fee integer not null default 0 check (other_fee >= 0);

update public.stay_ride_bookings
set distance_fare = coalesce(meter_fare, total_amount + discount_amount)
where distance_fare = 0;

