import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerCreateForm } from "./customer-create-form";

export default function NewCustomerPage() {
  return <>
    <div className="mb-5"><Button variant="ghost" asChild><Link href="/admin/customers"><ArrowLeft size={16} />顧客一覧へ戻る</Link></Button></div>
    <PageHeader title="顧客を新規登録" description="メールや電話で受け付けた顧客情報を管理者が登録します。" />
    <Card><CardHeader><CardTitle>顧客情報</CardTitle></CardHeader><CardContent><CustomerCreateForm /></CardContent></Card>
  </>;
}
