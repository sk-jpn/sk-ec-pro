import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleHelp, Mail, ShoppingBag, Store } from "lucide-react";
import { SiteFooter, SiteHeader } from "../components/site-chrome";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "お問い合わせ｜SK EC Pro", description: "中国EC購入代行、当社運営ショップ、その他SK EC Proへのお問い合わせ方法をご案内します。" };

export default function ContactPage() {
  const topics = [
    { title: "一般的なお問い合わせ", text: "SK EC Proのサービスやサイトについてのお問い合わせ。", icon: CircleHelp },
    { title: "中国EC購入代行について", text: "対応サイト、購入方法、配送条件などのご相談。見積依頼は専用フォームをご利用ください。", icon: ShoppingBag },
    { title: "当社運営ショップの商品について", text: "Yahoo!ショッピング・Amazonで当社が販売する商品についてのお問い合わせ。購入代行とは窓口が異なる場合があります。", icon: Store },
  ];
  return <main className="min-h-screen bg-white text-slate-950"><SiteHeader /><section className="hero-glow pt-20"><div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10"><Mail className="text-blue-600" size={34} /><p className="section-label mt-8">Contact</p><h1 className="section-title">お問い合わせ</h1><p className="section-copy">ご用件に合った窓口をご確認ください。中国EC購入代行のお見積りは、無料見積フォームから受け付けています。</p></div></section><section className="border-y border-slate-100 bg-slate-50/70 py-20 sm:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="grid gap-4 md:grid-cols-3">{topics.map(({ title, text, icon: Icon }) => <article key={title} className="rounded-[1.75rem] border border-slate-100 bg-white p-6"><span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Icon size={20} /></span><h2 className="mt-7 text-lg font-semibold">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{text}</p></article>)}</div></div></section><section className="py-24 sm:py-32"><div className="mx-auto max-w-4xl px-5 sm:px-8"><div className="text-center"><p className="section-label">Get In Touch</p><h2 className="section-title">お問い合わせフォーム</h2><p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-slate-600">見積とは別の一般お問い合わせ窓口です。</p></div><div className="mt-10"><ContactForm /></div><div className="mt-7 text-center"><Link href="/estimate" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">見積をご希望の方はこちら<ArrowRight size={17} /></Link></div></div></section><SiteFooter /></main>;
}
