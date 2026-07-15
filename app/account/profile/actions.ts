"use server";
import { revalidatePath } from "next/cache";
import { requireCustomerUser } from "@/lib/auth/require-customer";

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
