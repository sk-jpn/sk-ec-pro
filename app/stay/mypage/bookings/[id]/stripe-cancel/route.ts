import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { withBasePath } from "@/config/site";
import { requireStayUser } from "@/lib/stay/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";

const RESTORABLE_STATUSES = new Set(["pending_admin_review", "admin_reviewing", "awaiting_guest_confirmation", "confirmed", "payment_pending"]);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { customer } = await requireStayUser(`/stay/mypage/bookings/${id}`);
  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin.from("stay_bookings").select("status,payment_status,payment_method,stripe_checkout_session_id").eq("id", id).eq("customer_id", customer.id).maybeSingle();
  const destination = (payment: string) => NextResponse.redirect(new URL(withBasePath(`/stay/mypage/bookings/${id}?payment=${payment}`), request.url));
  if (!booking || booking.payment_status !== "payment_pending" || booking.payment_method !== "stripe_card" || !booking.stripe_checkout_session_id) return destination("stripe_cancelled");

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(booking.stripe_checkout_session_id);
    if (session.payment_status === "paid") return destination("stripe_success");
    await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
    const storedStatus = session.metadata?.previousBookingStatus;
    const restoredStatus = storedStatus && RESTORABLE_STATUSES.has(storedStatus) ? storedStatus : "confirmed";
    await admin.from("stay_bookings").update({ status: restoredStatus, payment_status: "unpaid", payment_method: null, card_fee_amount: 0, stripe_checkout_session_id: null, updated_at: new Date().toISOString() }).eq("id", id).eq("customer_id", customer.id).eq("payment_status", "payment_pending").eq("payment_method", "stripe_card").eq("stripe_checkout_session_id", session.id);
    revalidatePath(`/stay/mypage/bookings/${id}`);
  } catch (error) {
    console.error("キャンセルした宿泊Stripe決済の状態復元に失敗しました。", error);
    return destination("failed");
  }
  return destination("stripe_cancelled");
}
