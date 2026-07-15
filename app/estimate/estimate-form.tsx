"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CirclePlus,
  ClipboardCheck,
  Info,
  Package,
  Send,
  Trash2,
} from "lucide-react";

type Product = {
  id: number;
  url: string;
  quantity: string;
  color: string;
  size: string;
  model: string;
  request: string;
};

type Customer = {
  name: string;
  email: string;
  company: string;
  phone: string;
  marketplace: string;
  sellerQuestion: string;
  shipping: string;
  deadline: string;
  prefecture: string;
  notes: string;
  privacy: boolean;
};

const emptyProduct = (id: number): Product => ({
  id,
  url: "",
  quantity: "1",
  color: "",
  size: "",
  model: "",
  request: "",
});

const initialCustomer: Customer = {
  name: "",
  email: "",
  company: "",
  phone: "",
  marketplace: "",
  sellerQuestion: "",
  shipping: "おまかせ",
  deadline: "",
  prefecture: "",
  notes: "",
  privacy: false,
};

const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
const textareaClass = `${inputClass} min-h-28 resize-y py-3`;

function Required() {
  return <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">必須</span>;
}

function ErrorText({ message, id }: { message?: string; id: string }) {
  if (!message) return null;
  return <p id={id} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600"><AlertCircle size={13} />{message}</p>;
}

function safeUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function EstimateForm() {
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [products, setProducts] = useState<Product[]>([emptyProduct(1)]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"input" | "confirm" | "complete">("input");
  const [nextProductId, setNextProductId] = useState(2);

  const updateCustomer = <K extends keyof Customer>(key: K, value: Customer[K]) => {
    setCustomer((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const updateProduct = (id: number, key: keyof Omit<Product, "id">, value: string) => {
    setProducts((current) => current.map((product) => product.id === id ? { ...product, [key]: value } : product));
    setErrors((current) => {
      const next = { ...current };
      delete next[`product-${id}-${key}`];
      return next;
    });
  };

  const addProduct = () => {
    if (products.length >= 10) return;
    setProducts((current) => [...current, emptyProduct(nextProductId)]);
    setNextProductId((current) => current + 1);
  };

  const removeProduct = (id: number) => {
    if (products.length === 1) return;
    setProducts((current) => current.filter((product) => product.id !== id));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!customer.name.trim()) nextErrors.name = "お名前を入力してください。";
    if (!customer.email.trim()) nextErrors.email = "メールアドレスを入力してください。";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) nextErrors.email = "正しい形式のメールアドレスを入力してください。";
    if (!customer.prefecture) nextErrors.prefecture = "お届け先の都道府県を選択してください。";
    if (!customer.privacy) nextErrors.privacy = "プライバシーポリシーへの同意が必要です。";

    products.forEach((product) => {
      if (!product.url.trim()) nextErrors[`product-${product.id}-url`] = "商品URLを入力してください。";
      else if (!safeUrl(product.url)) nextErrors[`product-${product.id}-url`] = "http:// または https:// から始まるURLを入力してください。";
      if (!product.quantity || Number(product.quantity) < 1) nextErrors[`product-${product.id}-quantity`] = "数量は1以上で入力してください。";
      if (!product.request.trim()) nextErrors[`product-${product.id}-request`] = "商品仕様または希望内容を入力してください。";
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return false;
    }
    return true;
  };

  const showConfirmation = (event: React.FormEvent) => {
    event.preventDefault();
    if (validate()) {
      setStep("confirm");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (step === "complete") {
    return (
      <section className="mx-auto w-full max-w-4xl px-5 py-24 text-center sm:px-8 sm:py-32">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/20"><CheckCircle2 size={30} /></span>
        <p className="section-label mt-8">Development Preview</p>
        <h2 className="section-title">入力内容を確認しました</h2>
        <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-600">見積フォームの送信機能は現在準備中です。</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">この操作ではメール送信、データ保存、外部サービスへの送信は行われていません。</p>
        <button type="button" onClick={() => setStep("input")} className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600">入力画面に戻る</button>
      </section>
    );
  }

  if (step === "confirm") {
    const customerRows = [
      ["お名前", customer.name], ["メールアドレス", customer.email], ["会社名", customer.company],
      ["電話番号", customer.phone], ["中国ECサイト名", customer.marketplace], ["出品者に確認したい内容", customer.sellerQuestion],
      ["希望する配送方法", customer.shipping], ["希望納期", customer.deadline], ["お届け先都道府県", customer.prefecture], ["備考", customer.notes],
    ];
    return (
      <section className="border-t border-slate-100 bg-slate-50/70 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white"><ClipboardCheck size={21} /></span><div><p className="section-label !mb-1">Confirmation</p><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">入力内容の確認</h2></div></div>
          <p className="mt-5 text-sm leading-7 text-slate-500">内容をご確認ください。この段階ではまだ送信されません。</p>
          <div className="mt-10 space-y-5">
            <section className="rounded-[1.75rem] border border-slate-100 bg-white p-6 sm:p-8"><h3 className="font-semibold">お客様情報</h3><dl className="mt-6 divide-y divide-slate-100">{customerRows.filter(([, value]) => value).map(([label, value]) => <div key={label as string} className="grid gap-1 py-4 sm:grid-cols-[13rem_1fr]"><dt className="text-sm font-medium text-slate-400">{label as string}</dt><dd className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{value as string}</dd></div>)}</dl></section>
            {products.map((product, index) => <section key={product.id} className="rounded-[1.75rem] border border-slate-100 bg-white p-6 sm:p-8"><h3 className="font-semibold">商品 {index + 1}</h3><dl className="mt-6 divide-y divide-slate-100">{[["商品URL", product.url], ["数量", product.quantity], ["色", product.color], ["サイズ", product.size], ["型番", product.model], ["希望内容", product.request]].filter(([, value]) => value).map(([label, value]) => <div key={label} className="grid gap-1 py-4 sm:grid-cols-[13rem_1fr]"><dt className="text-sm font-medium text-slate-400">{label}</dt><dd className="whitespace-pre-wrap break-all text-sm leading-6 text-slate-800">{value}</dd></div>)}</dl></section>)}
          </div>
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setStep("input")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 px-6 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-600"><ArrowLeft size={17} />入力内容を修正する</button><button type="button" onClick={() => { setStep("complete"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-7 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">この内容で見積を依頼する<Send size={17} /></button></div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-slate-100 bg-slate-50/70 py-20 sm:py-24">
      <form onSubmit={showConfirmation} noValidate className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-[0_24px_70px_-52px_rgba(15,23,42,.35)] sm:p-8">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white"><Package size={21} /></span><div><p className="section-label !mb-1">Customer Details</p><h2 className="text-2xl font-semibold tracking-tight">お客様情報</h2></div></div>
          <div className="mt-8 grid gap-x-5 gap-y-6 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">お名前<Required /><input value={customer.name} onChange={(e) => updateCustomer("name", e.target.value)} className={inputClass} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} autoComplete="name" /><ErrorText id="name-error" message={errors.name} /></label>
            <label className="text-sm font-medium text-slate-700">メールアドレス<Required /><input type="email" value={customer.email} onChange={(e) => updateCustomer("email", e.target.value)} className={inputClass} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} autoComplete="email" placeholder="example@email.com" /><ErrorText id="email-error" message={errors.email} /></label>
            <label className="text-sm font-medium text-slate-700">会社名<span className="ml-2 text-xs text-slate-400">任意</span><input value={customer.company} onChange={(e) => updateCustomer("company", e.target.value)} className={inputClass} autoComplete="organization" /></label>
            <label className="text-sm font-medium text-slate-700">電話番号<span className="ml-2 text-xs text-slate-400">任意</span><input type="tel" value={customer.phone} onChange={(e) => updateCustomer("phone", e.target.value)} className={inputClass} autoComplete="tel" /></label>
            <label className="text-sm font-medium text-slate-700">中国ECサイト名<span className="ml-2 text-xs text-slate-400">任意</span><select value={customer.marketplace} onChange={(e) => updateCustomer("marketplace", e.target.value)} className={inputClass}><option value="">選択してください</option>{["Taobao（淘宝）", "1688", "Xianyu（闲鱼・咸鱼）", "Tmall（天猫）", "Alibaba", "その他"].map(item => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">日本国内のお届け先都道府県<Required /><select value={customer.prefecture} onChange={(e) => updateCustomer("prefecture", e.target.value)} className={inputClass} aria-invalid={Boolean(errors.prefecture)} aria-describedby={errors.prefecture ? "prefecture-error" : undefined}><option value="">選択してください</option>{prefectures.map(item => <option key={item}>{item}</option>)}</select><ErrorText id="prefecture-error" message={errors.prefecture} /></label>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {products.map((product, index) => (
            <fieldset key={product.id} className="rounded-[2rem] border border-slate-100 bg-white p-5 sm:p-8">
              <div className="flex items-center justify-between gap-4"><legend className="text-xl font-semibold tracking-tight">商品 {index + 1}</legend><button type="button" disabled={products.length === 1} onClick={() => removeProduct(product.id)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-xs font-semibold text-slate-500 transition enabled:hover:border-red-200 enabled:hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-35"><Trash2 size={15} />削除</button></div>
              <div className="mt-7 grid gap-x-5 gap-y-6 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">商品URL<Required /><input type="url" value={product.url} onChange={(e) => updateProduct(product.id, "url", e.target.value)} className={inputClass} placeholder="https://..." aria-invalid={Boolean(errors[`product-${product.id}-url`])} aria-describedby={errors[`product-${product.id}-url`] ? `product-${product.id}-url-error` : undefined} /><ErrorText id={`product-${product.id}-url-error`} message={errors[`product-${product.id}-url`]} /></label>
                <label className="text-sm font-medium text-slate-700">数量<Required /><input type="number" min="1" inputMode="numeric" value={product.quantity} onChange={(e) => updateProduct(product.id, "quantity", e.target.value)} className={inputClass} aria-invalid={Boolean(errors[`product-${product.id}-quantity`])} aria-describedby={errors[`product-${product.id}-quantity`] ? `product-${product.id}-quantity-error` : undefined} /><ErrorText id={`product-${product.id}-quantity-error`} message={errors[`product-${product.id}-quantity`]} /></label>
                <label className="text-sm font-medium text-slate-700">色<span className="ml-2 text-xs text-slate-400">任意</span><input value={product.color} onChange={(e) => updateProduct(product.id, "color", e.target.value)} className={inputClass} /></label>
                <label className="text-sm font-medium text-slate-700">サイズ<span className="ml-2 text-xs text-slate-400">任意</span><input value={product.size} onChange={(e) => updateProduct(product.id, "size", e.target.value)} className={inputClass} /></label>
                <label className="text-sm font-medium text-slate-700">型番<span className="ml-2 text-xs text-slate-400">任意</span><input value={product.model} onChange={(e) => updateProduct(product.id, "model", e.target.value)} className={inputClass} /></label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">商品仕様または希望内容<Required /><textarea value={product.request} onChange={(e) => updateProduct(product.id, "request", e.target.value)} className={textareaClass} placeholder="希望する仕様、種類、商品の状態など" aria-invalid={Boolean(errors[`product-${product.id}-request`])} aria-describedby={errors[`product-${product.id}-request`] ? `product-${product.id}-request-error` : undefined} /><ErrorText id={`product-${product.id}-request-error`} message={errors[`product-${product.id}-request`]} /></label>
              </div>
            </fieldset>
          ))}
        </div>
        <button type="button" onClick={addProduct} disabled={products.length >= 10} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-300 bg-blue-50/50 text-sm font-semibold text-blue-700 transition enabled:hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"><CirclePlus size={18} />商品を追加（{products.length}/10）</button>

        <div className="mt-6 rounded-[2rem] border border-slate-100 bg-white p-5 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">ご希望・補足情報</h2>
          <div className="mt-7 grid gap-x-5 gap-y-6 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">出品者に確認したい内容<span className="ml-2 text-xs text-slate-400">任意</span><textarea value={customer.sellerQuestion} onChange={(e) => updateCustomer("sellerQuestion", e.target.value)} className={textareaClass} /></label>
            <label className="text-sm font-medium text-slate-700">希望する配送方法<span className="ml-2 text-xs text-slate-400">任意</span><select value={customer.shipping} onChange={(e) => updateCustomer("shipping", e.target.value)} className={inputClass}>{["おまかせ", "速さを優先", "送料を優先", "未定"].map(item => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">希望納期<span className="ml-2 text-xs text-slate-400">任意</span><input value={customer.deadline} onChange={(e) => updateCustomer("deadline", e.target.value)} className={inputClass} placeholder="例：〇月頃まで" /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">備考<span className="ml-2 text-xs text-slate-400">任意</span><textarea value={customer.notes} onChange={(e) => updateCustomer("notes", e.target.value)} className={textareaClass} /></label>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border border-blue-100 bg-blue-50/60 p-5 sm:p-8">
          <div className="flex items-start gap-3"><Info size={19} className="mt-0.5 shrink-0 text-blue-600" /><ul className="space-y-2 text-sm leading-6 text-slate-600"><li>商品によっては購入または発送できない場合があります。</li><li>真贋、返品、納期を保証するものではありません。</li><li>商品URLや仕様が不明な場合は、分かる範囲でご入力ください。</li><li>パスワード、クレジットカード情報、本人確認書類などは入力しないでください。</li></ul></div>
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-white p-4 text-sm font-medium text-slate-700"><input type="checkbox" checked={customer.privacy} onChange={(e) => updateCustomer("privacy", e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-blue-600" aria-invalid={Boolean(errors.privacy)} aria-describedby={errors.privacy ? "privacy-error" : undefined} /><span><Link href="/privacy" className="text-blue-600 underline decoration-blue-200 underline-offset-4 hover:text-blue-800">プライバシーポリシー</Link>に同意します<Required /><ErrorText id="privacy-error" message={errors.privacy} /></span></label>
        </div>

        <button type="submit" className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-7 text-sm font-semibold text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700">入力内容を確認する<ArrowRight size={18} /></button>
      </form>
    </section>
  );
}
