import "server-only";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type FormKind = "contact" | "estimate";
type TurnstileResponse = { success?: boolean; action?: string; "error-codes"?: string[] };

export type ProtectionFailure = { message: string; status: number };

function clientIp(request: Request) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

async function checkRateLimit(request: Request, form: FormKind): Promise<ProtectionFailure | null> {
  const ipHash = createHash("sha256").update(clientIp(request)).digest("hex");
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc("check_form_submission_rate_limit", { p_form_key: form, p_ip_hash: ipHash, p_limit: 3 });
    if (error) throw error;
    if (data !== true) return { message: "送信回数が上限に達しました。1分ほど待ってから再度お試しください。", status: 429 };
    return null;
  } catch (error) {
    console.error("フォームのレート制限を確認できませんでした。", error);
    return { message: "現在送信を受け付けられません。時間をおいて再度お試しください。", status: 503 };
  }
}

async function verifyTurnstile(request: Request, token: string, form: FormKind): Promise<ProtectionFailure | null> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY が設定されていません。");
    return { message: "認証サービスの設定が完了していません。", status: 503 };
  }
  if (!token || token.length > 2048) return { message: "認証に失敗しました。もう一度お試しください。", status: 400 };

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: clientIp(request), idempotency_key: crypto.randomUUID() }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Siteverify returned ${response.status}`);
    const result = await response.json() as TurnstileResponse;
    if (!result.success || result.action !== form) {
      console.warn("Turnstile認証を拒否しました。", { form, action: result.action, errorCodes: result["error-codes"] });
      return { message: "認証に失敗しました。もう一度お試しください。", status: 400 };
    }
    return null;
  } catch (error) {
    console.error("Turnstile認証サービスへ接続できませんでした。", error);
    return { message: "認証サービスへ接続できませんでした。時間をおいて再度お試しください。", status: 503 };
  }
}

export async function protectFormSubmission(request: Request, form: FormKind, token: string, honeypot: string): Promise<ProtectionFailure | null> {
  if (honeypot) return { message: "送信を受け付けられませんでした。", status: 400 };
  const rateLimitFailure = await checkRateLimit(request, form);
  if (rateLimitFailure) return rateLimitFailure;
  return verifyTurnstile(request, token, form);
}
