import Stripe from "stripe";
import { PAYMENT_METHODS, calculateCardPaymentFee } from "@/config/payment";
import { calculateQuoteTotals } from "@/lib/estimates/quote-calculations";
import { getEstimateQuoteData } from "@/lib/estimates/quote-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return Response.json({ message: "Webhook設定が不完全です。" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe Webhookの署名検証に失敗しました。", error);
    return Response.json({ message: "署名を検証できませんでした。" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return Response.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") return Response.json({ received: true });
  if (session.metadata?.paymentType === "stay") {
    const bookingId = session.metadata.bookingId;
    const bookingNumber = session.metadata.bookingNumber;
    const expectedAmount = Number(session.metadata.expectedAmount);
    if (!bookingId || !bookingNumber || !Number.isSafeInteger(expectedAmount) || expectedAmount < 1) return Response.json({ message: "宿泊予約情報がありません。" }, { status: 400 });
    if (session.amount_total !== expectedAmount || session.currency !== "jpy") return Response.json({ message: "宿泊決済金額が一致しません。" }, { status: 400 });
    const supabase = createSupabaseAdminClient();
    const { data: booking, error: lookupError } = await supabase.from("stay_bookings").select("id,total_amount,payment_status,stripe_checkout_session_id").eq("id", bookingId).eq("booking_number", bookingNumber).maybeSingle();
    if (lookupError || !booking || booking.total_amount !== expectedAmount || booking.stripe_checkout_session_id !== session.id) return Response.json({ message: "宿泊予約が一致しません。" }, { status: 400 });
    if (booking.payment_status === "paid") return Response.json({ received: true });
    const { error: updateError } = await supabase.from("stay_bookings").update({ payment_method: "stripe_card", payment_status: "paid", status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", bookingId).eq("stripe_checkout_session_id", session.id).neq("payment_status", "paid");
    if (updateError) { console.error("宿泊Stripe決済完了の保存に失敗しました。", updateError); return Response.json({ message: "宿泊決済状態を保存できませんでした。" }, { status: 500 }); }
    return Response.json({ received: true });
  }
  const estimateId = session.metadata?.estimateId;
  const estimateNumber = session.metadata?.estimateNumber;
  if (!estimateId || !estimateNumber) return Response.json({ message: "見積情報がありません。" }, { status: 400 });

  try {
    const estimate = await getEstimateQuoteData(estimateId);
    if (!estimate || estimate.estimateNo !== estimateNumber) return Response.json({ message: "見積が一致しません。" }, { status: 400 });
    const { total: estimateTotal } = calculateQuoteTotals(estimate.items, estimate);
    const paymentFee = calculateCardPaymentFee(estimateTotal);
    const expectedAmount = estimateTotal + paymentFee;
    if (session.amount_total !== expectedAmount || session.currency !== "jpy" || session.metadata?.expectedAmount !== String(expectedAmount)) {
      console.error("Stripe決済金額が見積と一致しません。", { estimateId, sessionId: session.id });
      return Response.json({ message: "決済金額が一致しません。" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("estimates")
      .update({
        status: "発注作業中",
        paid_at: new Date().toISOString(),
        payment_method: PAYMENT_METHODS.stripeCard,
        payment_fee: paymentFee,
        stripe_checkout_session_id: session.id,
      })
      .eq("id", estimateId)
      .is("paid_at", null);
    if (error) throw error;

    return Response.json({ received: true });
  } catch (error) {
    console.error("Stripe決済完了の保存に失敗しました。", error);
    return Response.json({ message: "決済状態を保存できませんでした。" }, { status: 500 });
  }
}
