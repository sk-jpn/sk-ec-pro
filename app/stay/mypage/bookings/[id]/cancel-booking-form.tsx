"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { customerBookingAction } from "./actions";

export function CancelBookingForm({ id, compact = false }: { id: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!open) return <Button type="button" variant="destructive" size={compact ? "sm" : "default"} onClick={() => setOpen(true)}>キャンセル</Button>;
  return <form action={customerBookingAction} className="grid min-w-0 w-full gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
    <input type="hidden" name="id" value={id} /><input type="hidden" name="action" value="cancel" />
    <input name="reason" required maxLength={1000} placeholder="キャンセル理由" className="min-h-10 min-w-0 w-full rounded-lg border border-slate-200 px-3 text-sm" />
    <Button type="submit" variant="destructive" size={compact ? "sm" : "default"} className="w-full sm:w-auto">キャンセルする</Button>
    <Button type="button" variant="outline" size={compact ? "sm" : "default"} className="w-full sm:w-auto" onClick={() => setOpen(false)}>戻る</Button>
  </form>;
}
