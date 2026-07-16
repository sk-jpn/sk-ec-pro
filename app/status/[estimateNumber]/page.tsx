import type { Metadata } from "next";
import { Ban, Check, Circle, Clock3, FileSearch } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/app/components/site-chrome";
import { requireCustomerUser } from "@/lib/auth/require-customer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "進捗確認｜SK EC Pro",
  description: "SK EC Proの見積・購入代行案件の進捗をご確認いただけます。",
  robots: { index: false, follow: false },
};

const STEPS = [
  { label: "受付", statuses: ["新規", "未対応"] },
  { label: "見積作成", statuses: ["見積作成中", "見積作成完了", "対応中"] },
  { label: "お客様確認", statuses: ["お客様確認中", "見積送付済"] },
  { label: "発注", statuses: ["approved", "paid", "発注済", "注文確定", "購入済"] },
  { label: "中国発送", statuses: ["中国発送", "中国倉庫"] },
  { label: "国際配送", statuses: ["国際配送中", "国際発送済"] },
  { label: "国内発送", statuses: ["国内発送"] },
  { label: "完了", statuses: ["完了"] },
] as const;

type EstimateStatusRow = {
  estimate_no: string;
  status: string;
  created_at: string;
};

function statusLabel(status: string) {
  const step = STEPS.find((item) => item.statuses.some((candidate) => candidate === status));
  return status === "キャンセル" ? "キャンセル" : step?.label ?? status;
}

export default async function EstimateStatusPage({ params }: PageProps<"/status/[estimateNumber]">) {
  const { supabase } = await requireCustomerUser();
  const { estimateNumber: rawEstimateNumber } = await params;
  const estimateNumber = rawEstimateNumber.trim().toUpperCase();
  if (!/^SK\d{6}-\d{4}$/.test(estimateNumber)) notFound();

  const { data, error } = await supabase
    .from("estimates")
    .select("estimate_no, status, created_at")
    .eq("estimate_no", estimateNumber)
    .maybeSingle();

  if (error) throw new Error(`進捗情報の取得に失敗しました: ${error.message}`);
  if (!data) notFound();

  const estimate = data as EstimateStatusRow;
  const cancelled = estimate.status === "キャンセル";
  const currentIndex = STEPS.findIndex((step) => step.statuses.some((status) => status === estimate.status));
  if (!cancelled && currentIndex < 0) throw new Error(`未対応のステータスです: ${estimate.status}`);
  const receivedAt = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "long",
    timeZone: "Asia/Tokyo",
  }).format(new Date(estimate.created_at));

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <SiteHeader />
      <section className="hero-glow min-h-[34rem] pt-20">
        <div className="mx-auto max-w-5xl px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><FileSearch size={22} /></span>
            <p className="section-label mt-7">Order Status</p>
            <h1 className="text-3xl font-semibold tracking-[-.04em] sm:text-5xl">進捗状況のご確認</h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">SK EC Proへご依頼いただいた案件の現在の進捗です。</p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-2xl shadow-blue-950/8 sm:mt-14">
            <div className="grid gap-5 border-b border-slate-100 bg-slate-50/70 p-6 sm:grid-cols-3 sm:p-8">
              <div><p className="text-xs font-medium text-slate-400">見積番号</p><p className="mt-2 font-semibold tracking-wide text-slate-900">{estimate.estimate_no}</p></div>
              <div><p className="text-xs font-medium text-slate-400">受付日</p><p className="mt-2 font-semibold text-slate-900">{receivedAt}</p></div>
              <div><p className="text-xs font-medium text-slate-400">現在のステータス</p><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${cancelled ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{statusLabel(estimate.status)}</span></div>
            </div>

            {cancelled ? (
              <div className="p-6 sm:p-10">
                <div className="flex gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-900"><Ban className="mt-0.5 shrink-0 text-red-600" size={21} /><div><h2 className="font-semibold">この案件はキャンセルされました</h2><p className="mt-2 text-sm leading-7 text-red-700">ご不明な点がございましたら、お問い合わせ窓口までご連絡ください。</p></div></div>
              </div>
            ) : (
              <div className="p-6 sm:p-10">
                <h2 className="text-lg font-semibold tracking-tight">お手続きの進捗</h2>
                <ol className="mt-7">
                  {STEPS.map((step, index) => {
                    const completed = index < currentIndex;
                    const current = index === currentIndex;
                    const Icon = completed ? Check : current ? Clock3 : Circle;
                    const color = completed ? "border-emerald-500 bg-emerald-500 text-white" : current ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "border-slate-200 bg-white text-slate-300";
                    return (
                      <li key={step.label} className="relative flex min-h-18 gap-4 pb-5 last:min-h-0 last:pb-0 sm:gap-5">
                        {index < STEPS.length - 1 && <span aria-hidden="true" className={`absolute left-[17px] top-9 h-[calc(100%-1.25rem)] w-0.5 sm:left-[19px] ${index < currentIndex ? "bg-emerald-400" : "bg-slate-200"}`} />}
                        <span className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 sm:size-10 ${color}`}><Icon size={current ? 18 : 16} strokeWidth={completed ? 3 : 2} /></span>
                        <div className="pt-1.5">
                          <p className={`font-semibold ${completed ? "text-emerald-700" : current ? "text-blue-700" : "text-slate-400"}`}>{step.label}</p>
                          <p className="mt-1 text-xs text-slate-400">{completed ? "完了済み" : current ? "現在のお手続き" : "未着手"}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>

          <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-6 text-slate-400">進捗に関するお問い合わせ: <a href="mailto:contact@formosajapan.com" className="font-medium text-blue-600 hover:underline">contact@formosajapan.com</a></p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
