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

    if (customerError) {
      console.error("Googleログイン対象の顧客確認に失敗しました。", customerError);
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL(`${withBasePath("/login")}?error=oauth`, requestUrl.origin));
    }
    if (!hasCustomerAccount) {
      const { error: pendingError } = await admin.from("pending_customer_links").upsert({
        auth_user_id: user.id,
        google_email: normalizedEmail ?? "",
        status: "pending",
        updated_at: new Date().toISOString(),
      }, { onConflict: "auth_user_id" });
      if (pendingError) {
        console.error("連携確認待ちアカウントの保存に失敗しました。", pendingError);
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL(`${withBasePath("/login")}?error=configuration`, requestUrl.origin));
      }
      return NextResponse.redirect(new URL(withBasePath("/account-link-pending"), requestUrl.origin));
    }
    await admin.from("pending_customer_links").delete().eq("auth_user_id", user.id);
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (process.env.NODE_ENV === "production" && forwardedHost) {
    return NextResponse.redirect(`${forwardedProto}://${forwardedHost}${destinationPath}`);
  }
  return NextResponse.redirect(destination);
}
