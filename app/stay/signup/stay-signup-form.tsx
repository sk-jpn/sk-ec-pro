"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { withBasePath } from "@/config/site";
import { prepareStaySignup } from "./actions";

export function StaySignupForm() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const valid = name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  async function signup() { if (!valid) return; setLoading(true); setError(""); const prepared = await prepareStaySignup(name, email); if (!prepared.success) { setError(prepared.message); setLoading(false); return; } const supabase = createSupabaseBrowserClient(); const { error: authError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}${withBasePath("/auth/callback")}?next=%2Fstay%2Fmypage&mode=stay_signup` } }); if (authError) { setError("Googleアカウント作成を開始できませんでした。"); setLoading(false); } }
  return <div className="space-y-4"><label className="grid gap-2 text-sm font-medium">顧客名<Input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} disabled={loading} required /></label><label className="grid gap-2 text-sm font-medium">メールアドレス<Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" maxLength={254} disabled={loading} required /><span className="text-xs font-normal text-slate-400">予約確認などの連絡を受け取るメールアドレスを入力してください。</span></label><Button type="button" size="lg" className="w-full" disabled={!valid || loading} onClick={signup}>{loading && <LoaderCircle className="size-5 animate-spin" />}{loading ? "Googleへ移動しています…" : "Googleでアカウント作成"}</Button>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</div>;
}
