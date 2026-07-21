import { join } from "node:path";
import { generateStayReceiptPdf, normalizeStayReceiptLocale } from "@/lib/pdf/stay-receipt-pdf";
import { requireStayUser } from "@/lib/stay/auth";
import { getStayReceiptData } from "@/lib/stay/receipt-data";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { customer } = await requireStayUser(`/stay/mypage/bookings/${id}`);
  const locale = normalizeStayReceiptLocale(new URL(request.url).searchParams.get("locale"));
  const receipt = await getStayReceiptData(id, customer.id, locale);
  if (!receipt) return new Response(JSON.stringify({ message: "支払い済みの宿泊予約が見つかりません。" }), { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } });
  if (locale === "en" && !receipt.customerNameEn) return new Response(JSON.stringify({ message: "English領収書をご希望の場合は、プロフィールで英語名を設定してください。" }), { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } });
  const pdf = await generateStayReceiptPdf({ ...receipt, locale, customerName: locale === "en" && receipt.customerNameEn ? receipt.customerNameEn : receipt.customerName }, { logoPath: join(process.cwd(), "public", "brand", "sk-ec-pro-logo.png") });
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="receipt-${receipt.bookingNumber}.pdf"`, "Cache-Control": "private, no-store" } });
}