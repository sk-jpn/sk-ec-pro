"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ESTIMATE_STATUSES, estimateStatusLabel, type EstimateStatus } from "../statuses";
import { updateEstimate, type UpdateEstimateState } from "./actions";

const initialState: UpdateEstimateState = { success: false, message: "" };

export function EstimateManagementForm({
  estimateId,
  status,
  memo,
  updatedAt,
}: {
  estimateId: string;
  status: EstimateStatus;
  memo: string;
  updatedAt: string;
}) {
  const [state, formAction, pending] = useActionState(updateEstimate, initialState);
  const updatedLabel = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "long",
    timeStyle: "medium",
    timeZone: "Asia/Tokyo",
  }).format(new Date(updatedAt));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>案件ステータス</CardTitle>
        <p className="text-xs text-slate-400">更新: {updatedLabel}</p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          <input type="hidden" name="estimateId" value={estimateId} />
          <label className="grid gap-2 text-sm font-medium text-slate-700 sm:max-w-sm">
            ステータス
            <select
              name="status"
              defaultValue={status}
              disabled={pending}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            >
              {ESTIMATE_STATUSES.map((option) => <option key={option} value={option}>{estimateStatusLabel(option)}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            管理メモ
            <textarea
              name="memo"
              defaultValue={memo}
              maxLength={5_000}
              rows={6}
              disabled={pending}
              placeholder="対応状況や社内共有事項を入力してください"
              className="min-h-32 resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" disabled={pending} className="sm:w-fit">
              <Save size={16} />{pending ? "保存中…" : "保存する"}
            </Button>
            {state.message && <p aria-live="polite" className={`text-sm ${state.success ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
