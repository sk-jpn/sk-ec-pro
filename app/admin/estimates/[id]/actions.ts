"use server";

import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getEstimateQuoteData } from "@/lib/estimates/quote-data";
import { generateEstimatePdf } from "@/lib/pdf/estimate-pdf";
import { PAYMENT_METHODS } from "@/config/payment";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { ESTIMATE_IMAGE_BUCKET, validateEstimateImage } from "@/lib/estimates/image-files";
import { isEstimateStatus } from "../statuses";

export type UpdateEstimateState = {
  success: boolean;
  message: string;
};

export type UpdateQuoteState = UpdateEstimateState;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function textField(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" && value.length <= max ? value.trim() : null;
}

export async function updateEstimateItem(_state: UpdateEstimateState, formData: FormData): Promise<UpdateEstimateState> {
  await requireAdminUser();
  const itemId = formData.get("itemId");
  const estimateId = formData.get("estimateId");
  if (typeof itemId !== "string" || !UUID_PATTERN.test(itemId) || typeof estimateId !== "string" || !UUID_PATTERN.test(estimateId)) return { success: false, message: "商品IDが正しくありません。" };
  const url = textField(formData, "url", 2_000);
  const productName = textField(formData, "productName", 300);
  const color = textField(formData, "color", 200);
  const size = textField(formData, "size", 200);
  const model = textField(formData, "model", 200);
  const request = textField(formData, "request", 2_000);
  if ([url, productName, color, size, model, request].some((value) => value === null)) return { success: false, message: "商品情報の文字数を確認してください。" };
  if (url) {
    try { const parsed = new URL(url); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(); } catch { return { success: false, message: "商品URLを確認してください。" }; }
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("estimate_items").update({ url, product_name: productName || null, color: color || null, size: size || null, model: model || null, request }).eq("id", itemId).eq("estimate_id", estimateId).select("id").maybeSingle();
  if (error || !data) return { success: false, message: "商品情報を保存できませんでした。" };
  revalidatePath(`/admin/estimates/${estimateId}`);
  revalidatePath("/account/estimates/[id]", "page");
  return { success: true, message: "商品情報を保存しました。" };
}

export async function uploadEstimateItemImages(_state: UpdateEstimateState, formData: FormData): Promise<UpdateEstimateState> {
  await requireAdminUser();
  const itemId = formData.get("itemId");
  const estimateId = formData.get("estimateId");
  const imageType = formData.get("imageType");
  const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (typeof itemId !== "string" || !UUID_PATTERN.test(itemId) || typeof estimateId !== "string" || !UUID_PATTERN.test(estimateId) || (imageType !== "estimate" && imageType !== "received")) return { success: false, message: "画像の送信内容が正しくありません。" };
  if (!files.length) return { success: false, message: "画像を選択してください。" };
  if (files.length > 2) return { success: false, message: "画像は1回につき2枚まで選択してください。" };
  const table = imageType === "received" ? "received_item_images" : "estimate_item_images";
  const limit = imageType === "received" ? 2 : 10;
  const supabase = createSupabaseAdminClient();
  const { data: item, error: itemError } = await supabase.from("estimate_items").select("id, estimates!inner(estimate_no)").eq("id", itemId).eq("estimate_id", estimateId).maybeSingle();
  if (itemError || !item) return { success: false, message: "商品情報を確認できませんでした。" };
  const { data: current, error: countError } = await supabase.from(table).select("id, sort_order").eq("estimate_item_id", itemId).order("sort_order");
  if (countError) return { success: false, message: "登録済み画像を確認できませんでした。" };
  if ((current?.length ?? 0) + files.length > limit) return { success: false, message: `${imageType === "received" ? "到着商品画像" : "見積商品画像"}は最大${limit}枚です。` };
  const used = new Set((current ?? []).map((image) => image.sort_order));
  const estimateRelation = item.estimates as unknown as { estimate_no: string };
  const uploaded: string[] = [];
  try {
    for (const file of files) {
      const validated = await validateEstimateImage(file);
      let sortOrder = 1;
      while (used.has(sortOrder)) sortOrder += 1;
      used.add(sortOrder);
      const folder = imageType === "received" ? "received" : "admin-estimate";
      const path = `${estimateRelation.estimate_no}/${folder}/${itemId}/${crypto.randomUUID()}.${validated.extension}`;
      const { error: uploadError } = await supabase.storage.from(ESTIMATE_IMAGE_BUCKET).upload(path, validated.buffer, { contentType: validated.mimeType, upsert: false });
      if (uploadError) throw uploadError;
      uploaded.push(path);
      const { error: insertError } = await supabase.from(table).insert({ estimate_item_id: itemId, storage_path: path, original_name: file.name.slice(0, 255) || "image", mime_type: validated.mimeType, sort_order: sortOrder });
      if (insertError) throw insertError;
    }
  } catch (error) {
    if (uploaded.length) {
      await supabase.from(table).delete().in("storage_path", uploaded);
      await supabase.storage.from(ESTIMATE_IMAGE_BUCKET).remove(uploaded);
    }
    console.error("管理画面の商品画像アップロードに失敗しました。", error);
    return { success: false, message: error instanceof Error ? error.message : "画像をアップロードできませんでした。" };
  }
  revalidatePath(`/admin/estimates/${estimateId}`);
  revalidatePath("/account/estimates/[id]", "page");
  return { success: true, message: "画像を追加しました。" };
}

export async function deleteEstimateItemImage(formData: FormData) {
  await requireAdminUser();
  const imageId = formData.get("imageId");
  const estimateId = formData.get("estimateId");
  const imageType = formData.get("imageType");
  if (typeof imageId !== "string" || !UUID_PATTERN.test(imageId) || typeof estimateId !== "string" || !UUID_PATTERN.test(estimateId) || (imageType !== "estimate" && imageType !== "received")) return;
  const table = imageType === "received" ? "received_item_images" : "estimate_item_images";
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from(table).select("storage_path, estimate_items!inner(estimate_id)").eq("id", imageId).eq("estimate_items.estimate_id", estimateId).maybeSingle();
  if (!data) return;
  const { error } = await supabase.from(table).delete().eq("id", imageId);
  if (!error) await supabase.storage.from(ESTIMATE_IMAGE_BUCKET).remove([data.storage_path]);
  revalidatePath(`/admin/estimates/${estimateId}`);
  revalidatePath("/account/estimates/[id]", "page");
}

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
  const saveMode = formData.get("saveMode");
  const feeNames = ["chinaShippingFee", "internationalShippingFee", "agencyFee", "otherFee", "discount", "tax"] as const;
  const fees = feeNames.map((name) => money(formData.get(name)));

  if (typeof estimateId !== "string" || !UUID_PATTERN.test(estimateId)) {
    return { success: false, message: "見積IDが正しくありません。" };
  }
  if (saveMode !== "draft" && saveMode !== "complete") {
    return { success: false, message: "保存方法が正しくありません。" };
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

  let accountGuideSent = false;
  if (saveMode === "complete") {
    const { data: accountTarget, error: accountTargetError } = await supabase
      .from("estimates")
      .select("estimate_no, customers(name, email, auth_user_id)")
      .eq("id", estimateId)
      .maybeSingle();
    if (accountTargetError || !accountTarget) {
      console.error("顧客アカウント連携状況を確認できませんでした。", accountTargetError);
      return { success: false, message: "見積内容は保存されましたが、顧客アカウントの状態を確認できませんでした。" };
    }
    const customer = accountTarget.customers as unknown as { name: string; email: string; auth_user_id: string | null } | null;
    if (!customer) return { success: false, message: "見積内容は保存されましたが、顧客情報を確認できませんでした。" };
    {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL;
      if (!apiKey || !from) return { success: false, message: "見積内容は保存されましたが、マイページ案内メールの設定が完了していません。" };
      const sender = from.includes("<") ? from : `Formosa Inc <${from}>`;
      const siteOrigin = new URL(process.env.SITE_URL || "https://formosajapan.com").origin;
      const loginUrl = `${siteOrigin}/ec/login?next=/account`;
      const resend = new Resend(apiKey);
      const { error: guideError } = await resend.emails.send({
        from: sender,
        to: [customer.email],
        replyTo: from,
        subject: `【SK EC Pro】マイページ登録・ログインのご案内 ${accountTarget.estimate_no}`,
        text: `${customer.name} 様\n\nお見積 ${accountTarget.estimate_no} の確認準備が整いました。\n見積内容の確認・承認には、下記よりGoogleログインをご利用ください。\n\nマイページ登録・ログイン:\n${loginUrl}\n\nこのメールの送信先「${customer.email}」と同じメールアドレスが登録されたGoogleアカウントでログインしてください。\n初回ログインの場合はアカウントが作成され、見積データが自動的にマイページへ連携されます。登録済みの場合は、そのままマイページへログインできます。\n\nGoogleアカウントを利用しない場合は、引き続きメールでご案内いたします。\n\nFormosa Japan / SK EC Pro\ncontact@formosajapan.com`,
      });
      if (guideError) {
        console.error("マイページ案内メールの送信に失敗しました。", guideError);
        return { success: false, message: "見積内容は保存されましたが、マイページ案内メールを送信できませんでした。" };
      }
      accountGuideSent = true;
    }
  }

  const nextStatus = saveMode === "complete" ? "お客様確認中" : "見積作成中";
  const eligibleStatuses = saveMode === "complete" ? ["新規", "見積作成中"] : ["新規"];
  const { error: statusError } = await supabase
    .from("estimates")
    .update({ status: nextStatus })
    .eq("id", estimateId)
    .in("status", eligibleStatuses);
  if (statusError) {
    console.error("見積ステータスの更新に失敗しました。", statusError);
    return { success: false, message: "商品情報は保存されましたが、見積ステータスを更新できませんでした。" };
  }

  revalidatePath("/admin/estimates");
  revalidatePath(`/admin/estimates/${estimateId}`);
  return saveMode === "complete"
    ? { success: true, message: accountGuideSent ? "見積内容を保存し、マイページ案内メールを送信してお客様確認中へ更新しました。" : "見積内容を保存し、お客様確認中へ更新しました。" }
    : { success: true, message: "見積内容を一時保存しました。" };
}

export async function sendEstimateQuote(estimateId: string): Promise<UpdateQuoteState> {
  await requireAdminUser();
  if (!UUID_PATTERN.test(estimateId)) return { success: false, message: "見積IDが正しくありません。" };

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { success: false, message: "メール送信設定が完了していません。" };
  const sender = from.includes("<") ? from : `Formosa Inc <${from}>`;

  try {
    const statusClient = createSupabaseAdminClient();
    const { data: statusEstimate, error: statusCheckError } = await statusClient.from("estimates").select("status").eq("id", estimateId).maybeSingle();
    if (statusCheckError || !statusEstimate) return { success: false, message: "見積の状態を確認できませんでした。" };
    if (statusEstimate.status !== "お客様確認中") return { success: false, message: "お客様確認中の案件のみお客様へ送信できます。" };
    const estimate = await getEstimateQuoteData(estimateId);
    if (!estimate) return { success: false, message: "見積が見つかりません。" };
    const pdf = await generateEstimatePdf(estimate, { logoPath: join(process.cwd(), "public", "brand", "sk-ec-pro-logo.png") });
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: sender,
      to: [estimate.customerEmail],
      replyTo: from,
      subject: `【SK EC Pro】お見積書 ${estimate.estimateNo}`,
      text: `${estimate.customerName} 様\n\nご依頼いただきましたお見積書をお送りします。\n添付のPDFをご確認のうえ、下記ページからご承認ください。\n\nマイページ登録・ログイン:\nhttps://formosajapan.com/ec/login?next=/account\n\n見積確認・承認ページ:\nhttps://formosajapan.com/ec/estimate/${estimate.estimateNo}\n\nこのメールの送信先と同じメールアドレスが登録されたGoogleアカウントでログインすると、見積データがマイページへ連携されます。\n\nFormosa Japan / SK EC Pro\ncontact@formosajapan.com`,
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
