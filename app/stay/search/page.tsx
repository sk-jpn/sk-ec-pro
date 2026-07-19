import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { StaySearchFlow } from "./search-flow";

export default async function SearchPage() {
  const admin = createSupabaseAdminClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const endDate = new Date(`${today}T00:00:00Z`); endDate.setUTCMonth(endDate.getUTCMonth() + 18); const availabilityEnd = endDate.toISOString().slice(0, 10);
  const [{ data: listings }, { data: buildingImages }, { data: bookings }, { data: blocks }] = await Promise.all([admin.from("stay_listings").select("id,code,name,max_guests,base_price,cleaning_fee").eq("is_active", true).eq("is_public", true).eq("booking_enabled", true).order("sort_order"), admin.from("stay_building_images").select("building_code,storage_path"), admin.from("stay_bookings").select("listing_id,check_in_date,check_out_date").lt("check_in_date", availabilityEnd).gt("check_out_date", today).in("status", ["pending_admin_review", "awaiting_guest_confirmation", "confirmed", "payment_pending", "paid", "checked_in"]), admin.from("stay_blocked_dates").select("listing_id,start_date,end_date").lt("start_date", availabilityEnd).gt("end_date", today)]);
  const images = Object.fromEntries((buildingImages ?? []).map((image) => [image.building_code, admin.storage.from("stay-listings").getPublicUrl(image.storage_path).data.publicUrl]));
  const unavailable = [...(bookings ?? []).map((item) => ({ listingId: item.listing_id, start: item.check_in_date, end: item.check_out_date })), ...(blocks ?? []).map((item) => ({ listingId: item.listing_id, start: item.start_date, end: item.end_date }))];
  return <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Stay Search</p><h1 className="mt-2 text-3xl font-bold">空室検索</h1><p className="mt-3 text-sm text-slate-500">建物と部屋を選ぶと、宿泊日を選択するカレンダーが表示されます。</p><StaySearchFlow listings={listings ?? []} buildingImages={images} unavailable={unavailable} today={today} availabilityEnd={availabilityEnd} /></main>;
}
