import { NextResponse } from "next/server";
import { requireStayUser } from "@/lib/stay/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateRideFare, DEFAULT_RIDE_PRICING, type RidePricingSettings } from "@/lib/stay/ride-pricing";
import { getDrivingRoute } from "@/lib/stay/ride-route";

export async function POST(request: Request) {
  await requireStayUser("/stay/mypage/rides/new");
  try {
    const body = await request.json() as { departureTime?: string; pickupAddress?: string; destinationAddress?: string };
    const pickup = body.pickupAddress?.trim() ?? "", destination = body.destinationAddress?.trim() ?? "", time = body.departureTime ?? "";
    if (!/^\d{2}:\d{2}$/.test(time) || pickup.length < 2 || destination.length < 2) return NextResponse.json({ message: "出発時間・出発場所・到着場所を入力してください。" }, { status: 400 });
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("stay_ride_settings").select("*").eq("id", true).maybeSingle();
    const settings = { ...DEFAULT_RIDE_PRICING, ...(data ?? {}) } as RidePricingSettings;
    const route = await getDrivingRoute(pickup, destination);
    return NextResponse.json({ ...route, ...calculateRideFare(route.distanceMeters, time, settings) });
  } catch (error) {
    console.error("配車料金の見積に失敗しました。", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "見積を取得できませんでした。" }, { status: 500 });
  }
}
