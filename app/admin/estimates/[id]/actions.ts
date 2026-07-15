"use server";

import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getEstimateQuoteData } from "@/lib/estimates/quote-data";
import { generateEstimatePdf } from "@/lib/pdf/estimate-pdf";
import { PAYMENT_METHODS } from "@/config/payment";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { isEstimateStatus } from "../statuses";

export type UpdateEstimateState = {
  success: boolean;
  message: string;
};

export type UpdateQuoteState = UpdateEstimateState;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function money(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{1,10}$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export async function updateEstimate(
  _previousState: UpdateEstimateState,
  formData: FormData,
): Promise<UpdateEstimateState> {
  await requireAdminUser();
  const estimateId = formData.get("estimateId");
  const status = formData.get("status");
  const rawMemo = formData.get("memo");

  if (typeof estimateId !== "string" || !UUID_PATTERN.test(estimateId)) {
    return { success: false, message: "見積IDが正しくありません。" };
  }
  if (!isEstimateStatus(status)) {
    return { success: false, message: "ステータスが正しくありません。" };
  }
  if (typeof rawMemo !== "string" || rawMemo.length > 5_000) {
    return { success: false, message: "メモは5,000文字以内で入力してください。" };
  }

  const memo = rawMemo.trim();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .update({ status, memo: memo || null })
    .eq("id", estimateId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("見積ステータスの更新に失敗しました。", error);
    return { success: false, message: "保存できませんでした。時間をおいて再度お試しください。" };
  }

  revalidatePath("/admin/estimates");
  revalidatePath(`/admin/estimates/${estimateId}`);
  return { success: true, message: "案件情報を保存しました。" };
}

export async function updateEstimateQuote(
  _previousState: UpdateQuoteState,
  formData: FormData,
): Promise<UpdateQuoteState> {
  await requireAdminUser();
  const estimateId = formData.get("estimateId");
  const itemIds = formData.getAll("itemId");
  const issueDate = formData.get("quoteIssueDate");
  const validUntil = formData.get("validUntil");
  const paymentMethod = formData.get("paymentMethod");
  const feeNames = ["chinaShippingFee", "internationalShippingFee", "agencyFee", "otherFee", "discount", "tax"] as const;
  const fees = feeNames.map((name) => money(formData.get(name)));

  if (typeof estimateId !== "string" || !UUID_PATTERN.test(estimateId)) {
    return { success: false, message: "見積IDが正しくありません。" };
  }
  if (itemIds.length < 1 || itemIds.some((id) => typeof id !== "string" || !UUID_PATTERN.test(id))) {
    return { success: false, message: "商品情報が正しくありません。" };
  }
  if (typeof issueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(issueDate) || (typeof validUntil === "string" && validUntil !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(validUntil))) {
    return { success: false, message: "発行日または有効期限が正しくありません。" };
  }
  if (typeof paymentMethod !== "string" || paymentMethod.trim().length < 1 || paymentMethod.length > 100 || fees.some((value) => value === null)) {
    return { success: false, message: "金額と支払方法を確認してください。" };
  }

  const items = itemIds.map((entry) => {
    const id = String(entry);
    const productName = formData.get(`productName_${id}`);
    const quantity = money(formData.get(`quantity_${id}`));
    const unitPrice = money(formData.get(`unitPrice_${id}`));
    return { id, productName, quantity, unitPrice };
  });
  if (items.some((item) => typeof item.productName !== "string" || item.productName.length > 300 || item.quantity === null || item.quantity < 1 || item.unitPrice === null)) {
    return { success: false, message: "商品名・数量・単価を確認してください。" };
  }

  const supabase = createSupabaseAdminClient();
  const { data: ownedItems, error: ownershipError } = await supabase
    .from("estimate_items")
    .select("id")
    .eq("estimate_id", estimateId)
    .in("id", itemIds.map(String));
  if (ownershipError || ownedItems?.length !== itemIds.length) {
    return { success: false, message: "商品情報を確認できませんでした。" };
  }

  const [chinaShippingFee, internationalShippingFee, agencyFee, otherFee, discount, tax] = fees as number[];
  const { error: estimateError } = await supabase.from("estimates").update({
    quote_issue_date: issueDate,
    valid_until: validUntil || null,
    payment_method: paymentMethod.trim(),
    china_shipping_fee: chinaShippingFee,
    international_shipping_fee: internationalShippingFee,
    agency_fee: agencyFee,
    other_fee: otherFee,
    discount,
    tax,
  }).eq("id", estimateId);
  if (estimateError) {
    console.error("見積金額の更新に失敗しました。", estimateError);
    return { success: false, message: "見積設定を保存できませんでした。" };
  }

  const itemResults = await Promise.all(items.map((item) => supabase
    .from("estimate_items")
    .update({ product_name: String(item.productName).trim() || null, quantity: item.quantity, unit_price: item.unitPrice })
    .eq("id", item.id)
    .eq("estimate_id", estimateId)));
  const itemError = itemResults.find((result) => result.error)?.error;
  if (itemError) {
    console.error("見積商品の更新に失敗しました。", itemError);
    return { success: false, message: "商品情報を保存できませんでした。" };
  }

  revalidatePath(`/admin/estimates/${estimateId}`);
  return { success: true, message: "見積書の設定を保存しました。" };
}

export async function sendEstimateQuote(estimateId: string): Promise<UpdateQuoteState> {
  await requireAdminUser();
  if (!UUID_PATTERN.test(estimateId)) return { success: false, message: "見積IDが正しくありません。" };

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { success: false, message: "メール送信設定が完了していません。" };

  try {
    const estimate = await getEstimateQuoteData(estimateId);
    if (!estimate) return { success: false, message: "見積が見つかりません。" };
    const pdf = await generateEstimatePdf(estimate, { logoPath: join(process.cwd(), "public", "formosa-japan-logo.png") });
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [estimate.customerEmail],
      replyTo: from,
      subject: `【SK EC Pro】お見積書 ${estimate.estimateNo}`,
      text: `${estimate.customerName} 様\n\nご依頼いただきましたお見積書をお送りします。\n添付のPDFをご確認のうえ、下記ページからご承認ください。\n\n見積確認・承認ページ:\nhttps://formosajapan.com/ec/estimate/${estimate.estimateNo}\n\n進捗確認ページ:\nhttps://formosajapan.com/ec/status/${estimate.estimateNo}\n\nFormosa Japan / SK EC Pro\ncontact@formosajapan.com`,
      attachments: [{ filename: `estimate-${estimate.estimateNo}.pdf`, content: pdf }],
    });
    if (error) throw new Error(error.message);

    const supabase = createSupabaseAdminClient();
    const { error: statusError } = await supabase.from("estimates").update({ status: "お客様確認中" }).eq("id", estimateId);
    if (statusError) console.error("見積送信後のステータス更新に失敗しました。", statusError);

    revalidatePath("/admin/estimates");
    revalidatePath(`/admin/estimates/${estimateId}`);
    revalidatePath(`/ec/status/${estimate.estimateNo}`);
    return { success: true, message: `${estimate.customerEmail} へ見積書を送信しました。` };
  } catch (error) {
    console.error("見積書メールの送信に失敗しました。", error);
    return { success: false, message: "見積書を送信できませんでした。" };
  }
}

