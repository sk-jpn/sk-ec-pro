import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function requireStayUser(next = "/stay/mypage") {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/stay/login?next=${encodeURIComponent(next)}`);
  const admin = createSupabaseAdminClient();
  const { data: customer, error } = await admin.from("stay_customers").select("*").eq("auth_user_id", user.id).maybeSingle();
  if (error) {
    console.error("宿泊プロフィールの確認に失敗しました。", { code: error.code, message: error.message, details: error.details });
    throw new Error("宿泊プロフィールを確認できませんでした。");
  }
  if (!customer) {
    await supabase.auth.signOut();
    redirect(`/stay/signup?next=${encodeURIComponent(next)}`);
  }
  return { user, customer, supabase };
}
