import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const MESSAGE_BUCKET = "estimate-messages";

export type CaseMessage = {
  id: string; sender_type: "customer" | "admin"; body: string; created_at: string;
  attachments: { id: string; original_name: string; mime_type: string; is_image: boolean; deleted_at: string | null; url: string | null }[];
};

export async function loadCaseMessages(estimateId: string): Promise<CaseMessage[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("estimate_messages")
    .select("id, sender_type, body, created_at, estimate_message_attachments(id, storage_path, original_name, mime_type, is_image, deleted_at)")
    .eq("estimate_id", estimateId).order("created_at");
  if (error) throw new Error(`メッセージを取得できませんでした: ${error.message}`);
  const paths = (data ?? []).flatMap((message) => message.estimate_message_attachments.flatMap((file) => file.storage_path && !file.deleted_at ? [file.storage_path] : []));
  const { data: signed } = paths.length ? await supabase.storage.from(MESSAGE_BUCKET).createSignedUrls(paths, 60 * 60) : { data: [] };
  const urlByPath = new Map((signed ?? []).map((item, index) => [paths[index], item.signedUrl]));
  return (data ?? []).map((message) => ({
    id: message.id, sender_type: message.sender_type as "customer" | "admin", body: message.body, created_at: message.created_at,
    attachments: message.estimate_message_attachments.map((file) => ({ id: file.id, original_name: file.original_name, mime_type: file.mime_type, is_image: file.is_image, deleted_at: file.deleted_at, url: file.storage_path && !file.deleted_at ? urlByPath.get(file.storage_path) ?? null : null })),
  }));
}

export async function cleanupExpiredCaseImages() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("estimate_message_attachments").select("id, storage_path")
    .eq("is_image", true).is("deleted_at", null).lt("expires_at", new Date().toISOString());
  if (error || !data?.length) return;
  const paths = data.flatMap((row) => row.storage_path ? [row.storage_path] : []);
  if (paths.length) await supabase.storage.from(MESSAGE_BUCKET).remove(paths);
  await supabase.from("estimate_message_attachments").update({ storage_path: null, deleted_at: new Date().toISOString() }).in("id", data.map((row) => row.id));
}
