"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { yen } from "@/lib/stay/presentation";

type Listing = { id: string; code: string; name: string; max_guests: number; base_price: number; cleaning_fee: number };
const buildings = [
  { name: "F322", rooms: ["F101", "F102", "F301", "F302", "F322"] },
  { name: "F321", rooms: ["F201", "F202", "F203", "F205"] },
  { name: "F443", rooms: ["F101", "F102", "F103", "F302"] },
];

export function StaySearchFlow({ listings, buildingImages }: { listings: Listing[]; buildingImages: Record<string, string> }) {
  const [selectedId, setSelectedId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
  const selected = listings.find((listing) => listing.id === selectedId);
  const grouped = useMemo(() => buildings.map((building) => ({ ...building, listings: building.rooms.map((code) => listings.find((listing) => listing.code === code)).filter((listing): listing is Listing => Boolean(listing)) })), [listings]);
  const validDates = Boolean(selected && checkIn && checkOut && checkOut > checkIn);

  function chooseRoom(id: string) { setSelectedId(id); setCheckIn(""); setCheckOut(""); }

  return <>
    <section className="mt-7"><h2 className="text-lg font-bold">1. 建物・部屋を選択</h2><div className="mt-4 grid gap-5 lg:grid-cols-3">{grouped.map((building) => <div key={building.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{buildingImages[building.name] && <div className="aspect-[16/8] bg-cover bg-center" style={{ backgroundImage: `url(${buildingImages[building.name]})` }} />}<div className="p-5"><div className="flex items-center gap-2"><Building2 className="size-5 text-emerald-600" /><h3 className="text-xl font-bold">{building.name}</h3></div><div className="mt-4 grid grid-cols-2 gap-2">{building.listings.map((listing) => <button type="button" key={`${building.name}-${listing.id}`} onClick={() => chooseRoom(listing.id)} className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition ${selectedId === listing.id ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100" : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"}`}>{listing.code === "F322" ? "F322全館" : listing.code}</button>)}</div>{building.listings.length === 0 && <p className="mt-4 text-sm text-slate-400">登録された部屋がありません。</p>}</div></div>)}</div></section>
    {selected && <section className="mt-7 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><CalendarDays className="size-5 text-emerald-600" /><h2 className="text-lg font-bold">2. カレンダーで宿泊日を選択</h2></div><p className="mt-2 text-sm text-slate-500">{selected.name}（最大{selected.max_guests}名・基本 {yen(selected.base_price)}/泊・清掃費 {yen(selected.cleaning_fee)}）</p><div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="text-sm font-medium">チェックイン<Input type="date" value={checkIn} min={today} onChange={(event) => { setCheckIn(event.target.value); if (checkOut && checkOut <= event.target.value) setCheckOut(""); }} /></label><label className="text-sm font-medium">チェックアウト<Input type="date" value={checkOut} min={checkIn || today} onChange={(event) => setCheckOut(event.target.value)} /></label><label className="text-sm font-medium">宿泊人数<Input type="number" min={1} max={selected.max_guests} value={guests} onChange={(event) => setGuests(Math.max(1, Math.min(selected.max_guests, Number(event.target.value) || 1)))} /></label></div>{checkIn && checkOut && checkOut <= checkIn && <p className="mt-3 text-sm text-red-600">チェックアウトはチェックイン翌日以降を選択してください。</p>}<Button asChild size="lg" className={`mt-5 w-full sm:w-auto ${!validDates ? "pointer-events-none opacity-50" : ""}`} aria-disabled={!validDates}><Link href={validDates ? `/stay/book/${selected.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}` : "#"}>この日程で予約リクエストへ</Link></Button></section>}
  </>;
}
