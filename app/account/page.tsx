import Link from "next/link";
import { BedDouble, CircleDollarSign, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { date } from "@/lib/account/presentation";

export default async function AccountHomePage() {
  const { user, supabase } = await requireCustomerUser();
  const [{ data: profile }, { data: estimates }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, created_at").eq("id", user.id).single(),
    supabase.from("estimates").select("id, status, customers!inner(auth_user_id)").eq("customers.auth_user_id", user.id),
  ]);
  const active = (estimates ?? []).filter((estimate) => !["完了", "キャンセル"].includes(estimate.status)).length;
  const cards = [
    { label: "見積件数", value: estimates?.length ?? 0, icon: ClipboardList, color: "text-blue-600 bg-blue-50" },
    { label: "進行中件数", value: active, icon: CircleDollarSign, color: "text-amber-600 bg-amber-50" },
  ];
  return <>
    <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">My Account</p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight">{profile?.full_name || "お客様"} 様</h1>
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm sm:flex sm:gap-10"><p><span className="text-slate-400">メールアドレス</span><br /><span className="mt-1 inline-block font-medium">{profile?.email ?? user.email}</span></p><p className="mt-4 sm:mt-0"><span className="text-slate-400">登録日</span><br /><span className="mt-1 inline-block font-medium">{date(profile?.created_at ?? user.created_at)}</span></p></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-2">{cards.map(({ label, value, icon: Icon, color }) => <Card key={label}><CardContent className="flex items-center justify-between p-6"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}<span className="ml-1 text-sm font-medium text-slate-400">件</span></p></div><span className={`grid size-12 place-items-center rounded-2xl ${color}`}><Icon size={22} /></span></CardContent></Card>)}</div>
    <h2 className="mt-9 text-lg font-bold">利用するサービス</h2><div className="mt-3 grid gap-4 sm:grid-cols-2"><Link href="/account/estimates"><Card className="h-full hover:border-blue-300"><CardContent className="flex items-center gap-4 p-5"><ClipboardList className="text-blue-600"/><div><b>中国EC購入代行</b><p className="text-sm text-slate-500">見積・注文・配送を確認</p></div></CardContent></Card></Link><Link href="/stay/mypage"><Card className="h-full hover:border-emerald-300"><CardContent className="flex items-center gap-4 p-5"><BedDouble className="text-emerald-600"/><div><b>宿泊予約</b><p className="text-sm text-slate-500">予約・メッセージを確認</p></div></CardContent></Card></Link></div>
  </>;
}
