create or replace function public.create_manual_estimate(
  p_customer_id uuid,
  p_product_name text,
  p_url text,
  p_quantity integer,
  p_color text,
  p_size text,
  p_model text,
  p_request text
)
returns table (estimate_id uuid, estimate_no text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_estimate_id uuid;
  v_estimate_no text;
  v_prefix text := 'SK' || to_char(timezone('Asia/Tokyo', now()), 'YYMMDD') || '-';
  v_sequence integer;
begin
  if not exists (select 1 from public.customers where id = p_customer_id) then
    raise exception 'customer not found';
  end if;
  if p_quantity < 1 then
    raise exception 'quantity must be greater than zero';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_prefix));
  select coalesce(max(right(e.estimate_no, 4)::integer), 0) + 1
    into v_sequence
    from public.estimates e
    where e.estimate_no like v_prefix || '%';
  v_estimate_no := v_prefix || lpad(v_sequence::text, 4, '0');

  insert into public.estimates (estimate_no, customer_id, status)
  values (v_estimate_no, p_customer_id, '見積作成中')
  returning id into v_estimate_id;

  insert into public.estimate_items (
    estimate_id, item_index, product_name, url, quantity,
    color, size, model, request, unit_price
  )
  values (
    v_estimate_id, 1, nullif(btrim(p_product_name), ''),
    coalesce(btrim(p_url), ''), p_quantity, nullif(btrim(p_color), ''),
    nullif(btrim(p_size), ''), nullif(btrim(p_model), ''),
    coalesce(btrim(p_request), ''), 0
  );

  return query select v_estimate_id, v_estimate_no;
end;
$$;

revoke all on function public.create_manual_estimate(uuid, text, text, integer, text, text, text, text) from public;
revoke all on function public.create_manual_estimate(uuid, text, text, integer, text, text, text, text) from anon;
revoke all on function public.create_manual_estimate(uuid, text, text, integer, text, text, text, text) from authenticated;
grant execute on function public.create_manual_estimate(uuid, text, text, integer, text, text, text, text) to service_role;
