import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EstimateCreateForm } from "./estimate-create-form";

export default async function NewEstimatePage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("customers").select("id, name, email").order("created_at", { ascending: false });
  if (error) throw new Error(`顧客一覧を取得できませんでした: ${error.message}`);
  const customers = data ?? [];

  return <>
    <div className="mb-5"><Button variant="ghost" asChild><Link href="/admin/estimates"><ArrowLeft size={16} />見積一覧へ戻る</Link></Button></div>
    <PageHeader title="見積を新規作成" description="メールや電話で受け付けた依頼を手動登録します。" />
    {customers.length === 0 ? (
      <Card><CardContent className="p-10 text-center"><p className="text-sm text-slate-500">先に顧客を登録してください。</p><Button asChild className="mt-5"><Link href="/admin/customers/new">顧客を新規登録</Link></Button></CardContent></Card>
    ) : (
      <Card><CardHeader><CardTitle>見積依頼情報</CardTitle></CardHeader><CardContent><EstimateCreateForm customers={customers} /></CardContent></Card>
    )}
  </>;
}
