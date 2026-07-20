"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStayUser } from "@/lib/stay/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateRideFare, DEFAULT_RIDE_PRICING, type RidePricingSettings } from "@/lib/stay/ride-pricing";
import { getDrivingRoute } from "@/lib/stay/ride-route";
import { getFixedRouteForRoom } from "@/lib/stay/ride-fixed-routes";

const value = (form: FormData, name: string, max = 500) => String(form.get(name) ?? "").trim().slice(0, max);

export async function createRideBooking(formData: FormData) {
  const { customer } = await requireStayUser("/stay/mypage/rides/new");
  const rideDate = value(formData, "rideDate", 10), departureTime = value(formData, "departureTime", 5);
  let pickupAddress = value(formData, "pickupAddress"), destinationAddress = value(formData, "destinationAddress");
  const stayBookingId = value(formData, "stayBookingId", 36) || null;
  const fixedChoice=value(formData,"fixedRouteChoice",80),[choiceRouteId,choiceTripType]=fixedChoice.split(":"),fixedRouteId=choiceRouteId||value(formData,"fixedRouteId",50),tripType=(choiceTripType||value(formData,"tripType",20))==="round_trip"?"round_trip":"one_way";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rideDate) || !/^\d{2}:\d{2}$/.test(departureTime) || (!fixedRouteId&&(pickupAddress.length < 2 || destinationAddress.length < 2))) redirect("/stay/mypage/rides/new?error=invalid");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (rideDate < today) redirect("/stay/mypage/rides/new?error=invalid");
  const admin = createSupabaseAdminClient();
  let stayRoomCode="";
  if (stayBookingId) {
    const { data: stay } = await admin.from("stay_bookings").select("id,stay_listings(code)").eq("id", stayBookingId).eq("customer_id", customer.id).maybeSingle();
    if (!stay) redirect("/stay/mypage/rides/new?error=invalid");
    stayRoomCode=(stay.stay_listings as unknown as {code:string}|null)?.code??"";
  }
  try {
    const fixedRoute=getFixedRouteForRoom(stayRoomCode,fixedRouteId);
    if(fixedRouteId&&(!fixedRoute||(tripType==="round_trip"&&!("roundTrip" in fixedRoute))))redirect("/stay/mypage/rides/new?error=invalid");
    if(fixedRoute){pickupAddress="滞在中の部屋";destinationAddress=fixedRoute.label}
    const {data:setting}=await admin.from("stay_ride_settings").select("*").eq("id",true).maybeSingle();
    const settings = { ...DEFAULT_RIDE_PRICING, ...(setting ?? {}) } as RidePricingSettings;
    const route=fixedRoute?{distanceMeters:0,durationSeconds:0}:await getDrivingRoute(pickupAddress,destinationAddress);
    const fixedAmount=fixedRoute?(tripType==="round_trip"&&"roundTrip" in fixedRoute?fixedRoute.roundTrip:fixedRoute.oneWay):null;
    const fare=fixedAmount!==null?{meterFare:fixedAmount,discountPercent:0,discountAmount:0,totalAmount:fixedAmount,isNight:false}:calculateRideFare(route.distanceMeters,departureTime,settings);
    const { data: bookingNumber, error: numberError } = await admin.rpc("next_stay_ride_booking_number", { p_ride_date: rideDate });
    if (numberError || !bookingNumber) throw numberError ?? new Error("予約番号を作成できませんでした。");
    const { error } = await admin.from("stay_ride_bookings").insert({
      booking_number: bookingNumber, customer_id: customer.id, stay_booking_id: stayBookingId, ride_date: rideDate, departure_time: departureTime,
      pickup_address: pickupAddress, destination_address: destinationAddress, distance_meters: route.distanceMeters, duration_seconds: route.durationSeconds,
      meter_fare: fare.meterFare, discount_percent: fare.discountPercent, discount_amount: fare.discountAmount, total_amount: fare.totalAmount, is_night: fare.isNight,
      distance_fare: fare.meterFare, highway_fee: 0, other_fee: 0,
      pricing_snapshot: fixedRoute?{type:"fixed",route:fixedRoute.id}:settings,fixed_route_id:fixedRoute?.id??null,trip_type:tripType,status:"admin_reviewing",
      card_fee_rate: 0, card_fee_amount: 0,
    });
    if (error) throw error;
  } catch (error) {
    console.error("配車予約を登録できませんでした。", error);
    redirect("/stay/mypage/rides/new?error=failed");
  }
  revalidatePath("/stay/mypage/rides");
  revalidatePath("/admin/stay/rides");
  redirect("/stay/mypage/rides?created=success");
}
