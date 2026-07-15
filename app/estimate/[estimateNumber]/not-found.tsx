import Link from "next/link";
import { SearchX } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/app/components/site-chrome";

export default function EstimateNotFound() {
  return <main className="min-h-screen bg-white"><SiteHeader /><section className="hero-glow pt-20"><div className="mx-auto flex min-h-[38rem] max-w-3xl flex-col items-center justify-center px-5 py-20 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500"><SearchX size={25} /></span><h1 className="mt-7 text-2xl font-semibold">見積情報が見つかりません</h1><p className="mt-4 text-sm leading-7 text-slate-600">URLの見積番号をご確認ください。</p><Link href="/" className="mt-7 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white">トップページへ戻る</Link></div></section><SiteFooter /></main>;
}
