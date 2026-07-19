"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createManualStayBooking, type ManualBookingState } from "./actions";

type CalendarDay = null | { day: number; date: string; available: boolean; past: boolean; listingClosed: boolean; bookings: { id: string; number: string; status: string }[]; blocks: { id: string; label: string; reason: string; isAirbnb: boolean }[] };
type Customer = { id: string; name: string; email: string; phone: string };
const initialState: ManualBookingState = { success: false, message: "" };
const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

function addDay(date: string) { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + 1); return value.toISOString().slice(0, 10); }

export function AvailabilityCalendar({ days, today, listingId, maxGuests, customers }: { days: CalendarDay[]; today: string; listingId: string; maxGuests: number; customers: Customer[] }) {
  const [start, setStart] = useState("");
  const [lastNight, setLastNight] = useState("");
  const [state, action, pending] = useActionState(createManualStayBooking, initialState);
  const availableDates = useMemo(() => new Set(days.filter((day) => day?.available).map((day) => day!.date)), [days]);
  const selectedDates = useMemo(() => { const result = new Set<string>(); if (!start) return result; let cursor = start; const end = lastNight || start; while (cursor <= end) { result.add(cursor); cursor = addDay(cursor); } return result; }, [start, lastNight]);

  function selectDate(date: string) {
    if (!availableDates.has(date)) return;
    if (!start || lastNight || date < start) { setStart(date); setLastNight(""); return; }
    let cursor = start;
    while (cursor <= date) { if (!availableDates.has(cursor)) return; cursor = addDay(cursor); }
    setLastNight(date);
  }
  const checkOut = start ? addDay(lastNight || start) : "";

  return <>
    <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-slate-200">
      {weekdays.map((weekday, index) => <div key={weekday} className={`border-b border-slate-200 bg-slate-50 py-2 text-center text-xs font-bold ${index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-slate-500"}`}>{weekday}</div>)}
      {days.map((entry, index) => entry ? <button type="button" key={entry.date} onClick={() => selectDate(entry.date)} disabled={!entry.available} className={`min-h-28 border-b border-r border-slate-100 p-2 text-left sm:min-h-36 sm:p-3 ${selectedDates.has(entry.date) ? "bg-blue-100 ring-2 ring-inset ring-blue-500" : entry.available ? "bg-emerald-50/40 hover:bg-emerald-100/70" : entry.past ? "bg-slate-50 text-slate-400" : "bg-red-50/40"}`}>
        <div className="flex items-start justify-between"><span className={`text-sm font-bold ${entry.date === today ? "grid size-7 place-items-center rounded-full bg-emerald-600 text-white" : ""}`}>{entry.day}</span><span className={`grid size-8 place-items-center rounded-full text-lg font-black ${entry.available ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{entry.available ? "○" : "×"}</span></div>
        <div className="mt-2 space-y-1 text-[10px] leading-4 sm:text-xs">{selectedDates.has(entry.date) && <p className="rounded bg-blue-600 px-1.5 py-1 font-bold text-white">選択中</p>}{entry.past && <p>過去の日付</p>}{entry.listingClosed && !entry.past && <p className="font-medium text-red-600">予約受付停止</p>}{entry.bookings.map((booking) => <span key={booking.id} className="block truncate rounded bg-red-100 px-1.5 py-1 font-medium text-red-700">{booking.number}<span className="hidden sm:inline">・{booking.status}</span></span>)}{entry.blocks.map((block) => <p key={block.id} className={`truncate rounded px-1.5 py-1 font-medium ${block.isAirbnb ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"}`} title={block.reason}>{block.label}{block.isAirbnb && <span className="hidden sm:inline">・選択可</span>}</p>)}</div>
      </button> : <div key={`empty-${index}`} className="min-h-28 border-b border-r border-slate-100 bg-slate-50/60 sm:min-h-36" />)}
    </div>
    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-bold">オフライン予約を作成</h2><p className="mt-1 text-sm text-slate-600">予約可能な宿泊日を1日、または開始日と最終宿泊日の順に選択してください。</p></div>{start && <Button type="button" variant="outline" onClick={() => { setStart(""); setLastNight(""); }}>選択解除</Button>}</div>
      <form action={action} className="mt-4 grid gap-3 lg:grid-cols-[1fr_9rem_1fr_auto]"><input type="hidden" name="listingId" value={listingId} /><input type="hidden" name="checkIn" value={start} /><input type="hidden" name="checkOut" value={checkOut} /><select name="customerId" required defaultValue="" className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="" disabled>顧客名を選択</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}（{customer.email}）</option>)}</select><Input name="guestCount" type="number" min={1} max={maxGuests} defaultValue={1} required aria-label="宿泊人数" /><Input name="reason" placeholder="予約理由（電話予約、現地受付など）" maxLength={500} required /><Button disabled={!start || pending}>{pending ? "作成中…" : "新規予約"}</Button></form>
      {start && <p className="mt-3 text-sm font-bold text-blue-700">選択期間：{start}〜{checkOut}（{selectedDates.size}泊）</p>}{state.message && <p role="status" className={`mt-3 text-sm font-medium ${state.success ? "text-emerald-700" : "text-red-600"}`}>{state.message}{state.bookingId && <> <Link href={`/admin/stay/bookings/${state.bookingId}`} className="underline">予約詳細を見る</Link></>}</p>}
    </div>
    <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-600"><span className="flex items-center gap-2"><b className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">○</b>予約可能・日付選択可能</span><span className="flex items-center gap-2"><b className="grid size-6 place-items-center rounded-full bg-red-100 text-red-600">×</b>予約不可</span><span className="rounded bg-blue-100 px-2 py-1 text-blue-700">Airbnb予約は管理者のみ選択可能</span><span>チェックアウト日は宿泊日に含めません。</span></div>
  </>;
}
