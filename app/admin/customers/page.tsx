import { Search } from "lucide-react";
import { PageHeader } from "../admin-ui";
import { Badge } from "@/components/ui/badge";
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
  created_at: string;
  auth_user_id: string | null;
  estimates: { count: number }[];
};

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, company, email, created_at, auth_user_id, estimates(count)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`顧客一覧の取得に失敗しました: ${error.message}`);
  const customers = ((data ?? []) as unknown as CustomerRow[]).filter((customer) =>
    !query ||
    customer.name.toLowerCase().includes(query) ||
    customer.email.toLowerCase().includes(query) ||
    customer.company?.toLowerCase().includes(query)
  );

  return <><PageHeader title="顧客管理" description="見積フォームから登録された顧客情報と見積件数を表示します。" /><Card><CardContent className="p-0"><form className="border-b border-slate-200 p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><Input name="q" defaultValue={query} className="pl-9" placeholder="顧客名・メールで検索" /></div></form>{customers.length === 0 ? <p className="p-10 text-center text-sm text-slate-400">該当する顧客データはありません。</p> : <Table><TableHeader><TableRow><TableHead>顧客名</TableHead><TableHead>会社名</TableHead><TableHead>連絡用メール</TableHead><TableHead>登録日</TableHead><TableHead>見積件数</TableHead><TableHead>マイページ</TableHead></TableRow></TableHeader><TableBody>{customers.map((customer) => <TableRow key={customer.id}><TableCell className="font-medium">{customer.name}</TableCell><TableCell>{customer.company || "—"}</TableCell><TableCell className="text-slate-500">{customer.email}</TableCell><TableCell>{new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(customer.created_at))}</TableCell><TableCell><Badge variant="secondary">{customer.estimates?.[0]?.count ?? 0}件</Badge></TableCell><TableCell>{customer.auth_user_id ? <Badge>連携済み</Badge> : <Badge variant="outline">未連携</Badge>}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card></>;
}
