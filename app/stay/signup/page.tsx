import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StaySignupForm } from "./stay-signup-form";

export const metadata = { title: "宿泊マイページ アカウント作成｜SK EC Pro", robots: { index: false, follow: false } };
export default async function StaySignupPage() { const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (user) redirect("/stay/mypage"); return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12"><Card className="w-full max-w-md shadow-xl shadow-slate-200/60"><CardContent className="p-7"><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Stay Signup</p><h1 className="mt-2 text-2xl font-bold">宿泊マイページ アカウント作成</h1><p className="mt-3 text-sm leading-6 text-slate-500">Google・Microsoftの表示名ではなく、予約で使用する顧客名とメールアドレスを入力してください。</p><div className="mt-6"><StaySignupForm /></div><p className="mt-5 text-center text-sm text-slate-500">登録済みの方は <Link href="/stay/login" className="font-bold text-emerald-700 underline">ログイン</Link></p></CardContent></Card></main>; }
