"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cleanupExpiredCaseImages } from "@/lib/messages/case-messages";

export async function logout() {
  await cleanupExpiredCaseImages().catch((error) => console.error("期限切れ画像の削除に失敗しました。", error));
  await createSupabaseAdminClient().rpc("expire_stale_estimates").then(({ error }) => { if (error) console.error("期限切れ見積のキャンセルに失敗しました。", error); });
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
