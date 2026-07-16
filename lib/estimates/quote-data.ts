import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { type EstimatePdfData } from "@/lib/pdf/estimate-pdf";
import { ESTIMATE_IMAGE_BUCKET } from "@/lib/estimates/image-files";

type EstimateQuoteRow = {
  estimate_no: string;
  quote_issue_date: string;
  valid_until: string | null;
  payment_method: string;
  deposit: number;
  international_shipping_fee: number;
  agency_fee: number;
  other_fee: number;
  discount: number;
  tax: number;
  tax_rate: number;
  customers: { name: string; email: string; prefecture: string } | null;
  estimate_items: { product_name: string | null; url: string; quantity: number; unit_price: number; estimate_item_images: { storage_path: string; sort_order: number }[] }[];
};

export async function getEstimateQuoteData(estimateId: string): Promise<EstimatePdfData | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("estimate_no, quote_issue_date, valid_until, payment_method, deposit, international_shipping_fee, agency_fee, other_fee, discount, tax, tax_rate, customers(name, email, prefecture), estimate_items(product_name, url, quantity, unit_price, estimate_item_images(storage_path, sort_order))")
    .eq("id", estimateId)
    .maybeSingle();

  if (error) throw new Error(`見積データの取得に失敗しました: ${error.message}`);
  if (!data) return null;
  const estimate = data as unknown as EstimateQuoteRow;
  if (!estimate.customers) throw new Error("顧客情報が見つかりません。");

  const items = await Promise.all(estimate.estimate_items.map(async (item) => {
    const firstImage = item.estimate_item_images.sort((a, b) => a.sort_order - b.sort_order)[0];
    let image: Buffer | undefined;
    if (firstImage) {
      const { data: file, error: imageError } = await supabase.storage.from(ESTIMATE_IMAGE_BUCKET).download(firstImage.storage_path);
      if (imageError) console.error("PDF用の商品画像を取得できませんでした。", imageError);
      else image = Buffer.from(await file.arrayBuffer());
    }
    return { productName: item.product_name, url: item.url, quantity: item.quantity, unitPrice: item.unit_price, image };
  }));

  return {
    estimateNo: estimate.estimate_no,
    issueDate: estimate.quote_issue_date,
    customerName: estimate.customers.name,
    customerEmail: estimate.customers.email,
    prefecture: estimate.customers.prefecture,
    items,
    deposit: estimate.deposit,
    internationalShippingFee: estimate.international_shipping_fee,
    agencyFee: estimate.agency_fee,
    otherFee: estimate.other_fee,
    discount: estimate.discount,
    tax: estimate.tax,
    taxRate: estimate.tax_rate,
    paymentMethod: estimate.payment_method,
    validUntil: estimate.valid_until,
  };
}
