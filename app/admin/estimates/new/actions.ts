"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CreateEstimateState = { success: boolean; message: string };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function value(formData: FormData, name: string, maxLength: number) {
  const entry = formData.get(name);
  if (typeof entry !== "string") return null;
  const trimmed = entry.trim();
  return trimmed.length <= maxLength ? trimmed : null;
}

export async function createManualEstimate(_state: CreateEstimateState, formData: FormData): Promise<CreateEstimateState> {
  await requireAdminUser();
  const customerId = formData.get("customerId");
  const productName = value(formData, "productName", 300);
  const url = value(formData, "url", 2_000);
  const rawQuantity = formData.get("quantity");
  const color = value(formData, "color", 200);
  const size = value(formData, "size", 200);
  const model = value(formData, "model", 200);
  const request = value(formData, "request", 2_000);

  if (typeof customerId !== "string" || !UUID_PATTERN.test(customerId)) return { success: false, message: "顧客を選択してください。" };
  if ([productName, url, color, size, model, request].some((entry) => entry === null)) return { success: false, message: "入力内容を確認してください。" };
  if (!productName && !url && !request) return { success: false, message: "商品名・商品URL・希望内容のいずれかを入力してください。" };
  if (url) {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      return { success: false, message: "商品URLを正しく入力してください。" };
    }
  }
  const quantity = typeof rawQuantity === "string" && /^\d{1,10}$/.test(rawQuantity) ? Number(rawQuantity) : 0;
  if (!Number.isSafeInteger(quantity) || quantity < 1) return { success: false, message: "数量を正しく入力してください。" };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("create_manual_estimate", {
    p_customer_id: customerId,
    p_product_name: productName ?? "",
    p_url: url ?? "",
    p_quantity: quantity,
    p_color: color ?? "",
    p_size: size ?? "",
    p_model: model ?? "",
    p_request: request ?? "",
  });
  const created = Array.isArray(data) ? data[0] : null;
  if (error || !created?.estimate_id) {
    console.error("手動見積登録に失敗しました。", error);
    return { success: false, message: "見積データを登録できませんでした。" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/estimates");
  redirect(`/admin/estimates/${created.estimate_id}`);
}
