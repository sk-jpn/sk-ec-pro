alter table public.estimates add column if not exists quote_issue_date date not null default current_date;
alter table public.estimates add column if not exists valid_until date;
alter table public.estimates add column if not exists payment_method text not null default '銀行振込';
alter table public.estimates add column if not exists china_shipping_fee integer not null default 0;
alter table public.estimates add column if not exists international_shipping_fee integer not null default 0;
alter table public.estimates add column if not exists agency_fee integer not null default 0;
alter table public.estimates add column if not exists other_fee integer not null default 0;
alter table public.estimates add column if not exists discount integer not null default 0;
alter table public.estimates add column if not exists tax integer not null default 0;

alter table public.estimates drop constraint if exists estimates_china_shipping_fee_check;
alter table public.estimates add constraint estimates_china_shipping_fee_check check (china_shipping_fee >= 0);
alter table public.estimates drop constraint if exists estimates_international_shipping_fee_check;
alter table public.estimates add constraint estimates_international_shipping_fee_check check (international_shipping_fee >= 0);
alter table public.estimates drop constraint if exists estimates_agency_fee_check;
alter table public.estimates add constraint estimates_agency_fee_check check (agency_fee >= 0);
alter table public.estimates drop constraint if exists estimates_other_fee_check;
alter table public.estimates add constraint estimates_other_fee_check check (other_fee >= 0);
alter table public.estimates drop constraint if exists estimates_discount_check;
alter table public.estimates add constraint estimates_discount_check check (discount >= 0);
alter table public.estimates drop constraint if exists estimates_tax_check;
alter table public.estimates add constraint estimates_tax_check check (tax >= 0);

alter table public.estimate_items add column if not exists product_name text;
alter table public.estimate_items add column if not exists unit_price integer not null default 0;
alter table public.estimate_items drop constraint if exists estimate_items_unit_price_check;
alter table public.estimate_items add constraint estimate_items_unit_price_check check (unit_price >= 0);
