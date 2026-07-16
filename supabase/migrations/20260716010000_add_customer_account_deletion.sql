-- Allow an authenticated customer to permanently delete only their own
-- customer records and every estimate/order attached to those records.
-- Storage objects and the auth.users row are removed by the server action
-- after this transactional database cleanup succeeds.

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

  select coalesce(array_agg(c.id), '{}'::uuid[])
    into v_customer_ids
  from public.customers c
  where c.auth_user_id = v_user_id;

  select coalesce(array_agg(img.storage_path), '{}'::text[])
    into v_storage_paths
  from public.estimate_item_images img
  join public.estimate_items item on item.id = img.estimate_item_id
  join public.estimates estimate on estimate.id = item.estimate_id
  where estimate.customer_id = any(v_customer_ids);

  delete from public.orders
  where customer_id = any(v_customer_ids);

  delete from public.estimates
  where customer_id = any(v_customer_ids);

  delete from public.customers
  where id = any(v_customer_ids)
    and auth_user_id = v_user_id;

  return v_storage_paths;
end;
$$;

revoke all on function public.delete_customer_account_data() from public;
revoke all on function public.delete_customer_account_data() from anon;
grant execute on function public.delete_customer_account_data() to authenticated;

comment on function public.delete_customer_account_data() is
  'Permanently deletes the current user own customers, orders, estimates, items, and image records; returns storage paths for cleanup.';
