import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageHeader, StatusBadge } from "../admin-ui";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type EstimateStatus } from "./statuses";

export const dynamic = "force-dynamic";

type EstimateRow = {
  id: string;
  estimate_no: string;
  status: EstimateStatus;
  created_at: string;
  customers: { name: string } | null;
  estimate_items: { count: number }[];
};

export default async function EstimatesPage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("id, estimate_no, status, created_at, customers(name), estimate_items(count)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`見積一覧の取得に失敗しました: ${error.message}`);
  const estimates = (data ?? []) as unknown as EstimateRow[];

  return <>
    <PageHeader
      title="見積管理"
      description="見積依頼の受付状況と対応ステータスを管理します。"
      action={<Button asChild><Link href="/admin/estimates/new"><Plus size={16} />新規見積</Link></Button>}
    />
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><Input className="pl-9" placeholder="見積番号・顧客名で検索" /></div>
          <p className="text-xs text-slate-400">{estimates.length}件</p>
        </div>
        {estimates.length === 0 ? (
          <Alert className="m-4 w-auto border-emerald-100 bg-emerald-50/50"><AlertTitle>見積データはありません</AlertTitle><AlertDescription>無料見積フォームまたは新規見積ボタンから登録できます。</AlertDescription></Alert>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>受付日時</TableHead><TableHead>見積番号</TableHead><TableHead>顧客名</TableHead><TableHead>商品数</TableHead><TableHead>状態</TableHead></TableRow></TableHeader>
            <TableBody>{estimates.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-slate-500">{new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(item.created_at))}</TableCell>
                <TableCell><Link href={`/admin/estimates/${item.id}`} className="font-semibold text-emerald-700 hover:underline">{item.estimate_no}</Link></TableCell>
                <TableCell className="font-medium">{item.customers?.name ?? "—"}</TableCell>
                <TableCell>{item.estimate_items?.[0]?.count ?? 0}</TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  </>;
}
