import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireStayUser } from "@/lib/stay/auth";
import { OwnerContact } from "./owner-contact";
import { logoutStayCustomer } from "./auth-actions";

export default async function Mypage() {
  const { customer } = await requireStayUser();
  return <><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Stay My Page</p><h1 className="mt-2 text-3xl font-bold">{customer.name} 様</h1></div><form action={logoutStayCustomer}><Button type="submit" variant="outline" size="sm"><LogOut size={15} />ログアウト</Button></form></div><OwnerContact /><div className="mt-9"><Button asChild><Link href="/stay/mypage/bookings">宿泊予約を見る</Link></Button></div></>;
}