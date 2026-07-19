drop index if exists public.stay_blocked_dates_feed_uid_idx;

alter table public.stay_blocked_dates
  drop constraint if exists stay_blocked_dates_feed_uid_key;

alter table public.stay_blocked_dates
  add constraint stay_blocked_dates_feed_uid_key
  unique (calendar_feed_id, external_uid);
