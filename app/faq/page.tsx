import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleHelp } from "lucide-react";
import { SiteFooter, SiteHeader } from "../components/site-chrome";

export const metadata: Metadata = { title: "よくあるご質問（FAQ）", description: "中国EC購入代行の利用方法、見積、支払い、配送、関税、キャンセル、送料についてお答えします。" };
const faqs = [
  ["利用方法", "購入したい商品の画像またはURL、数量、仕様を見積フォームからお送りください。内容を確認してお見積りをご案内し、ご入金後に購入手配を進めます。"],
  ["見積は無料ですか？", "はい、相談・お見積りは無料です。見積依頼だけでは注文は成立しません。"],
  ["支払い方法", "現在ご利用いただけるお支払い方法は、お見積りのご案内時にお知らせします。"],
  ["配送日数", "商品、販売者、中国国内配送、国際配送方法、通関状況により異なります。確認できる目安をお見積り時にご案内します。"],
  ["関税について", "商品内容や金額によって、関税・輸入消費税などが発生する場合があります。通関時の判断となるため事前に確定できないことがあります。"],
  ["偽物の確認はできますか？", "外観や掲載情報の確認は可能ですが、真贋を保証する鑑定サービスではありません。購入前にリスクをご案内します。"],
  ["キャンセルできますか？", "購入手配前は見積内容を確認して見送れます。購入手配後は販売者の条件により、キャンセルできない場合や費用が発生する場合があります。"],
  ["送料はどう決まりますか？", "配送方法、実重量・容積重量、梱包サイズ、配送先、商品内容をもとに決まります。複数商品をまとめた場合も条件により変動します。"],
];
export default function FaqPage() { return <main className="min-h-screen bg-white text-slate-950"><SiteHeader /><section className="hero-glow pt-20"><div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10"><CircleHelp className="text-blue-600" size={36} /><p className="section-label mt-8">FAQ</p><h1 className="section-title">よくあるご質問</h1><p className="section-copy">中国EC購入代行について、よくいただくご質問をまとめました。</p></div></section><section className="border-y border-slate-100 bg-slate-50/70 py-20 sm:py-28"><div className="mx-auto max-w-4xl space-y-3 px-5 sm:px-8">{faqs.map(([question, answer], index) => <details key={question} className="group rounded-2xl border border-slate-100 bg-white p-5 open:border-blue-200 sm:p-6" open={index === 0}><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold"><span>{question}</span><span className="text-xl text-blue-600 transition group-open:rotate-45">＋</span></summary><p className="mt-5 border-t border-slate-100 pt-5 text-sm leading-7 text-slate-600">{answer}</p></details>)}</div></section><section className="py-20 text-center"><h2 className="text-2xl font-semibold">解決しない場合</h2><p className="mt-3 text-sm text-slate-500">ご不明点はお問い合わせフォームからご連絡ください。</p><Link href="/contact" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white">お問い合わせへ<ArrowRight size={17} /></Link></section><SiteFooter /></main>; }
