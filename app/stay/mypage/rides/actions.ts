"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStayUser } from "@/lib/stay/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateRideFare, DEFAULT_RIDE_PRICING, type RidePricingSettings } from "@/lib/stay/ride-pricing";
import { getDrivingRoute } from "@/lib/stay/ride-route";
import { getFixedRouteById } from "@/lib/stay/ride-fixed-routes";

const value = (form: FormData, name: string, max = 500) => String(form.get(name) ?? "").trim().slice(0, max);

async function sendRideNotification(booking: {
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  rideDate: string;
  departureTime: string;
  pickupAddress: string;
  destinationAddress: string;
  totalAmount: number;
  fixedRouteLabel?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) { console.warn("RESEND_API_KEY または RESEND_FROM_EMAIL が未設定のためメール通知をスキップします。"); return; }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: "contact@formosajapan.com",
      replyTo: from,
      subject: `【配車予約】${booking.customerName} 様 より新規予約 (${booking.bookingNumber})`,
      html: `<!doctype html><html lang="ja"><body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
        <div style="max-width:600px;margin:0 auto;padding:24px 16px">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
            <h1 style="margin:0 0 24px;font-size:20px">配車予約通知</h1>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">予約番号</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:bold">${booking.bookingNumber}</td></tr>
              <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">顧客名</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px">${booking.customerName}</td></tr>
              <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">メール</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px">${booking.customerEmail}</td></tr>
              <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">配車日時</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px">${booking.rideDate} ${booking.departureTime}</td></tr>
              <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">出発場所</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px">${booking.pickupAddress}</td></tr>
              <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">到着場所</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px">${booking.destinationAddress}</td></tr>
              ${booking.fixedRouteLabel ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">ルート</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px">${booking.fixedRouteLabel}</td></tr>` : ""}
              <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">合計金額</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:bold">¥${booking.totalAmount.toLocaleString()}</td></tr>
            </table>
          </div>
        </div></body></html>`,
    });
  } catch (error) {
    console.error("配車予約通知メールの送信に失敗しました。", error);
  }
}

export async function createRideBooking(formData: FormData) {
  const { customer } = await requireStayUser("/stay/mypage/rides/new");
  const rideDate = value(formData, "rideDate", 10), departureTime = value(formData, "departureTime", 5);
  let pickupAddress = value(formData, "pickupAddress"), destinationAddress = value(formData, "destinationAddress");
  const stayBookingId = value(formData, "stayBookingId", 36) || null;
  const fixedRouteId = value(formData, "fixedRouteId", 50);
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
    // Server-side fixed route validation: re-derive price from route definition
    let fixedAmount: number | null = null;
    let fixedRouteLabel: string | undefined;
    if (fixedRouteId) {
      const route = getFixedRouteById(stayRoomCode, fixedRouteId);
      if (!route) redirect("/stay/mypage/rides/new?error=invalid");
      fixedAmount = route.price;
      fixedRouteLabel = route.label;
      // Override with authoritative route data
      pickupAddress = route.pickup;
      destinationAddress = route.destination;
    }
    // Get pricing settings
    const {data:setting}=await admin.from("stay_ride_settings").select("*").eq("id",true).maybeSingle();
    const settings = { ...DEFAULT_RIDE_PRICING, ...(setting ?? {}) } as RidePricingSettings;
    // Get driving route (skip for fixed routes)
    const routeData=fixedAmount!==null?{distanceMeters:0,durationSeconds:0}:await getDrivingRoute(pickupAddress,destinationAddress);
    // Calculate fare (use fixed amount if available)
    const fare=fixedAmount!==null?{meterFare:fixedAmount,discountPercent:0,discountAmount:0,totalAmount:fixedAmount,isNight:false}:calculateRideFare(routeData.distanceMeters,departureTime,settings);
    // Generate booking number
    const { data: bookingNumber, error: numberError } = await admin.rpc("next_stay_ride_booking_number", { p_ride_date: rideDate });
    if (numberError || !bookingNumber) throw numberError ?? new Error("予約番号を作成できませんでした。");
    // Insert booking
    const tripType = "one_way";
    const { error } = await admin.from("stay_ride_bookings").insert({
      booking_number: bookingNumber, customer_id: customer.id, stay_booking_id: stayBookingId, ride_date: rideDate, departure_time: departureTime,
      pickup_address: pickupAddress, destination_address: destinationAddress, distance_meters: routeData.distanceMeters, duration_seconds: routeData.durationSeconds,
      meter_fare: fare.meterFare, discount_percent: fare.discountPercent, discount_amount: fare.discountAmount, total_amount: fare.totalAmount, is_night: fare.isNight,
      distance_fare: fare.meterFare, highway_fee: 0, other_fee: 0,
      pricing_snapshot: fixedRouteId?{type:"fixed",route:fixedRouteId}:settings,fixed_route_id:fixedRouteId||null,trip_type:tripType,status:"admin_reviewing",
      card_fee_rate: 0, card_fee_amount: 0,
    });
    if (error) throw error;
    // Send email notification
    await sendRideNotification({
      bookingNumber,
      customerName: customer.name,
      customerEmail: customer.email,
      rideDate,
      departureTime,
      pickupAddress,
      destinationAddress,
      totalAmount: fare.totalAmount,
      fixedRouteLabel,
    });
  } catch (error) {
    console.error("配車予約を登録できませんでした。", error);
    redirect("/stay/mypage/rides/new?error=failed");
  }
  revalidatePath("/stay/mypage/rides");
  revalidatePath("/admin/stay/rides");
  redirect("/stay/mypage/rides?created=success");
}