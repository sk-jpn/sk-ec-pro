import { requireStayUser } from "@/lib/stay/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_RIDE_PRICING } from "@/lib/stay/ride-pricing";
import { RideBookingForm } from "./ride-booking-form";

export default async function NewRidePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { customer } = await requireStayUser("/stay/mypage/rides/new");
  const params=await searchParams, admin=createSupabaseAdminClient();
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const end=new Date(`${today}T00:00:00Z`);end.setUTCMonth(end.getUTCMonth()+12);
  const [{data:bookings},{data:settings}]=await Promise.all([
    admin.from("stay_bookings").select("id,booking_number,check_in_date,check_out_date,stay_listings(code,name)").eq("customer_id",customer.id).not("status","in",'(guest_cancelled,admin_cancelled,expired,no_show)').gte("check_out_date",today).order("check_in_date"),
    admin.from("stay_ride_settings").select("discount_percent").eq("id",true).maybeSingle(),
  ]);
  const stays=(bookings??[]).map(row=>{const listing=row.stay_listings as unknown as {code:string;name:string}|null;return{id:row.id,code:listing?.code??"",label:`${listing?.code??listing?.name??"宿泊"}（${row.check_in_date}〜${row.check_out_date}）`}});
  return <><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Ride Booking</p><h1 className="mt-2 text-3xl font-bold">配車予約</h1><p className="mt-3 text-sm text-slate-500">配車日と出発情報を入力すると、道路距離から料金を自動見積します。</p>{params.error&&<p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{params.error==='invalid'?"入力内容を確認してください。":"配車予約を登録できませんでした。見積後にもう一度お試しください。"}</p>}<RideBookingForm today={today} monthEnd={end.toISOString().slice(0,7)} stays={stays} discountPercent={Number(settings?.discount_percent??DEFAULT_RIDE_PRICING.discount_percent)}/></>;
}
