"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ManualBookingState = { success: boolean; message: string; bookingId?: string };

export async function createManualStayBooking(_state: ManualBookingState, formData: FormData): Promise<ManualBookingState> {
  const user = await requireAdminUser();
  const value = (name: string, max: number) => { const entry = formData.get(name); return typeof entry === "string" ? entry.trim().slice(0, max) : ""; };
  const listingId = value("listingId", 36), customerId = value("customerId", 36), checkIn = value("checkIn", 10), checkOut = value("checkOut", 10), reason = value("reason", 500);
  const guestCount = Number(formData.get("guestCount"));
  if (!listingId || !customerId || !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut) || checkOut <= checkIn || !reason || !Number.isInteger(guestCount) || guestCount < 1) return { success: false, message: "日程、顧客、人数、予約理由を確認してください。" };
  const admin = createSupabaseAdminClient();
  const { data: bookingId, error } = await admin.rpc("create_admin_stay_booking", { p_listing_id: listingId, p_customer_id: customerId, p_check_in: checkIn, p_check_out: checkOut, p_reason: reason, p_admin_user_id: user.id, p_guest_count: guestCount });
  if (error || !bookingId) {
    console.error("オフライン宿泊予約を作成できませんでした。", error);
    const unavailable = error?.message.includes("blocked") || error?.message.includes("unavailable") || error?.message.includes("exclusion");
    return { success: false, message: unavailable ? "選択期間には予約またはブロックがあり、予約を作成できません。" : "予約を作成できませんでした。入力内容を確認してください。" };
  }
  revalidatePath("/admin/stay/calendar"); revalidatePath("/admin/stay/bookings");
  return { success: true, message: "オフライン予約を作成しました。", bookingId };
}
