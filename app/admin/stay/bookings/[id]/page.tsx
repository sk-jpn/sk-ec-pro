import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { withBasePath } from "@/config/site";
import { STAY_STATUSES, stayDate, yen } from "@/lib/stay/presentation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { reassignStayBookingCustomer, updateStayBooking } from "../../actions";
import { PricingEditor } from "./pricing-editor";

export default async function BookingAdminDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ linked?: string; saved?: string }> }) {
  const { id } = await params;
  const q = await searchParams;
  const admin = createSupabaseAdminClient();
  const [{ data: b }, { data: customers }] = await Promise.all([
    admin.from("stay_bookings").select("*,stay_customers(name,email,phone),stay_listings(name)").eq("id", id).maybeSingle(),
    admin.from("stay_customers").select("id,name,email,phone").order("name"),
  ]);
  if (!b) notFound();
  const c = b.stay_customers as unknown as { name: string; email: string; phone: string };

  return <>
    <p className="text-xs font-bold text-emerald-600">{b.booking_number}</p>
    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h1 className="text-3xl font-bold">{(b.stay_listings as unknown as { name: string }).name}</h1>{b.payment_status === "paid" && <Button asChild variant="outline"><a href={withBasePath(`/admin/stay/bookings/${id}/receipt`)} target="_blank" rel="noreferrer">領収書PDFを表示</a></Button>}</div>
    {q.linked === "success" && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">予約を選択した宿泊顧客へリンクしました。</p>}
    {(q.linked === "failed" || q.linked === "invalid") && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">宿泊顧客へのリンクを変更できませんでした。</p>}
    {q.saved === "success" && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">予約内容を保存しました。</p>}
    {q.saved === "invalid" && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">チェックイン・チェックアウト日を確認してください。</p>}
    {q.saved === "conflict" && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">選択期間には別の予約または手動ブロックがあります。</p>}
    {q.saved === "failed" && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">予約内容を保存できませんでした。</p>}

    <div className="mt-6 grid gap-4 rounded-xl bg-white p-6 sm:grid-cols-3">
      <p>顧客<br /><b>{c.name}</b><br />{c.email}<br />{c.phone}</p>
      <p>宿泊<br /><b>チェックイン {stayDate(b.check_in_date)} 15:00</b><br /><b>チェックアウト {stayDate(b.check_out_date)} 10:00</b><br />{b.guest_count}名・{b.nights}泊</p>
      <p>合計<br /><b className="text-xl">{yen(b.total_amount)}</b><br />清掃費 {yen(b.cleaning_fee)}</p>
    </div>

    <form action={reassignStayBookingCustomer} className="mt-5 rounded-xl border border-blue-200 bg-blue-50/50 p-6">
      <input type="hidden" name="bookingId" value={id} />
      <h2 className="text-lg font-bold">宿泊顧客を変更</h2>
      <p className="mt-2 text-sm text-slate-600">予約、予約者情報、メッセージ、通知を選択した宿泊顧客へリンクします。</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <select name="customerId" defaultValue={b.customer_id} required className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm">
          {(customers ?? []).map(customer => <option key={customer.id} value={customer.id}>{customer.name}（{customer.email}）</option>)}
        </select>
        <Button variant="outline">この顧客へ変更</Button>
      </div>
    </form>

    <form action={updateStayBooking} className="mt-5 grid gap-4 rounded-xl bg-white p-6">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="previousStatus" value={b.status} />
      <input type="hidden" name="previousCheckIn" value={b.check_in_date} />
      <input type="hidden" name="previousCheckOut" value={b.check_out_date} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>チェックイン<input name="checkIn" type="date" defaultValue={b.check_in_date} required className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 px-3" /></label>
        <label>チェックアウト<input name="checkOut" type="date" defaultValue={b.check_out_date} required className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 px-3" /></label>
      </div>
      <label>予約ステータス<select name="status" defaultValue={b.status} className="ml-3 rounded-lg border p-2">{Object.entries(STAY_STATUSES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>支払い状況<select name="paymentStatus" defaultValue={b.payment_status} className="ml-3 rounded-lg border p-2"><option value="unpaid">未払い</option><option value="payment_pending">確認中</option><option value="paid">支払い済み</option><option value="refunded">返金済み</option><option value="partially_refunded">一部返金</option></select></label>
      <label>支払い方法<select name="paymentMethod" defaultValue={b.payment_method ?? ""} className="ml-3 rounded-lg border p-2"><option value="">未設定</option><option value="cash">現金</option><option value="bank_transfer">銀行振込</option><option value="stripe_card">クレジットカード（Stripe）</option><option value="card_manual">カード（手動）</option><option value="other">その他</option></select></label>
      <PricingEditor subtotal={b.subtotal} additionalGuestFee={b.additional_guest_fee} cleaningFee={b.cleaning_fee} discount={b.discount_amount} totalAmount={b.total_amount} cardFeeRate={Number(b.card_fee_rate ?? 3.6)} editable={b.payment_status === "unpaid"} />
      <label>顧客へのメッセージ<textarea name="adminMessage" defaultValue={b.admin_message} className="mt-1 min-h-24 w-full rounded-lg border p-3" /></label>
      <label>管理者メモ<textarea name="adminMemo" defaultValue={b.admin_memo} className="mt-1 min-h-24 w-full rounded-lg border p-3" /></label>
      <Button>保存</Button>
    </form>
  </>;
}
