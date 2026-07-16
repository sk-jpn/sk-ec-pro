import type { Metadata } from "next";
import { FileText, ShieldCheck, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "../components/site-chrome";
import { EstimateForm } from "./estimate-form";

export const metadata: Metadata = {
  title: "無料見積｜中国EC購入代行｜SK EC Pro",
  description:
    "Taobao、Tmall、1688、Alibaba、Xianyu、REDなどの中国EC商品について、無料で見積をご依頼いただけます。",
};

export default function EstimatePage() {
  return (
    <main className="overflow-hidden bg-white text-slate-950">
      <SiteHeader />
      <section className="relative pt-20">
        <div className="hero-glow absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:px-10">
          <div className="max-w-4xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-700 shadow-sm shadow-blue-100 backdrop-blur">
              <Sparkles size={14} /> 無料見積
            </div>
            <h1 className="text-[clamp(2.7rem,6vw,5.5rem)] font-semibold leading-[1.06] tracking-[-0.06em]">
              購入したい商品の情報を<br className="hidden sm:block" /><span className="text-blue-600">お送りください</span>
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">商品URL、数量、仕様などを確認し、見積内容をご案内します。複数商品がある場合は、分かる範囲でご入力ください。</p>
          </div>
          <div className="mt-10 grid max-w-4xl gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white/80 px-4 py-4 text-sm text-slate-700"><FileText size={19} className="shrink-0 text-blue-600" />見積依頼だけでは注文は確定しません。</div>
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white/80 px-4 py-4 text-sm text-slate-700"><ShieldCheck size={19} className="shrink-0 text-blue-600" />決済情報や本人確認書類は入力しないでください。</div>
          </div>
        </div>
      </section>
      <EstimateForm testMode={process.env.ESTIMATE_TEST_MODE === "true"} />
      <SiteFooter />
    </main>
  );
}
