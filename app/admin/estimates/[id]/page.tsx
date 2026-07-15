import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageHeader, StatusBadge } from "../../admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type EstimateStatus } from "../statuses";
import { EstimateManagementForm } from "./estimate-management-form";
import { EstimateQuoteForm } from "./estimate-quote-form";
import { BankPaymentButton } from "./bank-payment-button";
import { PAYMENT_METHODS } from "@/config/payment";
import { ESTIMATE_IMAGE_BUCKET } from "@/lib/estimates/image-files";
import { EstimateImageGallery, type EstimateImageView } from "./estimate-image-gallery";

export const dynamic = "force-dynamic";

type EstimateDetail = {
  id: string;
  estimate_no: string;
  status: EstimateStatus;
  approved_at: string | null;
  paid_at: string | null;
  memo: string | null;
  quote_issue_date: string;
  valid_until: string | null;
  payment_method: string;
  payment_fee: number;
  china_shipping_fee: number;
  international_shipping_fee: number;
  agency_fee: number;
  other_fee: number;
  discount: number;
  tax: number;
  shipping_method: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  customers: { name: string; company: string | null; email: string; phone: string | null; prefecture: string } | null;
  estimate_items: { id: string; url: string; product_name: string | null; quantity: number; unit_price: number; color: string | null; size: string | null; model: string | null; request: string; estimate_item_images: { id: string; storage_path: string; original_name: string; sort_order: number }[] }[];
};

export default async function EstimateDetailPage({ params }: PageProps<"/admin/estimates/[id]">) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("id, estimate_no, status, approved_at, paid_at, memo, quote_issue_date, valid_until, payment_method, payment_fee, china_shipping_fee, international_shipping_fee, agency_fee, other_fee, discount, tax, shipping_method, remarks, created_at, updated_at, customers(name, company, email, phone, prefecture), estimate_items(id, url, product_name, quantity, unit_price, color, size, model, request, estimate_item_images(id, storage_path, original_name, sort_order))")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`見積詳細の取得に失敗しました: ${error.message}`);
  if (!data) notFound();
  const estimate = data as unknown as EstimateDetail;
  const customer = estimate.customers;
  const paths = estimate.estimate_items.flatMap((item) => item.estimate_item_images.map((image) => image.storage_path));
  const { data: signedImages, error: signedImageError } = paths.length ? await supabase.storage.from(ESTIMATE_IMAGE_BUCKET).createSignedUrls(paths, 60 * 60) : { data: [], error: null };
  if (signedImageError) console.error("見積画像の署名URLを作成できませんでした。", signedImageError);
  const signedUrlByPath = new Map((signedImages ?? []).map((entry, index) => [paths[index], entry.signedUrl]));

  return (
    <>
      <div className="mb-5">
        <Button variant="ghost" asChild><Link href="/admin/estimates"><ArrowLeft size={16} />見積一覧へ戻る</Link></Button>
      </div>
      <PageHeader
        title={estimate.estimate_no}
        description={`${new Intl.DateTimeFormat("ja-JP", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(estimate.created_at))} 受付`}
        action={<div className="text-right"><StatusBadge status={estimate.status} />{estimate.approved_at && <p className="mt-2 text-xs text-slate-400">承認日時: {new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(estimate.approved_at))}</p>}{estimate.paid_at && <p className="mt-1 text-xs text-emerald-600">入金日時: {new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(estimate.paid_at))}</p>}</div>}
      />
      <div className="space-y-6">
        <EstimateManagementForm estimateId={estimate.id} status={estimate.status} memo={estimate.memo ?? ""} updatedAt={estimate.updated_at} />
        <EstimateQuoteForm
          estimateId={estimate.id}
          quoteIssueDate={estimate.quote_issue_date}
          validUntil={estimate.valid_until ?? ""}
          paymentMethod={estimate.payment_method}
          chinaShippingFee={estimate.china_shipping_fee}
          internationalShippingFee={estimate.international_shipping_fee}
          agencyFee={estimate.agency_fee}
          otherFee={estimate.other_fee}
          discount={estimate.discount}
          tax={estimate.tax}
          items={estimate.estimate_items.map((item) => ({ id: item.id, url: item.url, productName: item.product_name ?? "", quantity: item.quantity, unitPrice: item.unit_price }))}
        />
        {estimate.payment_method === PAYMENT_METHODS.bankTransfer && (estimate.approved_at || estimate.paid_at) && <BankPaymentButton estimateId={estimate.id} paidAt={estimate.paid_at} />}
        <Card>
          <CardHeader><CardTitle>顧客情報</CardTitle></CardHeader>
          <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-3"><UserRound size={17} className="text-emerald-600" /><span>{customer?.name ?? "—"}{customer?.company && <span className="mt-1 block text-xs text-slate-400">{customer.company}</span>}</span></p>
            <p className="flex items-center gap-3"><Mail size={17} className="text-emerald-600" />{customer?.email ?? "—"}</p>
            <p className="flex items-center gap-3"><Phone size={17} className="text-emerald-600" />{customer?.phone ?? "—"}</p>
            <p className="flex items-center gap-3"><MapPin size={17} className="text-emerald-600" />{customer?.prefecture ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>商品一覧</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>商品</TableHead><TableHead>URL</TableHead><TableHead>画像</TableHead><TableHead>数量</TableHead><TableHead>希望内容</TableHead></TableRow></TableHeader>
              <TableBody>{estimate.estimate_items.map((item, index) => { const images = item.estimate_item_images.sort((a, b) => a.sort_order - b.sort_order).flatMap<EstimateImageView>((image) => { const url = signedUrlByPath.get(image.storage_path); return url ? [{ id: image.id, url, originalName: image.original_name }] : []; }); return <TableRow key={item.id}><TableCell className="font-medium">商品 {index + 1}</TableCell><TableCell>{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="block max-w-64 truncate text-emerald-700 hover:underline">{item.url}</a> : "—"}</TableCell><TableCell><EstimateImageGallery images={images} /></TableCell><TableCell>{item.quantity}</TableCell><TableCell className="max-w-80 whitespace-pre-wrap">{item.request || "—"}</TableCell></TableRow>; })}</TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>配送・備考</CardTitle></CardHeader>
          <CardContent className="grid gap-6 text-sm sm:grid-cols-2">
            <div><p className="text-xs text-slate-400">配送方法</p><p className="mt-2 font-medium">{estimate.shipping_method ?? "—"}</p></div>
            <div><p className="text-xs text-slate-400">お届け先</p><p className="mt-2 font-medium">{customer?.prefecture ?? "—"}</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-slate-400">備考</p><p className="mt-2 whitespace-pre-wrap leading-7">{estimate.remarks ?? "備考はありません。"}</p></div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
