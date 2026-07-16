import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CustomerEditForm } from "./customer-edit-form";
import { DeleteCustomerForm } from "./delete-customer-form";

type CustomerDetail = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  postal_code: string | null;
  prefecture: string;
  address_line1: string | null;
  address_line2: string | null;
  deposit_balance: number;
  auth_user_id: string | null;
  estimates: { count: number }[];
};

export default async function CustomerEditPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, company, email, phone, postal_code, prefecture, address_line1, address_line2, deposit_balance, auth_user_id, estimates(count)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`顧客情報の取得に失敗しました: ${error.message}`);
  if (!data) notFound();
  const customer = data as unknown as CustomerDetail;

  return (
    <>
      <div className="mb-5">
        <Button variant="ghost" asChild><Link href="/admin/customers"><ArrowLeft size={16} />顧客一覧へ戻る</Link></Button>
      </div>
      <PageHeader
        title={customer.name}
        description="見積・連絡先として保存されている顧客情報を編集します。"
        action={<div className="flex gap-2"><Badge variant="secondary">{customer.estimates?.[0]?.count ?? 0}件の見積</Badge>{customer.auth_user_id ? <Badge>マイページ連携済み</Badge> : <Badge variant="outline">未連携</Badge>}</div>}
      />
      <Card>
        <CardHeader><CardTitle>顧客情報編集</CardTitle></CardHeader>
        <CardContent>
          <CustomerEditForm customer={{ id: customer.id, name: customer.name, company: customer.company ?? "", email: customer.email, phone: customer.phone ?? "", postalCode: customer.postal_code ?? "", prefecture: customer.prefecture, addressLine1: customer.address_line1 ?? "", addressLine2: customer.address_line2 ?? "", depositBalance: customer.deposit_balance }} />
        </CardContent>
      </Card>
      <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-red-600">TEST DATA DELETE</p>
        <h2 className="mt-2 text-xl font-bold text-red-950">顧客データを全削除</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-red-800">この顧客に紐づく見積、注文、商品画像、到着画像をすべて削除します。削除したデータは回復できません。</p>
        <DeleteCustomerForm customerId={customer.id} />
      </section>
    </>
  );
}
