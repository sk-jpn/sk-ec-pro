import "server-only";
import { ESTIMATE_IMAGE_BUCKET } from "@/lib/estimates/image-files";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function deleteCustomerData({
  customerIds,
  authUserId,
  deleteUnreferencedAuthUsers = true,
}: {
  customerIds?: string[];
  authUserId?: string;
  deleteUnreferencedAuthUsers?: boolean;
}) {
  const admin = createSupabaseAdminClient();
  const customerQuery = admin.from("customers").select("id, auth_user_id");
  const { data: customers, error: customerError } = authUserId
    ? await customerQuery.eq("auth_user_id", authUserId)
    : await customerQuery.in("id", customerIds ?? []);
  if (customerError) throw customerError;

  const selectedCustomerIds = (customers ?? []).map((customer) => customer.id);
  if (customerIds && selectedCustomerIds.length !== customerIds.length) throw new Error("customer not found");
  const candidateAuthUserIds = new Set<string>();
  if (authUserId) candidateAuthUserIds.add(authUserId);
  for (const customer of customers ?? []) {
    if (customer.auth_user_id) candidateAuthUserIds.add(customer.auth_user_id);
  }

  let storagePaths: string[] = [];
  if (selectedCustomerIds.length) {
    const { data: estimates, error: estimateError } = await admin.from("estimates").select("id").in("customer_id", selectedCustomerIds);
    if (estimateError) throw estimateError;
    const estimateIds = (estimates ?? []).map((estimate) => estimate.id);

    if (estimateIds.length) {
      const { data: items, error: itemError } = await admin.from("estimate_items").select("id").in("estimate_id", estimateIds);
      if (itemError) throw itemError;
      const itemIds = (items ?? []).map((item) => item.id);
      if (itemIds.length) {
        const [{ data: estimateImages, error: estimateImageError }, { data: receivedImages, error: receivedImageError }] = await Promise.all([
          admin.from("estimate_item_images").select("storage_path").in("estimate_item_id", itemIds),
          admin.from("received_item_images").select("storage_path").in("estimate_item_id", itemIds),
        ]);
        if (estimateImageError) throw estimateImageError;
        if (receivedImageError) throw receivedImageError;
        storagePaths = [...(estimateImages ?? []), ...(receivedImages ?? [])].map((image) => image.storage_path);
      }
    }

    const { error: orderDeleteError } = await admin.from("orders").delete().in("customer_id", selectedCustomerIds);
    if (orderDeleteError) throw orderDeleteError;
    if (estimateIds.length) {
      const { error: estimateDeleteError } = await admin.from("estimates").delete().in("id", estimateIds);
      if (estimateDeleteError) throw estimateDeleteError;
    }
    const { error: customerDeleteError } = await admin.from("customers").delete().in("id", selectedCustomerIds);
    if (customerDeleteError) throw customerDeleteError;
  }

  for (let index = 0; index < storagePaths.length; index += 100) {
    const { error } = await admin.storage.from(ESTIMATE_IMAGE_BUCKET).remove(storagePaths.slice(index, index + 100));
    if (error) console.error("削除済み顧客の画像をStorageから削除できませんでした。", error);
  }

  if (deleteUnreferencedAuthUsers) {
    for (const candidateAuthUserId of candidateAuthUserIds) {
      const { count, error: remainingError } = await admin
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("auth_user_id", candidateAuthUserId);
      if (remainingError) {
        console.error("同一アカウントの残存顧客を確認できませんでした。", remainingError);
        continue;
      }
      if ((count ?? 0) === 0) {
        const { error: authDeleteError } = await admin.auth.admin.deleteUser(candidateAuthUserId);
        if (authDeleteError) throw authDeleteError;
      }
    }
  }

  return { customerCount: selectedCustomerIds.length, storageFileCount: storagePaths.length };
}
