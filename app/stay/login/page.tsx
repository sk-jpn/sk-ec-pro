import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OAuthLoginButtons } from "@/app/login/google-login-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { withBasePath } from "@/config/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "宿泊予約マイページ ログイン｜SK EC Pro", robots: { index: false, follow: false } };
const authenticationErrors: Record<string, string> = {
  account_unregistered: "アカウントがありません。アカウント作成からお進みください。",
  oauth: "ログインを完了できませんでした。もう一度お試しください。",
  unauthorized: "このアカウントではログインできません。",
  configuration: "認証処理でエラーが発生しました。時間をおいてもう一度お試しください。",
  session: "ログイン状態を確認できませんでした。もう一度ログインしてください。",
};

export default async function StayLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const query = await searchParams;
  const next: "/stay/search" | "/stay/mypage" = query.next === "/stay/search" ? "/stay/search" : "/stay/mypage";
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(next);
  const accountUnregistered = query.error === "account_unregistered";
  const authenticationError = typeof query.error === "string" ? authenticationErrors[query.error] ?? "ログイン処理でエラーが発生しました。もう一度お試しください。" : null;

  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12"><div className="w-full max-w-md text-center">
    <Image src={withBasePath("/brand/sk-ec-pro-logo.png")} width={200} height={75} alt="SK EC Pro" className="mx-auto h-auto w-44" />
    <p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Stay</p>
    <h1 className="mt-2 text-2xl font-bold">宿泊予約マイページ</h1>
    <p className="mt-3 text-sm leading-6 text-slate-500">宿泊予約、予約内容の確認、管理者とのメッセージを利用できます。</p>
    <Card className="mt-7 text-left shadow-xl shadow-slate-200/60"><CardContent className="p-7">
      <h2 className="font-bold">ログイン</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">登録済みのGoogle・Microsoftアカウントでログインできます。</p>
      {authenticationError && <div role="alert" className={`mt-5 rounded-xl border p-4 ${accountUnregistered ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800"}`}>
        <p className="text-sm font-bold leading-6">{authenticationError}</p>
        {accountUnregistered && <Button asChild className="mt-3 w-full"><Link href="/stay/signup">アカウント作成へ</Link></Button>}
      </div>}
      <div className="mt-5"><OAuthLoginButtons next={next} /></div>
      <p className="mt-6 border-t pt-5 text-center text-sm text-slate-500">初めて利用する方は <Link href="/stay/signup" className="font-bold text-emerald-700 underline">アカウント作成</Link></p>
    </CardContent></Card>
  </div></main>;
}
