import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { STAY_STATUSES } from "@/lib/stay/presentation";
import { AvailabilityCalendar } from "./availability-calendar";

const BLOCKING_STATUSES = ["pending_admin_review", "awaiting_guest_confirmation", "confirmed", "payment_pending", "paid", "checked_in"];

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
  const [{ data: listings }, { data: customers }] = await Promise.all([
    admin.from("stay_listings").select("id,code,name,is_active,booking_enabled,max_guests").order("sort_order"),
    admin.from("stay_customers").select("id,name,email,phone").order("name"),
  ]);
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
      {selectedId && <AvailabilityCalendar days={calendarDays.map((entry) => entry ? { day: entry.day, date: entry.date, available: entry.available, past: entry.past, listingClosed: entry.listingClosed, bookings: entry.dayBookings.map((booking) => ({ id: booking.id, number: booking.booking_number, status: STAY_STATUSES[booking.status] ?? booking.status })), blocks: entry.dayBlocks.map((block) => ({ id: block.id, label: block.calendar_feed_id ? "Airbnb" : block.reason, reason: block.reason })) } : null)} today={today} listingId={selectedId} maxGuests={selected?.max_guests ?? 1} customers={customers ?? []} />}
    </div>
  </>;
}
