"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCustomer, type UpdateCustomerState } from "./actions";

const initialState: UpdateCustomerState = { success: false, message: "" };
const labelClass = "grid gap-2 text-sm font-medium text-slate-700";

type CustomerEditValues = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  addressLine1: string;
  addressLine2: string;
  depositBalance: number;
};

export function CustomerEditForm({ customer }: { customer: CustomerEditValues }) {
  const [state, action, pending] = useActionState(updateCustomer, initialState);

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="customerId" value={customer.id} />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          氏名
          <Input name="name" defaultValue={customer.name} maxLength={100} required disabled={pending} />
        </label>
        <label className={labelClass}>
          会社名
          <Input name="company" defaultValue={customer.company} maxLength={200} disabled={pending} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          連絡用メールアドレス
          <Input name="email" type="email" defaultValue={customer.email} maxLength={254} required disabled={pending} />
          <span className="text-xs font-normal leading-5 text-slate-400">Googleログインの認証メールアドレスは変更されません。</span>
        </label>
        <label className={labelClass}>
          電話番号
          <Input name="phone" type="tel" defaultValue={customer.phone} maxLength={30} required disabled={pending} />
        </label>
        <label className={labelClass}>
          郵便番号
          <Input name="postalCode" defaultValue={customer.postalCode} maxLength={12} required disabled={pending} />
        </label>
        <label className={labelClass}>
          都道府県
          <Input name="prefecture" defaultValue={customer.prefecture} maxLength={20} required disabled={pending} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          お届け先住所
          <Input name="addressLine1" defaultValue={customer.addressLine1} maxLength={200} required disabled={pending} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          建物名・部屋番号
          <Input name="addressLine2" defaultValue={customer.addressLine2} maxLength={200} disabled={pending} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          デポジット残高
          <Input name="depositBalance" type="number" min={0} max={9_999_999_999} defaultValue={customer.depositBalance || ""} className="no-number-spinner sm:max-w-xs" disabled={pending} />
          <span className="text-xs font-normal leading-5 text-slate-400">多めに入金された金額の残高を記録します。</span>
        </label>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
        <Button type="submit" disabled={pending} className="sm:w-fit">
          <Save size={16} />
          {pending ? "保存中…" : "顧客情報を保存"}
        </Button>
        {state.message && <p aria-live="polite" className={`text-sm ${state.success ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
