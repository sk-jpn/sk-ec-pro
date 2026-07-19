create or replace function public.create_admin_stay_booking(
  p_listing_id uuid,
  p_customer_id uuid,
  p_check_in date,
  p_check_out date,
  p_reason text,
  p_admin_user_id uuid,
  p_guest_count integer default 1
) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  l public.stay_listings;
  c public.stay_customers;
  bid uuid=gen_random_uuid();
  quote jsonb;
  number text;
  seq bigint;
begin
  if p_check_out<=p_check_in or length(trim(coalesce(p_reason,'')))<1 then raise exception 'invalid_booking_details'; end if;
  select * into l from public.stay_listings where id=p_listing_id and is_active and booking_enabled;
  if not found then raise exception 'listing_unavailable'; end if;
  select * into c from public.stay_customers where id=p_customer_id;
  if not found then raise exception 'customer_not_found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_listing_id::text,0));
  if exists(
    select 1 from public.stay_blocked_dates
    where listing_id=p_listing_id
      and calendar_feed_id is null
      and start_date<p_check_out
      and end_date>p_check_in
  ) then raise exception 'dates_blocked'; end if;
  quote=public.calculate_stay_price(p_listing_id,p_check_in,p_check_out,p_guest_count,0);
  seq=nextval('public.stay_booking_number_seq');
  number='ST-'||to_char(current_date,'YYYYMMDD')||'-'||lpad(seq::text,4,'0');
  insert into public.stay_bookings(id,booking_number,customer_id,listing_id,check_in_date,check_out_date,nights,guest_count,base_guest_count,additional_guest_count,subtotal,additional_guest_fee,cleaning_fee,discount_amount,total_amount,pricing_snapshot,guest_name,guest_email,guest_phone,arrival_time,stay_purpose,customer_note,admin_memo,status)
  values(bid,number,c.id,l.id,p_check_in,p_check_out,(quote->>'nights')::int,p_guest_count,(quote->>'baseGuestCount')::int,(quote->>'additionalGuestCount')::int,(quote->>'subtotal')::int,(quote->>'additionalGuestFee')::int,(quote->>'cleaningFee')::int,(quote->>'discountAmount')::int,(quote->>'totalAmount')::int,quote,c.name,c.email,c.phone,l.check_in_time,left(trim(p_reason),500),'オフライン予約',left(trim(p_reason),500),'confirmed');
  insert into public.stay_booking_status_history(booking_id,new_status,changed_by_user_id,changed_by_role,reason) values(bid,'confirmed',p_admin_user_id,'admin',left(trim(p_reason),500));
  insert into public.stay_message_threads(booking_id,customer_id,subject) values(bid,c.id,number||' 宿泊予約');
  return bid;
exception when exclusion_violation then raise exception 'dates_unavailable';
end $$;

revoke all on function public.create_admin_stay_booking(uuid,uuid,date,date,text,uuid,integer) from public,anon,authenticated;
grant execute on function public.create_admin_stay_booking(uuid,uuid,date,date,text,uuid,integer) to service_role;
