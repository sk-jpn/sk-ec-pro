"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="ja"><body><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "sans-serif", textAlign: "center", color: "#0f172a", background: "#f8fafc" }}><div><p style={{ color: "#2563eb", fontWeight: 700, letterSpacing: ".2em" }}>500 ERROR</p><h1 style={{ marginTop: 12 }}>問題が発生しました</h1><p style={{ color: "#64748b", lineHeight: 1.8 }}>時間をおいて、もう一度お試しください。</p><button type="button" onClick={reset} style={{ marginTop: 20, border: 0, borderRadius: 999, padding: "12px 24px", color: "white", background: "#2563eb", fontWeight: 700, cursor: "pointer" }}>もう一度試す</button></div></main></body></html>;
}
