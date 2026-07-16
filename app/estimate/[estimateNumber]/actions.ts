"use server";

import { revalidatePath } from "next/cache";
import { PAYMENT_METHODS, calculateCardPaymentFee } from "@/config/payment";
import { calculateQuoteTotals } from "@/lib/estimates/quote-calculations";
import { getEstimateQuoteData } from "@/lib/estimates/quote-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { getStripeClient } from "@/lib/stripe/client";

export type ApproveEstimateState = {
  success: boolean;
  message: string;
};
const CUSTOMER_APPROVAL_STATUSES = ["お客様確認中"];

export async function approveEstimate(
  _previousState: ApproveEstimateState,
  formData: FormData,
): Promise<ApproveEstimateState> {
  const rawEstimateNumber = formData.get("estimateNumber");
  const paymentMethod = formData.get("paymentMethod");
  if (typeof rawEstimateNumber !== "string") return { success: false, message: "見積番号が正しくありません。" };
  const estimateNumber = rawEstimateNumber.trim().toUpperCase();
  if (!/^SK\d{6}-\d{4}$/.test(estimateNumber)) return { success: false, message: "見積番号が正しくありません。" };
  if (paymentMethod !== PAYMENT_METHODS.bankTransfer) return { success: false, message: "支払方法が正しくありません。" };

  const { supabase: customerClient } = await requireCustomerUser();
  const { data: ownedEstimate } = await customerClient.from("estimates").select("id, status, approved_at").eq("estimate_no", estimateNumber).maybeSingle();
  if (!ownedEstimate) return { success: false, message: "見積情報を確認できませんでした。" };
  if (!CUSTOMER_APPROVAL_STATUSES.includes(ownedEstimate.status)) return { success: false, message: "見積作成が完了するまで承認できません。" };
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .update({ status: "approved", approved_at: new Date().toISOString(), payment_method: PAYMENT_METHODS.bankTransfer, payment_fee: 0, stripe_checkout_session_id: null })
    .eq("id", ownedEstimate.id)
    .in("status", CUSTOMER_APPROVAL_STATUSES)
    .is("approved_at", null)
    .neq("status", "approved")
    .neq("status", "キャンセル")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("見積承認の保存に失敗しました。", error);
    return { success: false, message: "承認を保存できませんでした。時間をおいて再度お試しください。" };
  }

  if (!data) {
    const { data: current } = await supabase.from("estimates").select("status, approved_at").eq("estimate_no", estimateNumber).maybeSingle();
    if (current?.status === "approved" || current?.approved_at) return { success: false, message: "この見積はすでに承認されています。" };
    if (current?.status === "キャンセル") return { success: false, message: "キャンセルされた見積は承認できません。" };
    return { success: false, message: "見積情報を確認できませんでした。" };
  }

  revalidatePath("/admin/estimates");
  revalidatePath(`/admin/estimates/${data.id}`);
  revalidatePath(`/ec/estimate/${estimateNumber}`);
  revalidatePath(`/ec/status/${estimateNumber}`);
  return { success: true, message: "ご注文ありがとうございます。\n注文を受け付けました。" };
}

export type CheckoutState = ApproveEstimateState & { url?: string };

export async function createStripeCheckout(estimateNumber: string): Promise<CheckoutState> {
  const normalizedNumber = estimateNumber.trim().toUpperCase();
  if (!/^SK\d{6}-\d{4}$/.test(normalizedNumber)) return { success: false, message: "見積番号が正しくありません。" };

  const { supabase: customerClient } = await requireCustomerUser();
  const { data: ownedEstimate, error: ownershipError } = await customerClient
    .from("estimates")
    .select("id, status, approved_at, paid_at")
    .eq("estimate_no", normalizedNumber)
    .maybeSingle();
  if (ownershipError || !ownedEstimate) return { success: false, message: "見積情報を確認できませんでした。" };
  if (!CUSTOMER_APPROVAL_STATUSES.includes(ownedEstimate.status)) return { success: false, message: "見積作成が完了するまで決済できません。" };
  const supabase = createSupabaseAdminClient();
  const current = ownedEstimate;
  if (current.status === "キャンセル") return { success: false, message: "キャンセルされた見積は決済できません。" };
  if (current.status === "paid" || current.paid_at) return { success: false, message: "この見積は入金済みです。" };

  try {
    const estimate = await getEstimateQuoteData(current.id);
    if (!estimate) return { success: false, message: "見積情報が見つかりません。" };
    const { total: estimateTotal } = calculateQuoteTotals(estimate.items, estimate);
    const paymentFee = calculateCardPaymentFee(estimateTotal);
    const paymentTotal = estimateTotal + paymentFee;
    if (paymentTotal < 1) return { success: false, message: "決済金額が正しくありません。" };

    const siteUrl = new URL(process.env.SITE_URL || "https://formosajapan.com").origin;
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: estimate.customerEmail,
      client_reference_id: current.id,
      line_items: [{
        price_data: {
          currency: "jpy",
          product_data: { name: `SK EC Pro お見積 ${estimate.estimateNo}` },
          unit_amount: paymentTotal,
        },
        quantity: 1,
      }],
      metadata: {
        estimateId: current.id,
        estimateNumber: estimate.estimateNo,
        expectedAmount: String(paymentTotal),
      },
      success_url: `${siteUrl}/ec/estimate/${estimate.estimateNo}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/ec/estimate/${estimate.estimateNo}?payment=cancelled`,
    });
    if (!session.url) return { success: false, message: "Stripe決済画面を作成できませんでした。" };

    const { data: updated, error: updateError } = await supabase
      .from("estimates")
      .update({
        status: "approved",
        approved_at: current.approved_at ?? new Date().toISOString(),
        payment_method: PAYMENT_METHODS.stripeCard,
        payment_fee: paymentFee,
        stripe_checkout_session_id: session.id,
      })
      .eq("id", current.id)
      .in("status", CUSTOMER_APPROVAL_STATUSES)
      .is("paid_at", null)
      .neq("status", "キャンセル")
      .select("id")
      .maybeSingle();
    if (updateError || !updated) {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
      return { success: false, message: "決済情報を保存できませんでした。" };
    }

    revalidatePath("/admin/estimates");
    revalidatePath(`/admin/estimates/${current.id}`);
    revalidatePath(`/ec/estimate/${estimate.estimateNo}`);
    return { success: true, message: "Stripe決済画面へ移動します。", url: session.url };
  } catch (error) {
    console.error("Stripe Checkoutの作成に失敗しました。", error);
    return { success: false, message: "カード決済を開始できませんでした。" };
  }
}
