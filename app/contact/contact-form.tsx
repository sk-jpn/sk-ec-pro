"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { withBasePath } from "@/config/site";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSending(true); setError(""); const form = new FormData(event.currentTarget); try { const response = await fetch(withBasePath("/api/contact"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) }); const result = await response.json().catch(() => null) as { message?: string } | null; if (!response.ok) throw new Error(result?.message || "送信に失敗しました。"); setSent(true); } catch (reason) { setError(reason instanceof Error ? reason.message : "送信に失敗しました。"); } finally { setSending(false); } }
  if (sent) return <div role="status" className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-10 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={36} /><h2 className="mt-5 text-2xl font-semibold">お問い合わせを受け付けました</h2><p className="mt-3 text-sm text-slate-600">内容を確認後、担当者よりご連絡いたします。</p></div>;
  const field = "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  return <form onSubmit={submit} className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-[0_20px_60px_-45px_rgba(15,23,42,.35)] sm:p-8"><div className="grid gap-6 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">お名前 <span className="text-red-600">*</span><input required name="name" autoComplete="name" className={field} /></label><label className="text-sm font-medium text-slate-700">メールアドレス <span className="text-red-600">*</span><input required type="email" name="email" autoComplete="email" className={field} /></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">お問い合わせ種別<select name="topic" className={field}><option>サービスについて</option><option>当社オリジナル製品について</option><option>当社運営ショップについて</option><option>その他</option></select></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">お問い合わせ内容 <span className="text-red-600">*</span><textarea required name="message" rows={7} className={`${field} py-3`} /></label></div><p className="mt-5 text-xs leading-6 text-slate-500">見積をご希望の場合は、商品画像を添付できる無料見積フォームをご利用ください。</p>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}<button disabled={sending} className="mt-7 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-7 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{sending ? "送信中…" : "お問い合わせを送信"}<Send size={17} /></button></form>;
}
