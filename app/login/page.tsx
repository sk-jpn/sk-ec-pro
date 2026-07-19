import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { OAuthLoginButtons } from "./google-login-button";
import { GoogleSignupForm } from "./google-signup-form";
import { withBasePath } from "@/config/site";

export const metadata: Metadata = { title: "My Page Login｜SK EC Pro", robots: { index: false, follow: false } };

const messages: Record<string, string> = {
  account_unregistered: "アカウント未登録",
  unauthorized: "このアカウントではログインできませんでした。",
  oauth: "ログインを完了できませんでした。もう一度お試しください。",
  configuration: "認証設定を確認してください。",
  signup_expired: "アカウント作成情報の有効期限が切れました。もう一度入力してください。",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = params.next === "/estimate" ? "/estimate" : "/account";
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const admin = createSupabaseAdminClient();
    const { data: linkedCustomer } = await admin.from("customers").select("id").eq("auth_user_id", user.id).limit(1).maybeSingle();
    if (linkedCustomer) redirect(next);
    await supabase.auth.signOut();
  }

  const message = typeof params.error === "string" ? messages[params.error] : null;
  const accountDeleted = params.account === "deleted";
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12 text-slate-950">
    <div className="w-full max-w-4xl">
      <div className="mb-7 text-center">
        <Image src={withBasePath("/brand/sk-ec-pro-logo.png")} width={220} height={82} alt="SK EC Pro" className="mx-auto h-auto w-48" priority />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[.22em] text-emerald-600">My Page</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">マイページ ログイン</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Google・Microsoftアカウントで、見積から配送までの状況を確認できます。</p>
      </div>
      {message && <p role="alert" className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{message}</p>}
      {accountDeleted && <p role="status" className="mb-5 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">アカウントと関連データを削除しました。</p>}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="border-slate-200 shadow-xl shadow-slate-200/60">
          <CardContent className="p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Login</p>
            <h2 className="mt-2 text-xl font-bold">アカウント作成済みの方</h2>
            <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">登録時に使用した認証サービスでログインしてください。</p>
            <div className="mt-6"><OAuthLoginButtons next={next} /></div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 shadow-xl shadow-blue-100/50">
          <CardContent className="p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Create Account</p>
            <h2 className="mt-2 text-xl font-bold">アカウント未作成の方</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">顧客名と連絡用メールアドレスを入力後、認証サービスを選択します。</p>
            <div className="mt-6"><GoogleSignupForm /></div>
          </CardContent>
        </Card>
      </div>
      <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2 text-center text-xs font-medium text-slate-500"><span className="rounded-lg bg-white px-2 py-3">見積履歴</span><span className="rounded-lg bg-white px-2 py-3">注文状況</span><span className="rounded-lg bg-white px-2 py-3">発送状況</span></div>
      <p className="mt-5 text-center text-xs leading-5 text-slate-400">ログイン状態は安全なCookieに保存されます。</p>
    </div>
  </main>;
}
