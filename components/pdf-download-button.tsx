"use client";

import { useState } from "react";
import { Download, ExternalLink, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PdfDownloadButton({ href, label, fileName, openInNewTab = false, receiptLanguage = false }: { href: string; label: string; fileName: string; openInNewTab?: boolean; receiptLanguage?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locale, setLocale] = useState("ja");

  async function download() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const separator = href.includes("?") ? "&" : "?";
      const response = await fetch(receiptLanguage ? `${href}${separator}locale=${encodeURIComponent(locale)}` : href, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(data?.message || "PDFを作成できませんでした。");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (openInNewTab) {
        const opened = window.open(url, "_blank", "noopener,noreferrer");
        if (!opened) {
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = fileName;
          anchor.click();
        }
      } else {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "PDFを作成できませんでした。");
    } finally {
      setLoading(false);
    }
  }

  return <span className="inline-flex flex-col items-start gap-1">
    {receiptLanguage && <select aria-label="領収書の言語" value={locale} onChange={(event) => setLocale(event.target.value)} disabled={loading} className="min-h-9 rounded-md border border-slate-200 bg-white px-2 text-sm">
      <option value="ja">日本語</option><option value="en">English</option><option value="zh-CN">简体中文</option><option value="ko">한국어</option><option value="zh-TW">繁體中文</option>
    </select>}
    <Button type="button" variant="outline" onClick={download} disabled={loading} aria-busy={loading}>
      {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : openInNewTab ? <ExternalLink aria-hidden="true" className="size-4" /> : <Download aria-hidden="true" className="size-4" />}
      {loading ? "PDF作成中…" : label}
    </Button>
    {error && <span role="alert" className="max-w-xs text-xs font-medium text-red-600">{error}</span>}
  </span>;
}
