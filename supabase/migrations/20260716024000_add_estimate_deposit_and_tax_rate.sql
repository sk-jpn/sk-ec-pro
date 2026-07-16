alter table public.estimates
  add column if not exists deposit integer not null default 0 check (deposit >= 0);

alter table public.estimates
  add column if not exists tax_rate integer not null default 0 check (tax_rate in (0, 8, 10));

update public.estimates set china_shipping_fee = 0 where china_shipping_fee <> 0;
