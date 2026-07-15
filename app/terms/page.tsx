import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { SiteFooter, SiteHeader } from "../components/site-chrome";

export const metadata: Metadata = {
  title: "利用規約｜SK EC Pro",
  description: "SK EC Proの中国EC購入代行サービスに関する利用条件をご案内します。",
};

// TODO: 公開前に弁護士等の専門家による法的確認を行う
// 旧規約の「支払い・手数料・簡易検品・免責・輸出入制限・返品・著作権」という論点を参照し、
// 現在のサービス向けに一般化しています。旧料金、銀行、PayPal、配送保証、返金条件は移植していません。
const LAST_UPDATED = "確認中（正式公開前）";

const sections = [
  ["適用範囲", "本規約は、SK EC Proが提供する中国EC購入代行サービスの利用条件を定めるものです。利用者は、見積内容と本規約を確認したうえでサービスを利用するものとします。"],
  ["サービス内容", "当サービスは、利用者から提供された商品情報に基づき、中国ECサイトでの購入手続き、出品者との連絡、中国国内での受け取り、日本への国際発送などを代行します。商品や販売サイトの状況により対応できない場合があります。"],
  ["見積と注文成立", "商品URL、数量、仕様、配送条件などを確認して見積を案内します。見積依頼だけでは注文は成立しません。注文成立の時点と手続きは、見積時に提示する案内に従うものとします。"],
  ["商品代金と各種費用", "商品代金、代行手数料、中国国内送料、国際送料、必要に応じて関税・輸入消費税その他の費用が発生します。金額は商品や取引・配送条件により異なり、個別の見積で案内します。"],
  ["支払い", "支払い方法は銀行振込またはクレジットカードです。支払い時期、振込・決済等に伴う費用は、見積または注文時の案内に従うものとします。"],
  ["購入手続き", "入金など所定の手続きが確認できた後、商品の購入を進めます。在庫、価格、出品者の都合等により、見積後でも購入できない場合があります。"],
  ["商品の確認", "中国側で行う確認の内容は、商品、梱包状態、依頼内容等により異なります。動作、品質、仕様、真贋その他すべての事項を保証するものではありません。"],
  ["国際配送", "配送方法は重量、容積、商品内容、輸送規制等を踏まえて案内します。配送期間や到着日を保証するものではなく、輸送会社、通関その他の事情により遅延する場合があります。"],
  ["関税、輸入消費税", "商品内容や金額等に応じて、関税、輸入消費税その他の費用が発生する場合があります。課税の有無や金額を事前に確定または保証するものではありません。"],
  ["キャンセル", "購入手続き開始後のキャンセル可否は、販売サイト、出品者、商品の状態等により異なります。キャンセルに伴う費用が発生する場合があります。"],
  ["返品、交換", "返品・交換は、販売サイトや出品者の規約、商品の状態、国際配送の状況等により対応可否が異なります。返品・交換を保証するものではなく、送料その他の費用が発生する場合があります。"],
  ["購入または発送できない商品", "法令、航空輸送、輸出入規制、販売サイトの規約等により、購入または発送できない商品があります。対応可否は見積時または手続き中に個別に確認します。"],
  ["知的財産権", "偽ブランド品その他第三者の知的財産権を侵害するおそれのある商品の依頼は受け付けません。サイト上の文章、デザイン等の権利は、当社または正当な権利者に帰属します。"],
  ["免責事項", "販売者、販売サイト、輸送会社、税関その他の第三者に起因する事情、通信障害、災害その他当社が合理的に管理できない事情により生じた影響については、個別の状況を踏まえて対応します。責任範囲については公開前に法的確認を行います。"],
  ["禁止事項", "法令または公序良俗に反する依頼、虚偽情報の提供、第三者の権利を侵害する行為、サービス運営を妨害する行為、その他当社が不適切と判断する行為を禁止します。"],
  ["サービスの変更、中断", "運営上または技術上の必要がある場合、事前に案内のうえサービス内容を変更または中断することがあります。ただし、緊急の場合は事前に案内できない場合があります。"],
  ["個人情報", "個人情報の取り扱いは、当サイトのプライバシーポリシーに従います。"],
  ["準拠法、管轄", "準拠法および合意管轄裁判所については、公開前の法的確認を行います。"],
  ["規約の変更", "サービス内容や法令等の変更に応じて、本規約を変更する場合があります。重要な変更については、当サイト上で分かりやすく案内します。"],
] as const;

export default function TermsPage() {
  return <main className="min-h-screen bg-white text-slate-950"><SiteHeader /><section className="hero-glow pt-20"><div className="mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32"><FileText className="text-blue-600" size={34} /><p className="section-label mt-8">Terms of Service</p><h1 className="section-title">利用規約</h1><p className="section-copy">中国EC購入代行サービスをご利用いただく際の基本的な条件です。</p><p className="mt-6 text-xs font-medium text-slate-400">最終更新日：{LAST_UPDATED}</p></div></section><section className="border-t border-slate-100 py-20 sm:py-24"><div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[15rem_1fr]"><aside className="lg:sticky lg:top-8 lg:self-start"><p className="text-xs font-bold uppercase tracking-[.15em] text-blue-600">目次</p><nav className="mt-5 hidden space-y-2 text-sm text-slate-500 lg:block">{sections.map(([title], i) => <a key={title} href={`#term-${i + 1}`} className="block hover:text-blue-600">{title}</a>)}</nav></aside><div className="divide-y divide-slate-100 border-y border-slate-100">{sections.map(([title, text], i) => <article id={`term-${i + 1}`} key={title} className="scroll-mt-8 py-8"><p className="text-xs font-bold text-blue-600">{String(i + 1).padStart(2, "0")}</p><h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2><p className="mt-4 text-sm leading-8 text-slate-600">{text}</p></article>)}</div></div></section><SiteFooter /></main>;
}
