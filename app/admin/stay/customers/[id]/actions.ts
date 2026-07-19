"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";

const customerId = (formData: FormData) => {
  const value = String(formData.get("id") ?? "");
  return /^[0-9a-f-]{36}$/i.test(value) ? value : "";
};
const value = (formData: FormData, name: string, max: number) => String(formData.get(name) ?? "").trim().slice(0, max);

export async function updateStayCustomer(formData: FormData) {
  await requireAdminUser();
  const id = customerId(formData);
  const name = value(formData, "name", 100);
  const email = value(formData, "email", 254).toLowerCase();
  if (!id || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`/admin/stay/customers/${id}?saved=invalid`);
  const { error } = await createSupabaseAdminClient().from("stay_customers").update({ name, email, phone: value(formData, "phone", 30), address: value(formData, "address", 500), preferred_language: value(formData, "preferredLanguage", 10) || "ja", admin_memo: value(formData, "adminMemo", 5000), airbnb_guest: formData.get("airbnbGuest") === "on", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) { console.error("宿泊顧客を更新できませんでした。", error); redirect(`/admin/stay/customers/${id}?saved=failed`); }
  revalidatePath(`/admin/stay/customers/${id}`); revalidatePath("/admin/stay/customers"); redirect(`/admin/stay/customers/${id}?saved=success`);
}

export async function deleteStayCustomer(formData: FormData) {
  await requireAdminUser();
  const id = customerId(formData);
  if (!id || formData.get("confirmation") !== "delete") redirect(`/admin/stay/customers/${id}?deleted=invalid`);
  const admin = createSupabaseAdminClient();
  const { data: bookings, error: bookingError } = await admin.from("stay_bookings").select("stripe_checkout_session_id").eq("customer_id", id).not("stripe_checkout_session_id", "is", null);
  if (bookingError) { console.error("削除対象の宿泊決済を確認できませんでした。", bookingError); redirect(`/admin/stay/customers/${id}?deleted=failed`); }
  for (const booking of bookings ?? []) if (booking.stripe_checkout_session_id) await Promise.resolve().then(() => getStripeClient().checkout.sessions.expire(booking.stripe_checkout_session_id)).catch(() => undefined);
  const { data: storagePaths, error } = await admin.rpc("delete_admin_stay_customer_data", { p_customer_id: id });
  if (error) { console.error("宿泊顧客と関連データを削除できませんでした。", error); redirect(`/admin/stay/customers/${id}?deleted=failed`); }
  if (Array.isArray(storagePaths) && storagePaths.length > 0) { const { error: storageError } = await admin.storage.from("stay-messages").remove(storagePaths); if (storageError) console.error("削除済み宿泊顧客の添付ファイルをStorageから削除できませんでした。", storageError); }
  revalidatePath("/admin/stay/customers"); revalidatePath("/admin/stay/bookings"); revalidatePath("/admin/stay/messages"); revalidatePath("/admin/stay/calendar"); redirect("/admin/stay/customers?deleted=success");
}
