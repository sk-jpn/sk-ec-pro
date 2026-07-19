alter table public.stay_settings
  add column if not exists weekly_discount_percent integer not null default 10 check (weekly_discount_percent between 0 and 100),
  add column if not exists biweekly_discount_percent integer not null default 20 check (biweekly_discount_percent between 0 and 100),
  add column if not exists monthly_discount_percent integer not null default 30 check (monthly_discount_percent between 0 and 100);

update public.stay_settings
set weekly_discount_percent = coalesce(weekly_discount_percent, 10),
    biweekly_discount_percent = coalesce(biweekly_discount_percent, 20),
    monthly_discount_percent = coalesce(monthly_discount_percent, 30)
where id = true;

create or replace function public.calculate_stay_price(p_listing_id uuid,p_check_in date,p_check_out date,p_guest_count integer,p_discount integer default 0)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare
  l public.stay_listings; s public.stay_settings; d date; rule record; daily jsonb='[]';
  daily_price integer; sub integer=0; extra_count integer; extra_fee integer; nights integer;
  eligible_amount integer; length_rate integer=0; length_label text; length_discount integer=0; discount integer; total integer;
begin
  select * into l from public.stay_listings where id=p_listing_id and is_active and booking_enabled;
  if not found then raise exception 'listing_unavailable'; end if;
  if p_check_out<=p_check_in then raise exception 'invalid_dates'; end if;
  if p_guest_count<1 or p_guest_count>l.max_guests then raise exception 'invalid_guest_count'; end if;
  if p_check_out-p_check_in>60 then raise exception 'too_many_nights'; end if;
  select * into s from public.stay_settings where id=true;
  nights=p_check_out-p_check_in;
  for d in select generate_series(p_check_in,p_check_out-1,interval '1 day')::date loop
    select r.* into rule from public.stay_pricing_rules r where r.is_active and (r.listing_id is null or r.listing_id=l.id)
      and ((r.specific_date=d) or (r.start_date is not null and d between r.start_date and coalesce(r.end_date,r.start_date)) or (r.rule_type='weekday' and r.day_of_week=extract(dow from d)) or (r.rule_type='weekend' and extract(isodow from d) in(6,7)))
      order by (r.fixed_price is not null) desc,r.multiplier desc,r.priority desc limit 1;
    daily_price=case when rule.fixed_price is not null then rule.fixed_price else round(l.base_price*coalesce(rule.multiplier,1))+coalesce(rule.fixed_adjustment,0) end;
    daily_price=greatest(0,daily_price); sub=sub+daily_price;
    daily=daily||jsonb_build_array(jsonb_build_object('date',d,'basePrice',l.base_price,'multiplier',coalesce(rule.multiplier,1),'ruleName',rule.name,'nightlyPrice',daily_price));
  end loop;
  extra_count=greatest(0,p_guest_count-l.base_guests); extra_fee=extra_count*l.additional_guest_price*nights;
  eligible_amount=sub+extra_fee;
  if nights>=30 then length_rate=coalesce(s.monthly_discount_percent,30);length_label='月割';
  elsif nights>=14 then length_rate=coalesce(s.biweekly_discount_percent,20);length_label='2週割';
  elsif nights>=7 then length_rate=coalesce(s.weekly_discount_percent,10);length_label='週割'; end if;
  length_discount=round(eligible_amount*length_rate/100.0);
  discount=least(eligible_amount,length_discount+greatest(0,p_discount));
  total=greatest(0,eligible_amount-discount)+l.cleaning_fee;
  return jsonb_build_object('days',daily,'nights',nights,'baseGuestCount',l.base_guests,'guestCount',p_guest_count,'additionalGuestCount',extra_count,'subtotal',sub,'additionalGuestPrice',l.additional_guest_price,'additionalGuestFee',extra_fee,'cleaningFee',l.cleaning_fee,'lengthDiscountLabel',length_label,'lengthDiscountRate',length_rate,'lengthDiscountAmount',length_discount,'manualDiscountAmount',greatest(0,p_discount),'discountAmount',discount,'totalAmount',total,'currency','JPY');
end $$;

grant execute on function public.calculate_stay_price(uuid,date,date,integer,integer) to anon,authenticated,service_role;

create or replace function public.set_stay_booking_quote_discount()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if new.pricing_snapshot ? 'discountAmount' then
    new.discount_amount=least(new.subtotal+new.additional_guest_fee,greatest(0,(new.pricing_snapshot->>'discountAmount')::integer));
  end if;
  return new;
end $$;

drop trigger if exists set_stay_booking_quote_discount on public.stay_bookings;
create trigger set_stay_booking_quote_discount before insert on public.stay_bookings
for each row execute function public.set_stay_booking_quote_discount();
