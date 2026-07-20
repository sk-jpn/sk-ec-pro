import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PdfDownloadButton } from "@/components/pdf-download-button";
import { withBasePath } from "@/config/site";
import { requireStayUser } from "@/lib/stay/auth";
import { PAYMENT_STATUSES, STAY_STATUSES, stayDate, stayPreviousDate, yen } from "@/lib/stay/presentation";
import { OwnerContact } from "../../owner-contact";
import { cancelStayBankTransfer, customerBookingAction, selectStayBankTransfer, startStayStripeCheckout } from "./actions";
import { CancelBookingForm } from "./cancel-booking-form";

const BANK_DETAILS = <><p>三菱UFJ銀行</p><p>新宿支店</p><p>普通 0039565</p><p>カミキシンノスケ</p></>;

export default async function BookingDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; payment?: string }> }) {
  const { id } = await params;
  const q = await searchParams;
  const { customer, supabase } = await requireStayUser();
  const { data: b } = await supabase.from("stay_bookings").select("*,stay_listings(name,code),stay_message_threads(id)").eq("id", id).eq("customer_id", customer.id).maybeSingle();
  if (!b) notFound();
  const listing = b.stay_listings as unknown as { name: string; code: string };
  const thread = (b.stay_message_threads as unknown as { id: string }[])?.[0];
  const cancellable = ["pending_admin_review", "admin_reviewing", "awaiting_guest_confirmation"].includes(b.status);
  const payable = b.payment_status === "unpaid";
  const bankTransferPending = b.payment_status === "payment_pending" && b.payment_method === "bank_transfer";
  const stripePaymentPending = b.payment_status === "payment_pending" && b.payment_method === "stripe_card";
  const cardFeeRate = Number(b.card_fee_rate ?? 3.6);

  return <div className="mx-auto max-w-3xl">
    {q.created && <p className="mb-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">予約リクエストを受け付けました。内容を確認後、メールでお知らせします。</p>}
    {q.payment === "stripe_success" && <p className="mb-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">カード決済を受け付けました。支払い状況は決済確認後に更新されます。</p>}
    {q.payment === "stripe_cancelled" && <p className="mb-5 rounded-xl bg-amber-50 p-4 text-amber-800">カード決済をキャンセルしました。再度お支払い方法を選択できます。</p>}
    {q.payment === "bank_cancelled" && <p className="mb-5 rounded-xl bg-amber-50 p-4 text-amber-800">銀行振込をキャンセルしました。再度お支払い方法を選択できます。</p>}
    {q.payment === "failed" && <p className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">支払い処理を開始できませんでした。時間をおいて再度お試しください。</p>}
    <p className="text-xs font-bold text-emerald-600">{b.booking_number}</p>
    <h1 className="mt-2 text-3xl font-bold">{listing.name}</h1>
    <div className="mt-6 grid gap-4 rounded-2xl bg-white p-6 sm:grid-cols-2">
      <p>宿泊期間<br /><b>{stayDate(b.check_in_date)}〜{stayPreviousDate(b.check_out_date)}</b></p>
      <p>チェックアウト<br /><b>{stayDate(b.check_out_date)} 10:00</b></p>
      <p>人数<br /><b>{b.guest_count}名・{b.nights}泊</b></p>
      <p>予約状況<br /><b>{STAY_STATUSES[b.status]}</b></p>
      <p>支払い状況<br /><b>{PAYMENT_STATUSES[b.payment_status]}</b></p>
      <p>宿泊料金<br /><b>{yen(b.subtotal)}</b></p>
      <p>追加人数料金<br /><b>{yen(b.additional_guest_fee)}</b></p>
      <p>清掃費<br /><b>{yen(b.cleaning_fee)}</b></p>
      <p className="text-lg">合計<br /><b>{yen(b.total_amount)}</b></p>
    </div>
    {b.admin_message && <p className="mt-5 whitespace-pre-wrap rounded-xl bg-blue-50 p-5 text-sm">{b.admin_message}</p>}
    {stripePaymentPending && <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 sm:p-6">
      <h2 className="text-xl font-bold">カード決済が完了していません。</h2>
      <p className="mt-2 text-sm leading-6">Stripe支払い画面から戻った場合は、支払い方法選択画面に戻って再度お支払いできます。</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <form action={startStayStripeCheckout}><input type="hidden" name="id" value={id} /><Button>Stripeで再度支払う</Button></form>
        <Button asChild variant="outline"><Link href={`/stay/mypage/bookings/${id}/stripe-cancel`}>支払い方法選択に戻る</Link></Button>
      </div>
    </section>}
    {bankTransferPending && <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950 sm:p-6">
      <h2 className="text-xl font-bold">銀行振込を選択しました。下記口座へお振り込みください。</h2>
      <div className="mt-4 rounded-xl bg-white p-4 text-sm font-medium leading-7">{BANK_DETAILS}</div>
      <p className="mt-3 text-xs text-blue-800">振込手数料はお客様負担です。入金確認後に支払い状況を更新します。</p>
      <form action={cancelStayBankTransfer} className="mt-4"><input type="hidden" name="id" value={id} /><Button variant="outline">キャンセル</Button></form>
    </section>}
    {payable && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-xl font-bold">お支払い方法</h2>
      <p className="mt-2 text-sm text-slate-500">合計 {yen(b.total_amount)} のお支払い方法を選択してください。</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold">クレジットカード</h3>
          <p className="mt-2 text-sm font-bold text-amber-700">別途{cardFeeRate}%決済手数料がかかります。</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Stripeの安全な決済画面へ移動します。カード情報は当サイトに保存されません。</p>
          <form action={startStayStripeCheckout} className="mt-4"><input type="hidden" name="id" value={id} /><Button className="w-full">Stripeで支払う</Button></form>
        </div>
        <div className="rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold">銀行振込</h3>
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-medium leading-7">{BANK_DETAILS}</div>
          <p className="mt-2 text-xs text-slate-500">振込手数料はお客様負担です。入金確認後に支払い状況を更新します。</p>
          <form action={selectStayBankTransfer} className="mt-4"><input type="hidden" name="id" value={id} /><Button variant="outline" className="w-full">銀行振込を選択</Button></form>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 sm:col-span-2"><h3 className="font-bold">現金 / AliPay / WeChat Pay（手数料無料）</h3><p className="mt-2 text-sm text-slate-600">ご希望の場合はオーナーに連絡してください。</p></div>
      </div>
    </section>}
    {b.payment_status === "paid" && <><div className="mt-6 flex flex-col gap-3 rounded-xl bg-emerald-50 p-5 text-emerald-800 sm:flex-row sm:items-center sm:justify-between"><p className="font-bold">お支払い済みです。ありがとうございました。</p><PdfDownloadButton href={withBasePath(`/stay/mypage/bookings/${id}/receipt`)} label="領収書PDFをダウンロード" fileName={`receipt-${b.booking_number}.pdf`} receiptLanguage /></div><OwnerContact /></>}
    <div className="mt-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
      {b.status === "awaiting_guest_confirmation" && <form action={customerBookingAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value="confirm" /><Button>この内容で予約する</Button></form>}
      {cancellable && <div className="min-w-0 flex-1"><CancelBookingForm id={id} /></div>}
      {thread && <Button asChild variant="outline"><Link href={`/stay/messages/${thread.id}`}>メッセージ</Link></Button>}
    </div>
  </div>;
}
