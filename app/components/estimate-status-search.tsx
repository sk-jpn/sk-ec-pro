"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";

const demoStatuses: Record<string, string> = {
  "SK-2026-0001": "受付済", "SK-2026-0002": "見積作成中", "SK-2026-0003": "入金待ち", "SK-2026-0004": "発送準備中", "SK-2026-0005": "発送済",
};

export function EstimateStatusSearch() {
  const [number, setNumber] = useState("");
  const [result, setResult] = useState<{ number: string; status?: string } | null>(null);
  function search(event: FormEvent) { event.preventDefault(); const normalized = number.trim().toUpperCase(); if (normalized) setResult({ number: normalized, status: demoStatuses[normalized] }); }
  return <section className="border-y border-slate-100 bg-slate-950 py-20 text-white sm:py-24"><div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-10"><div><p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-blue-300">Estimate Tracking</p><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">見積番号検索</h2><p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">見積番号から現在の進行状況を確認できます。デモでは SK-2026-0001〜0005 をお試しください。</p></div><div className="rounded-[1.75rem] bg-white p-5 text-slate-950 sm:p-7"><form onSubmit={search} className="flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="estimate-number">見積番号</label><input id="estimate-number" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="例：SK-2026-0001" className="min-h-13 flex-1 rounded-xl border border-slate-200 px-4 text-base uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /><button className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700"><Search size={17} />検索する</button></form>{result && <div aria-live="polite" className={`mt-5 rounded-xl border p-4 ${result.status ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>{result.status ? <div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-600" size={21} /><div><p className="text-xs text-slate-500">{result.number}</p><p className="mt-1 font-semibold text-slate-900">現在のステータス：{result.status}</p></div></div> : <p className="text-sm font-medium text-amber-800">該当する見積番号が見つかりませんでした。</p>}</div>}</div></div></section>;
}
