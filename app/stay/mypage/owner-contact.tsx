"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import lineQr from "@/public/stay/line.png";
import wechatQr from "@/public/stay/wechat.png";
import whatsappQr from "@/public/stay/whatsapp.png";
import { StayLocalized } from "../stay-language";

const contacts = [
  { id: "whatsapp", label: "WhatsApp", qr: whatsappQr, href: "https://wa.me/qr/RL5DXGDIHEBXH1", color: "text-[#18a957]", active: "border-[#25D366] bg-[#25D366]/10 text-[#128C4A]" },
  { id: "line", label: "LINE", qr: lineQr, href: "https://line.me/ti/p/iBC1aHIgX3", color: "text-[#06C755]", active: "border-[#06C755] bg-[#06C755]/10 text-[#048d3e]" },
  { id: "wechat", label: "WeChat", qr: wechatQr, href: "https://u.wechat.com/kCf2j4mQ3-8YCVmjLPzqVlY", color: "text-[#07C160]", active: "border-[#07C160] bg-[#07C160]/10 text-[#078a48]" },
] as const;

export function OwnerContact() {
  const [selectedId, setSelectedId] = useState<(typeof contacts)[number]["id"]>("whatsapp");
  const selected = contacts.find((contact) => contact.id === selectedId) ?? contacts[0];
  return <StayLocalized><section className="mt-9 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white p-5 sm:p-6">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white"><MessageCircle size={20} /></span><div><h2 className="text-lg font-bold">オーナーと連絡を取る</h2><p className="mt-1 text-sm text-slate-500">使いやすい連絡方法を選択してください。</p></div></div>
    </div>
    <div className="p-5 sm:p-6">
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="連絡方法">
        {contacts.map((contact) => <button key={contact.id} type="button" role="tab" aria-selected={selectedId === contact.id} onClick={() => setSelectedId(contact.id)} className={cn("min-h-11 rounded-xl border px-2 py-2 text-sm font-bold transition", selectedId === contact.id ? contact.active : "border-slate-200 text-slate-500 hover:bg-slate-50")}>{contact.label}</button>)}
      </div>
      <div className="mt-6 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
        <div><p className={cn("text-xs font-bold uppercase tracking-[.18em]", selected.color)}>{selected.label}</p><h3 className="mt-2 text-xl font-bold">QRコードをスキャン</h3><p className="mt-3 text-sm leading-6 text-slate-500">スマートフォンのカメラで読み取るか、下のボタンから直接追加できます。</p><Button asChild size="lg" className="mt-5 w-full sm:w-auto"><a href={selected.href} target="_blank" rel="noopener noreferrer">{selected.label}で追加する<ExternalLink size={16} /></a></Button></div>
        <div className="mx-auto w-full max-w-[280px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><Image key={selected.id} src={selected.qr} alt={`${selected.label}の連絡先追加QRコード`} className="h-auto w-full" priority={selected.id === "whatsapp"} /></div>
      </div>
    </div>
  </section></StayLocalized>;
}
