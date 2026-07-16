-- Photos taken after purchased goods arrive at the China logistics warehouse.
-- These are kept separate from the customer's original estimate images.

create table if not exists public.received_item_images (
  id uuid primary key default gen_random_uuid(),
  estimate_item_id uuid not null references public.estimate_items(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  sort_order integer not null check (sort_order between 1 and 2),
  created_at timestamptz not null default now(),
  unique (estimate_item_id, sort_order)
);

create index if not exists received_item_images_item_id_idx
  on public.received_item_images(estimate_item_id);

alter table public.received_item_images enable row level security;

drop policy if exists "received_item_images_select_own" on public.received_item_images;
create policy "received_item_images_select_own"
  on public.received_item_images
  for select
  to authenticated
  using (
    estimate_item_id in (
      select item.id
      from public.estimate_items item
      join public.estimates estimate on estimate.id = item.estimate_id
      join public.customers customer on customer.id = estimate.customer_id
      where customer.auth_user_id = (select auth.uid())
    )
  );

grant select on public.received_item_images to authenticated;
grant all on public.received_item_images to service_role;
