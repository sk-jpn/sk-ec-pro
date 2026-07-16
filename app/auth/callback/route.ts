import { NextResponse } from "next/server";
import { withBasePath } from "@/config/site";
import { isAdminUser } from "@/lib/auth/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") === "/account" ? "/account" : "/admin";
  const loginPath = next === "/admin" ? "/admin/login" : "/login";
  const destinationPath = withBasePath(next);
  const destination = new URL(destinationPath, requestUrl.origin);

  if (!code) {
    return NextResponse.redirect(new URL(`${withBasePath(loginPath)}?error=oauth`, requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`${withBasePath(loginPath)}?error=oauth`, requestUrl.origin));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (next === "/admin" && !isAdminUser(user))) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL(`${withBasePath(loginPath)}?error=unauthorized`, requestUrl.origin));
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (process.env.NODE_ENV === "production" && forwardedHost) {
    return NextResponse.redirect(`${forwardedProto}://${forwardedHost}${destinationPath}`);
  }
  return NextResponse.redirect(destination);
}
