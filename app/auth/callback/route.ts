import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withBasePath } from "@/config/site";
import { isAdminUser } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CUSTOMER_SIGNUP_COOKIE = "sk_ec_customer_signup";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
  const mode = requestUrl.searchParams.get("mode");
  const next = requestedNext === "/account" || requestedNext === "/estimate" ? requestedNext : "/admin";
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

  if (next === "/account") {
    const admin = createSupabaseAdminClient();
    const { data: linkedCustomer, error: linkedError } = await admin
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (linkedError) {
      console.error("Googleログイン対象の顧客確認に失敗しました。", linkedError);
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL(`${withBasePath("/login")}?error=oauth`, requestUrl.origin));
    }
    if (!linkedCustomer && mode === "signup") {
      const cookieStore = await cookies();
      const rawSignup = cookieStore.get(CUSTOMER_SIGNUP_COOKIE)?.value;
      cookieStore.delete(CUSTOMER_SIGNUP_COOKIE);
      let signup: { name: string; email: string } | null = null;
      try {
        const parsed = JSON.parse(Buffer.from(rawSignup ?? "", "base64url").toString("utf8")) as { name?: unknown; email?: unknown };
        if (typeof parsed.name === "string" && typeof parsed.email === "string") signup = { name: parsed.name.trim(), email: parsed.email.trim().toLowerCase() };
      } catch {
        signup = null;
      }
      if (!signup?.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signup.email)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL(`${withBasePath("/login")}?error=signup_expired`, requestUrl.origin));
      }
      const { error: createError } = await admin.from("customers").insert({
        name: signup.name,
        email: signup.email,
        prefecture: "",
        auth_user_id: user.id,
      });
      if (createError) {
        console.error("顧客アカウントの作成に失敗しました。", createError);
        await supabase.auth.signOut();
        await admin.auth.admin.deleteUser(user.id);
        return NextResponse.redirect(new URL(`${withBasePath("/login")}?error=configuration`, requestUrl.origin));
      }
    } else if (!linkedCustomer) {
      await supabase.auth.signOut();
      await admin.auth.admin.deleteUser(user.id);
      return NextResponse.redirect(new URL(`${withBasePath("/login")}?error=account_unregistered`, requestUrl.origin));
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (process.env.NODE_ENV === "production" && forwardedHost) {
    return NextResponse.redirect(`${forwardedProto}://${forwardedHost}${destinationPath}`);
  }
  return NextResponse.redirect(destination);
}
