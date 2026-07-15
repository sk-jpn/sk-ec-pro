"use client";
import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

export type EstimateImageView = { id: string; url: string; originalName: string };

export function EstimateImageGallery({ images }: { images: EstimateImageView[] }) {
  const [selected, setSelected] = useState<EstimateImageView | null>(null);
  if (!images.length) return <span className="text-slate-400">—</span>;
  return <><div className="grid min-w-36 grid-cols-3 gap-2">{images.map((image, index) => <button key={image.id} type="button" onClick={() => setSelected(image)} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50" aria-label={`画像${index + 1}を拡大`}><Image src={image.url} alt={image.originalName} fill unoptimized className="object-cover" /></button>)}</div>{selected && <div role="dialog" aria-modal="true" aria-label="商品画像" onClick={() => setSelected(null)} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4"><button type="button" onClick={() => setSelected(null)} aria-label="閉じる" className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white text-slate-900"><X size={20} /></button><div className="relative h-[85vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}><Image src={selected.url} alt={selected.originalName} fill unoptimized className="object-contain" /></div></div>}</>;
}
