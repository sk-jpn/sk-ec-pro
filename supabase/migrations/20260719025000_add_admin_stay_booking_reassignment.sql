create or replace function public.reassign_admin_stay_booking_customer(
  p_booking_id uuid,
  p_customer_id uuid
) returns boolean
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_customer public.stay_customers;
  v_thread_id uuid;
begin
  select * into v_customer from public.stay_customers where id=p_customer_id;
  if not found then raise exception 'stay_customer_not_found'; end if;

  update public.stay_bookings
  set customer_id=v_customer.id,
      guest_name=v_customer.name,
      guest_email=v_customer.email,
      guest_phone=v_customer.phone,
      updated_at=now()
  where id=p_booking_id;
  if not found then raise exception 'stay_booking_not_found'; end if;

  update public.stay_message_threads
  set customer_id=v_customer.id,updated_at=now()
  where booking_id=p_booking_id
  returning id into v_thread_id;

  update public.stay_notifications
  set customer_id=v_customer.id
  where booking_id=p_booking_id
     or (v_thread_id is not null and message_thread_id=v_thread_id);

  return true;
end;
$$;

revoke all on function public.reassign_admin_stay_booking_customer(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reassign_admin_stay_booking_customer(uuid,uuid) to service_role;
