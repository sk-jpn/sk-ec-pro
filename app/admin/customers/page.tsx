import Link from "next/link";
import { Clock3, Pencil, Plus, Search } from "lucide-react";
import { PageHeader } from "../admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CustomerRow = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  postal_code: string | null;
  prefecture: string;
  address_line1: string | null;
  address_line2: string | null;
  deposit_balance: number;
  created_at: string;
  auth_user_id: string | null;
  estimates: { count: number }[];
};

type PendingAccount = {
  auth_user_id: string;
  google_email: string;
  created_at: string;
};

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const deleted = params.deleted === "1";
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, company, email, postal_code, prefecture, address_line1, address_line2, deposit_balance, created_at, auth_user_id, estimates(count)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`顧客一覧の取得に失敗しました: ${error.message}`);
  const { data: pendingData, error: pendingError } = await supabase
    .from("pending_customer_links")
    .select("auth_user_id, google_email, created_at")
    .order("created_at", { ascending: false });
  if (pendingError) throw new Error(`連携確認待ちアカウントの取得に失敗しました: ${pendingError.message}`);
  const pendingAccounts = (pendingData ?? []) as PendingAccount[];
  const customers = ((data ?? []) as unknown as CustomerRow[]).filter((customer) =>
    !query ||
    customer.name.toLowerCase().includes(query) ||
    customer.email.toLowerCase().includes(query) ||
    customer.company?.toLowerCase().includes(query)
  );

  return <>
    <PageHeader
      title="顧客管理"
      description="見積フォームと管理者登録の顧客情報を確認・編集できます。"
      action={<Button asChild><Link href="/admin/customers/new"><Plus size={16} />新規顧客</Link></Button>}
    />
    {deleted && <p role="status" className="mb-5 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">顧客と関連データを削除しました。</p>}
    {pendingAccounts.length > 0 && <Card className="mb-6 border-amber-200">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-5 py-4"><Clock3 className="text-amber-700" size={19} /><div><p className="font-semibold text-amber-950">連携確認待ちアカウント</p><p className="mt-1 text-xs text-amber-700">Google認証メールが顧客登録メールと一致しなかったアカウントです。</p></div><Badge variant="warning" className="ml-auto">{pendingAccounts.length}件</Badge></div>
        <Table>
          <TableHeader><TableRow><TableHead>Google認証メール</TableHead><TableHead>受付日時</TableHead><TableHead>状態</TableHead></TableRow></TableHeader>
          <TableBody>{pendingAccounts.map((pending) => <TableRow key={pending.auth_user_id}><TableCell className="font-medium">{pending.google_email}</TableCell><TableCell>{new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(pending.created_at))}</TableCell><TableCell><Badge variant="warning">連携確認待ち</Badge></TableCell></TableRow>)}</TableBody>
        </Table>
      </CardContent>
    </Card>}
    <Card>
      <CardContent className="p-0">
        <form className="border-b border-slate-200 p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input name="q" defaultValue={query} className="pl-9" placeholder="顧客名・メールで検索" />
          </div>
        </form>
        {customers.length === 0 ? <p className="p-10 text-center text-sm text-slate-400">該当する顧客データはありません。</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>顧客名</TableHead><TableHead>連絡用メール</TableHead><TableHead>お届け先住所</TableHead><TableHead>デポジット残高</TableHead><TableHead>見積件数</TableHead><TableHead>マイページ</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
            <TableBody>{customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}{customer.company && <span className="mt-1 block text-xs font-normal text-slate-400">{customer.company}</span>}</TableCell>
                <TableCell className="text-slate-500">{customer.email}</TableCell>
                <TableCell><span className="block">{customer.postal_code ? `〒${customer.postal_code}` : "未登録"}</span>{customer.address_line1 && <span className="mt-1 block max-w-72 whitespace-normal text-xs text-slate-500">{customer.prefecture}{customer.address_line1}{customer.address_line2 ? ` ${customer.address_line2}` : ""}</span>}</TableCell>
                <TableCell><span className={customer.deposit_balance > 0 ? "font-semibold text-blue-700" : "text-slate-400"}>¥{new Intl.NumberFormat("ja-JP").format(customer.deposit_balance)}</span></TableCell>
                <TableCell><Badge variant="secondary">{customer.estimates?.[0]?.count ?? 0}件</Badge></TableCell>
                <TableCell>{customer.auth_user_id ? <Badge>連携済み</Badge> : <Badge variant="outline">未連携</Badge>}</TableCell>
                <TableCell className="text-right"><Button variant="outline" size="sm" asChild><Link href={`/admin/customers/${customer.id}`}><Pencil size={14} />編集</Link></Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  </>;
}
