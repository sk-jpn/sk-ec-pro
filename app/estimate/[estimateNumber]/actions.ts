"use server";

import { revalidatePath } from "next/cache";
import { PAYMENT_METHODS, calculateCardPaymentFee } from "@/config/payment";
import { calculateQuoteTotals } from "@/lib/estimates/quote-calculations";
import { getEstimateQuoteData } from "@/lib/estimates/quote-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { getStripeClient } from "@/lib/stripe/client";
import { Resend } from "resend";

export type ApproveEstimateState = {
  success: boolean;
  message: string;
};
const CUSTOMER_APPROVAL_STATUSES = ["見積確認待ち"];
const ADDRESS_REQUIRED_MESSAGE = "商品の発送にはお届け先住所の登録が必要です。プロフィール画面で必須項目を入力してから、もう一度承認してください。";

async function hasCompleteShippingAddress(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email, phone, postal_code, prefecture, address_line1")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("承認前のお届け先住所確認に失敗しました。", error);
    return false;
  }
  return Boolean(data?.full_name?.trim() && data.email?.trim() && data.phone?.trim() && data.postal_code?.trim() && data.prefecture?.trim() && data.address_line1?.trim());
}

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

  const { user, supabase: customerClient } = await requireCustomerUser();
  const { data: ownedEstimate } = await customerClient.from("estimates").select("id, status, approved_at").eq("estimate_no", estimateNumber).maybeSingle();
  if (!ownedEstimate) return { success: false, message: "見積情報を確認できませんでした。" };
  if (!CUSTOMER_APPROVAL_STATUSES.includes(ownedEstimate.status)) return { success: false, message: "見積作成が完了するまで承認できません。" };
  if (!(await hasCompleteShippingAddress(user.id))) return { success: false, message: ADDRESS_REQUIRED_MESSAGE };
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .update({ status: "入金待ち", approved_at: new Date().toISOString(), payment_method: PAYMENT_METHODS.bankTransfer, payment_fee: 0, stripe_checkout_session_id: null })
    .eq("id", ownedEstimate.id)
    .in("status", CUSTOMER_APPROVAL_STATUSES)
    .is("approved_at", null)
    .neq("status", "入金待ち")
    .neq("status", "キャンセル")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("見積承認の保存に失敗しました。", error);
    return { success: false, message: "承認を保存できませんでした。時間をおいて再度お試しください。" };
  }

  if (!data) {
    const { data: current } = await supabase.from("estimates").select("status, approved_at").eq("estimate_no", estimateNumber).maybeSingle();
    if (current?.status === "入金待ち" || current?.approved_at) return { success: false, message: "この見積はすでに承認されています。" };
    if (current?.status === "キャンセル") return { success: false, message: "キャンセルされた見積は承認できません。" };
    return { success: false, message: "見積情報を確認できませんでした。" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (apiKey && from) {
    const admin = createSupabaseAdminClient();
    const { data: recipient } = await admin.from("estimates").select("estimate_no, customers(name, email)").eq("id", data.id).single();
    const customer = recipient?.customers as unknown as { name: string; email: string } | null;
    if (customer) await new Resend(apiKey).emails.send({
      from: from.includes("<") ? from : `Formosa Inc <${from}>`, to: [customer.email], replyTo: from,
      subject: "【SK EC Pro】お支払いのご案内",
      text: `${customer.name} 様\n\nお見積をご承認いただきありがとうございます。\n\n銀行振込先\n${process.env.BANK_TRANSFER_DETAILS || "振込先情報はマイページをご確認ください。"}\n\nクレジットカード決済\nhttps://www.formosajapan.com/ec/estimate/${estimateNumber}\n\nマイページ\nhttps://www.formosajapan.com/ec/login`,
    });
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

  const { user, supabase: customerClient } = await requireCustomerUser();
  const { data: ownedEstimate, error: ownershipError } = await customerClient
    .from("estimates")
    .select("id, status, approved_at, paid_at")
    .eq("estimate_no", normalizedNumber)
    .maybeSingle();
  if (ownershipError || !ownedEstimate) return { success: false, message: "見積情報を確認できませんでした。" };
  if (!CUSTOMER_APPROVAL_STATUSES.includes(ownedEstimate.status)) return { success: false, message: "見積作成が完了するまで決済できません。" };
  if (!(await hasCompleteShippingAddress(user.id))) return { success: false, message: ADDRESS_REQUIRED_MESSAGE };
  const supabase = createSupabaseAdminClient();
  const current = ownedEstimate;
  if (current.status === "キャンセル") return { success: false, message: "キャンセルされた見積は決済できません。" };
  if (current.status === "発注作業中" || current.paid_at) return { success: false, message: "この見積は入金済みです。" };

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
        status: "入金待ち",
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

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (apiKey && from) {
      await new Resend(apiKey).emails.send({
        from: from.includes("<") ? from : `Formosa Inc <${from}>`, to: [estimate.customerEmail], replyTo: from,
        subject: "【SK EC Pro】お支払いのご案内",
        text: `${estimate.customerName} 様\n\nお見積をご承認いただきありがとうございます。\n\n銀行振込先\n${process.env.BANK_TRANSFER_DETAILS || "振込先情報はマイページをご確認ください。"}\n\nクレジットカード決済\n${session.url}\n\nマイページ\nhttps://www.formosajapan.com/ec/login`,
      });
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

export async function cancelEstimate(_state: ApproveEstimateState, formData: FormData): Promise<ApproveEstimateState> {
  const estimateNumber = String(formData.get("estimateNumber") ?? "").trim().toUpperCase();
  if (!/^SK\d{6}-\d{4}$/.test(estimateNumber)) return { success: false, message: "見積番号が正しくありません。" };
  const { supabase } = await requireCustomerUser();
  const { data: owned } = await supabase.from("estimates").select("id, status").eq("estimate_no", estimateNumber).maybeSingle();
  if (!owned || owned.status !== "見積確認待ち") return { success: false, message: "この見積はキャンセルできません。" };
  const { error } = await createSupabaseAdminClient().from("estimates").update({ status: "キャンセル" }).eq("id", owned.id).eq("status", "見積確認待ち");
  if (error) return { success: false, message: "キャンセルを保存できませんでした。" };
  revalidatePath(`/ec/estimate/${estimateNumber}`); revalidatePath(`/account/estimates/${owned.id}`); revalidatePath("/admin/estimates");
  return { success: true, message: "見積をキャンセルしました。" };
}

export async function approveReceivedImages(formData: FormData) {
  const estimateNumber = String(formData.get("estimateNumber") ?? "").trim().toUpperCase();
  if (!/^SK\d{6}-\d{4}$/.test(estimateNumber)) return;
  const { supabase } = await requireCustomerUser();
  const { data: owned } = await supabase.from("estimates").select("id, status").eq("estimate_no", estimateNumber).maybeSingle();
  if (!owned || owned.status !== "画像確認待ち") return;
  await createSupabaseAdminClient().from("estimates").update({ status: "日本発送待ち" }).eq("id", owned.id).eq("status", "画像確認待ち");
  revalidatePath(`/account/estimates/${owned.id}`); revalidatePath("/admin/estimates");
}
