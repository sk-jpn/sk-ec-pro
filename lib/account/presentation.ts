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

export function customerStatusLabel(status: string) { return status; }
