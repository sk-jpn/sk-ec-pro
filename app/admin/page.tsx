import Link from "next/link";
import { BedDouble, Boxes, CalendarCheck, CalendarDays, CircleAlert, ClipboardCheck, Clock3, Truck } from "lucide-react";
import { PageHeader } from "./admin-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { STAY_STATUSES, stayDate } from "@/lib/stay/presentation";

function todayStartJst() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}T00:00:00+09:00`;
}

function todayJst() {
  return todayStartJst().slice(0, 10);
}

export default async function AdminDashboard() {
  const supabase = createSupabaseAdminClient();
  const currentDate = todayJst();
  const activeStayStatuses = ["confirmed", "payment_pending", "paid", "check_in_scheduled", "checked_in"];
  const [today, unanswered, shipping, ordering, recent, todayCheckIns, stayAttention, stayingNow, upcomingStays, recentStays] = await Promise.all([
    supabase.from("estimates").select("id", { count: "exact", head: true }).gte("created_at", todayStartJst()),
    supabase.from("estimates").select("id", { count: "exact", head: true }).eq("status", "見積作成中"),
    supabase.from("estimates").select("id", { count: "exact", head: true }).in("status", ["画像確認待ち", "日本発送待ち"]),
    supabase.from("estimates").select("id", { count: "exact", head: true }).in("status", ["入金待ち", "発注作業中"]),
    supabase.from("estimates").select("id, estimate_no, status, created_at, customers(name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("stay_bookings").select("id", { count: "exact", head: true }).eq("check_in_date", currentDate).in("status", activeStayStatuses),
    supabase.from("stay_bookings").select("id", { count: "exact", head: true }).in("status", ["pending_admin_review", "admin_reviewing", "awaiting_guest_confirmation"]),
    supabase.from("stay_bookings").select("id", { count: "exact", head: true }).eq("status", "checked_in"),
    supabase.from("stay_bookings").select("id", { count: "exact", head: true }).gt("check_out_date", currentDate).in("status", activeStayStatuses),
    supabase.from("stay_bookings").select("id,booking_number,check_in_date,check_out_date,status,stay_customers(name),stay_listings(code,name)").order("requested_at", { ascending: false }).limit(5),
  ]);
  const metrics = [
    { label: "今日の見積件数", value: today.count ?? 0, note: "本日受付", icon: ClipboardCheck },
    { label: "未返信件数", value: unanswered.count ?? 0, note: "見積作成中", icon: Clock3 },
    { label: "発送待ち件数", value: shipping.count ?? 0, note: "画像確認・日本発送待ち", icon: Truck },
    { label: "注文待ち件数", value: ordering.count ?? 0, note: "入金待ち・発注作業中", icon: Boxes },
  ];
  const recentEstimates = (recent.data ?? []) as unknown as { id: string; estimate_no: string; status: string; created_at: string; customers: { name: string } | null }[];
  const stayMetrics = [
    { label: "今日のチェックイン", value: todayCheckIns.count ?? 0, note: currentDate, icon: CalendarCheck },
    { label: "確認・対応待ち", value: stayAttention.count ?? 0, note: "予約申請・管理者確認・顧客確認待ち", icon: CircleAlert },
    { label: "現在宿泊中", value: stayingNow.count ?? 0, note: "チェックイン済み", icon: BedDouble },
    { label: "今後の有効予約", value: upcomingStays.count ?? 0, note: "本日以降に宿泊期間がある予約", icon: CalendarDays },
  ];
  const stayRows = (recentStays.data ?? []) as unknown as { id: string; booking_number: string; check_in_date: string; check_out_date: string; status: string; stay_customers: { name: string } | null; stay_listings: { code: string; name: string } | null }[];
  return <><PageHeader title="Dashboard" description="購入代行業務と宿泊業務の最新状況を本番データから表示しています。" />
    <div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Purchase Management</p><h2 className="mt-1 text-xl font-bold">購入代行業務</h2></div><Link href="/admin/purchase" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">購入代行管理へ</Link></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, note, icon: Icon }) => <Card key={label}><CardHeader className="flex-row items-center justify-between pb-3"><CardDescription>{label}</CardDescription><span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><Icon size={18} /></span></CardHeader><CardContent><p className="text-3xl font-bold tracking-tight">{value}</p><p className="mt-2 text-xs text-slate-400">{note}</p></CardContent></Card>)}</div>
    <Card className="mt-6"><CardHeader><CardTitle>最近の見積</CardTitle><CardDescription>直近5件の受付状況</CardDescription></CardHeader><CardContent>{recentEstimates.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">見積はまだありません。</p> : <div className="divide-y divide-slate-100">{recentEstimates.map((estimate) => <Link key={estimate.id} href={`/admin/estimates/${estimate.id}`} className="grid gap-2 py-4 text-sm transition hover:text-emerald-700 sm:grid-cols-[1fr_1fr_1fr]"><span className="font-semibold">{estimate.estimate_no}</span><span>{estimate.customers?.name ?? "顧客名未登録"}</span><span className="text-slate-400 sm:text-right">{estimate.status}・{new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(estimate.created_at))}</span></Link>)}</div>}</CardContent></Card>
    <div className="mb-3 mt-10 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Stay Management</p><h2 className="mt-1 text-xl font-bold">宿泊業務</h2></div><Link href="/admin/stay" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">宿泊管理へ</Link></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stayMetrics.map(({ label, value, note, icon: Icon }) => <Card key={label}><CardHeader className="flex-row items-center justify-between pb-3"><CardDescription>{label}</CardDescription><span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><Icon size={18} /></span></CardHeader><CardContent><p className="text-3xl font-bold tracking-tight">{value}</p><p className="mt-2 text-xs text-slate-400">{note}</p></CardContent></Card>)}</div>
    <Card className="mt-6"><CardHeader><CardTitle>最近の宿泊予約</CardTitle><CardDescription>直近5件の受付状況</CardDescription></CardHeader><CardContent>{stayRows.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">宿泊予約はまだありません。</p> : <div className="divide-y divide-slate-100">{stayRows.map((booking) => <Link key={booking.id} href={`/admin/stay/bookings/${booking.id}`} className="grid gap-2 py-4 text-sm transition hover:text-emerald-700 sm:grid-cols-[1fr_1fr_1.2fr_1fr]"><span className="font-semibold">{booking.booking_number}</span><span>{booking.stay_customers?.name ?? "顧客名未登録"}</span><span>{booking.stay_listings ? `${booking.stay_listings.code}・${booking.stay_listings.name}` : "リスティング未登録"}</span><span className="text-slate-400 sm:text-right">{stayDate(booking.check_in_date)}〜{stayDate(booking.check_out_date)}・{STAY_STATUSES[booking.status] ?? booking.status}</span></Link>)}</div>}</CardContent></Card>
  </>;
}
