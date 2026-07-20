"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function updateRideDiscount(formData:FormData){const user=await requireAdminUser();const discount=Number(formData.get("discountPercent"));if(!Number.isFinite(discount)||discount<0||discount>100)redirect("/admin/stay/rides?saved=invalid");const {error}=await createSupabaseAdminClient().from("stay_ride_settings").update({discount_percent:discount,updated_at:new Date().toISOString(),updated_by:user.id}).eq("id",true);if(error){console.error("配車割引率を保存できませんでした。",error);redirect("/admin/stay/rides?saved=failed")}revalidatePath("/admin/stay/rides");revalidatePath("/stay/mypage/rides/new");redirect("/admin/stay/rides?saved=success")}
export async function updateRideBooking(formData:FormData){await requireAdminUser();const id=String(formData.get("id")??""),status=String(formData.get("status")??""),memo=String(formData.get("adminMemo")??"").trim().slice(0,5000);if(!/^[0-9a-f-]{36}$/i.test(id)||!["requested","confirmed","completed","customer_cancelled","admin_cancelled"].includes(status))redirect("/admin/stay/rides?saved=invalid");const {error}=await createSupabaseAdminClient().from("stay_ride_bookings").update({status,admin_memo:memo,updated_at:new Date().toISOString()}).eq("id",id);if(error){console.error("配車予約を更新できませんでした。",error);redirect("/admin/stay/rides?saved=failed")}revalidatePath("/admin/stay/rides");revalidatePath("/stay/mypage/rides");redirect("/admin/stay/rides?saved=success")}

