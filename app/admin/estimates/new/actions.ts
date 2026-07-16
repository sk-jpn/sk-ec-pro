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
  const rawItemCount = formData.get("itemCount");

  if (typeof customerId !== "string" || !UUID_PATTERN.test(customerId)) return { success: false, message: "顧客を選択してください。" };
  const itemCount = typeof rawItemCount === "string" && /^\d{1,2}$/.test(rawItemCount) ? Number(rawItemCount) : 0;
  if (!Number.isInteger(itemCount) || itemCount < 1 || itemCount > 10) return { success: false, message: "商品は1件から10件まで登録できます。" };

  const items = [];
  for (let index = 0; index < itemCount; index += 1) {
    const productName = value(formData, `productName_${index}`, 300);
    const url = value(formData, `url_${index}`, 2_000);
    const rawQuantity = formData.get(`quantity_${index}`);
    const color = value(formData, `color_${index}`, 200);
    const size = value(formData, `size_${index}`, 200);
    const model = value(formData, `model_${index}`, 200);
    const request = value(formData, `request_${index}`, 2_000);
    if ([productName, url, color, size, model, request].some((entry) => entry === null)) return { success: false, message: `商品${index + 1}の入力内容を確認してください。` };
    if (!productName && !url && !request) return { success: false, message: `商品${index + 1}の商品名・URL・希望内容のいずれかを入力してください。` };
    if (url) {
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        return { success: false, message: `商品${index + 1}のURLを正しく入力してください。` };
      }
    }
    const quantity = typeof rawQuantity === "string" && /^\d{1,10}$/.test(rawQuantity) ? Number(rawQuantity) : 0;
    if (!Number.isSafeInteger(quantity) || quantity < 1) return { success: false, message: `商品${index + 1}の数量を正しく入力してください。` };
    items.push({ productName, url, quantity, color, size, model, request });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("create_manual_estimate_items", {
    p_customer_id: customerId,
    p_items: items,
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
