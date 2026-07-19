alter table public.stay_calendar_feeds
  drop constraint if exists stay_calendar_feeds_listing_id_key;

alter table public.stay_calendar_feeds
  add column if not exists name text not null default 'Airbnbカレンダー';

create index if not exists stay_calendar_feeds_listing_idx
  on public.stay_calendar_feeds(listing_id, created_at);

comment on column public.stay_calendar_feeds.name is
  'Admin-facing label used to distinguish multiple calendar feeds for one listing.';
