import Link from "next/link";
import { SearchX } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/app/components/site-chrome";

export default function EstimateStatusNotFound() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <section className="hero-glow pt-20">
        <div className="mx-auto flex min-h-[38rem] max-w-3xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
          <span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500"><SearchX size={25} /></span>
          <h1 className="mt-7 text-2xl font-semibold tracking-tight sm:text-3xl">見積情報が見つかりません</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">URLの見積番号をご確認ください。解決しない場合は、お問い合わせ窓口までご連絡ください。</p>
          <a href="mailto:contact@formosajapan.com" className="mt-7 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">お問い合わせ</a>
          <Link href="/" className="mt-5 text-sm font-medium text-slate-500 hover:text-blue-600">トップページへ戻る</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
