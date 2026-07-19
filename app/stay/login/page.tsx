import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { OAuthLoginButtons } from "@/app/login/google-login-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withBasePath } from "@/config/site";

export const metadata={title:"宿泊予約マイページ ログイン｜SK EC Pro",robots:{index:false,follow:false}};
export default async function StayLoginPage({searchParams}:{searchParams:Promise<{next?:string}>}){const query=await searchParams;const next:"/stay/search"|"/stay/mypage"=query.next==='/stay/search'?'/stay/search':'/stay/mypage';const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();if(user)redirect(next);return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12"><div className="w-full max-w-md text-center"><Image src={withBasePath("/brand/sk-ec-pro-logo.png")} width={200} height={75} alt="SK EC Pro" className="mx-auto h-auto w-44"/><p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Stay</p><h1 className="mt-2 text-2xl font-bold">宿泊予約マイページ</h1><p className="mt-3 text-sm leading-6 text-slate-500">宿泊予約、予約内容の確認、管理者とのメッセージを利用できます。</p><Card className="mt-7 text-left shadow-xl shadow-slate-200/60"><CardContent className="p-7"><h2 className="font-bold">ログイン</h2><p className="mt-2 text-sm leading-6 text-slate-500">登録済みのGoogle・Microsoftアカウントでログインできます。</p><div className="mt-5"><OAuthLoginButtons next={next}/></div><p className="mt-6 border-t pt-5 text-center text-sm text-slate-500">初めて利用する方は <Link href="/stay/signup" className="font-bold text-emerald-700 underline">アカウント作成</Link></p></CardContent></Card></div></main>}
