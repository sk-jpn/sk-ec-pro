-- Store a stable Supabase Storage object URL alongside the private object path.
-- UI and email delivery continue to use short-lived signed URLs because the
-- estimate-images bucket is private.

alter table public.estimate_item_images
  add column if not exists image_url text;

comment on column public.estimate_item_images.image_url is
  'Stable Supabase Storage object URL. Access-controlled views must use a signed URL generated from storage_path.';
