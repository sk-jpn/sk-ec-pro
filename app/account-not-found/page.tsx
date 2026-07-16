import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "アカウントが存在しません",
  robots: { index: false, follow: false },
};

export default function AccountNotFoundPage() {
  return <main className="min-h-screen bg-white text-slate-950"><SiteHeader /><section className="hero-glow grid min-h-[42rem] place-items-center px-5 pb-20 pt-32"><div className="w-full max-w-xl rounded-[2rem] border border-amber-200 bg-white p-7 text-center shadow-2xl shadow-slate-200/60 sm:p-10"><span className="mx-auto grid size-14 place-items-center rounded-full bg-amber-100 text-amber-700"><CircleAlert size={27} /></span><p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-amber-700">ACCOUNT NOT FOUND</p><h1 className="mt-3 text-3xl font-bold tracking-tight">アカウントが存在しません</h1><p className="mt-5 text-sm leading-7 text-slate-600">このGoogleアカウントに一致する顧客情報がありません。見積フォームに入力したメールアドレスと同じGoogleアカウントでログインしてください。</p><p className="mt-3 text-sm leading-7 text-slate-500">アカウント削除後に再度利用する場合は、新しい見積依頼を送信してからログインしてください。</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/estimate" className="inline-flex min-h-12 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700">無料見積フォームへ</Link><Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-600">ログインへ戻る</Link></div></div></section><SiteFooter /></main>;
}
