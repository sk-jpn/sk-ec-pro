import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Building2,
  Calculator,
  Check,
  ChevronDown,
  CircleHelp,
  CreditCard,
  FileQuestion,
  Globe2,
  Languages,
  Link2,
  ListChecks,
  Package,
  PackageSearch,
  Plane,
  Search,
  Send,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Warehouse,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "../components/site-chrome";

export const metadata: Metadata = {
  title: "中国EC購入代行｜Taobao・1688・Xianyu対応｜SK EC Pro",
  description:
    "Taobao、1688、Xianyu、Tmall、Alibabaなどの中国EC商品を購入代行し、日本への国際発送までサポートします。",
};

const platforms = [
  { name: "Taobao", sub: "淘宝", text: "個人向け商品から専門商品まで、幅広い商品の購入依頼に対応します。", icon: ShoppingBag },
  { name: "1688", sub: "中国国内向け卸売", text: "業務用商品、まとめ買い、仕入れ商品の購入依頼に対応します。", icon: Box },
  { name: "Xianyu", sub: "闲鱼・咸鱼", text: "中古品、廃盤品、コレクター商品などの購入依頼に対応します。", icon: Search },
  { name: "Tmall", sub: "天猫", text: "ブランド公式店や正規販売店で販売されている商品の購入依頼に対応します。", icon: Store },
  { name: "Alibaba", sub: "法人向け卸売", text: "卸売商品、大口注文、法人向け商品の購入についてご相談いただけます。", icon: Globe2 },
  { name: "その他の中国ECサイト", sub: "商品ごとに確認", text: "対応可否を確認しますので、商品URLをお送りください。", icon: PackageSearch },
];

const requestExamples = [
  { text: "個人利用の商品購入", icon: ShoppingBag },
  { text: "日本未発売商品の購入", icon: Globe2 },
  { text: "中古品、廃盤品、コレクター商品の購入", icon: Search },
  { text: "複数商品のまとめ買い", icon: Package },
  { text: "業務用商品の仕入れ", icon: Building2 },
  { text: "中国語で出品者への確認が必要な商品", icon: Languages },
];

const steps = [
  { step: "STEP 1", title: "商品情報を送る", text: "商品URL、数量、色、サイズ、仕様などを送っていただきます。", icon: Link2 },
  { step: "STEP 2", title: "見積内容を確認", text: "商品代金、代行手数料、中国国内送料、国際送料などを確認して見積します。", icon: Calculator },
  { step: "STEP 3", title: "入金後に購入", text: "入金確認後、商品の購入手続きを行います。", icon: CreditCard },
  { step: "STEP 4", title: "中国国内で受け取り", text: "商品を中国側の受取先で受領し、発送準備を行います。", icon: Warehouse },
  { step: "STEP 5", title: "日本へ国際発送", text: "指定された日本国内の住所へ商品を発送します。", icon: Plane },
];

const quoteItems = ["商品URL", "数量", "色、サイズ、型番", "出品者に確認したい内容", "希望する配送方法", "日本国内のお届け先都道府県"];
const feeNotes = ["為替レートは見積時の基準を使用", "関税や輸入消費税が発生する場合がある", "大型品、壊れ物、電池を含む商品などは配送方法が限られる場合がある"];
const restrictedItems = ["危険物", "一部の電池、液体、スプレー", "医薬品、食品、化粧品", "偽ブランド品や知的財産権を侵害する商品", "日本への輸入が規制されている商品", "大型または特殊な配送が必要な商品"];

const faqs = [
  { question: "中国語が分からなくても利用できますか？", answer: "はい。商品情報やご希望を日本語でお送りください。必要に応じて、当社が出品者との連絡を行います。" },
  { question: "Xianyuの個人出品商品も購入できますか？", answer: "購入を依頼いただけます。ただし、出品状況や出品者の対応、商品の内容によって購入できない場合があります。商品URLを確認したうえでご案内します。" },
  { question: "商品が本物か確認してもらえますか？", answer: "当社では商品の真贋を保証していません。出品情報の確認や出品者への質問はご相談いただけますが、確認できる内容は商品や出品者によって異なります。" },
  { question: "返品や交換はできますか？", answer: "返品・交換の可否は、販売サイトや出品者の規約、商品の状態などによって異なります。ご希望がある場合は個別に確認しますが、対応を保証するものではありません。" },
  { question: "複数店舗の商品をまとめて発送できますか？", answer: "商品内容や大きさ、配送条件により、まとめて発送できる場合があります。各商品のURLをお送りいただき、見積時にご相談ください。" },
  { question: "見積だけでも利用できますか？", answer: "はい。商品URL、数量、仕様などをお送りいただければ、内容を確認して無料でお見積りします。" },
  { question: "商品到着までどのくらいかかりますか？", answer: "出品者の発送時期、中国国内での受け取り、国際配送、通関などの状況により異なります。見積時に目安をご案内しますが、到着日を保証するものではありません。" },
];

