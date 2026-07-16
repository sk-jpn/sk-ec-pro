"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ESTIMATE_IMAGE_BUCKET } from "@/lib/estimates/image-files";

export type ProfileState = { success: boolean; message: string };

export async function updateProfile(_state: ProfileState, formData: FormData): Promise<ProfileState> {
  const { user, supabase } = await requireCustomerUser();
  const value = (name: string, max: number) => { const entry = formData.get(name); return typeof entry === "string" && entry.trim().length <= max ? entry.trim() : null; };
  const fullName = value("fullName", 100); const phone = value("phone", 30); const postalCode = value("postalCode", 12); const prefecture = value("prefecture", 20); const addressLine1 = value("addressLine1", 200); const addressLine2 = value("addressLine2", 200);
  if (!fullName) return { success: false, message: "氏名を入力してください。" };
  if ([phone, postalCode, prefecture, addressLine1, addressLine2].some((entry) => entry === null)) return { success: false, message: "入力内容を確認してください。" };
  const { error } = await supabase.from("profiles").update({ full_name: fullName, phone: phone || null, postal_code: postalCode || null, prefecture: prefecture || null, address_line1: addressLine1 || null, address_line2: addressLine2 || null, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (error) return { success: false, message: "プロフィールを保存できませんでした。" };
  revalidatePath("/account"); revalidatePath("/account/profile");
  return { success: true, message: "プロフィールを保存しました。" };
}

export async function deleteCustomerAccount(_state: ProfileState, formData: FormData): Promise<ProfileState> {
  if (formData.get("confirmation") !== "アカウントを削除する") {
    return { success: false, message: "確認欄に「アカウントを削除する」と入力してください。" };
  }

  const { user, supabase } = await requireCustomerUser();
  const { data, error } = await supabase.rpc("delete_customer_account_data");
  if (error) {
    console.error("顧客アカウントデータの削除に失敗しました。", error);
    return { success: false, message: "アカウントを削除できませんでした。時間をおいて再度お試しください。" };
  }

  const admin = createSupabaseAdminClient();
  const storagePaths = Array.isArray(data) ? data.filter((path): path is string => typeof path === "string") : [];
  for (let index = 0; index < storagePaths.length; index += 100) {
    const { error: storageError } = await admin.storage.from(ESTIMATE_IMAGE_BUCKET).remove(storagePaths.slice(index, index + 100));
    if (storageError) console.error("削除済み見積の画像をStorageから削除できませんでした。", storageError);
  }

  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) {
    console.error("Supabase Authアカウントの削除に失敗しました。", authError);
    return { success: false, message: "顧客データは削除されましたが、ログイン情報を削除できませんでした。もう一度お試しください。" };
  }

  await supabase.auth.signOut();
  redirect("/login?account=deleted");
}
