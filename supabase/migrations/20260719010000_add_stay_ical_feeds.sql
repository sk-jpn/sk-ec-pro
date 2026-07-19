create table if not exists public.stay_calendar_feeds (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.stay_listings(id) on delete cascade,
  provider text not null default 'airbnb' check (provider in ('airbnb','ical')),
  feed_url text not null check (feed_url ~ '^https://'),
  is_enabled boolean not null default true,
  last_synced_at timestamptz,
  last_sync_status text check (last_sync_status in ('success','failed')),
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stay_blocked_dates
  add column if not exists calendar_feed_id uuid references public.stay_calendar_feeds(id) on delete cascade,
  add column if not exists external_uid text;

create unique index if not exists stay_blocked_dates_feed_uid_idx
  on public.stay_blocked_dates(calendar_feed_id, external_uid)
  where calendar_feed_id is not null and external_uid is not null;

alter table public.stay_calendar_feeds enable row level security;

revoke all on public.stay_calendar_feeds from anon, authenticated;

comment on table public.stay_calendar_feeds is
  'Private iCal feed URLs. Access only through service-role-backed admin server actions.';
