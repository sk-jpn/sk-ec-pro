alter table public.stay_bookings
  add column if not exists card_fee_rate numeric(5,2) not null default 3.60,
  add column if not exists card_fee_amount integer not null default 0;

alter table public.stay_bookings
  drop constraint if exists stay_bookings_card_fee_rate_check,
  drop constraint if exists stay_bookings_card_fee_amount_check;

alter table public.stay_bookings
  add constraint stay_bookings_card_fee_rate_check check (card_fee_rate between 0 and 100),
  add constraint stay_bookings_card_fee_amount_check check (card_fee_amount >= 0);
