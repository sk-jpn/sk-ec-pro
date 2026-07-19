"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { yen } from "@/lib/stay/presentation";

type AmountKey = "subtotal" | "additionalGuestFee" | "cleaningFee" | "discount" | "totalAmount" | "cardFeeRate";

export function PricingEditor({ subtotal, additionalGuestFee, cleaningFee, discount, totalAmount, cardFeeRate, editable }: { subtotal: number; additionalGuestFee: number; cleaningFee: number; discount: number; totalAmount: number; cardFeeRate: number; editable: boolean }) {
  const [amounts, setAmounts] = useState<Record<AmountKey, number>>({ subtotal, additionalGuestFee, cleaningFee, discount, totalAmount, cardFeeRate });
  const update = (key: AmountKey, value: string) => setAmounts((current) => ({ ...current, [key]: Math.max(0, key === "cardFeeRate" ? Number(value) || 0 : Math.round(Number(value) || 0)) }));
  const calculate = () => setAmounts((current) => ({ ...current, totalAmount: Math.max(0, current.subtotal + current.additionalGuestFee + current.cleaningFee - current.discount) }));
  return <fieldset className="rounded-xl border border-slate-200 bg-slate-50/60 p-4" disabled={!editable}>
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><legend className="font-bold">支払い内訳</legend><p className="mt-1 text-xs text-slate-500">{editable ? "未払いのため編集できます。" : "支払い処理開始後は編集できません。"}</p></div>{editable && <Button type="button" variant="outline" onClick={calculate}>計算</Button>}</div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-medium">宿泊料金<Input name="subtotal" type="number" min="0" value={amounts.subtotal} onChange={(event) => update("subtotal", event.target.value)} /></label>
      <label className="text-sm font-medium">追加人数料金<Input name="additionalGuestFee" type="number" min="0" value={amounts.additionalGuestFee} onChange={(event) => update("additionalGuestFee", event.target.value)} /></label>
      <label className="text-sm font-medium">清掃費<Input name="cleaningFee" type="number" min="0" value={amounts.cleaningFee} onChange={(event) => update("cleaningFee", event.target.value)} /></label>
      <label className="text-sm font-medium">割引額<Input name="discount" type="number" min="0" value={amounts.discount} onChange={(event) => update("discount", event.target.value)} /></label>
    </div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold">合計金額<Input name="totalAmount" type="number" min="0" value={amounts.totalAmount} onChange={(event) => update("totalAmount", event.target.value)} className="mt-1 text-lg font-bold" /></label><label className="block text-sm font-bold">カード手数料率（%）<Input name="cardFeeRate" type="number" min="0" max="100" step="0.01" value={amounts.cardFeeRate} onChange={(event) => update("cardFeeRate", event.target.value)} className="mt-1" /></label></div>
    <div className="mt-3 text-right"><p className="text-xl font-bold text-emerald-700">銀行振込合計 {yen(amounts.totalAmount)}</p><p className="mt-1 text-sm font-bold text-blue-700">カード手数料 {yen(Math.round(amounts.totalAmount*amounts.cardFeeRate/100))}・カード決済合計 {yen(amounts.totalAmount+Math.round(amounts.totalAmount*amounts.cardFeeRate/100))}</p></div>
  </fieldset>;
}
