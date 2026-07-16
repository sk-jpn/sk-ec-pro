"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { ExternalLink, FileText, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateQuoteTax, calculateQuoteTotals } from "@/lib/estimates/quote-calculations";
import { addEstimateItem, updateEstimateQuote, type AddEstimateItemState, type UpdateQuoteState } from "./actions";

type QuoteItem = {
  id: string;
  url: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

type Fees = {
  deposit: number;
  internationalShippingFee: number;
  agencyFee: number;
  otherFee: number;
  discount: number;
};

const initialState: UpdateQuoteState = { success: false, message: "" };
const inputClass = "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60";
const yen = (value: number) => `¥${new Intl.NumberFormat("ja-JP").format(value)}`;

export function EstimateQuoteForm({
  estimateId,
  quoteIssueDate,
  validUntil,
  paymentMethod,
  deposit,
  customerDepositBalance,
  internationalShippingFee,
  agencyFee,
  otherFee,
  discount,
  taxRate,
  items: initialItems,
}: {
  estimateId: string;
  quoteIssueDate: string;
  validUntil: string;
  paymentMethod: string;
  deposit: number;
  customerDepositBalance: number;
  internationalShippingFee: number;
  agencyFee: number;
  otherFee: number;
  discount: number;
  taxRate: number;
  items: QuoteItem[];
}) {
  const [saveState, formAction, saving] = useActionState(updateEstimateQuote, initialState);
  const [items, setItems] = useState(initialItems);
  const [fees, setFees] = useState<Fees>({ deposit, internationalShippingFee, agencyFee, otherFee, discount });
  const [selectedTaxRate, setSelectedTaxRate] = useState(taxRate);
  const [addState, setAddState] = useState<AddEstimateItemState>(initialState);
  const [adding, startAdding] = useTransition();
  const productTotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [items]);
  const calculatedTax = useMemo(() => calculateQuoteTax(productTotal + fees.deposit + fees.internationalShippingFee + fees.agencyFee + fees.otherFee - fees.discount, selectedTaxRate), [fees, productTotal, selectedTaxRate]);
  const totals = useMemo(() => calculateQuoteTotals(items, { ...fees, tax: calculatedTax }), [calculatedTax, fees, items]);

  const updateItem = (id: string, field: "productName" | "quantity" | "unitPrice", value: string) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: field === "productName" ? value : Number(value) || 0 } : item));
  };
  const updateFee = (field: keyof Fees, value: string) => setFees((current) => ({ ...current, [field]: Number(value) || 0 }));
  const handleAddItem = () => startAdding(async () => {
    const result = await addEstimateItem(estimateId);
    setAddState(result);
    if (result.item) setItems((current) => current.length >= 10 ? current : [...current, result.item!]);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>見積金額編集</CardTitle>
        <p className="mt-2 text-xs leading-6 text-slate-400">入力中の小計・合計はリアルタイムで計算されます。一時保存では顧客承認を開始せず、見積完了後に承認可能になります。</p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-8">
          <input type="hidden" name="estimateId" value={estimateId} />
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-slate-700">発行日<input type="date" name="quoteIssueDate" required defaultValue={quoteIssueDate} disabled={saving} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">有効期限<input type="date" name="validUntil" defaultValue={validUntil} disabled={saving} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">支払方法<input name="paymentMethod" required maxLength={100} defaultValue={paymentMethod} disabled={saving} className={inputClass} /></label>
          </div>

          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="text-sm font-semibold text-slate-800">見積商品</h3><p className="mt-1 text-xs text-slate-400">商品名は最大10件まで追加できます。</p></div>
              <Button type="button" variant="outline" onClick={handleAddItem} disabled={saving || adding || items.length >= 10}><Plus size={16} />{adding ? "追加中…" : `商品を追加（${items.length}/10）`}</Button>
            </div>
            <div className="mb-3 hidden grid-cols-[minmax(0,1fr)_6rem_9rem_9rem] gap-3 px-4 text-xs font-semibold text-slate-500 sm:grid"><span>商品名</span><span className="text-right">数量</span><span className="text-right">単価</span><span className="text-right">小計</span></div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-[minmax(0,1fr)_6rem_9rem_9rem] sm:items-center">
                  <input type="hidden" name="itemId" value={item.id} />
                  <label className="grid min-w-0 gap-2 text-xs font-medium text-slate-600"><span className="sm:hidden">商品名</span><input name={`productName_${item.id}`} maxLength={300} value={item.productName} onChange={(event) => updateItem(item.id, "productName", event.target.value)} placeholder={`商品 ${index + 1}`} disabled={saving} className={inputClass} /><span className="truncate font-normal text-slate-400">{item.url}</span></label>
                  <label className="grid gap-2 text-xs font-medium text-slate-600"><span className="sm:hidden">数量</span><input type="number" name={`quantity_${item.id}`} min={1} max={9_999_999_999} step={1} required value={item.quantity || ""} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} disabled={saving} className={`${inputClass} no-number-spinner text-right`} /></label>
                  <label className="grid gap-2 text-xs font-medium text-slate-600"><span className="sm:hidden">単価</span><input type="number" name={`unitPrice_${item.id}`} min={0} max={9_999_999_999} step={1} value={item.unitPrice || ""} onChange={(event) => updateItem(item.id, "unitPrice", event.target.value)} disabled={saving} className={`${inputClass} no-number-spinner text-right`} /></label>
                  <div className="text-right"><p className="text-xs font-medium text-slate-500 sm:hidden">小計</p><p className="mt-1 text-base font-semibold text-slate-900 sm:mt-0">{yen(totals.subtotals[index])}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-7 lg:grid-cols-[1fr_22rem]">
            <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {[
                [customerDepositBalance > 0 ? `デポジット（前回残高：${yen(customerDepositBalance)}）` : "デポジット", "deposit"],
                ["国際送料", "internationalShippingFee"],
                ["代行購入", "agencyFee"],
                ["その他の費用（前回不足金等）", "otherFee"],
                ["割引", "discount"],
              ].map(([label, name]) => <label key={name} className="grid grid-cols-[1fr_9rem] items-center gap-4 text-sm font-medium text-slate-600"><span>{label}</span><input type="number" name={name} min={0} max={9_999_999_999} step={1} value={fees[name as keyof Fees] || ""} onChange={(event) => updateFee(name as keyof Fees, event.target.value)} disabled={saving} className={`${inputClass} no-number-spinner text-right`} /></label>)}
              <div className="grid grid-cols-[1fr_5rem_9rem] items-center gap-3 text-sm font-medium text-slate-600"><span>消費税</span><select name="taxRate" value={selectedTaxRate} onChange={(event) => setSelectedTaxRate(Number(event.target.value))} disabled={saving} className={inputClass}><option value={0}>0%</option><option value={8}>8%</option><option value={10}>10%</option></select><input aria-label="消費税額" type="number" value={calculatedTax || ""} readOnly className={`${inputClass} no-number-spinner bg-slate-50 text-right`} /></div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-sm"><span className="text-slate-500">商品合計</span><span className="font-semibold">{yen(totals.productTotal)}</span></div>
              <div className="space-y-2 py-4 text-xs text-slate-500">
                <p className="flex justify-between"><span>デポジット</span><span>{yen(fees.deposit)}</span></p>
                <p className="flex justify-between"><span>国際送料</span><span>{yen(fees.internationalShippingFee)}</span></p>
                <p className="flex justify-between"><span>代行購入</span><span>{yen(fees.agencyFee)}</span></p>
                <p className="flex justify-between"><span>その他の費用</span><span>{yen(fees.otherFee)}</span></p>
                <p className="flex justify-between"><span>割引</span><span className="text-red-600">-{yen(fees.discount)}</span></p>
                <p className="flex justify-between"><span>消費税（{selectedTaxRate}%）</span><span>{yen(calculatedTax)}</span></p>
              </div>
              <div className="rounded-xl bg-slate-950 px-5 py-5 text-white"><p className="text-xs font-medium text-slate-300">合計金額</p><p className="mt-2 text-right text-3xl font-bold tracking-tight">{yen(totals.total)}</p></div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
            <Button type="submit" name="saveMode" value="draft" variant="outline" disabled={saving}><Save size={16} />{saving ? "保存中…" : "一時保存"}</Button>
            <Button type="submit" name="saveMode" value="complete" disabled={saving}><Save size={16} />{saving ? "PDF生成・メール送信中…" : "見積完了"}</Button>
            <Button type="button" variant="outline" asChild><a href={`/admin/estimates/${estimateId}/pdf`} target="_blank" rel="noreferrer"><FileText size={16} />PDF生成<ExternalLink size={14} /></a></Button>
            {(saveState.message || addState.message) && <p aria-live="polite" className={`text-sm ${(saveState.message ? saveState.success : addState.success) ? "text-emerald-700" : "text-red-600"}`}>{saveState.message || addState.message}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
