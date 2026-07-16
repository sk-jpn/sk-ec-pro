import { Card, CardContent } from "@/components/ui/card";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { DeleteAccountForm } from "./delete-account-form";

export default async function ProfilePage() {
  const { user, supabase } = await requireCustomerUser();
  const { data, error } = await supabase.from("profiles").select("full_name, email, phone, postal_code, prefecture, address_line1, address_line2").eq("id", user.id).single();
  if (error) throw new Error(`プロフィールを取得できませんでした: ${error.message}`);
  const address = [data.postal_code && `〒${data.postal_code}`, data.prefecture, data.address_line1, data.address_line2].filter(Boolean).join(" ");
  const rows = [["氏名", data.full_name || "未登録"], ["メール", data.email], ["電話番号", data.phone || "未登録"], ["住所", address || "未登録"]];
  return <><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Profile</p><h1 className="mt-2 text-3xl font-bold">プロフィール</h1><p className="mt-3 text-sm text-slate-500">登録されているお客様情報です。</p><Card className="mt-7 max-w-3xl"><CardContent className="divide-y divide-slate-100 p-6 sm:p-8">{rows.map(([label, value]) => <dl key={label} className="grid gap-2 py-5 first:pt-0 last:pb-0 sm:grid-cols-[10rem_1fr]"><dt className="text-sm font-medium text-slate-400">{label}</dt><dd className="whitespace-pre-wrap text-sm font-semibold leading-7">{value}</dd></dl>)}</CardContent></Card><section className="mt-10 max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-red-600">ACCOUNT DELETE</p><h2 className="mt-2 text-xl font-bold text-red-950">アカウントを削除</h2><p className="mt-3 text-sm font-semibold leading-7 text-red-800">アカウントを削除すると、該当する顧客情報、すべての見積・注文・発送情報を完全に削除します。削除したデータは回復できません。</p><DeleteAccountForm /></section></>;
}
