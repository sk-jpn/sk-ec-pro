import Link from "next/link";
import { BedDouble, CalendarDays, CalendarOff, Car, ClipboardList, MessageSquare, Settings, Tags, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "宿泊管理" };

export default async function StayAdminPage() {
  const supabase = createSupabaseAdminClient();
  const [bookings, customers, listings, messages, pricingRules, blockedDates] = await Promise.all([
    supabase.from("stay_bookings").select("id", { count: "exact", head: true }),
    supabase.from("stay_customers").select("id", { count: "exact", head: true }),
    supabase.from("stay_listings").select("id", { count: "exact", head: true }),
    supabase.from("stay_message_threads").select("id", { count: "exact", head: true }),
    supabase.from("stay_pricing_rules").select("id", { count: "exact", head: true }),
    supabase.from("stay_blocked_dates").select("id", { count: "exact", head: true }),
  ]);
  const links = [
    { href: "/admin/stay/rides", label: "配車管理", description: "配車予約、見積金額、割引率の管理", value: "予約・料金", icon: Car },
    { href: "/admin/stay/bookings", label: "予約管理", description: "宿泊予約の確認・承認・進行管理", value: `${bookings.count ?? 0}件`, icon: ClipboardList },
    { href: "/admin/stay/calendar", label: "宿泊カレンダー", description: "予約とブロック日の月間確認", value: "月表示", icon: CalendarDays },
    { href: "/admin/stay/listings", label: "リスティング管理", description: "客室・全館の料金と公開設定", value: `${listings.count ?? 0}件`, icon: BedDouble },
    { href: "/admin/stay/customers", label: "宿泊顧客", description: "宿泊者プロフィールと利用履歴", value: `${customers.count ?? 0}名`, icon: Users },
    { href: "/admin/stay/messages", label: "メッセージ", description: "予約別のお客様メッセージ対応", value: `${messages.count ?? 0}件`, icon: MessageSquare },
    { href: "/admin/stay/pricing", label: "料金ルール", description: "曜日・期間・特定日の料金設定", value: `${pricingRules.count ?? 0}件`, icon: Tags },
    { href: "/admin/stay/blocked-dates", label: "ブロック日", description: "Airbnb予約・清掃・利用停止日", value: `${blockedDates.count ?? 0}件`, icon: CalendarOff },
    { href: "/admin/stay/settings", label: "宿泊設定", description: "予約受付・支払い・共通案内", value: "受付・案内", icon: Settings },
  ];
  return <>
    <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Stay Management</p>
    <h1 className="mt-2 text-3xl font-bold">宿泊管理</h1>
    <p className="mt-3 text-sm leading-6 text-slate-500">宿泊予約、客室、料金、顧客対応を一元管理します。</p>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {links.map(({ href, label, description, value, icon: Icon }) => <Link href={href} key={href}>
        <Card className="h-full transition hover:border-emerald-300 hover:shadow-md">
          <CardContent className="flex h-full items-start justify-between gap-4 p-6">
            <div><h2 className="font-bold">{label}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><p className="mt-4 text-sm font-bold text-emerald-600">{value}</p></div>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Icon size={20} /></span>
          </CardContent>
        </Card>
      </Link>)}
    </div>
  </>;
}
