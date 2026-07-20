import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { withBasePath } from "@/config/site";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params,supabase=await createSupabaseServerClient(),{data:{user}}=await supabase.auth.getUser();if(user){const admin=createSupabaseAdminClient(),{data:customer}=await admin.from("stay_customers").select("id").eq("auth_user_id",user.id).maybeSingle();if(customer)await admin.from("stay_ride_bookings").update({status:"confirmed",payment_status:"unpaid",payment_method:null,card_fee_amount:0,stripe_checkout_session_id:null,updated_at:new Date().toISOString()}).eq("id",id).eq("customer_id",customer.id).eq("status","payment_pending").eq("payment_status","payment_pending");revalidatePath(`/stay/mypage/rides/${id}`)}return NextResponse.redirect(new URL(withBasePath(`/stay/mypage/rides/${id}?payment=stripe_cancelled`),request.url))}
