import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StayReceiptData, StayReceiptItem } from "@/lib/pdf/stay-receipt-pdf";

const PAYMENT_METHODS: Record<string, string> = { stripe_card: "クレジットカード（Stripe）", bank_transfer: "銀行振込", cash: "現金", card_manual: "カード", other: "その他" };
function dateInJapan(value: string) { return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date(value)); }

export async function getStayReceiptData(id: string, customerId?: string): Promise<StayReceiptData | null> {
  let query = createSupabaseAdminClient().from("stay_bookings").select("booking_number,customer_id,guest_name,check_in_date,check_out_date,nights,subtotal,additional_guest_fee,cleaning_fee,discount_amount,total_amount,card_fee_amount,payment_method,payment_status,paid_at,updated_at,stay_listings(name)").eq("id", id);
  if (customerId) query = query.eq("customer_id", customerId);
  const { data: booking, error } = await query.maybeSingle();
  if (error) { console.error("宿泊領収書データを取得できませんでした。", { code: error.code, message: error.message }); return null; }
  if (!booking || booking.payment_status !== "paid") return null;
  const items: StayReceiptItem[] = [
    { description: `宿泊料金（${booking.nights}泊）`, quantity: 1, unitPrice: booking.subtotal, amount: booking.subtotal },
    ...(booking.additional_guest_fee ? [{ description: "追加人数料金", quantity: 1, unitPrice: booking.additional_guest_fee, amount: booking.additional_guest_fee }] : []),
    { description: "清掃料金", quantity: 1, unitPrice: booking.cleaning_fee, amount: booking.cleaning_fee },
    ...(booking.discount_amount ? [{ description: "連泊割引等", quantity: 1, unitPrice: -booking.discount_amount, amount: -booking.discount_amount }] : []),
    ...(booking.card_fee_amount ? [{ description: "カード決済手数料", quantity: 1, unitPrice: booking.card_fee_amount, amount: booking.card_fee_amount }] : []),
  ];
  const totalAmount = booking.total_amount + Number(booking.card_fee_amount ?? 0);
  return {
    receiptNumber: `${booking.booking_number}-R1`, receiptDate: dateInJapan(booking.paid_at ?? booking.updated_at), customerName: booking.guest_name,
    bookingNumber: booking.booking_number, listingName: (booking.stay_listings as unknown as { name: string }).name,
    checkInDate: booking.check_in_date, checkOutDate: booking.check_out_date,
    paymentMethod: PAYMENT_METHODS[booking.payment_method ?? ""] ?? "支払い済み", items, totalAmount,
  };
}
