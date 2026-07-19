create table if not exists public.stay_building_images (
  building_code text primary key check (building_code in ('F322', 'F321', 'F443')),
  storage_path text not null unique,
  alt_text text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.stay_building_images enable row level security;

drop policy if exists stay_building_images_public_read on public.stay_building_images;
create policy stay_building_images_public_read on public.stay_building_images for select using (true);

grant select on public.stay_building_images to anon, authenticated;
grant all on public.stay_building_images to service_role;
