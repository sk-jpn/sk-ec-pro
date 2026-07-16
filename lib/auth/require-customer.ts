import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireCustomerUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: customer, error: customerError } = await admin.from("customers").select("id").eq("auth_user_id", user.id).limit(1).maybeSingle();
  if (customerError) throw new Error(`お客様情報を確認できませんでした: ${customerError.message}`);
  if (!customer) redirect("/account-not-found");

  const { error } = await supabase.rpc("claim_customer_account");
  if (error?.message.toLowerCase().includes("jwt issued at future")) {
    redirect("/auth/account-error");
  }
  if (error) throw new Error(`お客様情報を連携できませんでした: ${error.message}`);
  return { user, supabase };
}
