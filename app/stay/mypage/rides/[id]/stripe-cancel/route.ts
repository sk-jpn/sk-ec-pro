import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { withBasePath } from "@/config/site";
import { requireStayUser } from "@/lib/stay/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params,{customer}=await requireStayUser(`/stay/mypage/rides/${id}`),admin=createSupabaseAdminClient();
  const destination=(payment:string)=>NextResponse.redirect(new URL(withBasePath(`/stay/mypage/rides/${id}?payment=${payment}`),request.url));
  const {data:ride}=await admin.from("stay_ride_bookings").select("payment_status,payment_method,stripe_checkout_session_id").eq("id",id).eq("customer_id",customer.id).maybeSingle();
  if(!ride||ride.payment_status!=="payment_pending"||ride.payment_method!=="stripe_card"||!ride.stripe_checkout_session_id)return destination("stripe_cancelled");
  try{
    const stripe=getStripeClient(),session=await stripe.checkout.sessions.retrieve(ride.stripe_checkout_session_id);
    if(session.payment_status==="paid")return destination("stripe_success");
    await stripe.checkout.sessions.expire(session.id).catch(()=>undefined);
    const {error}=await admin.from("stay_ride_bookings").update({status:"confirmed",payment_status:"unpaid",payment_method:null,card_fee_amount:0,stripe_checkout_session_id:null,updated_at:new Date().toISOString()}).eq("id",id).eq("customer_id",customer.id).eq("payment_status","payment_pending").eq("payment_method","stripe_card").eq("stripe_checkout_session_id",session.id);
    if(error)throw error;revalidatePath(`/stay/mypage/rides/${id}`);revalidatePath("/stay/mypage/rides");
  }catch(error){console.error("キャンセルした配車Stripe決済の状態復元に失敗しました。",error);return destination("failed")}
  return destination("stripe_cancelled");
}
