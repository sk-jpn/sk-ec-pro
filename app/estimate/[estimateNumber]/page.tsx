import type { Metadata } from "next";
import { FileCheck2 } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/app/components/site-chrome";
import { calculateQuoteTotals } from "@/lib/estimates/quote-calculations";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { PaymentPanel } from "./payment-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "お見積内容の確認｜SK EC Pro",
  description: "SK EC Proのお見積内容をご確認・承認いただけます。",
  robots: { index: false, follow: false },
};

type CustomerEstimate = {
  estimate_no: string;
  status: string;
  approved_at: string | null;
  paid_at: string | null;
  payment_method: string;
  updated_at: string;
  china_shipping_fee: number;
  international_shipping_fee: number;
  agency_fee: number;
  other_fee: number;
  discount: number;
  tax: number;
  estimate_items: { id: string; product_name: string | null; url: string; quantity: number; unit_price: number }[];
};

const yen = (value: number) => `¥${new Intl.NumberFormat("ja-JP").format(value)}`;

function itemName(item: CustomerEstimate["estimate_items"][number]) {
  if (item.product_name?.trim()) return item.product_name.trim();
  try {
    const url = new URL(item.url);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return item.url || "商品画像からのご依頼";
  }
}

export default async function CustomerEstimatePage({ params }: PageProps<"/estimate/[estimateNumber]">) {
  const { supabase } = await requireCustomerUser();
  const { estimateNumber: rawEstimateNumber } = await params;
  const estimateNumber = rawEstimateNumber.trim().toUpperCase();
  if (!/^SK\d{6}-\d{4}$/.test(estimateNumber)) notFound();

  const { data, error } = await supabase
    .from("estimates")
    .select("estimate_no, status, approved_at, paid_at, payment_method, updated_at, china_shipping_fee, international_shipping_fee, agency_fee, other_fee, discount, tax, estimate_items(id, product_name, url, quantity, unit_price)")
    .eq("estimate_no", estimateNumber)
    .maybeSingle();

  if (error) throw new Error(`見積情報の取得に失敗しました: ${error.message}`);
  if (!data) notFound();
  const estimate = data as unknown as CustomerEstimate;
  const totals = calculateQuoteTotals(estimate.estimate_items.map((item) => ({ quantity: item.quantity, unitPrice: item.unit_price })), {
    chinaShippingFee: estimate.china_shipping_fee,
    internationalShippingFee: estimate.international_shipping_fee,
    agencyFee: estimate.agency_fee,
    otherFee: estimate.other_fee,
    discount: estimate.discount,
    tax: estimate.tax,
  });
  const estimateDate = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(estimate.updated_at));

  const charges = [
    ["中国国内送料", estimate.china_shipping_fee],
    ["国際送料", estimate.international_shipping_fee],
    ["代行手数料", estimate.agency_fee],
    ["その他費用", estimate.other_fee],
  ] as const;

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <SiteHeader />
      <section className="hero-glow pt-20">
        <div className="mx-auto max-w-5xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><FileCheck2 size={22} /></span>
            <p className="section-label mt-7">Estimate Approval</p>
            <h1 className="text-3xl font-semibold tracking-[-.04em] sm:text-5xl">お見積内容のご確認</h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">内容をご確認のうえ、ページ下部のボタンからご承認ください。</p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-2xl shadow-blue-950/8 sm:mt-14">
            <div className="grid gap-5 border-b border-slate-100 bg-slate-50/70 p-6 sm:grid-cols-3 sm:p-8">
              <div><p className="text-xs font-medium text-slate-400">見積番号</p><p className="mt-2 font-semibold tracking-wide">{estimate.estimate_no}</p></div>
              <div><p className="text-xs font-medium text-slate-400">見積日時</p><p className="mt-2 font-semibold">{estimateDate}</p></div>
              <div><p className="text-xs font-medium text-slate-400">見積金額</p><p className="mt-2 text-xl font-bold text-blue-700">{yen(totals.total)}</p></div>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight">商品一覧</h2>
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden grid-cols-[minmax(0,1fr)_5rem_8rem_8rem] gap-3 bg-slate-950 px-5 py-3 text-xs font-semibold text-white sm:grid"><span>商品</span><span className="text-right">数量</span><span className="text-right">単価</span><span className="text-right">小計</span></div>
                {estimate.estimate_items.map((item, index) => <div key={item.id} className="grid gap-3 border-t border-slate-100 p-5 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_5rem_8rem_8rem] sm:items-center"><div className="min-w-0"><p className="font-medium text-slate-900">{itemName(item)}</p><p className="mt-1 truncate text-xs text-slate-400">{item.url}</p></div><p className="flex justify-between text-sm sm:block sm:text-right"><span className="text-slate-400 sm:hidden">数量</span>{item.quantity}</p><p className="flex justify-between text-sm sm:block sm:text-right"><span className="text-slate-400 sm:hidden">単価</span>{yen(item.unit_price)}</p><p className="flex justify-between text-sm font-semibold sm:block sm:text-right"><span className="text-slate-400 sm:hidden">小計</span>{yen(totals.subtotals[index])}</p></div>)}
              </div>

              <div className="mt-8 ml-auto max-w-md space-y-3">
                <p className="flex justify-between border-b border-slate-100 pb-3 text-sm"><span className="text-slate-500">商品合計</span><span className="font-semibold">{yen(totals.productTotal)}</span></p>
                {charges.map(([label, value]) => <p key={label} className="flex justify-between text-sm"><span className="text-slate-500">{label}</span><span className="font-medium">{yen(value)}</span></p>)}
                {estimate.discount > 0 && <p className="flex justify-between text-sm"><span className="text-slate-500">割引</span><span className="font-medium text-red-600">-{yen(estimate.discount)}</span></p>}
                {estimate.tax > 0 && <p className="flex justify-between text-sm"><span className="text-slate-500">消費税</span><span className="font-medium">{yen(estimate.tax)}</span></p>}
                <div className="mt-5 rounded-2xl bg-slate-950 px-6 py-5 text-white"><p className="text-xs text-slate-300">合計金額</p><p className="mt-2 text-right text-3xl font-bold tracking-tight">{yen(totals.total)}</p></div>
              </div>

              <div className="mt-10 border-t border-slate-100 pt-8">
                <PaymentPanel estimateNumber={estimate.estimate_no} estimateTotal={totals.total} initialPaymentMethod={estimate.payment_method} approved={Boolean(estimate.approved_at)} paid={estimate.status === "paid" || Boolean(estimate.paid_at)} cancelled={estimate.status === "キャンセル"} approvalAllowed={["見積作成完了", "お客様確認中"].includes(estimate.status)} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
