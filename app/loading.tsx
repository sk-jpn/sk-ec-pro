import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return <div className="grid min-h-64 place-items-center" role="status"><div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm"><LoaderCircle className="size-5 animate-spin text-emerald-600" />読み込み中…</div></div>;
}
