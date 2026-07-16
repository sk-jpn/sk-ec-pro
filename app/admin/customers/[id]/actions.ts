"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { ESTIMATE_IMAGE_BUCKET } from "@/lib/estimates/image-files";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type UpdateCustomerState = {
  success: boolean;
  message: string;
};

export type DeleteCustomerState = UpdateCustomerState;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : null;
}

export async function updateCustomer(
  _previousState: UpdateCustomerState,
  formData: FormData,
): Promise<UpdateCustomerState> {
  await requireAdminUser();

  const customerId = formData.get("customerId");
  const name = text(formData, "name", 100);
  const company = text(formData, "company", 200);
  const email = text(formData, "email", 254);
  const phone = text(formData, "phone", 30);
  const postalCode = text(formData, "postalCode", 12);
  const prefecture = text(formData, "prefecture", 20);
  const addressLine1 = text(formData, "addressLine1", 200);
  const addressLine2 = text(formData, "addressLine2", 200);

  if (typeof customerId !== "string" || !UUID_PATTERN.test(customerId)) {
    return { success: false, message: "顧客IDが正しくありません。" };
  }
  if (!name) return { success: false, message: "氏名を入力してください。" };
  if (!email || !EMAIL_PATTERN.test(email)) return { success: false, message: "正しいメールアドレスを入力してください。" };
  if (!phone || !postalCode || !prefecture || !addressLine1) return { success: false, message: "建物名・部屋番号以外の項目はすべて入力してください。" };
  if (company === null || addressLine2 === null) return { success: false, message: "入力内容が長すぎます。" };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .update({
      name,
      company: company || null,
      email: email.toLowerCase(),
      phone,
      postal_code: postalCode,
      prefecture,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
    })
    .eq("id", customerId)
    .select("id, auth_user_id")
    .maybeSingle();

  if (error) {
    console.error("顧客情報の更新に失敗しました。", error);
    return { success: false, message: "顧客情報を保存できませんでした。" };
  }
  if (!data) return { success: false, message: "対象の顧客が見つかりません。" };
  if (data.auth_user_id) {
    const { error: profileError } = await supabase.from("profiles").update({
      full_name: name,
      email: email.toLowerCase(),
      phone,
      postal_code: postalCode,
      prefecture,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      updated_at: new Date().toISOString(),
    }).eq("id", data.auth_user_id);
    if (profileError) {
      console.error("顧客に紐づくプロフィールの更新に失敗しました。", profileError);
      return { success: false, message: "顧客情報は保存されましたが、マイページのお届け先住所を更新できませんでした。" };
    }
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/estimates");
  return { success: true, message: "顧客情報を保存しました。" };
}

export async function deleteCustomer(
  _previousState: DeleteCustomerState,
  formData: FormData,
): Promise<DeleteCustomerState> {
  await requireAdminUser();
  const customerId = formData.get("customerId");
  const confirmation = formData.get("confirmation");

  if (typeof customerId !== "string" || !UUID_PATTERN.test(customerId)) {
    return { success: false, message: "顧客IDが正しくありません。" };
  }
  if (confirmation !== "顧客データを削除する") {
    return { success: false, message: "確認欄に「顧客データを削除する」と入力してください。" };
  }

  const supabase = createSupabaseAdminClient();
  const { data: customer, error: customerReadError } = await supabase
    .from("customers")
    .select("id, auth_user_id")
    .eq("id", customerId)
    .maybeSingle();
  if (customerReadError || !customer) {
    console.error("削除対象の顧客情報を取得できませんでした。", customerReadError);
    return { success: false, message: "削除対象の顧客が見つかりません。" };
  }

  const { data: estimates, error: estimateReadError } = await supabase.from("estimates").select("id").eq("customer_id", customerId);
  if (estimateReadError) return { success: false, message: "顧客の見積データを確認できませんでした。" };
  const estimateIds = (estimates ?? []).map((estimate) => estimate.id);
  let storagePaths: string[] = [];

  if (estimateIds.length) {
    const { data: items, error: itemReadError } = await supabase.from("estimate_items").select("id").in("estimate_id", estimateIds);
    if (itemReadError) return { success: false, message: "顧客の商品データを確認できませんでした。" };
    const itemIds = (items ?? []).map((item) => item.id);
    if (itemIds.length) {
      const [{ data: estimateImages, error: estimateImageError }, { data: receivedImages, error: receivedImageError }] = await Promise.all([
        supabase.from("estimate_item_images").select("storage_path").in("estimate_item_id", itemIds),
        supabase.from("received_item_images").select("storage_path").in("estimate_item_id", itemIds),
      ]);
      if (estimateImageError || receivedImageError) return { success: false, message: "顧客の画像データを確認できませんでした。" };
      storagePaths = [...(estimateImages ?? []), ...(receivedImages ?? [])].map((image) => image.storage_path);
    }
  }

  const { error: orderDeleteError } = await supabase.from("orders").delete().eq("customer_id", customerId);
  if (orderDeleteError) {
    console.error("顧客の注文データを削除できませんでした。", orderDeleteError);
    return { success: false, message: "注文データを削除できませんでした。" };
  }
  if (estimateIds.length) {
    const { error: estimateDeleteError } = await supabase.from("estimates").delete().in("id", estimateIds);
    if (estimateDeleteError) {
      console.error("顧客の見積データを削除できませんでした。", estimateDeleteError);
      return { success: false, message: "見積データを削除できませんでした。" };
    }
  }
  const { error: customerDeleteError } = await supabase.from("customers").delete().eq("id", customerId);
  if (customerDeleteError) {
    console.error("顧客データを削除できませんでした。", customerDeleteError);
    return { success: false, message: "顧客データを削除できませんでした。" };
  }

  for (let index = 0; index < storagePaths.length; index += 100) {
    const { error: storageError } = await supabase.storage.from(ESTIMATE_IMAGE_BUCKET).remove(storagePaths.slice(index, index + 100));
    if (storageError) console.error("削除済み顧客の画像をStorageから削除できませんでした。", storageError);
  }

  if (customer.auth_user_id) {
    const { count, error: remainingError } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("auth_user_id", customer.auth_user_id);
    if (remainingError) {
      console.error("同一アカウントの残存顧客を確認できませんでした。", remainingError);
    } else if ((count ?? 0) === 0) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(customer.auth_user_id);
      if (authDeleteError) console.error("顧客の認証アカウントを削除できませんでした。", authDeleteError);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/estimates");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/shipping");
  redirect("/admin/customers?deleted=1");
}
