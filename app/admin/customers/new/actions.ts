"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CreateCustomerState = { success: boolean; message: string };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function value(formData: FormData, name: string, maxLength: number) {
  const entry = formData.get(name);
  if (typeof entry !== "string") return null;
  const trimmed = entry.trim();
  return trimmed.length <= maxLength ? trimmed : null;
}

function nonNegativeMoney(entry: FormDataEntryValue | null) {
  if (entry === "") return 0;
  if (typeof entry !== "string" || !/^\d{1,10}$/.test(entry)) return null;
  const parsed = Number(entry);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export async function createCustomer(_state: CreateCustomerState, formData: FormData): Promise<CreateCustomerState> {
  await requireAdminUser();
  const name = value(formData, "name", 100);
  const company = value(formData, "company", 200);
  const email = value(formData, "email", 254);
  const phone = value(formData, "phone", 30);
  const postalCode = value(formData, "postalCode", 12);
  const prefecture = value(formData, "prefecture", 20);
  const addressLine1 = value(formData, "addressLine1", 200);
  const addressLine2 = value(formData, "addressLine2", 200);
  const depositBalance = nonNegativeMoney(formData.get("depositBalance"));

  if (!name) return { success: false, message: "氏名を入力してください。" };
  if (!email || !EMAIL_PATTERN.test(email)) return { success: false, message: "正しいメールアドレスを入力してください。" };
  if ([company, phone, postalCode, prefecture, addressLine1, addressLine2].some((entry) => entry === null)) return { success: false, message: "入力内容を確認してください。" };
  if (depositBalance === null) return { success: false, message: "デポジット残高を正しく入力してください。" };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("customers").insert({
    name,
    company: company || null,
    email: email.toLowerCase(),
    phone: phone || null,
    postal_code: postalCode || null,
    prefecture: prefecture || "",
    address_line1: addressLine1 || null,
    address_line2: addressLine2 || null,
    deposit_balance: depositBalance,
  }).select("id").single();
  if (error) {
    console.error("手動顧客登録に失敗しました。", error);
    return { success: false, message: "顧客データを登録できませんでした。" };
  }

  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${data.id}`);
}
