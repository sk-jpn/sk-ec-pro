alter table public.customers
  add column if not exists deposit_balance integer not null default 0 check (deposit_balance >= 0);
