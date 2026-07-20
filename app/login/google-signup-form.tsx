"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { withBasePath } from "@/config/site";
import { prepareCustomerSignup } from "./actions";

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.63.39 3.17 1.04 4.55l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"/></svg>;
}

type OAuthProvider = "google" | "azure";
const signupProviders: { id: OAuthProvider; label: string; icon: React.ReactNode }[] = [
  { id: "google", label: "Google", icon: <GoogleIcon /> },
  { id: "azure", label: "Microsoft", icon: <span aria-hidden="true" className="grid grid-cols-2 gap-0.5">{["#f25022", "#7fba00", "#00a4ef", "#ffb900"].map((color) => <i key={color} className="size-2" style={{ backgroundColor: color }} />)}</span> },
];

export function GoogleSignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState("");
  const canSubmit = name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function signup(provider: OAuthProvider, label: string) {
    if (!canSubmit) return;
    setLoading(provider);
    setError("");
    const prepared = await prepareCustomerSignup(name, email);
    if (!prepared.success) {
      setError(prepared.message);
      setLoading(null);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${withBasePath("/auth/callback")}?next=%2Faccount&mode=signup`, ...(provider === "azure" ? { scopes: "email" } : {}) },
    });
    if (authError) {
      setError(`${label}アカウント作成を開始できませんでした。`);
      setLoading(null);
    }
  }

  return <div className="space-y-4">
    <label className="grid gap-2 text-sm font-medium text-slate-700">顧客名<Input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required disabled={loading !== null} /></label>
    <label className="grid gap-2 text-sm font-medium text-slate-700">連絡用メールアドレス<Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" maxLength={254} required disabled={loading !== null} /><span className="text-xs font-normal leading-5 text-slate-400">見積や発送に関するご連絡先です。認証サービスのメールと異なっていても登録できます。</span></label>
    <div className="space-y-3">{signupProviders.map(({ id, label, icon }) => <Button key={id} type="button" size="lg" variant={id === "google" ? "default" : "outline"} className="w-full" onClick={() => signup(id, label)} disabled={!canSubmit || loading !== null}>
      {loading === id ? <LoaderCircle className="animate-spin" size={20} /> : icon}
      {loading === id ? `${label}へ移動しています…` : `${label}でアカウント作成`}
    </Button>)}</div>
    {error && <p role="alert" className="text-center text-sm text-red-600">{error}</p>}
  </div>;
}
