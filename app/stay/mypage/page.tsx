import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireStayUser } from "@/lib/stay/auth";
import { STAY_STATUSES, stayDate, yen } from "@/lib/stay/presentation";
import { OwnerContact } from "./owner-contact";
import { CancelBookingForm } from "./bookings/[id]/cancel-booking-form";
import { logoutStayCustomer } from "./auth-actions";

export default async function Mypage() {
  const { customer, supabase } = await requireStayUser();
  const { data: bookings } = await supabase.from("stay_bookings").select("id,booking_number,check_in_date,check_out_date,total_amount,status,stay_listings(name)").eq("customer_id", customer.id).order("check_in_date", { ascending: true });
  return <><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Stay My Page</p><h1 className="mt-2 text-3xl font-bold">{customer.name} 様</h1></div><form action={logoutStayCustomer}><Button type="submit" variant="outline" size="sm"><LogOut size={15} />ログアウト</Button></form></div><OwnerContact /><div className="mt-9 flex items-center justify-between gap-3"><h2 className="text-xl font-bold">宿泊予約</h2><Button asChild><Link href="/stay/search">空室を検索</Link></Button></div><div className="mt-4 grid gap-4">{(bookings ?? []).map((b) => { const cancellable = ["pending_admin_review", "admin_reviewing", "awaiting_guest_confirmation"].includes(b.status); return <Card key={b.id}><CardContent className="grid min-w-0 gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><p className="text-xs font-bold text-emerald-600">{b.booking_number}</p><h3 className="mt-1 font-bold">{(b.stay_listings as unknown as { name: string })?.name}</h3><p className="mt-2 text-sm text-slate-500">{stayDate(b.check_in_date)}〜{stayDate(b.check_out_date)}・{yen(b.total_amount)}</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{STAY_STATUSES[b.status] ?? b.status}</span><Button asChild variant="outline" size="sm"><Link href={`/stay/mypage/bookings/${b.id}`}>詳細</Link></Button>{cancellable && <CancelBookingForm id={b.id} compact />}</div></CardContent></Card>; })}{!bookings?.length && <p className="rounded-xl bg-white p-8 text-center text-slate-500">予約はまだありません。</p>}</div></>;
}
