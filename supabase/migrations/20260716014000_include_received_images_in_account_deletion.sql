create or replace function public.delete_customer_account_data()
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_customer_ids uuid[];
  v_storage_paths text[];
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select coalesce(array_agg(c.id), '{}'::uuid[]) into v_customer_ids
  from public.customers c
  where c.auth_user_id = v_user_id;

  select coalesce(array_agg(paths.storage_path), '{}'::text[]) into v_storage_paths
  from (
    select image.storage_path
    from public.estimate_item_images image
    join public.estimate_items item on item.id = image.estimate_item_id
    join public.estimates estimate on estimate.id = item.estimate_id
    where estimate.customer_id = any(v_customer_ids)
    union all
    select image.storage_path
    from public.received_item_images image
    join public.estimate_items item on item.id = image.estimate_item_id
    join public.estimates estimate on estimate.id = item.estimate_id
    where estimate.customer_id = any(v_customer_ids)
  ) paths;

  delete from public.orders where customer_id = any(v_customer_ids);
  delete from public.estimates where customer_id = any(v_customer_ids);
  delete from public.customers where id = any(v_customer_ids) and auth_user_id = v_user_id;
  return v_storage_paths;
end;
$$;

revoke all on function public.delete_customer_account_data() from public;
revoke all on function public.delete_customer_account_data() from anon;
grant execute on function public.delete_customer_account_data() to authenticated;
