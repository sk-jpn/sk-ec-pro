"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

const SCRIPT_ID = "cloudflare-turnstile-script";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const LOAD_TIMEOUT_MS = 10_000;

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi; }
}

export type TurnstileWidgetHandle = { reset: () => void };

type Props = {
  action: "contact" | "estimate";
  onTokenChange: (token: string) => void;
};

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, Props>(function TurnstileWidget({ action, onTokenChange }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    onTokenChange("");
    if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
  }, [onTokenChange]);

  useImperativeHandle(ref, () => ({ reset }), [reset]);

  useEffect(() => {
    let cancelled = false;

    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
      setError("");
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        action,
        theme: "light",
        callback: (token: string) => { setError(""); onTokenChange(token); },
        "expired-callback": () => { onTokenChange(""); setError("認証の有効期限が切れました。もう一度お試しください。"); },
        "error-callback": () => { onTokenChange(""); setError("認証に失敗しました。もう一度お試しください。"); },
        "timeout-callback": () => { onTokenChange(""); setError("認証がタイムアウトしました。もう一度お試しください。"); },
      });
    };

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      setError("認証サービスの設定を確認できません。時間をおいて再度お試しください。");
      return;
    }

    if (window.turnstile) {
      render();
      return () => { cancelled = true; };
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const handleLoad = () => render();
    const handleError = () => setError("認証サービスを読み込めませんでした。再試行してください。");
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    const timer = setTimeout(() => {
      if (!window.turnstile && !cancelled) setError("認証サービスを読み込めませんでした。再試行してください。");
    }, LOAD_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [action, loadAttempt, onTokenChange]);

  const retry = () => {
    if (widgetIdRef.current && window.turnstile) {
      reset();
      setError("");
      return;
    }
    document.getElementById(SCRIPT_ID)?.remove();
    setError("");
    setLoadAttempt((current) => current + 1);
  };

  return <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div ref={containerRef} className="min-h-[65px]" aria-label="ボット対策認証" />
    {error && <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-red-700"><span>{error}</span><button type="button" onClick={retry} className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs hover:bg-red-50">認証を再試行</button></div>}
  </div>;
});
