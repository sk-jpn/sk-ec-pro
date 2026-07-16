import { Card, CardContent } from "@/components/ui/card";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { DeleteAccountForm } from "./delete-account-form";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const { user, supabase } = await requireCustomerUser();
  const { data, error } = await supabase.from("profiles").select("full_name, email, phone, postal_code, prefecture, address_line1, address_line2").eq("id", user.id).single();
  if (error) throw new Error(`プロフィールを取得できませんでした: ${error.message}`);
  return <><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Profile</p><h1 className="mt-2 text-3xl font-bold">プロフィール</h1><p className="mt-3 text-sm text-slate-500">氏名・連絡先・住所を編集できます。</p><Card className="mt-7 max-w-3xl"><CardContent className="p-6 sm:p-8"><ProfileForm profile={data} /></CardContent></Card><section className="mt-10 max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-red-600">ACCOUNT DELETE</p><h2 className="mt-2 text-xl font-bold text-red-950">アカウントを削除</h2><p className="mt-3 text-sm font-semibold leading-7 text-red-800">アカウントを削除すると、該当する顧客情報、すべての見積・注文・発送情報を完全に削除します。削除したデータは回復できません。</p><DeleteAccountForm /></section></>;
}
