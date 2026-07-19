import Link from "next/link";
import { Boxes, ClipboardList, Truck, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "購入代行管理" };

export default async function PurchaseAdminPage() {
  const supabase = createSupabaseAdminClient();
  const [estimates, customers, orders, shipping] = await Promise.all([
    supabase.from("estimates").select("id", { count: "exact", head: true }),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("shipping_status", ["受付", "画像確認待ち", "日本発送待ち"]),
  ]);
  const links = [
    { href: "/admin/estimates", label: "見積管理", description: "見積の作成・確認・進行管理", value: `${estimates.count ?? 0}件`, icon: ClipboardList },
    { href: "/admin/customers", label: "顧客管理", description: "購入代行顧客とアカウント管理", value: `${customers.count ?? 0}名`, icon: Users },
    { href: "/admin/orders", label: "注文管理", description: "入金後の発注・注文状況", value: `${orders.count ?? 0}件`, icon: Boxes },
    { href: "/admin/shipping", label: "発送管理", description: "商品到着・国際配送・日本発送", value: `${shipping.count ?? 0}件`, icon: Truck },
  ];
  return <>
    <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Purchase Agent Management</p>
    <h1 className="mt-2 text-3xl font-bold">購入代行管理</h1>
    <p className="mt-3 text-sm leading-6 text-slate-500">中国EC購入代行の見積から発送までを管理します。</p>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {links.map(({ href, label, description, value, icon: Icon }) => <Link href={href} key={href}>
        <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
          <CardContent className="flex h-full items-start justify-between gap-4 p-6">
            <div><h2 className="font-bold">{label}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><p className="mt-4 text-sm font-bold text-blue-600">{value}</p></div>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon size={20} /></span>
          </CardContent>
        </Card>
      </Link>)}
    </div>
  </>;
}
