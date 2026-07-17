"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { deleteCustomerData } from "@/lib/customers/delete-customer-data";
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

function nonNegativeMoney(value: FormDataEntryValue | null) {
  if (value === "") return 0;
  if (typeof value !== "string" || !/^\d{1,10}$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
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
  const depositBalance = nonNegativeMoney(formData.get("depositBalance"));
  const adminMemo = text(formData, "adminMemo", 5000);

  if (typeof customerId !== "string" || !UUID_PATTERN.test(customerId)) {
    return { success: false, message: "顧客IDが正しくありません。" };
  }
  if (!name) return { success: false, message: "氏名を入力してください。" };
  if (!email || !EMAIL_PATTERN.test(email)) return { success: false, message: "正しいメールアドレスを入力してください。" };
  if (!phone || !postalCode || !prefecture || !addressLine1) return { success: false, message: "建物名・部屋番号以外の項目はすべて入力してください。" };
  if (company === null || addressLine2 === null || adminMemo === null) return { success: false, message: "入力内容が長すぎます。" };
  if (depositBalance === null) return { success: false, message: "デポジット残高を正しく入力してください。" };

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
      deposit_balance: depositBalance,
      admin_memo: adminMemo || null,
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

  try {
    await deleteCustomerData({ customerIds: [customerId] });
  } catch (error) {
    console.error("管理者による顧客データの削除に失敗しました。", error);
    return { success: false, message: "顧客と関連データを削除できませんでした。" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/estimates");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/shipping");
  redirect("/admin/customers?deleted=1");
}
