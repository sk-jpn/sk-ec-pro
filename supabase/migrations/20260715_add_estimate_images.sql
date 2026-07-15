alter table public.estimate_items alter column url drop not null;
alter table public.estimate_items alter column url set default '';
alter table public.estimate_items add column if not exists item_index integer not null default 1;

create table if not exists public.estimate_item_images (
  id uuid primary key default gen_random_uuid(),
  estimate_item_id uuid not null references public.estimate_items(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  sort_order integer not null check (sort_order between 1 and 10),
  created_at timestamptz not null default now(),
  unique (estimate_item_id, sort_order)
);

create index if not exists estimate_item_images_item_id_idx on public.estimate_item_images(estimate_item_id);
alter table public.estimate_item_images enable row level security;

create policy "estimate_item_images_select_own" on public.estimate_item_images for select to authenticated
  using (estimate_item_id in (
    select i.id from public.estimate_items i
    join public.estimates e on e.id = i.estimate_id
    join public.customers c on c.id = e.customer_id
    where c.auth_user_id = (select auth.uid())
  ));
grant select on public.estimate_item_images to authenticated;
grant all on public.estimate_item_images to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('estimate-images', 'estimate-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.create_estimate(
  p_name text, p_company text, p_email text, p_phone text, p_prefecture text,
  p_shipping_method text, p_remarks text, p_items jsonb
)
returns table (estimate_id uuid, estimate_no text)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid; v_estimate_id uuid; v_estimate_no text;
  v_prefix text := 'SK' || to_char(timezone('Asia/Tokyo', now()), 'YYMMDD') || '-';
  v_sequence integer;
begin
  if p_name is null or btrim(p_name) = '' or p_email is null or btrim(p_email) = '' then raise exception 'name and email are required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 10 then raise exception 'items must contain between 1 and 10 products'; end if;
  if exists (select 1 from jsonb_array_elements(p_items) item where coalesce(btrim(item->>'url'), '') = '' and coalesce((item->>'image_count')::integer, 0) < 1) then raise exception 'each item requires a url or image'; end if;

  perform pg_advisory_xact_lock(hashtext(v_prefix));
  select coalesce(max(right(e.estimate_no, 4)::integer), 0) + 1 into v_sequence from public.estimates e where e.estimate_no like v_prefix || '%';
  v_estimate_no := v_prefix || lpad(v_sequence::text, 4, '0');
  insert into public.customers (name, company, email, phone, prefecture) values (p_name, nullif(p_company, ''), p_email, nullif(p_phone, ''), p_prefecture) returning id into v_customer_id;
  insert into public.estimates (estimate_no, customer_id, shipping_method, remarks) values (v_estimate_no, v_customer_id, nullif(p_shipping_method, ''), nullif(p_remarks, '')) returning id into v_estimate_id;
  insert into public.estimate_items (estimate_id, item_index, url, quantity, color, size, model, request)
  select v_estimate_id, ordinality::integer, coalesce(item->>'url', ''), (item->>'quantity')::integer,
    nullif(item->>'color', ''), nullif(item->>'size', ''), nullif(item->>'model', ''), coalesce(item->>'request', '')
  from jsonb_array_elements(p_items) with ordinality as entries(item, ordinality);
  return query select v_estimate_id, v_estimate_no;
end;
$$;
