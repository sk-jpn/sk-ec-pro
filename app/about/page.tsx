import type { Metadata } from "next";
import { Building2, ExternalLink, Globe2, Languages, ShoppingBag, Store } from "lucide-react";
import { SiteFooter, SiteHeader } from "../components/site-chrome";

export const metadata: Metadata = {
  title: "会社概要｜SK EC Pro",
  description: "SK EC Proのブランド情報、事業内容、運営ショップについてご案内します。",
};

const profile = [
  { label: "運営会社名", value: "フォルモサインターナショナルジャパン株式会社" },
  { label: "ブランド名", value: "SK EC Pro" },
  { label: "旧称", value: "Taobao no Tatsujin／タオバオの達人" },
  { label: "運営責任者", value: "神木新之介" },
  { label: "所在地", value: "〒273-0011\n千葉県船橋市湊町3-22-12" },
  { label: "お問い合わせ", value: "sales@taobaonotatsujin.com" },
  { label: "事業内容", value: "中国EC購入代行、当社運営オンラインショップでの商品販売" },
  { label: "対応言語", value: "日本語でのご案内、中国EC出品者との連絡対応" },
  { label: "支払い方法", value: "銀行振込、クレジットカード" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950"><SiteHeader />
      <section className="hero-glow pt-20"><div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10"><span className="grid size-12 place-items-center rounded-2xl bg-blue-600 text-white"><Building2 size={22} /></span><p className="section-label mt-8">About Us</p><h1 className="section-title">会社概要</h1><p className="section-copy">中国ECでの商品購入を、日本語で分かりやすく。SK EC Proは、購入手続きから日本への国際発送までをサポートしています。</p></div></section>
      <section className="border-y border-slate-100 bg-slate-50/70 py-20 sm:py-24"><div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-20 lg:px-10"><div><p className="section-label">Profile</p><h2 className="text-3xl font-semibold tracking-[-.04em] sm:text-4xl">ブランド情報</h2></div><dl className="divide-y divide-slate-200 border-y border-slate-200">{profile.map(({ label, value }) => <div key={label} className="grid gap-2 py-5 sm:grid-cols-[12rem_1fr]"><dt className="text-sm font-medium text-slate-400">{label}</dt><dd className="whitespace-pre-line text-sm font-medium leading-7 text-slate-800">{value}</dd></div>)}</dl></div></section>
      <section className="py-20 sm:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="rounded-[2rem] border border-blue-100 bg-blue-50/60 p-7 sm:p-10"><p className="section-label">Brand Update</p><h2 className="text-2xl font-semibold tracking-[-.035em] sm:text-3xl">ブランド名称変更について</h2><p className="mt-5 max-w-4xl text-sm leading-8 text-slate-700 sm:text-base">旧ブランド名「Taobao no Tatsujin（タオバオの達人）」は、「SK EC Pro」へ名称変更しました。運営会社は引き続きフォルモサインターナショナルジャパン株式会社です。</p></div></div></section>
      <section className="pb-24 sm:pb-32"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="max-w-2xl"><p className="section-label">Our Business</p><h2 className="section-title">現在の事業</h2></div><div className="mt-12 grid gap-4 md:grid-cols-2"><article className="rounded-[2rem] border border-slate-100 p-7 sm:p-8"><span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Globe2 size={22} /></span><h3 className="mt-8 text-xl font-semibold">中国EC購入代行</h3><p className="mt-4 text-sm leading-7 text-slate-600">Taobao、1688、Xianyu、Tmall、Alibabaなどの商品について、購入手続き、出品者との連絡、中国国内での受け取り、日本への国際発送を代行します。</p></article><article className="rounded-[2rem] border border-slate-100 p-7 sm:p-8"><span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Store size={22} /></span><h3 className="mt-8 text-xl font-semibold">当社運営ショップ</h3><p className="mt-4 text-sm leading-7 text-slate-600">SK EC Proが運営するYahoo!ショッピング・Amazonのオンラインショップで、当社取扱商品を販売しています。販売支援サービスではありません。</p></article></div></div></section>
      <section className="border-y border-slate-100 bg-slate-50/70 py-20 sm:py-24"><div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 md:grid-cols-2 lg:px-10"><div className="flex items-center gap-4 rounded-2xl bg-white p-6"><Languages className="text-blue-600" /><div><p className="text-xs text-slate-400">SUPPORT LANGUAGE</p><p className="mt-1 font-semibold">日本語でご案内</p></div></div><div className="rounded-2xl bg-white p-6"><div className="flex items-center gap-4"><ShoppingBag className="text-blue-600" /><div><p className="text-xs text-slate-400">ONLINE SHOPS</p><p className="mt-1 font-semibold">Yahoo!ショッピング・Amazon</p></div></div><div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-blue-600"><a href="https://store.shopping.yahoo.co.jp/taobaonotatsujinpro/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-blue-800">Yahoo!ショッピング <ExternalLink size={14} /></a><a href="https://www.amazon.co.jp/stores/iFormosa/page/8055D27A-D7EF-452A-B983-3D7E673B6287" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-blue-800">Amazon <ExternalLink size={14} /></a></div></div></div></section>
      <SiteFooter />
    </main>
  );
}
