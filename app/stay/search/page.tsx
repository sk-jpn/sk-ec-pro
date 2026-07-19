import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { StaySearchFlow } from "./search-flow";

export default async function SearchPage() {
  const admin = createSupabaseAdminClient();
  const [{ data: listings }, { data: buildingImages }] = await Promise.all([admin.from("stay_listings").select("id,code,name,max_guests,base_price,cleaning_fee").eq("is_active", true).eq("is_public", true).eq("booking_enabled", true).order("sort_order"), admin.from("stay_building_images").select("building_code,storage_path")]);
  const images = Object.fromEntries((buildingImages ?? []).map((image) => [image.building_code, admin.storage.from("stay-listings").getPublicUrl(image.storage_path).data.publicUrl]));
  return <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Stay Search</p><h1 className="mt-2 text-3xl font-bold">空室検索</h1><p className="mt-3 text-sm text-slate-500">建物と部屋を選ぶと、宿泊日を選択するカレンダーが表示されます。</p><StaySearchFlow listings={listings ?? []} buildingImages={images} /></main>;
}
