import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StayReceiptData, StayReceiptItem } from "@/lib/pdf/stay-receipt-pdf";

function dateInJapan(value: string) { return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date(value)); }

export async function getStayReceiptData(id: string, customerId?: string): Promise<StayReceiptData | null> {
  let query = createSupabaseAdminClient().from("stay_bookings").select("booking_number,customer_id,guest_name,check_in_date,check_out_date,nights,subtotal,additional_guest_fee,cleaning_fee,discount_amount,total_amount,card_fee_amount,payment_method,payment_status,paid_at,updated_at,stay_listings(name)").eq("id", id);
  if (customerId) query = query.eq("customer_id", customerId);
  const { data: booking, error } = await query.maybeSingle();
  if (error) { console.error("宿泊領収書データを取得できませんでした。", { code: error.code, message: error.message }); return null; }
  if (!booking || booking.payment_status !== "paid") return null;
  const items: StayReceiptItem[] = [
    { kind: "accommodation", nights: booking.nights, quantity: 1, unitPrice: booking.subtotal, amount: booking.subtotal },
    ...(booking.additional_guest_fee ? [{ kind: "additionalGuest" as const, quantity: 1, unitPrice: booking.additional_guest_fee, amount: booking.additional_guest_fee }] : []),
    { kind: "cleaning", quantity: 1, unitPrice: booking.cleaning_fee, amount: booking.cleaning_fee },
    ...(booking.discount_amount ? [{ kind: "discount" as const, quantity: 1, unitPrice: -booking.discount_amount, amount: -booking.discount_amount }] : []),
    ...(booking.card_fee_amount ? [{ kind: "cardFee" as const, quantity: 1, unitPrice: booking.card_fee_amount, amount: booking.card_fee_amount }] : []),
  ];
  const totalAmount = booking.total_amount + Number(booking.card_fee_amount ?? 0);
  return {
    receiptNumber: `${booking.booking_number}-R1`, receiptDate: dateInJapan(booking.paid_at ?? booking.updated_at), customerName: booking.guest_name,
    bookingNumber: booking.booking_number, listingName: (booking.stay_listings as unknown as { name: string }).name,
    checkInDate: booking.check_in_date, checkOutDate: booking.check_out_date,
    paymentMethod: booking.payment_method ?? "paid", items, totalAmount,
  };
}
