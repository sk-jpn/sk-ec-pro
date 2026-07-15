import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { notFound } from "next/navigation";
import { PaymentPanel } from "@/app/estimate/[estimateNumber]/payment-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { customerStatusLabel, estimateTotal, yen } from "@/lib/account/presentation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ESTIMATE_IMAGE_BUCKET } from "@/lib/estimates/image-files";
import { StatusTimeline } from "../../status-timeline";
import { CustomerImageGallery, type CustomerEstimateImage } from "./customer-image-gallery";

type EstimateImage = { id: string; storage_path: string; original_name: string; sort_order: number };
type Estimate = { id: string; estimate_no: string; status: string; approved_at: string | null; paid_at: string | null; payment_method: string; china_shipping_fee: number; international_shipping_fee: number; agency_fee: number; other_fee: number; discount: number; tax: number; estimate_items: { id: string; product_name: string | null; url: string; quantity: number; unit_price: number; color: string | null; size: string | null; model: string | null; request: string; estimate_item_images: EstimateImage[] }[] };

export default async function AccountEstimateDetailPage({ params }: PageProps<"/account/estimates/[id]">) {
  const { id } = await params;
  const { user, supabase } = await requireCustomerUser();
  const { data, error } = await supabase.from("estimates").select("id, estimate_no, status, approved_at, paid_at, payment_method, china_shipping_fee, international_shipping_fee, agency_fee, other_fee, discount, tax, estimate_items(id, product_name, url, quantity, unit_price, color, size, model, request, estimate_item_images(id, storage_path, original_name, sort_order)), customers!inner(auth_user_id)").eq("id", id).eq("customers.auth_user_id", user.id).maybeSingle();
  if (error) throw new Error(`見積詳細を取得できませんでした: ${error.message}`);
  if (!data) notFound();
  const estimate = data as unknown as Estimate;
  const imagePaths = estimate.estimate_items.flatMap((item) => item.estimate_item_images.map((image) => image.storage_path));
  const admin = createSupabaseAdminClient();
  const { data: signedImages, error: signedError } = imagePaths.length ? await admin.storage.from(ESTIMATE_IMAGE_BUCKET).createSignedUrls(imagePaths, 60 * 60) : { data: [], error: null };
  if (signedError) console.error("商品画像を表示できませんでした。", signedError);
  const signedUrlByPath = new Map((signedImages ?? []).map((entry, index) => [imagePaths[index], entry.signedUrl]));
  const totals = estimateTotal(estimate);
  const charges = [["中国国内送料", estimate.china_shipping_fee], ["国際送料", estimate.international_shipping_fee], ["代行手数料", estimate.agency_fee], ["その他", estimate.other_fee]] as const;
  return <><Button variant="ghost" asChild><Link href="/account/estimates"><ArrowLeft size={16} />見積一覧へ</Link></Button>
    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Estimate Detail</p><h1 className="mt-2 text-3xl font-bold">{estimate.estimate_no}</h1><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{customerStatusLabel(estimate.status)}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${estimate.paid_at || estimate.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{estimate.paid_at || estimate.status === "paid" ? "決済済" : "未決済"}</span></div></div><Button variant="outline" asChild><a href={`/account/estimates/${estimate.id}/pdf`}><Download size={16} />PDFダウンロード</a></Button></div>
    <Card className="mt-7"><CardContent className="p-5 sm:p-8"><h2 className="text-lg font-bold">商品一覧</h2><div className="mt-4 space-y-4">{estimate.estimate_items.map((item, index) => { const variations = [["色", item.color], ["サイズ", item.size], ["型番", item.model]].filter((entry) => entry[1]); const images = item.estimate_item_images.sort((a, b) => a.sort_order - b.sort_order).flatMap<CustomerEstimateImage>((image) => { const url = signedUrlByPath.get(image.storage_path); return url ? [{ id: image.id, url, name: image.original_name }] : []; }); return <article key={item.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-xs font-bold text-blue-600">商品 {index + 1}</p><h3 className="mt-1 font-bold">{item.product_name || item.url || "商品画像からのご依頼"}</h3>{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-blue-600 hover:underline">{item.url}</a>}</div><div className="shrink-0 text-sm sm:text-right"><p>数量 <strong>{item.quantity}</strong></p><p className="mt-1 font-bold">{yen(totals.subtotals[index])}</p></div></div><div className="mt-4"><CustomerImageGallery images={images} /></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-400">バリエーション</dt><dd className="mt-1 font-medium">{variations.length ? variations.map(([label, value]) => `${label}: ${value}`).join(" / ") : "指定なし"}</dd></div><div><dt className="text-xs text-slate-400">希望内容</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{item.request || "指定なし"}</dd></div></dl></article>; })}</div>
      <div className="mt-7 ml-auto max-w-md space-y-3">{charges.map(([label, value]) => <p key={label} className="flex justify-between text-sm"><span className="text-slate-500">{label}</span><span>{yen(value)}</span></p>)}<div className="flex justify-between border-t border-slate-200 pt-4 text-xl font-bold"><span>合計金額</span><span className="text-blue-700">{yen(totals.total)}</span></div></div>
      <div className="mt-9 border-t border-slate-100 pt-8"><PaymentPanel estimateNumber={estimate.estimate_no} estimateTotal={totals.total} initialPaymentMethod={estimate.payment_method} approved={Boolean(estimate.approved_at)} paid={estimate.status === "paid" || Boolean(estimate.paid_at)} cancelled={estimate.status === "キャンセル"} /></div>
    </CardContent></Card>
    <Card className="mt-6"><CardContent className="p-5 sm:p-8"><h2 className="text-lg font-bold">発送状況</h2><StatusTimeline status={estimate.status} /></CardContent></Card>
  </>;
}
