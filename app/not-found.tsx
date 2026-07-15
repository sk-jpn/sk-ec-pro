import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center text-slate-950"><div><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-blue-50 text-blue-600"><SearchX size={28} /></span><p className="mt-7 text-sm font-bold tracking-[.2em] text-blue-600">404 NOT FOUND</p><h1 className="mt-3 text-3xl font-bold">ページが見つかりません</h1><p className="mt-4 text-sm leading-7 text-slate-500">URLをご確認いただくか、トップページへお戻りください。</p><Link href="/" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-blue-600 px-7 text-sm font-semibold text-white">トップページへ戻る</Link></div></main>;
}
