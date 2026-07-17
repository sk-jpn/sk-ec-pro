import Link from "next/link";
import { Boxes, ClipboardCheck, Clock3, Truck } from "lucide-react";
import { PageHeader } from "./admin-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function todayStartJst() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}T00:00:00+09:00`;
}

export default async function AdminDashboard() {
  const supabase = createSupabaseAdminClient();
  const [today, unanswered, shipping, ordering, recent] = await Promise.all([
    supabase.from("estimates").select("id", { count: "exact", head: true }).gte("created_at", todayStartJst()),
    supabase.from("estimates").select("id", { count: "exact", head: true }).eq("status", "見積作成中"),
    supabase.from("estimates").select("id", { count: "exact", head: true }).in("status", ["画像確認待ち", "日本発送待ち"]),
    supabase.from("estimates").select("id", { count: "exact", head: true }).in("status", ["入金待ち", "発注作業中"]),
    supabase.from("estimates").select("id, estimate_no, status, created_at, customers(name)").order("created_at", { ascending: false }).limit(5),
  ]);
  const metrics = [
    { label: "今日の見積件数", value: today.count ?? 0, note: "本日受付", icon: ClipboardCheck },
    { label: "未返信件数", value: unanswered.count ?? 0, note: "見積作成中", icon: Clock3 },
    { label: "発送待ち件数", value: shipping.count ?? 0, note: "画像確認・日本発送待ち", icon: Truck },
    { label: "注文待ち件数", value: ordering.count ?? 0, note: "入金待ち・発注作業中", icon: Boxes },
  ];
  const recentEstimates = (recent.data ?? []) as unknown as { id: string; estimate_no: string; status: string; created_at: string; customers: { name: string } | null }[];
  return <><PageHeader title="Dashboard" description="購入代行業務の最新状況を本番データから表示しています。" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, note, icon: Icon }) => <Card key={label}><CardHeader className="flex-row items-center justify-between pb-3"><CardDescription>{label}</CardDescription><span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><Icon size={18} /></span></CardHeader><CardContent><p className="text-3xl font-bold tracking-tight">{value}</p><p className="mt-2 text-xs text-slate-400">{note}</p></CardContent></Card>)}</div><Card className="mt-6"><CardHeader><CardTitle>最近の見積</CardTitle><CardDescription>直近5件の受付状況</CardDescription></CardHeader><CardContent>{recentEstimates.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">見積はまだありません。</p> : <div className="divide-y divide-slate-100">{recentEstimates.map((estimate) => <Link key={estimate.id} href={`/admin/estimates/${estimate.id}`} className="grid gap-2 py-4 text-sm transition hover:text-emerald-700 sm:grid-cols-[1fr_1fr_1fr]"><span className="font-semibold">{estimate.estimate_no}</span><span>{estimate.customers?.name ?? "顧客名未登録"}</span><span className="text-slate-400 sm:text-right">{estimate.status}・{new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(estimate.created_at))}</span></Link>)}</div>}</CardContent></Card></>;
}
