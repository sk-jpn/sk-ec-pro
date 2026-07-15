import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireCustomerUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const { error } = await supabase.rpc("claim_customer_account");
  if (error) throw new Error(`お客様情報を連携できませんでした: ${error.message}`);
  return { user, supabase };
}
