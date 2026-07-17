import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireCustomerUser } from "@/lib/auth/require-customer";

export default async function AccountMessagesPage() {
  const { supabase } = await requireCustomerUser();
  const { data, error } = await supabase.from("estimate_messages").select("estimate_id, body, created_at, sender_type, estimates(estimate_no)").order("created_at", { ascending: false });
  if (error) throw new Error(`メッセージ一覧を取得できませんでした: ${error.message}`);
  const latest = new Map<string, (typeof data)[number]>();
  for (const message of data ?? []) if (!latest.has(message.estimate_id)) latest.set(message.estimate_id, message);
  return <><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Messages</p><h1 className="mt-2 text-3xl font-bold">メッセージ</h1><p className="mt-3 text-sm text-slate-500">案件ごとのSK EC Proとのやりとりです。</p><Card className="mt-7"><CardContent className="divide-y p-0">{latest.size === 0 ? <p className="p-10 text-center text-sm text-slate-400">メッセージはまだありません。</p> : [...latest.values()].map((message) => { const estimate = message.estimates as unknown as { estimate_no: string } | null; return <Link key={message.estimate_id} href={`/account/estimates/${message.estimate_id}`} className="flex items-start gap-4 p-5 hover:bg-slate-50"><MessageSquare className="mt-1 text-blue-600" size={18} /><div className="min-w-0 flex-1"><p className="font-semibold">{estimate?.estimate_no ?? "案件"}</p><p className="mt-1 truncate text-sm text-slate-500">{message.body || "添付ファイル"}</p><p className="mt-2 text-xs text-slate-400">{message.sender_type === "admin" ? "SK EC Pro" : "お客様"}・{new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short" }).format(new Date(message.created_at))}</p></div></Link>; })}</CardContent></Card></>;
}
