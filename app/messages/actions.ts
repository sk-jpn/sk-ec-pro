"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { MESSAGE_BUCKET } from "@/lib/messages/case-messages";

export type SendMessageState = { success: boolean; message: string };
const UUID = /^[0-9a-f-]{36}$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function sendCaseMessage(_state: SendMessageState, formData: FormData): Promise<SendMessageState> {
  const estimateId = formData.get("estimateId");
  const senderType = formData.get("senderType");
  const bodyValue = formData.get("body");
  if (typeof estimateId !== "string" || !UUID.test(estimateId) || (senderType !== "admin" && senderType !== "customer")) return { success: false, message: "案件情報が正しくありません。" };
  const body = typeof bodyValue === "string" ? bodyValue.trim().slice(0, 5000) : "";
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (!body && files.length === 0) return { success: false, message: "メッセージまたはファイルを入力してください。" };
  if (files.length > 1 || files.some((file) => file.size > MAX_FILE_SIZE)) return { success: false, message: "添付は1送信につき1ファイル、10MB以下にしてください。" };

  let userId: string;
  if (senderType === "admin") userId = (await requireAdminUser()).id;
  else {
    const { user, supabase } = await requireCustomerUser();
    const { data } = await supabase.from("estimates").select("id").eq("id", estimateId).maybeSingle();
    if (!data) return { success: false, message: "この案件へメッセージを送信できません。" };
    userId = user.id;
  }

  const admin = createSupabaseAdminClient();
  const { data: message, error } = await admin.from("estimate_messages").insert({ estimate_id: estimateId, sender_type: senderType, sender_user_id: userId, body }).select("id").single();
  if (error || !message) return { success: false, message: "メッセージを保存できませんでした。" };
  const uploaded: string[] = [];
  try {
    for (const [index, file] of files.entries()) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || `file-${index + 1}`;
      const path = `${estimateId}/${message.id}/${index + 1}-${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await admin.storage.from(MESSAGE_BUCKET).upload(path, await file.arrayBuffer(), { contentType: file.type || "application/octet-stream" });
      if (uploadError) throw uploadError;
      uploaded.push(path);
      const isImage = file.type.startsWith("image/");
      const expiresAt = isImage ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null;
      const { error: recordError } = await admin.from("estimate_message_attachments").insert({ message_id: message.id, storage_path: path, original_name: file.name.slice(0, 255), mime_type: file.type || "application/octet-stream", file_size: file.size, is_image: isImage, expires_at: expiresAt });
      if (recordError) throw recordError;
    }
  } catch (uploadError) {
    if (uploaded.length) await admin.storage.from(MESSAGE_BUCKET).remove(uploaded);
    await admin.from("estimate_messages").delete().eq("id", message.id);
    console.error("メッセージ添付の保存に失敗しました。", uploadError);
    return { success: false, message: "添付ファイルを保存できませんでした。" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (apiKey && from) {
    try {
      const { data: estimate } = await admin.from("estimates").select("estimate_no, customer_id").eq("id", estimateId).maybeSingle();
      const estimateNo = estimate?.estimate_no ?? estimateId;
      const { data: customer } = estimate
        ? await admin.from("customers").select("email").eq("id", estimate.customer_id).maybeSingle()
        : { data: null };
      const customerEmail = customer?.email;
      const resend = new Resend(apiKey);
      if (senderType === "customer") {
        await resend.emails.send({
          from: from.includes("<") ? from : `Formosa Inc <${from}>`,
          to: [from],
          replyTo: from,
          subject: `【SK EC Pro】メッセージを受信しました（案件 ${estimateNo}）`,
          text: `新しいメッセージを受信しました。

案件番号: ${estimateNo}
送信者: お客様

マイページにログインしてご確認ください。`,
        });
      } else if (customerEmail) {
        await resend.emails.send({
          from: from.includes("<") ? from : `Formosa Inc <${from}>`,
          to: [customerEmail],
          replyTo: from,
          subject: `【SK EC Pro】メッセージを受信しました（案件 ${estimateNo}）`,
          text: `新しいメッセージを受信しました。

案件番号: ${estimateNo}
送信者: 管理者

マイページにログインしてご確認ください。`,
        });
      }
    } catch (sendError) {
      console.error("メッセージ通知メールの送信に失敗しました。", sendError);
    }
  }

  revalidatePath(`/admin/estimates/${estimateId}`);
  revalidatePath(`/account/estimates/${estimateId}`);
  return { success: true, message: "メッセージを送信しました。" };
}
