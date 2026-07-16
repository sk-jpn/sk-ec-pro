"use client";

import { useActionState, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createManualEstimate, type CreateEstimateState } from "./actions";

type CustomerOption = { id: string; name: string; email: string };
const initialState: CreateEstimateState = { success: false, message: "" };
const fieldClass = "grid gap-2 text-sm font-medium text-slate-700";
const inputClass = "h-10 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60";

export function EstimateCreateForm({ customers }: { customers: CustomerOption[] }) {
  const [state, action, pending] = useActionState(createManualEstimate, initialState);
  const [itemKeys, setItemKeys] = useState([0]);
  const addItem = () => setItemKeys((current) => current.length >= 10 ? current : [...current, Math.max(...current) + 1]);
  const removeItem = (key: number) => setItemKeys((current) => current.length === 1 ? current : current.filter((itemKey) => itemKey !== key));
  return <form action={action} className="grid gap-6">
    <input type="hidden" name="itemCount" value={itemKeys.length} />
    <label className={fieldClass}>顧客
      <select name="customerId" required defaultValue="" disabled={pending} className={inputClass}>
        <option value="" disabled>顧客を選択してください</option>
        {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}（{customer.email}）</option>)}
      </select>
    </label>
    <div className="space-y-5">{itemKeys.map((key, index) => <section key={key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="mb-5 flex items-center justify-between"><h2 className="font-semibold">商品 {index + 1}</h2>{itemKeys.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(key)} disabled={pending} className="text-red-600 hover:bg-red-50"><Trash2 size={15} />削除</Button>}</div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={`${fieldClass} sm:col-span-2`}>商品名<Input name={`productName_${index}`} maxLength={300} disabled={pending} /></label>
        <label className={`${fieldClass} sm:col-span-2`}>商品URL<Input name={`url_${index}`} type="url" maxLength={2_000} disabled={pending} /></label>
        <label className={fieldClass}>数量<Input name={`quantity_${index}`} type="number" min={1} max={9_999_999_999} defaultValue={1} required disabled={pending} className="no-number-spinner" /></label>
        <label className={fieldClass}>色<Input name={`color_${index}`} maxLength={200} disabled={pending} /></label>
        <label className={fieldClass}>サイズ<Input name={`size_${index}`} maxLength={200} disabled={pending} /></label>
        <label className={fieldClass}>型番<Input name={`model_${index}`} maxLength={200} disabled={pending} /></label>
        <label className={`${fieldClass} sm:col-span-2`}>その他・希望内容<textarea name={`request_${index}`} maxLength={2_000} rows={4} disabled={pending} className={`${inputClass} h-auto py-2`} /></label>
      </div>
    </section>)}</div>
    <Button type="button" variant="outline" onClick={addItem} disabled={pending || itemKeys.length >= 10} className="w-fit"><Plus size={16} />商品を追加（{itemKeys.length}/10）</Button>
    <p className="text-xs leading-6 text-slate-400">登録すると「見積作成中」で保存されます。商品画像や見積金額は登録後の編集画面で追加できます。</p>
    {state.message && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>}
    <Button type="submit" disabled={pending} className="w-fit"><Save size={16} />{pending ? "保存中…" : "一時保存"}</Button>
  </form>;
}
