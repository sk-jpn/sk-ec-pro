alter table public.stay_ride_bookings alter column card_fee_rate set default 0;

update public.stay_ride_bookings
set card_fee_rate = 0,
    card_fee_amount = 0,
    updated_at = now()
where payment_status = 'unpaid';

