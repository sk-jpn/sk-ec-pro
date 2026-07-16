import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { isAdminUser } from "@/lib/auth/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GoogleLoginButton } from "./google-login-button";
import { withBasePath } from "@/config/site";

export const metadata: Metadata = { title: "管理画面ログイン｜SK EC Pro", robots: { index: false, follow: false } };

const messages: Record<string, string> = {
  unauthorized: "このGoogleアカウントには管理画面の利用権限がありません。",
  oauth: "Googleログインを完了できませんでした。もう一度お試しください。",
  configuration: "認証設定を確認してください。",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = params.next === "/account" ? "/account" : "/admin";
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && (next === "/account" || isAdminUser(user))) redirect(next);

  const message = typeof params.error === "string" ? messages[params.error] : null;
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12 text-slate-950">
    <div className="w-full max-w-md">
      <div className="mb-7 text-center">
        <Image src={withBasePath("/brand/sk-ec-pro-logo.png")} width={220} height={82} alt="SK EC Pro" className="mx-auto h-auto w-48" priority />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[.22em] text-emerald-600">My Page</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">管理画面ログイン</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{next === "/account" ? "お見積時と同じGoogleアカウントでログインしてください。" : "許可されたGoogleアカウントでログインしてください。"}</p>
      </div>
      <Card className="border-slate-200 shadow-xl shadow-slate-200/60">
        <CardContent className="p-6 sm:p-8">
          {message && <p role="alert" className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{message}</p>}
          <GoogleLoginButton next={next} />
          <p className="mt-5 text-center text-xs leading-5 text-slate-400">管理者専用ページです。ログイン状態は安全なCookieに保存されます。</p>
        </CardContent>
      </Card>
    </div>
  </main>;
}
