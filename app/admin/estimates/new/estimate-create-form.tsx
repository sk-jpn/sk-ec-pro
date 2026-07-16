"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createManualEstimate, type CreateEstimateState } from "./actions";

type CustomerOption = { id: string; name: string; email: string };
const initialState: CreateEstimateState = { success: false, message: "" };
const fieldClass = "grid gap-2 text-sm font-medium text-slate-700";
const inputClass = "h-10 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60";

export function EstimateCreateForm({ customers }: { customers: CustomerOption[] }) {
  const [state, action, pending] = useActionState(createManualEstimate, initialState);
  return <form action={action} className="grid gap-6">
    <label className={fieldClass}>顧客
      <select name="customerId" required defaultValue="" disabled={pending} className={inputClass}>
        <option value="" disabled>顧客を選択してください</option>
        {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}（{customer.email}）</option>)}
      </select>
    </label>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className={`${fieldClass} sm:col-span-2`}>商品名<Input name="productName" maxLength={300} disabled={pending} /></label>
      <label className={`${fieldClass} sm:col-span-2`}>商品URL<Input name="url" type="url" maxLength={2_000} disabled={pending} /></label>
      <label className={fieldClass}>数量<Input name="quantity" type="number" min={1} max={9_999_999_999} defaultValue={1} required disabled={pending} /></label>
      <label className={fieldClass}>色<Input name="color" maxLength={200} disabled={pending} /></label>
      <label className={fieldClass}>サイズ<Input name="size" maxLength={200} disabled={pending} /></label>
      <label className={fieldClass}>型番<Input name="model" maxLength={200} disabled={pending} /></label>
      <label className={`${fieldClass} sm:col-span-2`}>その他・希望内容<textarea name="request" maxLength={2_000} rows={5} disabled={pending} className={`${inputClass} h-auto py-2`} /></label>
    </div>
    <p className="text-xs leading-6 text-slate-400">登録すると「見積作成中」で保存されます。商品画像や見積金額は登録後の編集画面で追加できます。</p>
    {state.message && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>}
    <Button type="submit" disabled={pending} className="w-fit"><Save size={16} />{pending ? "保存中…" : "一時保存"}</Button>
  </form>;
}