export async function confirmBankPayment(
  _previousState: UpdateQuoteState,
  formData: FormData,
): Promise<UpdateQuoteState> {
  await requireAdminUser();
  const estimateId = formData.get("estimateId");
  if (typeof estimateId !== "string" || !UUID_PATTERN.test(estimateId)) return { success: false, message: "見積IDが正しくありません。" };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .update({ status: "paid", paid_at: new Date().toISOString(), payment_fee: 0 })
    .eq("id", estimateId)
    .eq("payment_method", PAYMENT_METHODS.bankTransfer)
    .not("approved_at", "is", null)
    .is("paid_at", null)
    .neq("status", "キャンセル")
    .select("id, estimate_no")
    .maybeSingle();
  if (error) {
    console.error("銀行振込の入金確認に失敗しました。", error);
    return { success: false, message: "入金状態を保存できませんでした。" };
  }
  if (!data) return { success: false, message: "承認済みの銀行振込案件のみ入金確認できます。" };

  revalidatePath("/admin/estimates");
  revalidatePath(`/admin/estimates/${estimateId}`);
  revalidatePath(`/ec/estimate/${data.estimate_no}`);
  revalidatePath(`/ec/status/${data.estimate_no}`);
  return { success: true, message: "入金確認を保存しました。" };
}
