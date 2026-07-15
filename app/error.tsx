"use client";
import { RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center text-slate-950"><div><p className="text-sm font-bold tracking-[.2em] text-blue-600">500 ERROR</p><h1 className="mt-3 text-3xl font-bold">問題が発生しました</h1><p className="mt-4 text-sm leading-7 text-slate-500">時間をおいて、もう一度お試しください。</p><button type="button" onClick={reset} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-blue-600 px-7 text-sm font-semibold text-white"><RotateCcw size={16} />もう一度試す</button></div></main>;
}
