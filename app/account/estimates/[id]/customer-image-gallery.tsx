"use client";
import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

export type CustomerEstimateImage = { id: string; url: string; name: string };

export function CustomerImageGallery({ images }: { images: CustomerEstimateImage[] }) {
  const [selected, setSelected] = useState<CustomerEstimateImage | null>(null);
  if (!images.length) return <p className="text-sm text-slate-400">画像なし</p>;
  return <><div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{images.map((image, index) => <button key={image.id} type="button" onClick={() => setSelected(image)} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50" aria-label={`商品画像${index + 1}を拡大`}><Image src={image.url} alt={image.name} fill unoptimized className="object-cover" /></button>)}</div>{selected && <div role="dialog" aria-modal="true" aria-label="商品画像の拡大表示" onClick={() => setSelected(null)} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/85 p-4"><button type="button" onClick={() => setSelected(null)} aria-label="閉じる" className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white text-slate-900"><X size={20} /></button><div className="relative h-[85vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}><Image src={selected.url} alt={selected.name} fill unoptimized className="object-contain" /></div></div>}</>;
}
