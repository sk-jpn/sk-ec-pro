import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Resend } from "resend";
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
  const next = requestedNext === "/account" || requestedNext === "/estimate" || requestedNext === "/stay/mypage" ? requestedNext : "/admin";
  const loginPath = next === "/admin" ? "/admin/login" : next === "/stay/mypage" ? "/stay/login" : "/login";
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
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL;
      if (apiKey && from) {
        const sender = from.includes("<") ? from : `Formosa Inc <${from}>`;
        const { error: notificationError } = await new Resend(apiKey).emails.send({
          from: sender,
          to: ["contact@formosajapan.com"],
          replyTo: signup.email,
          subject: "【SK EC Pro】顧客アカウントが作成されました",
          text: `新しい顧客アカウントが作成されました。\n\n顧客氏名：${signup.name}\n連絡用メールアドレス：${signup.email}\n\n管理画面で顧客情報と見積の紐付けをご確認ください。`,
        });
        if (notificationError) console.error("顧客アカウント作成通知メールの送信に失敗しました。", notificationError);
      } else {
        console.error("顧客アカウント作成通知メールを送信できません。Resend設定がありません。");
      }
    } else if (!linkedCustomer) {
      await supabase.auth.signOut();
      await admin.auth.admin.deleteUser(user.id);
      return NextResponse.redirect(new URL(`${withBasePath("/login")}?error=account_unregistered`, requestUrl.origin));
    }
  }

  if (next === "/stay/mypage") {
    const admin = createSupabaseAdminClient();
    const { error: profileError } = await admin.from("stay_customers").upsert({
      auth_user_id: user.id,
      name: user.user_metadata.full_name ?? user.user_metadata.name ?? user.email ?? "お客様",
      email: user.email ?? "",
      last_login_at: new Date().toISOString(),
    }, { onConflict: "auth_user_id" });
    if (profileError) {
      console.error("宿泊プロフィールの準備に失敗しました。", profileError);
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL(`${withBasePath("/stay/login")}?error=configuration`, requestUrl.origin));
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (process.env.NODE_ENV === "production" && forwardedHost) {
    return NextResponse.redirect(`${forwardedProto}://${forwardedHost}${destinationPath}`);
  }
  return NextResponse.redirect(destination);
}
