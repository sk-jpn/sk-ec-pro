"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { withBasePath } from "@/config/site";

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.63.39 3.17 1.04 4.55l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"/></svg>;
}

export function GoogleLoginButton({ next = "/account" }: { next?: "/admin" | "/account" | "/estimate" | "/stay/mypage" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${withBasePath("/auth/callback")}?next=${encodeURIComponent(next)}` },
    });
    if (authError) {
      setError("Googleログインを開始できませんでした。");
      setLoading(false);
    }
  }

  return <div className="space-y-3">
    <Button type="button" variant="outline" size="lg" className="w-full border-slate-300 bg-white text-slate-800 shadow-sm" onClick={login} disabled={loading}>
      {loading ? <LoaderCircle className="animate-spin" size={20} /> : <GoogleIcon />}
      {loading ? "Googleへ移動しています…" : "Googleでログイン"}
    </Button>
    {error && <p role="alert" className="text-center text-sm text-red-600">{error}</p>}
  </div>;
}
