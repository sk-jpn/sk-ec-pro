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
    const { data: created, error: createError } = await admin.from("stay_customers").upsert({
      auth_user_id: user.id,
      name: user.user_metadata.full_name ?? user.user_metadata.name ?? user.email ?? "お客様",
      email: user.email ?? "",
      last_login_at: new Date().toISOString(),
    }, { onConflict: "auth_user_id" }).select("*").single();
    if (createError) {
      console.error("宿泊プロフィールの作成に失敗しました。", { code: createError.code, message: createError.message, details: createError.details });
      throw new Error("宿泊プロフィールを作成できませんでした。");
    }
    return { user, customer: created, supabase };
  }
  return { user, customer, supabase };
}
