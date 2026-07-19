create or replace function public.delete_admin_stay_customer_data(p_customer_id uuid)
returns text[]
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_booking_ids uuid[];
  v_thread_ids uuid[];
  v_storage_paths text[];
begin
  if p_customer_id is null or not exists(select 1 from public.stay_customers where id=p_customer_id) then
    raise exception 'stay_customer_not_found';
  end if;

  select coalesce(array_agg(id),'{}'::uuid[]) into v_booking_ids
  from public.stay_bookings where customer_id=p_customer_id;

  select coalesce(array_agg(id),'{}'::uuid[]) into v_thread_ids
  from public.stay_message_threads where customer_id=p_customer_id;

  select coalesce(array_agg(a.storage_path),'{}'::text[]) into v_storage_paths
  from public.stay_message_attachments a
  join public.stay_messages m on m.id=a.message_id
  where m.thread_id=any(v_thread_ids);

  delete from public.stay_notifications
  where customer_id=p_customer_id
     or booking_id=any(v_booking_ids)
     or message_thread_id=any(v_thread_ids);

  delete from public.stay_bookings where customer_id=p_customer_id;
  delete from public.stay_message_threads where customer_id=p_customer_id;
  delete from public.stay_customers where id=p_customer_id;

  return v_storage_paths;
end;
$$;

revoke all on function public.delete_admin_stay_customer_data(uuid) from public,anon,authenticated;
grant execute on function public.delete_admin_stay_customer_data(uuid) to service_role;
