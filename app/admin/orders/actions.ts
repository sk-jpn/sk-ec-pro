"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type DeleteOrderState = {
  success: boolean;
  message: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function deleteOrder(
  _previousState: DeleteOrderState,
  formData: FormData,
): Promise<DeleteOrderState> {
  await requireAdminUser();
  const orderId = formData.get("orderId");

  if (typeof orderId !== "string" || !UUID_PATTERN.test(orderId)) {
    return { success: false, message: "注文IDが正しくありません。" };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("注文データの削除に失敗しました。", error);
    return { success: false, message: "注文データを削除できませんでした。" };
  }
  if (!data) {
    return { success: false, message: "対象の注文データが見つかりません。" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/shipping");
  return { success: true, message: "注文データを削除しました。" };
}
