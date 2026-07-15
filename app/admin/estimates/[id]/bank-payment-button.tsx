"use client";

import { useActionState } from "react";
import { BadgeCheck, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { confirmBankPayment, type UpdateQuoteState } from "./actions";

const initialState: UpdateQuoteState = { success: false, message: "" };

export function BankPaymentButton({ estimateId, paidAt }: { estimateId: string; paidAt: string | null }) {
  const [state, formAction, pending] = useActionState(confirmBankPayment, initialState);
  if (paidAt || state.success) {
    return <Card className="border-emerald-200 bg-emerald-50/60"><CardContent className="flex items-center gap-3 py-5 text-sm font-semibold text-emerald-800"><BadgeCheck size={20} className="text-emerald-600" />{state.message || "入金確認済みです。"}</CardContent></Card>;
  }

  return <Card><CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Landmark size={20} className="text-blue-600" /><div><p className="text-sm font-semibold">銀行振込の入金確認</p><p className="mt-1 text-xs text-slate-400">着金を確認してから操作してください。</p></div></div><form action={formAction} className="flex flex-col items-start gap-2 sm:items-end"><input type="hidden" name="estimateId" value={estimateId} /><Button type="submit" disabled={pending}>{pending ? "保存中…" : "入金確認"}</Button>{state.message && !state.success && <p className="text-xs text-red-600">{state.message}</p>}</form></CardContent></Card>;
}
