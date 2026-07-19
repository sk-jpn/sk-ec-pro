create extension if not exists btree_gist;

create table if not exists public.stay_customers (
  id uuid primary key default gen_random_uuid(), auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null, email text not null, phone text not null default '', address text not null default '', preferred_language text not null default 'ja',
  admin_memo text not null default '', airbnb_guest boolean not null default false, first_stay_at date, last_stay_at date,
  total_stay_count integer not null default 0 check (total_stay_count >= 0), cancellation_count integer not null default 0 check (cancellation_count >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), last_login_at timestamptz
);
create index if not exists stay_customers_email_idx on public.stay_customers(lower(email));

create table if not exists public.stay_listings (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
  listing_type text not null check (listing_type in ('room','entire_building')), description text not null default '', short_description text not null default '',
  address text not null default '', area text not null default '', max_guests integer not null default 4 check (max_guests > 0),
  base_guests integer not null default 2 check (base_guests > 0 and base_guests <= max_guests), base_price integer not null default 8000 check (base_price >= 0),
  additional_guest_price integer not null default 1000 check (additional_guest_price >= 0), cleaning_fee integer not null default 1000 check (cleaning_fee >= 0),
  check_in_time time not null default '15:00', check_out_time time not null default '10:00', amenities jsonb not null default '[]'::jsonb,
  is_active boolean not null default true, is_public boolean not null default true, booking_enabled boolean not null default true,
  sort_order integer not null default 0, admin_memo text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.stay_listing_images (
  id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.stay_listings(id) on delete cascade,
  storage_path text not null, alt_text text not null default '', sort_order integer not null default 0, is_cover boolean not null default false, created_at timestamptz not null default now()
);
create unique index if not exists stay_listing_one_cover_idx on public.stay_listing_images(listing_id) where is_cover;

create table if not exists public.stay_pricing_rules (
  id uuid primary key default gen_random_uuid(), listing_id uuid references public.stay_listings(id) on delete cascade,
  name text not null, rule_type text not null check (rule_type in ('weekday','weekend','holiday','day_before_holiday','date_range','specific_date','special_period')),
  day_of_week smallint check (day_of_week between 0 and 6), start_date date, end_date date, specific_date date,
  multiplier numeric(6,3) not null default 1 check (multiplier > 0), fixed_price integer check (fixed_price >= 0), fixed_adjustment integer not null default 0,
  priority integer not null default 0, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);
create index if not exists stay_pricing_rules_lookup_idx on public.stay_pricing_rules(listing_id,is_active,start_date,end_date,specific_date);

create table if not exists public.stay_blocked_dates (
  id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.stay_listings(id) on delete cascade,
  start_date date not null, end_date date not null, reason text not null, admin_memo text not null default '', created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (end_date > start_date)
);
create index if not exists stay_blocked_dates_lookup_idx on public.stay_blocked_dates(listing_id,start_date,end_date);

create sequence if not exists public.stay_booking_number_seq;
create table if not exists public.stay_bookings (
  id uuid primary key default gen_random_uuid(), booking_number text not null unique,
  customer_id uuid not null references public.stay_customers(id), listing_id uuid not null references public.stay_listings(id),
  check_in_date date not null, check_out_date date not null, nights integer not null check (nights > 0), guest_count integer not null check (guest_count > 0),
  base_guest_count integer not null, additional_guest_count integer not null, subtotal integer not null, additional_guest_fee integer not null,
  cleaning_fee integer not null, discount_amount integer not null default 0, total_amount integer not null, pricing_snapshot jsonb not null,
  guest_name text not null, guest_email text not null, guest_phone text not null, arrival_time time not null,
  stay_purpose text not null default '', customer_note text not null default '', additional_requests text not null default '', airbnb_experience boolean not null default false,
  admin_message text not null default '', admin_memo text not null default '',
  status text not null default 'pending_admin_review' check (status in ('pending_admin_review','admin_reviewing','awaiting_guest_confirmation','confirmed','payment_pending','paid','check_in_scheduled','checked_in','checked_out','completed','guest_cancelled','admin_cancelled','expired','no_show')),
  payment_method text check (payment_method in ('bank_transfer','cash','card_manual','other')), payment_status text not null default 'unpaid' check (payment_status in ('unpaid','payment_pending','paid','refunded','partially_refunded')),
  cancellation_reason text, requested_at timestamptz not null default now(), admin_reviewed_at timestamptz, guest_confirmed_at timestamptz,
  paid_at timestamptz, checked_in_at timestamptz, checked_out_at timestamptz, cancelled_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (check_out_date > check_in_date), check (discount_amount between 0 and subtotal + additional_guest_fee + cleaning_fee)
);
alter table public.stay_bookings drop constraint if exists stay_bookings_no_overlap;
alter table public.stay_bookings add constraint stay_bookings_no_overlap exclude using gist
  (listing_id with =, daterange(check_in_date,check_out_date,'[)') with &&)
  where (status in ('pending_admin_review','awaiting_guest_confirmation','confirmed','payment_pending','paid','checked_in'));

create table if not exists public.stay_booking_status_history (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.stay_bookings(id) on delete cascade,
  previous_status text, new_status text not null, changed_by_user_id uuid references auth.users(id) on delete set null,
  changed_by_role text not null check (changed_by_role in ('customer','admin','system')), reason text, created_at timestamptz not null default now()
);
create table if not exists public.stay_message_threads (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.stay_bookings(id) on delete cascade,
  customer_id uuid not null references public.stay_customers(id), subject text not null, last_message_at timestamptz,
  customer_unread_count integer not null default 0, admin_unread_count integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.stay_messages (
  id uuid primary key default gen_random_uuid(), thread_id uuid not null references public.stay_message_threads(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null, sender_role text not null check (sender_role in ('customer','admin')),
  body text not null check (char_length(body) between 1 and 5000), created_at timestamptz not null default now(), read_at timestamptz
);
create table if not exists public.stay_message_attachments (
  id uuid primary key default gen_random_uuid(), message_id uuid not null references public.stay_messages(id) on delete cascade,
  storage_path text not null, original_name text not null, mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  file_size integer not null check (file_size between 1 and 10485760), created_at timestamptz not null default now()
);
create table if not exists public.stay_notifications (
  id uuid primary key default gen_random_uuid(), customer_id uuid references public.stay_customers(id), booking_id uuid references public.stay_bookings(id),
  message_thread_id uuid references public.stay_message_threads(id), notification_type text not null, channel text not null default 'email' check (channel='email'),
  recipient text not null, status text not null check (status in ('pending','sent','failed')), error_message text, sent_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.stay_settings (
  id boolean primary key default true check (id), default_check_in_time time not null default '15:00', default_check_out_time time not null default '10:00',
  request_expiry_hours integer not null default 72, payment_instructions text not null default '', common_guest_information text not null default '',
  cancellation_information text not null default '', admin_notification_email text not null default '', booking_acceptance_enabled boolean not null default true,
  updated_at timestamptz not null default now(), updated_by uuid references auth.users(id) on delete set null
);
insert into public.stay_settings(id) values(true) on conflict(id) do nothing;

insert into public.stay_listings(code,name,listing_type,cleaning_fee,sort_order)
select code,code,case when code='F322' then 'entire_building' else 'room' end,case when code='F322' then 10000 else 1000 end,ord
from (values ('F101',1),('F102',2),('F201',3),('F202',4),('F203',5),('F205',6),('F301',7),('F302',8),('K101',9),('K102',10),('K103',11),('K302',12),('F322',13)) v(code,ord)
on conflict(code) do nothing;
update public.stay_listings set name='F322全館' where code='F322' and name='F322';

create or replace function public.stay_is_admin() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select lower(coalesce(auth.jwt()->>'email','')) = any(string_to_array(lower(coalesce(current_setting('app.settings.admin_emails',true),'')),','))
$$;

do $$ declare t text; begin foreach t in array array['stay_customers','stay_listings','stay_listing_images','stay_pricing_rules','stay_blocked_dates','stay_bookings','stay_booking_status_history','stay_message_threads','stay_messages','stay_message_attachments','stay_notifications','stay_settings'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;

create policy stay_listings_public_read on public.stay_listings for select using ((is_active and is_public) or public.stay_is_admin());
create policy stay_listing_images_public_read on public.stay_listing_images for select using (exists(select 1 from public.stay_listings l where l.id=listing_id and ((l.is_active and l.is_public) or public.stay_is_admin())));
create policy stay_pricing_rules_public_read on public.stay_pricing_rules for select using (is_active or public.stay_is_admin());
create policy stay_customers_own_read on public.stay_customers for select to authenticated using (auth_user_id=(select auth.uid()) or public.stay_is_admin());
create policy stay_customers_own_update on public.stay_customers for update to authenticated using (auth_user_id=(select auth.uid())) with check (auth_user_id=(select auth.uid()));
create policy stay_bookings_own_read on public.stay_bookings for select to authenticated using (customer_id in(select id from public.stay_customers where auth_user_id=(select auth.uid())) or public.stay_is_admin());
create policy stay_threads_own_read on public.stay_message_threads for select to authenticated using (customer_id in(select id from public.stay_customers where auth_user_id=(select auth.uid())) or public.stay_is_admin());
create policy stay_messages_own_read on public.stay_messages for select to authenticated using (thread_id in(select id from public.stay_message_threads where customer_id in(select id from public.stay_customers where auth_user_id=(select auth.uid()))) or public.stay_is_admin());
create policy stay_attachments_own_read on public.stay_message_attachments for select to authenticated using (message_id in(select m.id from public.stay_messages m join public.stay_message_threads t on t.id=m.thread_id where t.customer_id in(select id from public.stay_customers where auth_user_id=(select auth.uid()))) or public.stay_is_admin());

grant select on public.stay_listings,public.stay_listing_images,public.stay_pricing_rules to anon,authenticated;
grant select on public.stay_customers,public.stay_bookings,public.stay_message_threads,public.stay_messages,public.stay_message_attachments to authenticated;

create or replace function public.calculate_stay_price(p_listing_id uuid,p_check_in date,p_check_out date,p_guest_count integer,p_discount integer default 0)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare l public.stay_listings; d date; rule record; daily jsonb='[]'; daily_price integer; sub integer=0; extra_count integer; extra_fee integer; total integer;
begin
  select * into l from public.stay_listings where id=p_listing_id and is_active and booking_enabled;
  if not found then raise exception 'listing_unavailable'; end if;
  if p_check_out<=p_check_in then raise exception 'invalid_dates'; end if;
  if p_guest_count<1 or p_guest_count>l.max_guests then raise exception 'invalid_guest_count'; end if;
  if p_check_out-p_check_in>60 then raise exception 'too_many_nights'; end if;
  for d in select generate_series(p_check_in,p_check_out-1,interval '1 day')::date loop
    select r.* into rule from public.stay_pricing_rules r where r.is_active and (r.listing_id is null or r.listing_id=l.id)
      and ((r.specific_date=d) or (r.start_date is not null and d between r.start_date and coalesce(r.end_date,r.start_date)) or (r.rule_type='weekday' and r.day_of_week=extract(dow from d)) or (r.rule_type='weekend' and extract(isodow from d) in(6,7)))
      order by (r.fixed_price is not null) desc,r.multiplier desc,r.priority desc limit 1;
    daily_price=case when rule.fixed_price is not null then rule.fixed_price else round(l.base_price*coalesce(rule.multiplier,1))+coalesce(rule.fixed_adjustment,0) end;
    daily_price=greatest(0,daily_price); sub=sub+daily_price;
    daily=daily||jsonb_build_array(jsonb_build_object('date',d,'basePrice',l.base_price,'multiplier',coalesce(rule.multiplier,1),'ruleName',rule.name,'nightlyPrice',daily_price));
  end loop;
  extra_count=greatest(0,p_guest_count-l.base_guests); extra_fee=extra_count*l.additional_guest_price*(p_check_out-p_check_in);
  total=greatest(0,sub+extra_fee+l.cleaning_fee-greatest(0,p_discount));
  return jsonb_build_object('days',daily,'nights',p_check_out-p_check_in,'baseGuestCount',l.base_guests,'guestCount',p_guest_count,'additionalGuestCount',extra_count,'subtotal',sub,'additionalGuestPrice',l.additional_guest_price,'additionalGuestFee',extra_fee,'cleaningFee',l.cleaning_fee,'discountAmount',greatest(0,p_discount),'totalAmount',total,'currency','JPY');
end $$;
grant execute on function public.calculate_stay_price(uuid,date,date,integer,integer) to anon,authenticated,service_role;

create or replace function public.create_stay_booking(p_listing_id uuid,p_check_in date,p_check_out date,p_guest_count integer,p_name text,p_email text,p_phone text,p_arrival_time time,p_purpose text default '',p_note text default '',p_requests text default '',p_airbnb boolean default false)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid=auth.uid(); cid uuid; bid uuid=gen_random_uuid(); quote jsonb; number text; seq bigint;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  if length(trim(p_name))<1 or length(trim(p_email))<3 or length(trim(p_phone))<3 then raise exception 'invalid_guest_details'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_listing_id::text,0));
  if exists(select 1 from public.stay_blocked_dates where listing_id=p_listing_id and start_date<p_check_out and end_date>p_check_in) then raise exception 'dates_blocked'; end if;
  insert into public.stay_customers(auth_user_id,name,email,phone,airbnb_guest,last_login_at) values(uid,trim(p_name),lower(trim(p_email)),trim(p_phone),p_airbnb,now())
  on conflict(auth_user_id) do update set name=excluded.name,email=excluded.email,phone=excluded.phone,airbnb_guest=stay_customers.airbnb_guest or excluded.airbnb_guest,last_login_at=now(),updated_at=now() returning id into cid;
  quote=public.calculate_stay_price(p_listing_id,p_check_in,p_check_out,p_guest_count,0);
  seq=nextval('public.stay_booking_number_seq'); number='ST-'||to_char(current_date,'YYYYMMDD')||'-'||lpad(seq::text,4,'0');
  insert into public.stay_bookings(id,booking_number,customer_id,listing_id,check_in_date,check_out_date,nights,guest_count,base_guest_count,additional_guest_count,subtotal,additional_guest_fee,cleaning_fee,discount_amount,total_amount,pricing_snapshot,guest_name,guest_email,guest_phone,arrival_time,stay_purpose,customer_note,additional_requests,airbnb_experience)
  values(bid,number,cid,p_listing_id,p_check_in,p_check_out,(quote->>'nights')::int,p_guest_count,(quote->>'baseGuestCount')::int,(quote->>'additionalGuestCount')::int,(quote->>'subtotal')::int,(quote->>'additionalGuestFee')::int,(quote->>'cleaningFee')::int,0,(quote->>'totalAmount')::int,quote,trim(p_name),lower(trim(p_email)),trim(p_phone),p_arrival_time,left(coalesce(p_purpose,''),500),left(coalesce(p_note,''),2000),left(coalesce(p_requests,''),2000),p_airbnb);
  insert into public.stay_booking_status_history(booking_id,new_status,changed_by_user_id,changed_by_role) values(bid,'pending_admin_review',uid,'customer');
  insert into public.stay_message_threads(booking_id,customer_id,subject) values(bid,cid,number||' 宿泊予約'); return bid;
exception when exclusion_violation then raise exception 'dates_unavailable'; end $$;
grant execute on function public.create_stay_booking(uuid,date,date,integer,text,text,text,time,text,text,text,boolean) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('stay-listings','stay-listings',true,10485760,array['image/jpeg','image/png','image/webp']),('stay-messages','stay-messages',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']) on conflict(id) do nothing;
