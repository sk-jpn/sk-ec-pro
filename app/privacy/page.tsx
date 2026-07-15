import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "../components/site-chrome";

export const metadata: Metadata = { title: "プライバシーポリシー｜SK EC Pro", description: "SK EC Proにおける個人情報の取得、利用目的、安全管理などの取り扱い方針をご案内します。" };

// TODO: 現在の情報を運営者に確認（個人情報の具体的な保存期間）
// TODO: 公開前にプライバシーポリシーの法的確認を行う
const LAST_UPDATED = "確認中（正式公開前）";
const sections = [
  ["取得する情報", "無料見積やお問い合わせの際に、氏名、メールアドレス、電話番号、会社名、配送先都道府県、商品URL、商品仕様、問い合わせ内容などをご提供いただく場合があります。また、サイトの安全な提供に必要な範囲で、アクセス日時、端末やブラウザに関する情報等が記録される場合があります。"],
  ["利用目的", "見積内容の確認、購入代行に関する連絡、問い合わせへの回答、サービス提供に必要な手続き、不正利用の防止、サイトとサービスの改善のために利用します。"],
  ["第三者提供", "法令に基づく場合、ご本人の同意がある場合、または商品購入・配送等の手続きに必要な場合を除き、個人情報を第三者へ提供しません。"],
  ["業務委託", "商品購入、出品者との連絡、配送その他サービス提供に必要な業務を委託する場合、必要な範囲で情報を取り扱わせることがあります。その場合は、委託先を適切に選定し、必要な管理を行います。"],
  ["安全管理", "個人情報への不正アクセス、漏えい、紛失、改ざん等を防止するため、サービスの状況に応じた必要な安全管理に努めます。"],
  ["Cookieやアクセス解析", "現時点で、Google Analytics、広告配信サービス等を利用しているとは記載しません。将来Cookieやアクセス解析ツールを導入する場合は、利用するサービスと目的を確認し、本ポリシーで案内します。"],
  ["情報の開示、訂正、削除", "ご本人から、当社が保有する個人情報の開示、訂正、削除等の依頼があった場合は、ご本人であることを確認したうえで、法令および運用状況に従って対応します。"],
  ["保存期間", "取得した情報は、利用目的の達成、取引・問い合わせ対応、法令上必要な期間等を踏まえて保存し、不要となった情報は適切な方法で削除します。具体的な保存期間は運用開始前に確認します。"],
  ["未成年者の利用", "未成年の方がサービスを利用する場合は、必要に応じて保護者等の法定代理人の同意を得てください。"],
  ["お問い合わせ窓口", "個人情報の取り扱いに関するお問い合わせは、フォルモサインターナショナルジャパン株式会社（sales@taobaonotatsujin.com）までご連絡ください。"],
  ["ポリシーの変更", "サービス内容や法令等の変更に応じて、本ポリシーを変更する場合があります。重要な変更については、当サイト上で分かりやすく案内します。"],
] as const;

export default function PrivacyPage() {
  return <main className="min-h-screen bg-white text-slate-950"><SiteHeader /><section className="hero-glow pt-20"><div className="mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32"><ShieldCheck className="text-blue-600" size={34} /><p className="section-label mt-8">Privacy Policy</p><h1 className="section-title">プライバシーポリシー</h1><p className="section-copy">SK EC Proがお預かりする情報の取り扱い方針をご案内します。</p><p className="mt-6 text-xs font-medium text-slate-400">最終更新日：{LAST_UPDATED}</p></div></section><section className="border-t border-slate-100 py-20 sm:py-24"><div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[15rem_1fr]"><aside className="lg:sticky lg:top-8 lg:self-start"><p className="text-xs font-bold uppercase tracking-[.15em] text-blue-600">目次</p><nav className="mt-5 hidden space-y-2 text-sm text-slate-500 lg:block">{sections.map(([title], i) => <a key={title} href={`#privacy-${i + 1}`} className="block hover:text-blue-600">{title}</a>)}</nav></aside><div className="divide-y divide-slate-100 border-y border-slate-100">{sections.map(([title, text], i) => <article id={`privacy-${i + 1}`} key={title} className="scroll-mt-8 py-8"><p className="text-xs font-bold text-blue-600">{String(i + 1).padStart(2, "0")}</p><h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2><p className="mt-4 text-sm leading-8 text-slate-600">{text}</p></article>)}</div></div></section><SiteFooter /></main>;
}
