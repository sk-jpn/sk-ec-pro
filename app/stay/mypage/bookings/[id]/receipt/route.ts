import { join } from "node:path";
import { generateStayReceiptPdf } from "@/lib/pdf/stay-receipt-pdf";
import { requireStayUser } from "@/lib/stay/auth";
import { getStayReceiptData } from "@/lib/stay/receipt-data";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { customer } = await requireStayUser(`/stay/mypage/bookings/${id}`);
  const receipt = await getStayReceiptData(id, customer.id);
  if (!receipt) return new Response(JSON.stringify({ message: "支払い済みの宿泊予約が見つかりません。" }), { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } });
  const pdf = await generateStayReceiptPdf(receipt, { logoPath: join(process.cwd(), "public", "brand", "sk-ec-pro-logo.png") });
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="receipt-${receipt.bookingNumber}.pdf"`, "Cache-Control": "private, no-store" } });
}
