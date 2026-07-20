"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStayUser } from "@/lib/stay/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateRideFare, DEFAULT_RIDE_PRICING, type RidePricingSettings } from "@/lib/stay/ride-pricing";
import { getDrivingRoute } from "@/lib/stay/ride-route";

const value = (form: FormData, name: string, max = 500) => String(form.get(name) ?? "").trim().slice(0, max);

export async function createRideBooking(formData: FormData) {
  const { customer } = await requireStayUser("/stay/mypage/rides/new");
  const rideDate = value(formData, "rideDate", 10), departureTime = value(formData, "departureTime", 5);
  const pickupAddress = value(formData, "pickupAddress"), destinationAddress = value(formData, "destinationAddress");
  const stayBookingId = value(formData, "stayBookingId", 36) || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rideDate) || !/^\d{2}:\d{2}$/.test(departureTime) || pickupAddress.length < 2 || destinationAddress.length < 2) redirect("/stay/mypage/rides/new?error=invalid");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (rideDate < today) redirect("/stay/mypage/rides/new?error=invalid");
  const admin = createSupabaseAdminClient();
  if (stayBookingId) {
    const { data: stay } = await admin.from("stay_bookings").select("id").eq("id", stayBookingId).eq("customer_id", customer.id).maybeSingle();
    if (!stay) redirect("/stay/mypage/rides/new?error=invalid");
  }
  try {
    const [{ data: setting }, route] = await Promise.all([
      admin.from("stay_ride_settings").select("*").eq("id", true).maybeSingle(),
      getDrivingRoute(pickupAddress, destinationAddress),
    ]);
    const settings = { ...DEFAULT_RIDE_PRICING, ...(setting ?? {}) } as RidePricingSettings;
    const fare = calculateRideFare(route.distanceMeters, departureTime, settings);
    const { data: bookingNumber, error: numberError } = await admin.rpc("next_stay_ride_booking_number", { p_ride_date: rideDate });
    if (numberError || !bookingNumber) throw numberError ?? new Error("予約番号を作成できませんでした。");
    const { error } = await admin.from("stay_ride_bookings").insert({
      booking_number: bookingNumber, customer_id: customer.id, stay_booking_id: stayBookingId, ride_date: rideDate, departure_time: departureTime,
      pickup_address: pickupAddress, destination_address: destinationAddress, distance_meters: route.distanceMeters, duration_seconds: route.durationSeconds,
      meter_fare: fare.meterFare, discount_percent: fare.discountPercent, discount_amount: fare.discountAmount, total_amount: fare.totalAmount, is_night: fare.isNight,
      pricing_snapshot: settings,
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
