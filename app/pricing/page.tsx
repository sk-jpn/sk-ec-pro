import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Calculator,
  Check,
  ChevronDown,
  CircleDollarSign,
  CircleHelp,
  Coins,
  FileCheck2,
  Globe2,
  ReceiptText,
  Scale,
  Send,
  Sparkles,
  Truck,
  WalletCards,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "../components/site-chrome";

export const metadata: Metadata = {
  title: "料金・お見積り｜中国EC購入代行｜SK EC Pro",
  description:
    "中国EC購入代行のお支払い構成、代行手数料、中国国内送料、国際送料、関税などについてご案内します。",
};

const costItems = [
  { title: "商品代金", text: "中国ECサイト上の商品価格", icon: Banknote },
  {
    title: "代行手数料",
    text: "購入手続き、出品者との連絡、受け取りなどにかかる手数料",
    icon: FileCheck2,
  },
  {
    title: "中国国内送料",
    text: "販売者から中国側受取先までの送料",
    icon: Truck,
  },
  { title: "国際送料", text: "中国から日本までの配送費用", icon: Globe2 },
  {
    title: "関税、輸入消費税など",
    text: "商品内容や金額に応じて発生する場合があります",
    icon: Scale,
  },
];

const quoteChecks = [
  "商品価格",
  "数量、色、サイズ、仕様",
  "中国国内送料",
  "代行手数料",
  "国際配送方法",
  "梱包サイズと重量",
  "関税や輸入消費税の可能性",
  "特殊な取り扱いの有無",
];

const possibleCosts = [
  "販売者側の中国国内送料",
  "追加梱包費",
  "大型商品の取り扱い費用",
  "特殊配送費用",
  "関税、輸入消費税",
  "返品や再発送に関する費用",
  "保管が長期化した場合の費用",
];

const calculation = [
  "商品代金",
  "中国国内送料",
  "代行手数料",
  "国際送料",
  "必要に応じて関税・輸入消費税など",
];

const faqs = [
  {
    question: "見積は無料ですか？",
    answer:
      "はい。商品URL、数量、仕様などをお送りいただければ、内容を確認して無料でお見積りします。",
  },
  {
    question: "見積後にキャンセルできますか？",
    answer:
      "購入手続き前であれば、見積内容をご確認後に依頼を見送ることができます。購入手続き後のキャンセル可否や費用は、商品や販売者の条件によって異なります。",
  },
  {
    question: "為替レートはいつ決まりますか？",
    answer:
      "見積時点の基準レートを使用します。為替変動や決済条件によって換算額が変わる場合があるため、見積内容をご確認ください。",
  },
  {
    question: "国際送料はいつ確定しますか？",
    answer:
      "商品の重量や容積、梱包状態、配送方法によって異なります。見積時には確認できる情報をもとにご案内し、必要に応じて中国側での受け取り後に確認します。",
  },
  {
    question: "関税は見積に含まれますか？",
    answer:
      "関税や輸入消費税は商品内容や金額、通関時の判断によって発生する場合があります。見積時に可能性をご案内しますが、事前に確定できない場合があります。",
  },
  {
    question: "複数商品をまとめると送料は安くなりますか？",
    answer:
      "梱包をまとめられる場合は配送条件が変わることがありますが、重量、容積、商品内容によって結果は異なります。送料が安くなることを保証するものではありません。",
  },
];

