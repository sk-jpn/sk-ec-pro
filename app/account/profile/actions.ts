"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { deleteCustomerData } from "@/lib/customers/delete-customer-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ProfileState = { success: boolean; message: string };

export async function updateProfile(_state: ProfileState, formData: FormData): Promise<ProfileState> {
  const { user, supabase } = await requireCustomerUser();
  const value = (name: string, max: number) => { const entry = formData.get(name); return typeof entry === "string" && entry.trim().length <= max ? entry.trim() : null; };
  const fullName = value("fullName", 100); const email = value("email", 254); const phone = value("phone", 30); const postalCode = value("postalCode", 12); const prefecture = value("prefecture", 20); const addressLine1 = value("addressLine1", 200); const addressLine2 = value("addressLine2", 200);
  if (!fullName) return { success: false, message: "氏名を入力してください。" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, message: "正しいメールアドレスを入力してください。" };
  if ([phone, postalCode, prefecture, addressLine1, addressLine2].some((entry) => entry === null)) return { success: false, message: "入力内容を確認してください。" };
  if (!phone || !postalCode || !prefecture || !addressLine1) return { success: false, message: "建物名・部屋番号以外の項目はすべて入力してください。" };
  const { error } = await supabase.from("profiles").update({ full_name: fullName, email: email.toLowerCase(), phone: phone || null, postal_code: postalCode || null, prefecture: prefecture || null, address_line1: addressLine1 || null, address_line2: addressLine2 || null, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (error) return { success: false, message: "プロフィールを保存できませんでした。" };
  const admin = createSupabaseAdminClient();
  const { error: customerError } = await admin.from("customers").update({ name: fullName, email: email.toLowerCase(), phone, postal_code: postalCode, prefecture, address_line1: addressLine1, address_line2: addressLine2 || null }).eq("auth_user_id", user.id);
  if (customerError) {
    console.error("プロフィールに紐づく顧客情報を更新できませんでした。", customerError);
    return { success: false, message: "プロフィールは保存されましたが、顧客情報を更新できませんでした。" };
  }
  revalidatePath("/account"); revalidatePath("/account/profile");
  return { success: true, message: "プロフィールを保存しました。" };
}

export async function deleteCustomerAccount(_state: ProfileState, formData: FormData): Promise<ProfileState> {
  if (formData.get("confirmation") !== "アカウントを削除する") {
    return { success: false, message: "確認欄に「アカウントを削除する」と入力してください。" };
  }

  const { user, supabase } = await requireCustomerUser();
  try {
    await deleteCustomerData({ authUserId: user.id });
  } catch (error) {
    console.error("顧客アカウントデータの削除に失敗しました。", error);
    return { success: false, message: "アカウントを削除できませんでした。時間をおいて再度お試しください。" };
  }

  await supabase.auth.signOut();
  redirect("/login?account=deleted");
}
