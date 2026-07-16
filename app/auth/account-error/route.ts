import { NextResponse } from "next/server";
import { withBasePath } from "@/config/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(
    new URL(`${withBasePath("/login")}?error=account_unregistered`, request.url),
  );
}
