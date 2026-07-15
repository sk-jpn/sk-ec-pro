"use client";

import { AlertCircle } from "lucide-react";

export default function EstimateError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5"><div className="max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl"><AlertCircle className="mx-auto text-red-500" size={30} /><h1 className="mt-5 text-xl font-semibold">見積を読み込めませんでした</h1><p className="mt-3 text-sm text-slate-600">時間をおいて、もう一度お試しください。</p><button type="button" onClick={reset} className="mt-6 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white">再読み込み</button></div></main>;
}
