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
import { CaseMessages } from "@/app/components/case-messages";
import { loadCaseMessages } from "@/lib/messages/case-messages";
import { approveReceivedImages } from "@/app/estimate/[estimateNumber]/actions";

type EstimateImage = { id: string; storage_path: string; original_name: string; sort_order: number };
type Estimate = { id: string; estimate_no: string; status: string; approved_at: string | null; paid_at: string | null; payment_method: string; deposit: number; international_shipping_fee: number; agency_fee: number; other_fee: number; discount: number; tax: number; tax_rate: number; estimate_items: { id: string; product_name: string | null; url: string; quantity: number; unit_price: number; color: string | null; size: string | null; model: string | null; request: string; estimate_item_images: EstimateImage[]; received_item_images: EstimateImage[] }[]; estimate_tracking_numbers: { sort_order: number; carrier: string; tracking_number: string; note: string | null }[] };

export default async function AccountEstimateDetailPage({ params }: PageProps<"/account/estimates/[id]">) {
  const { id } = await params;
  const { user, supabase } = await requireCustomerUser();
  const { data, error } = await supabase.from("estimates").select("id, estimate_no, status, approved_at, paid_at, payment_method, deposit, international_shipping_fee, agency_fee, other_fee, discount, tax, tax_rate, estimate_items(id, product_name, url, quantity, unit_price, color, size, model, request, estimate_item_images(id, storage_path, original_name, sort_order), received_item_images(id, storage_path, original_name, sort_order)), estimate_tracking_numbers(sort_order, carrier, tracking_number, note), customers!inner(auth_user_id)").eq("id", id).eq("customers.auth_user_id", user.id).maybeSingle();
  if (error) throw new Error(`見積詳細を取得できませんでした: ${error.message}`);
  if (!data) notFound();
  const estimate = data as unknown as Estimate;
  const messages = await loadCaseMessages(estimate.id);
  const imagePaths = estimate.estimate_items.flatMap((item) => [...item.estimate_item_images, ...item.received_item_images].map((image) => image.storage_path));
  const admin = createSupabaseAdminClient();
  const { data: signedImages, error: signedError } = imagePaths.length ? await admin.storage.from(ESTIMATE_IMAGE_BUCKET).createSignedUrls(imagePaths, 60 * 60) : { data: [], error: null };
  if (signedError) console.error("商品画像を表示できませんでした。", signedError);
  const signedUrlByPath = new Map((signedImages ?? []).map((entry, index) => [imagePaths[index], entry.signedUrl]));
  const totals = estimateTotal(estimate);
  const charges = [["デポジット", estimate.deposit], ["国際送料", estimate.international_shipping_fee], ["購入代行", estimate.agency_fee], ["その他の費用（前回不足金等）", estimate.other_fee], ["割引", -estimate.discount], [`消費税（${estimate.tax_rate}%）`, estimate.tax]] as const;
  return <><Button variant="ghost" asChild><Link href="/account/estimates"><ArrowLeft size={16} />見積一覧へ</Link></Button>
    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Estimate Detail</p><h1 className="mt-2 text-3xl font-bold">{estimate.estimate_no}</h1><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{customerStatusLabel(estimate.status)}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${estimate.paid_at || estimate.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{estimate.paid_at || estimate.status === "paid" ? "決済済" : "未決済"}</span></div></div><Button variant="outline" asChild><a href={`/account/estimates/${estimate.id}/pdf`}><Download size={16} />PDFダウンロード</a></Button></div>
    <Card className="mt-7"><CardContent className="p-5 sm:p-8"><h2 className="text-lg font-bold">商品一覧</h2><div className="mt-4 space-y-4">{estimate.estimate_items.map((item, index) => { const variations = [["色", item.color], ["サイズ", item.size], ["型番", item.model]].filter((entry) => entry[1]); const images = item.estimate_item_images.sort((a, b) => a.sort_order - b.sort_order).flatMap<CustomerEstimateImage>((image) => { const url = signedUrlByPath.get(image.storage_path); return url ? [{ id: image.id, url, name: image.original_name }] : []; }); const receivedImages = item.received_item_images.sort((a, b) => a.sort_order - b.sort_order).flatMap<CustomerEstimateImage>((image) => { const url = signedUrlByPath.get(image.storage_path); return url ? [{ id: image.id, url, name: image.original_name }] : []; }); return <article key={item.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-xs font-bold text-blue-600">商品 {index + 1}</p><h3 className="mt-1 font-bold">{item.product_name || item.url || "商品画像からのご依頼"}</h3>{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-blue-600 hover:underline">{item.url}</a>}</div><div className="shrink-0 text-sm sm:text-right"><p>数量 <strong>{item.quantity}</strong></p><p className="mt-1 font-bold">{yen(totals.subtotals[index])}</p></div></div><div className="mt-4"><p className="mb-2 text-xs font-bold text-slate-500">見積時の商品画像</p><CustomerImageGallery images={images} /></div>{receivedImages.length > 0 && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4"><p className="mb-3 text-sm font-bold text-emerald-800">中国物流に到着した商品の画像</p><CustomerImageGallery images={receivedImages} /></div>}<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-400">バリエーション</dt><dd className="mt-1 font-medium">{variations.length ? variations.map(([label, value]) => `${label}: ${value}`).join(" / ") : "指定なし"}</dd></div><div><dt className="text-xs text-slate-400">希望内容</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{item.request || "指定なし"}</dd></div></dl></article>; })}</div>
      <div className="mt-7 ml-auto max-w-md space-y-3">{charges.map(([label, value]) => <p key={label} className="flex justify-between text-sm"><span className="text-slate-500">{label}</span><span>{yen(value)}</span></p>)}<div className="flex justify-between border-t border-slate-200 pt-4 text-xl font-bold"><span>合計金額</span><span className="text-blue-700">{yen(totals.total)}</span></div></div>
      <div className="mt-9 border-t border-slate-100 pt-8"><PaymentPanel estimateNumber={estimate.estimate_no} estimateTotal={totals.total} initialPaymentMethod={estimate.payment_method} approved={Boolean(estimate.approved_at)} paid={estimate.status === "発注作業中" || Boolean(estimate.paid_at)} cancelled={estimate.status === "キャンセル"} approvalAllowed={estimate.status === "見積確認待ち"} bankTransferDetails="三菱UFJ銀行 新宿支店 普通 0039565 カミキシンノスケ" currentStatus={estimate.status} /></div>
    </CardContent></Card>
    <Card className="mt-6"><CardContent className="p-5 sm:p-8"><h2 className="text-lg font-bold">発送状況</h2><StatusTimeline status={estimate.status} /></CardContent></Card>
    {estimate.estimate_tracking_numbers.length > 0 && <Card className="mt-6"><CardContent className="p-5 sm:p-8"><h2 className="text-lg font-bold">配送・追跡情報</h2><div className="mt-5 grid gap-3">{estimate.estimate_tracking_numbers.sort((a,b) => a.sort_order-b.sort_order).map((row) => <div key={row.sort_order} className="grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3"><p><span className="text-xs text-slate-400">配送会社</span><br />{row.carrier || "—"}</p><p><span className="text-xs text-slate-400">追跡番号</span><br />{row.tracking_number || "—"}</p><p><span className="text-xs text-slate-400">備考</span><br />{row.note || "—"}</p></div>)}</div></CardContent></Card>}
    <div className="mt-6"><CaseMessages estimateId={estimate.id} viewer="customer" messages={messages} /></div>
    {estimate.status === "画像確認待ち" && <Card className="mt-6"><CardContent className="p-6 text-center"><h2 className="text-lg font-bold">到着商品の画像をご確認ください</h2><p className="mt-2 text-sm text-slate-500">問題がなければ承認してください。問題がある場合はメッセージからご連絡ください。</p><form action={approveReceivedImages} className="mt-5"><input type="hidden" name="estimateNumber" value={estimate.estimate_no} /><Button type="submit">承認＆発送指示</Button></form></CardContent></Card>}
  </>;
}
