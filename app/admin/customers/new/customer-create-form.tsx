"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCustomer, type CreateCustomerState } from "./actions";

const initialState: CreateCustomerState = { success: false, message: "" };
const fieldClass = "grid gap-2 text-sm font-medium text-slate-700";

export function CustomerCreateForm() {
  const [state, action, pending] = useActionState(createCustomer, initialState);
  return <form action={action} className="grid gap-5">
    <div className="grid gap-5 sm:grid-cols-2">
      <label className={fieldClass}>氏名<Input name="name" required maxLength={100} disabled={pending} /></label>
      <label className={fieldClass}>会社名<Input name="company" maxLength={200} disabled={pending} /></label>
      <label className={`${fieldClass} sm:col-span-2`}>連絡用メールアドレス<Input name="email" type="email" required maxLength={254} disabled={pending} /><span className="text-xs font-normal text-slate-400">Googleログイン時は、このメールアドレスと完全一致するGoogleアカウントを使用します。</span></label>
      <label className={fieldClass}>電話番号<Input name="phone" type="tel" maxLength={30} disabled={pending} /></label>
      <label className={fieldClass}>郵便番号<Input name="postalCode" maxLength={12} disabled={pending} /></label>
      <label className={fieldClass}>都道府県<Input name="prefecture" maxLength={20} disabled={pending} /></label>
      <label className={`${fieldClass} sm:col-span-2`}>お届け先住所<Input name="addressLine1" maxLength={200} disabled={pending} /></label>
      <label className={`${fieldClass} sm:col-span-2`}>建物名・部屋番号<Input name="addressLine2" maxLength={200} disabled={pending} /></label>
      <label className={`${fieldClass} sm:col-span-2`}>デポジット残高<Input name="depositBalance" type="number" min={0} max={9_999_999_999} className="no-number-spinner sm:max-w-xs" disabled={pending} /><span className="text-xs font-normal text-slate-400">既に預かっている残高がある場合のみ入力してください。</span></label>
    </div>
    {state.message && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>}
    <Button type="submit" disabled={pending} className="w-fit"><UserPlus size={16} />{pending ? "登録中…" : "顧客を登録"}</Button>
  </form>;
}
