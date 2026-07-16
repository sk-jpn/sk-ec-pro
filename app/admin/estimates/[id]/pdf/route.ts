import { join } from "node:path";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getEstimateQuoteData } from "@/lib/estimates/quote-data";
import { generateEstimatePdf } from "@/lib/pdf/estimate-pdf";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: RouteContext<"/admin/estimates/[id]/pdf">) {
  await requireAdminUser();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return Response.json({ message: "見積IDが正しくありません。" }, { status: 400 });
  }

  try {
    const estimate = await getEstimateQuoteData(id);
    if (!estimate) return Response.json({ message: "見積が見つかりません。" }, { status: 404 });

    const pdf = await generateEstimatePdf(estimate, { logoPath: join(process.cwd(), "public", "brand", "sk-ec-pro-logo.png") });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="estimate-${estimate.estimateNo}.pdf"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("見積書PDFの生成に失敗しました。", error);
    return Response.json({ message: "PDFを生成できませんでした。" }, { status: 500 });
  }
}
