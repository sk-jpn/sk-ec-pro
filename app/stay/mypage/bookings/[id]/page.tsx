import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireStayUser } from "@/lib/stay/auth";
import { STAY_STATUSES, PAYMENT_STATUSES, stayDate, yen } from "@/lib/stay/presentation";
import { customerBookingAction } from "./actions";
import { CancelBookingForm } from "./cancel-booking-form";

export default async function BookingDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params; const q = await searchParams; const { customer, supabase } = await requireStayUser();
  const { data: b } = await supabase.from("stay_bookings").select("*,stay_listings(name,code),stay_message_threads(id)").eq("id", id).eq("customer_id", customer.id).maybeSingle();
  if (!b) notFound();
  const listing = b.stay_listings as unknown as { name: string; code: string }; const thread = (b.stay_message_threads as unknown as { id: string }[])?.[0];
  const cancellable = ["pending_admin_review", "admin_reviewing", "awaiting_guest_confirmation"].includes(b.status);
  return <div className="mx-auto max-w-3xl">{q.created && <p className="mb-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">予約リクエストを受け付けました。内容を確認後、メールでお知らせします。</p>}<p className="text-xs font-bold text-emerald-600">{b.booking_number}</p><h1 className="mt-2 text-3xl font-bold">{listing.name}</h1><div className="mt-6 grid gap-4 rounded-2xl bg-white p-6 sm:grid-cols-2"><p>宿泊期間<br /><b>{stayDate(b.check_in_date)}〜{stayDate(b.check_out_date)}</b></p><p>人数<br /><b>{b.guest_count}名・{b.nights}泊</b></p><p>予約状況<br /><b>{STAY_STATUSES[b.status]}</b></p><p>支払い状況<br /><b>{PAYMENT_STATUSES[b.payment_status]}</b></p><p>宿泊料金<br /><b>{yen(b.subtotal)}</b></p><p>追加人数料金<br /><b>{yen(b.additional_guest_fee)}</b></p><p>清掃費<br /><b>{yen(b.cleaning_fee)}</b></p><p className="text-lg">合計<br /><b>{yen(b.total_amount)}</b></p></div>{b.admin_message && <p className="mt-5 whitespace-pre-wrap rounded-xl bg-blue-50 p-5 text-sm">{b.admin_message}</p>}<div className="mt-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">{b.status === "awaiting_guest_confirmation" && <form action={customerBookingAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value="confirm" /><Button>この内容で予約する</Button></form>}{cancellable && <div className="min-w-0 flex-1"><CancelBookingForm id={id} /></div>}{thread && <Button asChild variant="outline"><Link href={`/stay/messages/${thread.id}`}>メッセージ</Link></Button>}</div></div>;
}
