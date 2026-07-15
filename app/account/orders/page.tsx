import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { date } from "@/lib/account/presentation";

type Order = { id: string; order_no: string; ordered_at: string; payment_status: string; shipping_status: string; carrier: string | null; tracking_number: string | null };

export default async function AccountOrdersPage() {
  const { user, supabase } = await requireCustomerUser();
  const { data, error } = await supabase.from("orders").select("id, order_no, ordered_at, payment_status, shipping_status, carrier, tracking_number, customers!inner(auth_user_id)").eq("customers.auth_user_id", user.id).order("ordered_at", { ascending: false });
  if (error) throw new Error(`注文一覧を取得できませんでした: ${error.message}`);
  const orders = data as unknown as Order[];
  return <><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Orders</p><h1 className="mt-2 text-3xl font-bold">注文一覧</h1><p className="mt-3 text-sm text-slate-500">決済状況と配送情報を確認できます。</p><div className="mt-7 space-y-3">{orders.length === 0 ? <Card><CardContent className="p-10 text-center text-sm text-slate-500">確定済みの注文はまだありません。</CardContent></Card> : orders.map((order) => <Link key={order.id} href={`/account/orders/${order.id}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md sm:grid-cols-[1.2fr_1fr_.8fr_1fr_1fr_auto] sm:items-center"><Cell label="注文番号" value={order.order_no} bold /><Cell label="注文日" value={date(order.ordered_at)} /><div><p className="text-xs text-slate-400">支払状況</p><Badge className="mt-1">{order.payment_status === "paid" ? "支払済" : "未払い"}</Badge></div><Cell label="発送状況" value={order.shipping_status} /><Cell label="配送・追跡" value={order.carrier ? `${order.carrier} ${order.tracking_number ?? ""}` : "未登録"} /><span className="flex items-center gap-1 text-sm font-semibold text-blue-600">詳細を見る<ArrowRight size={15} /></span></Link>)}</div></>;
}

function Cell({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) { return <div><p className="text-xs text-slate-400">{label}</p><p className={`mt-1 text-sm ${bold ? "font-bold" : "font-medium"}`}>{value}</p></div>; }
