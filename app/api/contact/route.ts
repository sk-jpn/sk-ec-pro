import { Resend } from "resend";

function text(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ message: "送信内容を確認できませんでした。" }, { status: 400 }); }
  if (!body || typeof body !== "object") return Response.json({ message: "入力内容を確認してください。" }, { status: 400 });
  const record = body as Record<string, unknown>;
  const name = text(record.name, 100); const email = text(record.email, 254); const topic = text(record.topic, 100); const message = text(record.message, 5000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) return Response.json({ message: "必須項目を正しく入力してください。" }, { status: 400 });
  const apiKey = process.env.RESEND_API_KEY; const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return Response.json({ message: "メール送信の設定が完了していません。" }, { status: 503 });
  try {
    const { error } = await new Resend(apiKey).emails.send({ from, to: [from], replyTo: email, subject: `【SK EC Pro お問い合わせ】${topic || "その他"}（${name}様）`, html: `<h1>お問い合わせ</h1><p><strong>お名前:</strong> ${escapeHtml(name)}</p><p><strong>メール:</strong> ${escapeHtml(email)}</p><p><strong>種別:</strong> ${escapeHtml(topic)}</p><p><strong>内容:</strong></p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>` });
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (error) { console.error("お問い合わせメールの送信に失敗しました。", error); return Response.json({ message: "送信に失敗しました。時間をおいて再度お試しください。" }, { status: 502 }); }
}
