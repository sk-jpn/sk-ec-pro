alter table public.customers add column if not exists postal_code text;
alter table public.customers add column if not exists address_line1 text;
alter table public.customers add column if not exists address_line2 text;

update public.customers c
set
  phone = coalesce(nullif(c.phone, ''), p.phone),
  postal_code = p.postal_code,
  prefecture = coalesce(nullif(p.prefecture, ''), c.prefecture),
  address_line1 = p.address_line1,
  address_line2 = p.address_line2
from public.profiles p
where c.auth_user_id = p.id;
