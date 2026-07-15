import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { date } from "@/lib/account/presentation";
import { StatusTimeline } from "../../status-timeline";

type Order = { order_no: string; ordered_at: string; payment_status: string; shipping_status: string; carrier: string | null; tracking_number: string | null; estimates: { estimate_no: string; status: string } | null };
export default async function OrderDetailPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params; const { user, supabase } = await requireCustomerUser();
  const { data, error } = await supabase.from("orders").select("order_no, ordered_at, payment_status, shipping_status, carrier, tracking_number, estimates(estimate_no, status), customers!inner(auth_user_id)").eq("id", id).eq("customers.auth_user_id", user.id).maybeSingle();
  if (error) throw new Error(`注文詳細を取得できませんでした: ${error.message}`); if (!data) notFound();
  const order = data as unknown as Order;
  return <><Button variant="ghost" asChild><Link href="/account/orders"><ArrowLeft size={16} />注文一覧へ</Link></Button><p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-blue-600">Order Detail</p><h1 className="mt-2 text-3xl font-bold">{order.order_no}</h1><Card className="mt-7"><CardContent className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4"><Info label="注文日" value={date(order.ordered_at)} /><Info label="支払状況" value={order.payment_status === "paid" ? "支払済" : "未払い"} /><Info label="配送会社" value={order.carrier ?? "未登録"} /><Info label="追跡番号" value={order.tracking_number ?? "未登録"} /></CardContent></Card><Card className="mt-6"><CardContent className="p-6 sm:p-8"><h2 className="text-lg font-bold">発送状況</h2><StatusTimeline status={order.estimates?.status ?? "新規"} /></CardContent></Card></>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-slate-400">{label}</p><p className="mt-2 font-semibold">{value}</p></div>; }
