alter table public.stay_bookings
  drop constraint if exists stay_bookings_payment_method_check;

alter table public.stay_bookings
  add constraint stay_bookings_payment_method_check
  check (payment_method in ('bank_transfer','stripe_card','cash','card_manual','other'));

alter table public.stay_bookings
  add column if not exists stripe_checkout_session_id text;

create unique index if not exists stay_bookings_stripe_session_idx
  on public.stay_bookings(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
