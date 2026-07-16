import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Clock3, LogOut } from "lucide-react";
import { logoutCustomer } from "@/app/account/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { withBasePath } from "@/config/site";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "連携確認待ち", robots: { index: false, follow: false } };

export default async function AccountLinkPendingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: customer } = await admin.from("customers").select("id").eq("auth_user_id", user.id).limit(1).maybeSingle();
  if (customer) redirect("/account");
  const { data: pending } = await admin.from("pending_customer_links").select("google_email, created_at").eq("auth_user_id", user.id).maybeSingle();

  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12 text-slate-950">
    <div className="w-full max-w-lg">
      <Image src={withBasePath("/brand/sk-ec-pro-logo.png")} width={220} height={82} alt="SK EC Pro" className="mx-auto h-auto w-48" priority />
      <Card className="mt-7 border-amber-200 shadow-xl shadow-slate-200/60">
        <CardContent className="p-7 text-center sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-amber-100 text-amber-700"><Clock3 size={27} /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-amber-700">LINK CONFIRMATION PENDING</p>
          <h1 className="mt-3 text-2xl font-bold">連携確認待ちです</h1>
          <p className="mt-5 text-sm leading-7 text-slate-600">Googleログインは完了しましたが、登録済みの顧客メールアドレスと一致しなかったため、見積データはまだ連携されていません。</p>
          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-4 text-left text-sm"><p className="text-xs text-slate-400">Google認証メール</p><p className="mt-1 break-all font-semibold">{pending?.google_email ?? user.email ?? "確認できません"}</p></div>
          <p className="mt-5 text-sm leading-7 text-slate-500">登録時のメールアドレスとGoogle認証メールアドレスを添えて、管理者へご連絡ください。確認完了まで見積・注文情報にはアクセスできません。</p>
          <form action={logoutCustomer} className="mt-7"><Button type="submit" variant="outline" className="w-full sm:w-auto"><LogOut size={16} />別のGoogleアカウントでログイン</Button></form>
        </CardContent>
      </Card>
    </div>
  </main>;
}
