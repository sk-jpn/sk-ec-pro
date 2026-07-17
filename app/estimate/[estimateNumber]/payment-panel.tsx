"use client";

import { useActionState, useState, useTransition } from "react";
import { Building2, CheckCircle2, CreditCard } from "lucide-react";
import { PAYMENT_METHODS, STRIPE_CARD_FEE_RATE, calculateCardPaymentFee, type PaymentMethod } from "@/config/payment";
import { approveEstimate, cancelEstimate, createStripeCheckout, type ApproveEstimateState } from "./actions";

const initialState: ApproveEstimateState = { success: false, message: "" };
const yen = (value: number) => `¥${new Intl.NumberFormat("ja-JP").format(value)}`;

export function PaymentPanel({
  estimateNumber,
  estimateTotal,
  initialPaymentMethod,
  approved,
  paid,
  cancelled,
  approvalAllowed,
  bankTransferDetails,
  currentStatus,
}: {
  estimateNumber: string;
  estimateTotal: number;
  initialPaymentMethod: string;
  approved: boolean;
  paid: boolean;
  cancelled: boolean;
  approvalAllowed: boolean;
  bankTransferDetails: string;
  currentStatus: string;
}) {
  const recognizedMethod = Object.values(PAYMENT_METHODS).includes(initialPaymentMethod as PaymentMethod) ? initialPaymentMethod as PaymentMethod : PAYMENT_METHODS.bankTransfer;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(recognizedMethod);
  const [bankState, bankAction, bankPending] = useActionState(approveEstimate, initialState);
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelEstimate, initialState);
  const [cardState, setCardState] = useState(initialState);
  const [cardPending, startCardTransition] = useTransition();
  const cardFee = paymentMethod === PAYMENT_METHODS.stripeCard ? calculateCardPaymentFee(estimateTotal) : 0;
  const paymentTotal = estimateTotal + cardFee;

  if (paid) {
    return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900"><CheckCircle2 className="mx-auto text-emerald-600" size={30} /><p className="mt-4 text-lg font-semibold">お支払いが完了しています</p><p className="mt-2 text-sm text-emerald-700">ご注文ありがとうございます。</p></div>;
  }
  if (cancelled) return <p className="rounded-2xl border border-red-100 bg-red-50 p-5 text-center text-sm font-semibold text-red-700">キャンセルされた見積は承認・決済できません。</p>;
  if ((approved || bankState.success) && paymentMethod === PAYMENT_METHODS.bankTransfer) {
    return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900"><CheckCircle2 className="mx-auto text-emerald-600" size={30} /><p className="mt-4 text-center text-base font-semibold">見積を承認しました。入金を確認後、発注作業を開始します。</p><div className="mt-5 rounded-xl bg-white/80 p-4"><p className="text-xs font-bold text-emerald-700">銀行振込先（振込手数料お客様ご負担となります）</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{bankTransferDetails}</p><p className="mt-3 border-t border-emerald-100 pt-3 text-sm font-bold">振込金額：{yen(estimateTotal)}</p></div></div>;
  }
  if (!approvalAllowed) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"><p className="font-semibold text-amber-900">{currentStatus === "見積作成中" ? "現在、見積を作成しています" : `現在のステータス：${currentStatus}`}</p><p className="mt-2 text-sm leading-6 text-amber-700">{currentStatus === "見積作成中" ? "管理者が見積作成を完了するまで、承認・決済はできません。" : "進捗や確認事項はメッセージからお問い合わせいただけます。"}</p></div>;
  }

  const startCardCheckout = () => startCardTransition(async () => {
    const result = await createStripeCheckout(estimateNumber);
    setCardState(result);
    if (result.url) window.location.assign(result.url);
  });

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">支払方法</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className={`flex cursor-pointer gap-4 rounded-2xl border p-5 transition ${paymentMethod === PAYMENT_METHODS.bankTransfer ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/10" : "border-slate-200 bg-white"}`}><input type="radio" name="paymentMethodChoice" value={PAYMENT_METHODS.bankTransfer} checked={paymentMethod === PAYMENT_METHODS.bankTransfer} onChange={() => setPaymentMethod(PAYMENT_METHODS.bankTransfer)} disabled={approved || bankPending || cardPending} className="mt-1" /><Building2 className="shrink-0 text-blue-600" size={21} /><span><span className="block font-semibold">銀行振込</span><span className="mt-1 block text-xs leading-5 text-slate-500">振込先はご注文受付後にご案内します。</span></span></label>
        <label className={`flex cursor-pointer gap-4 rounded-2xl border p-5 transition ${paymentMethod === PAYMENT_METHODS.stripeCard ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/10" : "border-slate-200 bg-white"}`}><input type="radio" name="paymentMethodChoice" value={PAYMENT_METHODS.stripeCard} checked={paymentMethod === PAYMENT_METHODS.stripeCard} onChange={() => setPaymentMethod(PAYMENT_METHODS.stripeCard)} disabled={approved || bankPending || cardPending} className="mt-1" /><CreditCard className="shrink-0 text-blue-600" size={21} /><span><span className="block font-semibold">Stripeクレジットカード</span><span className="mt-1 block text-xs leading-5 text-slate-500">決済手数料 {(STRIPE_CARD_FEE_RATE * 100).toFixed(1)}%</span></span></label>
      </div>

      <div className="mt-6 ml-auto max-w-md rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
        <p className="flex justify-between text-sm"><span className="text-slate-500">見積金額</span><span className="font-semibold">{yen(estimateTotal)}</span></p>
        {paymentMethod === PAYMENT_METHODS.stripeCard && <p className="mt-3 flex justify-between text-sm"><span className="text-slate-500">決済手数料 ({(STRIPE_CARD_FEE_RATE * 100).toFixed(1)}%)</span><span className="font-semibold">{yen(cardFee)}</span></p>}
        <div className="mt-4 border-t border-slate-200 pt-4"><p className="flex items-end justify-between"><span className="text-sm font-semibold">支払総額</span><span className="text-2xl font-bold text-blue-700">{yen(paymentTotal)}</span></p></div>
      </div>

      <div className="mt-7 text-center">
        {paymentMethod === PAYMENT_METHODS.bankTransfer ? (
          <form action={bankAction}>
            <input type="hidden" name="estimateNumber" value={estimateNumber} />
            <input type="hidden" name="paymentMethod" value={PAYMENT_METHODS.bankTransfer} />
            <button type="submit" disabled={bankPending || cardPending} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-8 text-base font-semibold text-white shadow-xl shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60 sm:w-auto sm:min-w-72"><CheckCircle2 size={20} />{bankPending ? "承認中…" : "見積を承認する"}</button>
          </form>
        ) : (
          <button type="button" onClick={startCardCheckout} disabled={bankPending || cardPending} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-8 text-base font-semibold text-white shadow-xl shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60 sm:w-auto sm:min-w-72"><CreditCard size={20} />{cardPending ? "決済画面を準備中…" : "カード決済へ進む"}</button>
        )}
        <p className="mt-4 text-xs leading-6 text-slate-400">手続きを進めると、この見積内容で注文が確定します。</p>
        {(bankState.message && !bankState.success) && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{bankState.message}</p>}
        {cardState.message && !cardState.success && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{cardState.message}</p>}
        <form action={cancelAction} className="mt-5"><input type="hidden" name="estimateNumber" value={estimateNumber} /><button type="submit" disabled={bankPending || cardPending || cancelPending} className="text-sm font-semibold text-red-600 underline underline-offset-4 disabled:opacity-50">{cancelPending ? "キャンセル処理中…" : "この見積をキャンセル"}</button></form>
        {cancelState.message && <p className={`mt-3 text-sm ${cancelState.success ? "text-slate-600" : "text-red-600"}`}>{cancelState.message}</p>}
      </div>
    </div>
  );
}
