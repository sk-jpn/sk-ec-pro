import Link from "next/link";
import { NoData, PageHeader } from "../admin-ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DeleteOrderButton } from "../orders/delete-order-button";

type ShippingRow = {
  id: string;
  order_no: string;
  estimate_id: string;
  shipping_status: string;
  carrier: string | null;
  tracking_number: string | null;
  customers: { name: string } | null;
  estimates: { estimate_no: string; status: string } | null;
};

export default async function ShippingPage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_no, estimate_id, shipping_status, carrier, tracking_number, customers(name), estimates(estimate_no, status)")
    .order("ordered_at", { ascending: false });

  if (error) console.error("発送一覧の取得に失敗しました。", error);
  const orders = (data ?? []) as unknown as ShippingRow[];

  return (
    <>
      <PageHeader title="発送管理" description="注文ごとの発送状況と追跡情報を確認できます。" />
      {orders.length === 0 ? (
        <NoData title="発送データはありません" description="注文データが作成されると、発送状況がここに表示されます。" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>注文番号</TableHead>
                  <TableHead>見積・顧客</TableHead>
                  <TableHead>発送状況</TableHead>
                  <TableHead>配送会社</TableHead>
                  <TableHead>追跡番号</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-semibold">{order.order_no}</TableCell>
                    <TableCell>
                      <Link href={`/admin/estimates/${order.estimate_id}`} className="font-medium text-emerald-700 hover:underline">
                        {order.estimates?.estimate_no ?? "見積を確認"}
                      </Link>
                      <p className="mt-1 text-xs text-slate-400">{order.customers?.name ?? "顧客名未登録"}・{order.estimates?.status ?? "状態不明"}</p>
                    </TableCell>
                    <TableCell><Badge variant={["完了", "国内発送"].includes(order.shipping_status) ? "success" : "warning"}>{order.shipping_status}</Badge></TableCell>
                    <TableCell>{order.carrier ?? "未登録"}</TableCell>
                    <TableCell>{order.tracking_number ?? "未登録"}</TableCell>
                    <TableCell><DeleteOrderButton orderId={order.id} orderNo={order.order_no} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
