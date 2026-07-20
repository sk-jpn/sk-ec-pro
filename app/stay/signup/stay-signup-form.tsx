"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { withBasePath } from "@/config/site";
import { prepareStaySignup } from "./actions";
import { StayLocalized } from "../stay-language";

export function StaySignupForm() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [loading, setLoading] = useState<"google"|"azure"|null>(null); const [error, setError] = useState("");
  const valid = name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  async function signup(provider:"google"|"azure",label:string) { if (!valid) return; setLoading(provider); setError(""); const prepared = await prepareStaySignup(name, email); if (!prepared.success) { setError(prepared.message); setLoading(null); return; } const supabase = createSupabaseBrowserClient(); const { error: authError } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}${withBasePath("/auth/callback")}?next=%2Fstay%2Fmypage&mode=stay_signup`, ...(provider === "azure" ? { scopes: "email" } : {}) } }); if (authError) { setError(`${label}アカウント作成を開始できませんでした。`); setLoading(null); } }
  return <StayLocalized><div className="space-y-4"><label className="grid gap-2 text-sm font-medium">顧客名<Input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} disabled={loading!==null} required /></label><label className="grid gap-2 text-sm font-medium">メールアドレス<Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" maxLength={254} disabled={loading!==null} required /><span className="text-xs font-normal text-slate-400">予約確認などの連絡を受け取るメールアドレスを入力してください。</span></label><div className="grid gap-3"><Button type="button" size="lg" className="w-full" disabled={!valid || loading!==null} onClick={()=>signup("google","Google")}>{loading==="google"&&<LoaderCircle className="size-5 animate-spin"/>}{loading==="google"?"Googleへ移動しています…":"Googleでアカウント作成"}</Button><Button type="button" size="lg" variant="outline" className="w-full" disabled={!valid || loading!==null} onClick={()=>signup("azure","Microsoft")}>{loading==="azure"?<LoaderCircle className="size-5 animate-spin"/>:<span aria-hidden="true" className="grid grid-cols-2 gap-0.5">{["#f25022","#7fba00","#00a4ef","#ffb900"].map((color)=><i key={color} className="size-2" style={{backgroundColor:color}}/>)}</span>}{loading==="azure"?"Microsoftへ移動しています…":"Microsoftでアカウント作成"}</Button></div>{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}</div></StayLocalized>;
}
