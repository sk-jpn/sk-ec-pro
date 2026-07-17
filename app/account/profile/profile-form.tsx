"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile, type ProfileState } from "./actions";

const initial: ProfileState = { success: false, message: "" };
type Profile = { full_name: string; email: string; phone: string | null; postal_code: string | null; prefecture: string | null; address_line1: string | null; address_line2: string | null; deposit_balance: number };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  return <form action={action} className="space-y-5">
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Deposit</p>
      <p className="mt-2 text-2xl font-bold text-blue-950">¥{new Intl.NumberFormat("ja-JP").format(profile.deposit_balance)}</p>
      <p className="mt-2 text-xs leading-5 text-blue-700">デポジット残高は管理者が更新します。マイページからは編集できません。</p>
    </div>
    <Field label="氏名" name="fullName" defaultValue={profile.full_name} required />
    <Field label="メールアドレス" name="email" defaultValue={profile.email} type="email" required hint="連絡先メールアドレスです。Googleログインに使用するメールアドレスは変更されません。" />
    <div className="grid gap-5 sm:grid-cols-2"><Field label="電話番号" name="phone" defaultValue={profile.phone ?? ""} type="tel" required /><Field label="郵便番号" name="postalCode" defaultValue={profile.postal_code ?? ""} required /></div>
    <Field label="都道府県" name="prefecture" defaultValue={profile.prefecture ?? ""} required />
    <Field label="お届け先住所" name="addressLine1" defaultValue={profile.address_line1 ?? ""} required />
    <Field label="建物名・部屋番号" name="addressLine2" defaultValue={profile.address_line2 ?? ""} />
    {state.message && <p role="status" className={`rounded-lg px-4 py-3 text-sm ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{state.message}</p>}
    <Button type="submit" size="lg" disabled={pending}>{pending ? "保存中…" : "プロフィールを保存"}</Button>
  </form>;
}

function Field({ label, hint, ...props }: React.ComponentProps<typeof Input> & { label: string; hint?: string }) { return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span><Input {...props} />{hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}</label>; }
