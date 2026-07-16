-- The form email is a reply address only. When the request is authenticated,
-- link the new customer/estimate directly to the Google-authenticated user.

create or replace function public.create_estimate(
  p_name text, p_company text, p_email text, p_phone text, p_prefecture text,
  p_shipping_method text, p_remarks text, p_items jsonb
)
returns table (estimate_id uuid, estimate_no text)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
  v_estimate_id uuid;
  v_estimate_no text;
  v_auth_user_id uuid := auth.uid();
  v_prefix text := 'SK' || to_char(timezone('Asia/Tokyo', now()), 'YYMMDD') || '-';
  v_sequence integer;
begin
  if p_name is null or btrim(p_name) = '' or p_email is null or btrim(p_email) = '' then
    raise exception 'name and email are required';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 10 then
    raise exception 'items must contain between 1 and 10 products';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) item
    where coalesce(btrim(item->>'url'), '') = ''
      and coalesce((item->>'image_count')::integer, 0) < 1
  ) then
    raise exception 'each item requires a url or image';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_prefix));
  select coalesce(max(right(e.estimate_no, 4)::integer), 0) + 1
    into v_sequence
  from public.estimates e
  where e.estimate_no like v_prefix || '%';
  v_estimate_no := v_prefix || lpad(v_sequence::text, 4, '0');

  insert into public.customers (name, company, email, phone, prefecture, auth_user_id)
  values (p_name, nullif(p_company, ''), p_email, nullif(p_phone, ''), p_prefecture, v_auth_user_id)
  returning id into v_customer_id;

  insert into public.estimates (estimate_no, customer_id, shipping_method, remarks)
  values (v_estimate_no, v_customer_id, nullif(p_shipping_method, ''), nullif(p_remarks, ''))
  returning id into v_estimate_id;

  insert into public.estimate_items (estimate_id, item_index, url, quantity, color, size, model, request)
  select
    v_estimate_id,
    ordinality::integer,
    coalesce(item->>'url', ''),
    (item->>'quantity')::integer,
    nullif(item->>'color', ''),
    nullif(item->>'size', ''),
    nullif(item->>'model', ''),
    coalesce(item->>'request', '')
  from jsonb_array_elements(p_items) with ordinality as entries(item, ordinality);

  return query select v_estimate_id, v_estimate_no;
end;
$$;

revoke all on function public.create_estimate(text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.create_estimate(text, text, text, text, text, text, text, jsonb) to anon, authenticated;

comment on function public.create_estimate(text, text, text, text, text, text, text, jsonb) is
  'Creates an estimate and links it to auth.uid when submitted by a Google-authenticated user; p_email remains the reply address.';
