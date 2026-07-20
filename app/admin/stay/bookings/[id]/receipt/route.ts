import { join } from "node:path";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { generateStayReceiptPdf } from "@/lib/pdf/stay-receipt-pdf";
import { getStayReceiptData } from "@/lib/stay/receipt-data";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser();
  const { id } = await params;
  const receipt = await getStayReceiptData(id);
  if (!receipt) return new Response(JSON.stringify({ message: "支払い済みの宿泊予約が見つかりません。" }), { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } });
  const pdf = await generateStayReceiptPdf(receipt, { logoPath: join(process.cwd(), "public", "brand", "sk-ec-pro-logo.png") });
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="receipt-${receipt.bookingNumber}.pdf"`, "Cache-Control": "private, no-store" } });
}
