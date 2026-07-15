import { join } from "node:path";
import { getEstimateQuoteData } from "@/lib/estimates/quote-data";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { generateEstimatePdf } from "@/lib/pdf/estimate-pdf";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: RouteContext<"/account/estimates/[id]/pdf">) {
  const { id } = await params;
  const { user, supabase } = await requireCustomerUser();
  const { data } = await supabase.from("estimates").select("id, customers!inner(auth_user_id)").eq("id", id).eq("customers.auth_user_id", user.id).maybeSingle();
  if (!data) return Response.json({ message: "見積が見つかりません。" }, { status: 404 });
  const estimate = await getEstimateQuoteData(id);
  if (!estimate) return Response.json({ message: "見積が見つかりません。" }, { status: 404 });
  const pdf = await generateEstimatePdf(estimate, { logoPath: join(process.cwd(), "public", "formosa-japan-logo.png") });
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="estimate-${estimate.estimateNo}.pdf"`, "Cache-Control": "private, no-store" } });
}
