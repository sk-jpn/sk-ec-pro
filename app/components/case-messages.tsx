"use client";
/* eslint-disable @next/next/no-img-element -- private signed URLs are intentionally not sent through the image optimizer */

import { useActionState } from "react";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendCaseMessage, type SendMessageState } from "@/app/messages/actions";
import type { CaseMessage } from "@/lib/messages/case-messages";

const initial: SendMessageState = { success: false, message: "" };

export function CaseMessages({ estimateId, viewer, messages }: { estimateId: string; viewer: "customer" | "admin"; messages: CaseMessage[] }) {
  const [state, action, pending] = useActionState(sendCaseMessage, initial);
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
    <h2 className="text-lg font-bold">メッセージ</h2>
    <p className="mt-2 text-xs leading-6 text-slate-500">画像は送信から3か月後に削除されます。その他のメッセージと添付ファイルは保存されます。</p>
    <div className="mt-6 max-h-[32rem] space-y-4 overflow-y-auto rounded-xl bg-slate-50 p-4">
      {messages.length === 0 && <p className="py-8 text-center text-sm text-slate-400">メッセージはまだありません。</p>}
      {messages.map((message) => <article key={message.id} className={`max-w-[90%] rounded-2xl p-4 ${message.sender_type === viewer ? "ml-auto bg-blue-600 text-white" : "bg-white text-slate-800 shadow-sm"}`}>
        <p className="whitespace-pre-wrap text-sm leading-7">{message.body}</p>
        {message.attachments.length > 0 && <div className="mt-3 grid gap-2">{message.attachments.map((file) => file.deleted_at || !file.url ? <p key={file.id} className="rounded-lg bg-black/5 px-3 py-2 text-xs">（期間が過ぎたため、画像が削除されました）</p> : file.is_image ? <a key={file.id} href={file.url} target="_blank" rel="noreferrer"><img src={file.url} alt={file.original_name} className="max-h-64 rounded-lg object-contain" /></a> : <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-black/5 px-3 py-2 text-xs underline"><Paperclip size={14} />{file.original_name}</a>)}</div>}
        <p className={`mt-2 text-[11px] ${message.sender_type === viewer ? "text-blue-100" : "text-slate-400"}`}>{message.sender_type === "admin" ? "管理者" : "お客様"}・{new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short" }).format(new Date(message.created_at))}</p>
      </article>)}
    </div>
    <form action={action} className="mt-5 grid gap-3">
      <input type="hidden" name="estimateId" value={estimateId} /><input type="hidden" name="senderType" value={viewer} />
      <textarea name="body" rows={4} maxLength={5000} placeholder="メッセージを入力してください" className="rounded-xl border border-slate-200 p-3 text-sm" disabled={pending} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600"><Paperclip size={16} /><input name="files" type="file" className="max-w-64 text-xs" disabled={pending} />1ファイル・10MB以下</label><Button type="submit" disabled={pending}><Send size={16} />{pending ? "送信中…" : "送信"}</Button></div>
      {state.message && <p className={`text-sm ${state.success ? "text-emerald-600" : "text-red-600"}`}>{state.message}</p>}
    </form>
  </section>;
}
