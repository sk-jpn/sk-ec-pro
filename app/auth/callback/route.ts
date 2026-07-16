import { NextResponse } from "next/server";
import { withBasePath } from "@/config/site";
import { isAdminUser } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
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
    const normalizedEmail = user.email?.trim().toLowerCase();
    const admin = createSupabaseAdminClient();
    const { data: linkedCustomer, error: linkedError } = await admin
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .limit(1)
      .maybeSingle();
    const { data: candidates, error: emailError } = !linkedCustomer && normalizedEmail
      ? await admin.from("customers").select("email, auth_user_id").ilike("email", normalizedEmail).limit(100)
      : { data: null, error: null };
    const hasLegacyEmailMatch = (candidates ?? []).some((customer) =>
      customer.email.trim().toLowerCase() === normalizedEmail &&
      (customer.auth_user_id === null || customer.auth_user_id === user.id)
    );
    const customerError = linkedError ?? emailError;
    const hasCustomerAccount = !customerError && (Boolean(linkedCustomer) || hasLegacyEmailMatch);

    if (!hasCustomerAccount) {
      if (customerError) console.error("Googleログイン対象の顧客確認に失敗しました。", customerError);
      await supabase.auth.signOut();
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) console.error("未登録GoogleユーザーのAuth削除に失敗しました。", deleteError);
      return NextResponse.redirect(new URL(withBasePath("/account-not-found"), requestUrl.origin));
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (process.env.NODE_ENV === "production" && forwardedHost) {
    return NextResponse.redirect(`${forwardedProto}://${forwardedHost}${destinationPath}`);
  }
  return NextResponse.redirect(destination);
}