export default function PricingPage() {
  return (
    <main className="overflow-hidden bg-white text-slate-950">
      <SiteHeader />

      <section className="relative flex min-h-[640px] items-center pt-20">
        <div className="hero-glow absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:px-10">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-700 shadow-sm shadow-blue-100 backdrop-blur">
              <Sparkles size={14} /> 料金について
            </div>
            <h1 className="text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-[1.05] tracking-[-0.06em]">
              商品ごとに、
              <br />
              <span className="text-blue-600">分かりやすくお見積り</span>
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              商品代金、代行手数料、中国国内送料、国際送料などを確認し、購入前にお見積りをご案内します。
            </p>
          </div>
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="absolute inset-10 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="relative rounded-[2.25rem] border border-white/80 bg-white/80 p-6 shadow-[0_30px_100px_-30px_rgba(37,99,235,.3)] backdrop-blur-xl">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <span className="grid size-12 place-items-center rounded-2xl bg-blue-600 text-white">
                  <Calculator size={21} />
                </span>
                <div>
                  <p className="text-xs text-slate-400">INDIVIDUAL QUOTE</p>
                  <p className="mt-1 font-semibold">商品ごとに内容を確認</p>
                </div>
              </div>
              <div className="space-y-3 py-6">
                {[
                  "商品と数量・仕様",
                  "中国国内の配送条件",
                  "国際配送方法",
                  "関税等の可能性",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <Check size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-950 px-4 py-4 text-white">
                <ReceiptText size={19} className="text-blue-400" />
                <p className="text-xs font-medium">購入前に見積内容をご案内</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/70 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="section-label">Cost Structure</p>
            <h2 className="section-title">お支払い金額の構成</h2>
            <p className="section-copy">
              商品や販売者、配送方法によって金額が異なるため、個別にお見積りします。
            </p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {costItems.map(({ title, text, icon: Icon }) => (
              <article key={title} className="service-card group">
                <span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Icon size={21} />
                </span>
                <h3 className="mt-7 text-lg font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </article>
            ))}
            <div className="flex min-h-48 flex-col justify-between rounded-[1.75rem] bg-blue-600 p-6 text-white">
              <WalletCards size={23} />
              <p className="text-sm font-semibold leading-6">
                すべての条件を確認し、
                <br />
                購入前にご案内します
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:px-10">
          <div>
            <p className="section-label">Quote Details</p>
            <h2 className="section-title">見積時に確認する内容</h2>
            <p className="section-copy">
              商品情報と配送条件を確認し、それぞれの費用を整理します。
            </p>
          </div>
          <div className="rounded-[2rem] border border-blue-100 bg-blue-50/50 p-6 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              {quoteChecks.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-700"
                >
                  <Check size={16} className="shrink-0 text-blue-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-950 py-24 text-white sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-10">
          <article>
            <span className="grid size-12 place-items-center rounded-2xl bg-blue-500/15 text-blue-400">
              <Coins size={22} />
            </span>
            <h2 className="mt-8 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
              為替レートについて
            </h2>
            <p className="mt-5 text-sm leading-8 text-slate-300 sm:text-base">
              見積時点の基準レートをもとに日本円へ換算します。為替変動や決済条件などにより、ECサイト上の単純な換算額と異なる場合があります。
            </p>
          </article>
          <article>
            <span className="grid size-12 place-items-center rounded-2xl bg-blue-500/15 text-blue-400">
              <Globe2 size={22} />
            </span>
            <h2 className="mt-8 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
              国際送料について
            </h2>
            <p className="mt-5 text-sm leading-8 text-slate-300 sm:text-base">
              重量、容積、配送方法、商品内容によって異なります。大型商品、壊れ物、電池、液体などを含む商品は、配送方法が限られる場合があります。
            </p>
          </article>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:px-10">
          <div>
            <p className="section-label">Possible Costs</p>
            <h2 className="section-title">追加費用が発生する可能性</h2>
            <p className="section-copy">
              商品の内容や取引・配送状況により、次の費用が発生する場合があります。確定料金ではなく、必要性を個別に確認してご案内します。
            </p>
          </div>
          <ul className="divide-y divide-slate-100 border-y border-slate-100">
            {possibleCosts.map((item) => (
              <li key={item} className="flex items-center gap-4 py-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <CircleDollarSign size={17} />
                </span>
                <span className="text-sm font-medium leading-6 text-slate-700 sm:text-base">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/70 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="text-center">
            <p className="section-label">Calculation Structure</p>
            <h2 className="section-title">見積例</h2>
            <p className="section-copy mx-auto">
              具体的な金額ではなく、お支払い総額の計算構造をご案内します。
            </p>
          </div>
          <div className="mt-12 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,.3)] sm:p-10">
            <div className="grid gap-3 sm:grid-cols-5">
              {calculation.map((item, index) => (
                <div
                  key={item}
                  className="relative rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm font-medium leading-6 text-slate-700"
                >
                  {index > 0 && (
                    <span className="absolute -top-3 left-1/2 grid size-6 -translate-x-1/2 place-items-center rounded-full bg-blue-600 text-white sm:-left-[1.1rem] sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0">
                      ＋
                    </span>
                  )}
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 py-5 text-white">
              <span className="text-xl font-semibold">＝</span>
              <span className="font-semibold">お支払い総額</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="text-center">
            <p className="section-label">FAQ</p>
            <h2 className="section-title">よくある質問</h2>
            <p className="section-copy mx-auto">
              料金とお見積りについて、よくいただく質問をまとめました。
            </p>
          </div>
          <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200">
            {faqs.map(({ question, answer }) => (
              <details key={question} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-4 py-6 text-left font-semibold text-slate-800">
                  <CircleHelp size={20} className="shrink-0 text-blue-600" />
                  <span>{question}</span>
                  <ChevronDown
                    size={18}
                    className="ml-auto shrink-0 text-slate-400 transition group-open:rotate-180"
                  />
                </summary>
                <p className="pb-6 pl-9 pr-8 text-sm leading-7 text-slate-600">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="contact-panel mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] px-6 py-20 text-center text-white sm:rounded-[2.75rem] sm:px-10 sm:py-28">
          <div className="relative mx-auto max-w-3xl">
            <Send size={28} className="mx-auto mb-6 text-blue-200" />
            <h2 className="text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">
              まずは商品URLを
              <br className="sm:hidden" />
              お送りください
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
              数量、仕様、配送条件などを確認し、購入前にお見積りをご案内します。
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/estimate"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-blue-700 shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5"
              >
                無料見積を依頼する{" "}
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 py-4 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                お問い合わせ
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
