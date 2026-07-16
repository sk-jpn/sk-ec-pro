import { calculateQuoteTotals } from "@/lib/estimates/quote-calculations";

export const yen = (value: number) => `¥${new Intl.NumberFormat("ja-JP").format(value)}`;
export const date = (value: string) => new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeZone: "Asia/Tokyo" }).format(new Date(value));

export function estimateTotal(estimate: {
  deposit: number; international_shipping_fee: number; agency_fee: number;
  other_fee: number; discount: number; tax: number;
  estimate_items: { quantity: number; unit_price: number }[];
}) {
  return calculateQuoteTotals(estimate.estimate_items.map((item) => ({ quantity: item.quantity, unitPrice: item.unit_price })), {
    deposit: estimate.deposit,
    internationalShippingFee: estimate.international_shipping_fee,
    agencyFee: estimate.agency_fee,
    otherFee: estimate.other_fee,
    discount: estimate.discount,
    tax: estimate.tax,
  });
}

export function customerStatusLabel(status: string) {
  return ({ 新規: "受付", 見積作成中: "見積作成中", お客様確認中: "お客様確認中", approved: "承認済", paid: "決済済", 発注済: "発注済", 中国発送: "中国発送", 国際配送中: "国際配送中", 国内発送: "国内発送", 完了: "完了", キャンセル: "キャンセル" } as Record<string, string>)[status] ?? status;
}
