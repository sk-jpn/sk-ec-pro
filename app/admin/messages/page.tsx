import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { PageHeader } from "../admin-ui";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AdminMessagesPage() {
  const { data, error } = await createSupabaseAdminClient().from("estimate_messages").select("estimate_id, body, created_at, sender_type, estimates(estimate_no, customers(name))").order("created_at", { ascending: false });
  if (error) throw new Error(`メッセージ一覧を取得できませんでした: ${error.message}`);
  const latest = new Map<string, (typeof data)[number]>();
  for (const message of data ?? []) if (!latest.has(message.estimate_id)) latest.set(message.estimate_id, message);
  return <><PageHeader title="メッセージ" description="見積案件ごとのお客様とのやりとりを確認します。" /><Card><CardContent className="divide-y p-0">{latest.size === 0 ? <p className="p-10 text-center text-sm text-slate-400">メッセージはまだありません。</p> : [...latest.values()].map((message) => { const estimate = message.estimates as unknown as { estimate_no: string; customers: { name: string } | null } | null; return <Link key={message.estimate_id} href={`/admin/estimates/${message.estimate_id}`} className="flex items-start gap-4 p-5 hover:bg-slate-50"><MessageSquare className="mt-1 text-emerald-600" size={18} /><div className="min-w-0 flex-1"><p className="font-semibold">{estimate?.estimate_no ?? "案件"}・{estimate?.customers?.name ?? "顧客"}</p><p className="mt-1 truncate text-sm text-slate-500">{message.body || "添付ファイル"}</p><p className="mt-2 text-xs text-slate-400">{message.sender_type === "admin" ? "管理者" : "お客様"}・{new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short" }).format(new Date(message.created_at))}</p></div></Link>; })}</CardContent></Card></>;
}
