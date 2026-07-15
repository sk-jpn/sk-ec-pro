import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { customerStatusLabel, date, estimateTotal, yen } from "@/lib/account/presentation";

type Estimate = { id: string; estimate_no: string; created_at: string; status: string; china_shipping_fee: number; international_shipping_fee: number; agency_fee: number; other_fee: number; discount: number; tax: number; estimate_items: { quantity: number; unit_price: number }[] };

export default async function AccountEstimatesPage() {
  const { user, supabase } = await requireCustomerUser();
  const { data, error } = await supabase.from("estimates").select("id, estimate_no, created_at, status, china_shipping_fee, international_shipping_fee, agency_fee, other_fee, discount, tax, estimate_items(quantity, unit_price), customers!inner(auth_user_id)").eq("customers.auth_user_id", user.id).order("created_at", { ascending: false });
  if (error) throw new Error(`見積一覧を取得できませんでした: ${error.message}`);
  const estimates = data as unknown as Estimate[];
  return <><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Estimates</p><h1 className="mt-2 text-3xl font-bold tracking-tight">見積一覧</h1><p className="mt-3 text-sm text-slate-500">これまでのお見積と現在の状況を確認できます。</p>
    <div className="mt-7 space-y-3">{estimates.length === 0 ? <Card><CardContent className="p-10 text-center text-sm text-slate-500">見積はまだありません。</CardContent></Card> : estimates.map((estimate) => { const total = estimateTotal(estimate).total; return <Link key={estimate.id} href={`/account/estimates/${estimate.id}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto] sm:items-center"><div><p className="text-xs text-slate-400">見積番号</p><p className="mt-1 font-bold">{estimate.estimate_no}</p></div><div><p className="text-xs text-slate-400">見積日</p><p className="mt-1 text-sm font-medium">{date(estimate.created_at)}</p></div><div><p className="text-xs text-slate-400">現在ステータス</p><Badge className="mt-1">{customerStatusLabel(estimate.status)}</Badge></div><div><p className="text-xs text-slate-400">金額</p><p className="mt-1 font-bold text-blue-700">{yen(total)}</p></div><span className="flex items-center gap-1 text-sm font-semibold text-blue-600">詳細を見る<ArrowRight size={15} /></span></Link>; })}</div>
  </>;
}
