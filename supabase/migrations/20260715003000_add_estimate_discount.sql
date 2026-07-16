alter table public.estimates add column if not exists discount integer not null default 0;
alter table public.estimates drop constraint if exists estimates_discount_check;
alter table public.estimates add constraint estimates_discount_check check (discount >= 0);
