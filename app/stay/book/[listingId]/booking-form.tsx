"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { yen } from "@/lib/stay/presentation";
import { StayLocalized } from "../../stay-language";
import { recalculateStayPrice, requestBooking, type BookingQuote, type BookingState } from "./actions";

const initial: BookingState = { success: false, message: "" };

type BookingFormProps = {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  maxGuests?: number;
  name: string;
  email: string;
  phone: string;
  initialQuote?: BookingQuote | null;
};

export function BookingForm({ listingId, checkIn, checkOut, guests, maxGuests = 100, name, email, phone, initialQuote = null }: BookingFormProps) {
  const [state, action, pending] = useActionState(requestBooking, initial);
  const [guestCount, setGuestCount] = useState(guests);
  const [quote, setQuote] = useState(initialQuote);
  const [quoteError, setQuoteError] = useState("");
  const [isRecalculating, startRecalculation] = useTransition();
  const requestSequence = useRef(0);

  useEffect(() => {
    if (!checkIn || !checkOut || guestCount < 1 || guestCount > maxGuests) return;
    const sequence = ++requestSequence.current;
    const timer = window.setTimeout(() => {
      startRecalculation(async () => {
        try {
          const nextQuote = await recalculateStayPrice(listingId, checkIn, checkOut, guestCount);
          if (sequence === requestSequence.current) {
            setQuote(nextQuote);
            setQuoteError("");
          }
        } catch {
          if (sequence === requestSequence.current) setQuoteError("料金を再計算できませんでした。");
        }
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [checkIn, checkOut, guestCount, listingId, maxGuests]);

  return <StayLocalized>
    {quote && <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-5" aria-live="polite" aria-busy={isRecalculating}>
      <p>{quote.nights}泊・{guestCount}名</p>
      <p className="mt-1 text-2xl font-bold">合計 {yen(quote.totalAmount)}</p>
      <p className="mt-1 text-sm text-slate-600">宿泊料金 {yen(quote.subtotal)}＋追加人数 {yen(quote.additionalGuestFee)}－割引 {yen(quote.discountAmount)}＋清掃費 {yen(quote.cleaningFee)}</p>
      {quote.lengthDiscountRate > 0 && <p className="mt-2 font-bold text-emerald-700">{quote.lengthDiscountLabel} {quote.lengthDiscountRate}%OFF 適用</p>}
      <p className="mt-1 text-xs text-slate-500">清掃料金は割引対象外です。</p>
      {isRecalculating && <p className="mt-2 text-sm font-bold text-emerald-700">料金を再計算中…</p>}
      {quoteError && <p role="alert" className="mt-2 text-sm text-red-600">{quoteError}</p>}
    </div>}
    <form action={action} className="mt-6 grid gap-4 rounded-2xl bg-white p-6 shadow-sm">
      <input type="hidden" name="listingId" value={listingId}/>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium">チェックイン<Input name="checkIn" type="date" defaultValue={checkIn} required/></label>
        <label className="text-sm font-medium">チェックアウト<Input name="checkOut" type="date" defaultValue={checkOut} required/></label>
        <label className="text-sm font-medium">宿泊人数<Input name="guests" type="number" min="1" max={maxGuests} value={guestCount || ""} onChange={(event) => setGuestCount(Number(event.target.value))} required/></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">氏名<Input name="name" defaultValue={name} maxLength={100} required/></label>
        <label className="text-sm font-medium">メールアドレス<Input name="email" type="email" defaultValue={email} required/></label>
        <label className="text-sm font-medium">電話番号<Input name="phone" type="tel" defaultValue={phone} required/></label>
        <label className="text-sm font-medium">到着予定時刻<Input name="arrivalTime" type="time" defaultValue="15:00" required/></label>
      </div>
      <label className="text-sm font-medium">宿泊目的（任意）<Input name="purpose" maxLength={500}/></label>
      <label className="text-sm font-medium">備考・追加要望（任意）<textarea name="note" maxLength={2000} className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 p-3"/></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="airbnb"/>以前宿泊したことがあります。</label>
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">支払い方法は、管理者が予約内容を確認した後にご案内します。</p>
      {state.message && <p role="alert" className="text-sm text-red-600">{state.message}</p>}
      <Button size="lg" disabled={pending || isRecalculating || Boolean(quoteError)}>{pending ? "送信中…" : "予約をリクエストする"}</Button>
    </form>
  </StayLocalized>;
}