export default function PurchaseAgentPage() {
  return (
    <main className="overflow-hidden bg-white text-slate-950">
      <SiteHeader />

      <section className="relative flex min-h-[700px] items-center pt-20">
        <div className="hero-glow absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:px-10">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-700 shadow-sm shadow-blue-100 backdrop-blur">
              <Sparkles size={14} /> 中国EC購入代行
            </div>
            <h1 className="text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-[1.05] tracking-[-0.06em]">
              中国の商品を、<br /><span className="text-blue-600">日本語でかんたんに購入</span>
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">Taobao・1688・Xianyu・Tmall・Alibabaなどの商品について、購入手続き、出品者との連絡、中国国内での受け取り、日本への国際発送を代行します。</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href="/estimate" className="group inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">無料見積を依頼する <ArrowRight size={17} className="transition group-hover:translate-x-1" /></a>
              <a href="#flow" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600">ご利用の流れを見る</a>
            </div>
          </div>
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="absolute inset-10 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="relative rounded-[2.25rem] border border-white/80 bg-white/80 p-6 shadow-[0_30px_100px_-30px_rgba(37,99,235,.3)] backdrop-blur-xl">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5"><span className="grid size-12 place-items-center rounded-2xl bg-blue-600 text-white"><Send size={21} /></span><div><p className="text-xs text-slate-400">PURCHASE AGENT</p><p className="mt-1 font-semibold">日本語でご依頼</p></div></div>
              <div className="space-y-4 py-6">{["商品URLを送付", "内容確認・お見積り", "購入・中国国内で受領", "日本へ国際発送"].map((item, index) => <div key={item} className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">{index + 1}</span><span className="text-sm font-medium text-slate-700">{item}</span></div>)}</div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-950 px-4 py-4 text-white"><Truck size={19} className="text-blue-400" /><p className="text-xs font-medium">中国での購入から日本への発送まで</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/70 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="max-w-2xl"><p className="section-label">Supported Platforms</p><h2 className="section-title">対応サイト</h2><p className="section-copy">主要な中国ECサイトに加え、その他のサイトも商品ごとに対応可否を確認します。</p></div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{platforms.map(({ name, sub, text, icon: Icon }) => <article key={name} className="service-card group"><span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white"><Icon size={21} /></span><h3 className="mt-7 text-lg font-semibold tracking-tight">{name}</h3><p className="mt-1 text-sm text-slate-400">{sub}</p><p className="mt-4 text-sm leading-7 text-slate-600">{text}</p></article>)}</div>
        </div>
      </section>

      <section className="py-24 sm:py-32"><div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:px-10"><div><p className="section-label">Request Examples</p><h2 className="section-title">対応できる依頼例</h2><p className="section-copy">次のようなご依頼をご相談いただけます。商品の内容や出品状況により、対応可否を個別に確認します。</p></div><div className="grid gap-3 sm:grid-cols-2">{requestExamples.map(({ text, icon: Icon }) => <div key={text} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600"><Icon size={18} /></span><p className="text-sm font-medium leading-6 text-slate-700">{text}</p></div>)}</div></div></section>

      <section id="flow" className="border-y border-slate-100 bg-slate-50/70 py-24 sm:py-32"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="max-w-2xl"><p className="section-label">How It Works</p><h2 className="section-title">ご利用の流れ</h2><p className="section-copy">商品情報の送付から日本への国際発送まで、5つのステップで進みます。</p></div><div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-5">{steps.map(({ step, title, text, icon: Icon }) => <article key={step} className="rounded-[1.75rem] border border-slate-100 bg-white p-6"><div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-full bg-blue-600 text-white"><Icon size={20} /></span><span className="text-[11px] font-bold tracking-[.12em] text-blue-600">{step}</span></div><h3 className="mt-7 font-semibold tracking-tight">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-500">{text}</p></article>)}</div></div></section>

      <section className="py-24 sm:py-32"><div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-10"><div><p className="section-label">For Your Quote</p><h2 className="section-title">見積に必要な情報</h2><p className="section-copy">分かる範囲でお送りください。内容を確認し、必要な情報をご案内します。</p></div><div className="rounded-[2rem] border border-blue-100 bg-blue-50/50 p-6 sm:p-8"><div className="mb-6 flex items-center gap-3"><ListChecks className="text-blue-600" /><p className="font-semibold">お送りいただきたい内容</p></div><ul className="grid gap-3 sm:grid-cols-2">{quoteItems.map(item => <li key={item} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-700"><Check size={16} className="shrink-0 text-blue-600" />{item}</li>)}</ul></div></div></section>

      <section className="border-y border-slate-100 bg-slate-950 py-24 text-white sm:py-32"><div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-20 lg:px-10"><div><p className="section-label !text-blue-400">Pricing</p><h2 className="section-title">料金について</h2><Link href="/pricing" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:text-blue-300">料金の詳細を見る <ArrowRight size={16} /></Link></div><div><p className="text-base leading-8 text-slate-300">お支払い金額は、商品代金、代行手数料、中国国内送料、国際送料、必要に応じて関税・消費税などで構成されます。商品や配送条件により異なるため、個別にお見積りします。</p><ul className="mt-8 space-y-4">{feeNotes.map(item => <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-300"><Check size={17} className="mt-1 shrink-0 text-blue-400" />{item}</li>)}</ul></div></div></section>

      <section className="py-24 sm:py-32"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20"><div><p className="section-label">Handling Policy</p><h2 className="section-title">お取り扱いについて</h2><p className="section-copy">法令、航空輸送、輸出入規制、販売サイトの規約などにより、購入または発送できない商品があります。見積時に個別に確認します。</p></div><div className="rounded-[2rem] border border-amber-100 bg-amber-50/50 p-6 sm:p-8"><div className="mb-6 flex items-center gap-3 text-amber-800"><ShieldAlert size={22} /><p className="font-semibold">購入できない、または確認が必要な商品の例</p></div><div className="grid gap-3 sm:grid-cols-2">{restrictedItems.map(item => <div key={item} className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 text-sm leading-6 text-slate-700"><AlertTriangle size={16} className="mt-1 shrink-0 text-amber-600" />{item}</div>)}</div></div></div></div></section>

      <section className="border-y border-slate-100 bg-slate-50/70 py-24 sm:py-32"><div className="mx-auto max-w-4xl px-5 sm:px-8"><div className="text-center"><p className="section-label">FAQ</p><h2 className="section-title">よくある質問</h2><p className="section-copy mx-auto">ご利用前によくいただくご質問をまとめました。</p></div><div className="mt-12 divide-y divide-slate-200 border-y border-slate-200">{faqs.map(({ question, answer }) => <details key={question} className="group"><summary className="flex cursor-pointer list-none items-center gap-4 py-6 text-left font-semibold text-slate-800"><CircleHelp size={20} className="shrink-0 text-blue-600" /><span>{question}</span><ChevronDown size={18} className="ml-auto shrink-0 text-slate-400 transition group-open:rotate-180" /></summary><p className="pb-6 pl-9 pr-8 text-sm leading-7 text-slate-600">{answer}</p></details>)}</div></div></section>

      <section className="px-4 pb-4 pt-20 sm:px-6 sm:pb-6 sm:pt-24"><div className="contact-panel mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] px-6 py-20 text-center text-white sm:rounded-[2.75rem] sm:px-10 sm:py-28"><div className="relative mx-auto max-w-3xl"><FileQuestion size={28} className="mx-auto mb-6 text-blue-200" /><h2 className="text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">購入したい商品は<br className="sm:hidden" />見つかりましたか？</h2><p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">商品URLと希望内容をお送りください。確認後、無料でお見積りします。</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><a href="/estimate" className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-blue-700 shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5">無料見積を依頼する <ArrowRight size={17} className="transition group-hover:translate-x-1" /></a><a href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 py-4 text-sm font-semibold text-white transition hover:bg-white/20">お問い合わせ</a></div></div></div></section>

      <SiteFooter />
    </main>
  );
}
