import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { STAY_STATUSES } from "@/lib/stay/presentation";

const BLOCKING_STATUSES = ["pending_admin_review", "awaiting_guest_confirmation", "confirmed", "payment_pending", "paid", "checked_in"];
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function adjacentMonth(month: string, offset: number) {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, value - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function StayCalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; listingId?: string }> }) {
  const query = await searchParams;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const currentMonth = today.slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(query.month ?? "") ? query.month! : currentMonth;
  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = `${adjacentMonth(month, 1)}-01`;
  const admin = createSupabaseAdminClient();
  const { data: listings } = await admin.from("stay_listings").select("id,code,name,is_active,booking_enabled").order("sort_order");
  const selected = listings?.find((listing) => listing.id === query.listingId) ?? listings?.[0] ?? null;
  const selectedId = selected?.id;
  const [{ data: bookings }, { data: blocks }] = selectedId ? await Promise.all([
    admin.from("stay_bookings").select("id,booking_number,check_in_date,check_out_date,status").eq("listing_id", selectedId).lt("check_in_date", end).gt("check_out_date", start).in("status", BLOCKING_STATUSES),
    admin.from("stay_blocked_dates").select("id,start_date,end_date,reason,calendar_feed_id").eq("listing_id", selectedId).lt("start_date", end).gt("end_date", start),
  ]) : [{ data: [] }, { data: [] }];

  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const leadingDays = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const calendarDays = Array.from({ length: totalCells }, (_, index) => {
    const day = index - leadingDays + 1;
    if (day < 1 || day > daysInMonth) return null;
    const date = isoDate(year, monthNumber, day);
    const dayBookings = (bookings ?? []).filter((booking) => booking.check_in_date <= date && booking.check_out_date > date);
    const dayBlocks = (blocks ?? []).filter((block) => block.start_date <= date && block.end_date > date);
    const past = date < today;
    const listingClosed = !selected?.is_active || !selected?.booking_enabled;
    return { day, date, dayBookings, dayBlocks, available: !past && !listingClosed && dayBookings.length === 0 && dayBlocks.length === 0, past, listingClosed };
  });
  const queryFor = (targetMonth: string) => `/admin/stay/calendar?month=${targetMonth}${selectedId ? `&listingId=${selectedId}` : ""}`;

  return <>
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Availability Calendar</p><h1 className="mt-2 text-3xl font-bold">宿泊カレンダー</h1><p className="mt-2 text-sm text-slate-500">リスティングごとの予約可否を月間表示します。</p></div>
      <form className="flex flex-col gap-2 sm:flex-row"><input type="hidden" name="month" value={month} /><select name="listingId" defaultValue={selectedId} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" aria-label="リスティング">{listings?.map((listing) => <option value={listing.id} key={listing.id}>{listing.code}・{listing.name}</option>)}</select><button className="min-h-10 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white">表示</button></form>
    </div>
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="mb-5 flex items-center justify-between"><Link href={queryFor(adjacentMonth(month, -1))} className="grid size-10 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50" aria-label="前月"><ChevronLeft size={19} /></Link><div className="text-center"><p className="text-xl font-bold">{year}年{monthNumber}月</p><p className="mt-1 text-sm font-medium text-slate-500">{selected ? `${selected.code}・${selected.name}` : "リスティング未登録"}</p></div><Link href={queryFor(adjacentMonth(month, 1))} className="grid size-10 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50" aria-label="翌月"><ChevronRight size={19} /></Link></div>
      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-slate-200">
        {WEEKDAYS.map((weekday, index) => <div key={weekday} className={`border-b border-slate-200 bg-slate-50 py-2 text-center text-xs font-bold ${index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-slate-500"}`}>{weekday}</div>)}
        {calendarDays.map((entry, index) => entry ? <div key={entry.date} className={`min-h-28 border-b border-r border-slate-100 p-2 sm:min-h-36 sm:p-3 ${entry.available ? "bg-emerald-50/40" : entry.past ? "bg-slate-50 text-slate-400" : "bg-red-50/40"}`}>
          <div className="flex items-start justify-between"><span className={`text-sm font-bold ${entry.date === today ? "grid size-7 place-items-center rounded-full bg-emerald-600 text-white" : ""}`}>{entry.day}</span><span className={`grid size-8 place-items-center rounded-full text-lg font-black ${entry.available ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`} title={entry.available ? "予約可能" : "予約不可"}>{entry.available ? "○" : "×"}</span></div>
          <div className="mt-2 space-y-1 text-[10px] leading-4 sm:text-xs">{entry.past && <p className="text-slate-400">過去の日付</p>}{entry.listingClosed && !entry.past && <p className="font-medium text-red-600">予約受付停止</p>}{entry.dayBookings.map((booking) => <Link key={booking.id} href={`/admin/stay/bookings/${booking.id}`} className="block truncate rounded bg-red-100 px-1.5 py-1 font-medium text-red-700 hover:bg-red-200">{booking.booking_number}<span className="hidden sm:inline">・{STAY_STATUSES[booking.status]}</span></Link>)}{entry.dayBlocks.map((block) => <p key={block.id} className="truncate rounded bg-slate-200 px-1.5 py-1 font-medium text-slate-700" title={block.reason}>{block.calendar_feed_id ? "Airbnb" : block.reason}</p>)}</div>
        </div> : <div key={`empty-${index}`} className="min-h-28 border-b border-r border-slate-100 bg-slate-50/60 sm:min-h-36" />)}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-600"><span className="flex items-center gap-2"><b className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">○</b>予約可能</span><span className="flex items-center gap-2"><b className="grid size-6 place-items-center rounded-full bg-red-100 text-red-600">×</b>予約不可</span><span>チェックアウト日は宿泊日に含めません。</span></div>
    </div>
  </>;
}
