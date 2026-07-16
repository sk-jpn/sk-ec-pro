create or replace function public.create_manual_estimate_items(
  p_customer_id uuid,
  p_items jsonb
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
  v_item jsonb;
  v_index integer := 0;
  v_quantity integer;
begin
  if not exists (select 1 from public.customers where id = p_customer_id) then
    raise exception 'customer not found';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 10 then
    raise exception 'items must contain between 1 and 10 entries';
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

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_index := v_index + 1;
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity < 1 then raise exception 'quantity must be greater than zero'; end if;

    insert into public.estimate_items (
      estimate_id, item_index, product_name, url, quantity,
      color, size, model, request, unit_price
    )
    values (
      v_estimate_id,
      v_index,
      nullif(btrim(v_item ->> 'productName'), ''),
      coalesce(btrim(v_item ->> 'url'), ''),
      v_quantity,
      nullif(btrim(v_item ->> 'color'), ''),
      nullif(btrim(v_item ->> 'size'), ''),
      nullif(btrim(v_item ->> 'model'), ''),
      coalesce(btrim(v_item ->> 'request'), ''),
      0
    );
  end loop;

  return query select v_estimate_id, v_estimate_no;
end;
$$;

revoke all on function public.create_manual_estimate_items(uuid, jsonb) from public;
revoke all on function public.create_manual_estimate_items(uuid, jsonb) from anon;
revoke all on function public.create_manual_estimate_items(uuid, jsonb) from authenticated;
grant execute on function public.create_manual_estimate_items(uuid, jsonb) to service_role;

drop function if exists public.create_manual_estimate(uuid, text, text, integer, text, text, text, text);
