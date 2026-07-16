import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser } from "./authorization";

export async function requireAdminUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  if (!isAdminUser(user)) redirect("/admin/login?error=unauthorized");

  return user;
}
