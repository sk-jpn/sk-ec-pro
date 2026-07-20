"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStayUser } from "@/lib/stay/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";

const idOf=(form:FormData)=>String(form.get("id")??"");
export async function rideCustomerAction(formData:FormData){
  const {customer}=await requireStayUser();const id=idOf(formData),action=String(formData.get("action")??"");
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["confirm","cancel"].includes(action))return;
  const admin=createSupabaseAdminClient(),{data:ride}=await admin.from("stay_ride_bookings").select("status").eq("id",id).eq("customer_id",customer.id).maybeSingle();if(!ride)return;
  if(action==="cancel"&&["admin_reviewing","awaiting_guest_confirmation"].includes(ride.status))await admin.from("stay_ride_bookings").update({status:"customer_cancelled",updated_at:new Date().toISOString()}).eq("id",id).eq("status",ride.status);
  else if(action==="confirm"&&ride.status==="awaiting_guest_confirmation")await admin.from("stay_ride_bookings").update({status:"confirmed",payment_status:"unpaid",updated_at:new Date().toISOString()}).eq("id",id).eq("status","awaiting_guest_confirmation");
  revalidatePath(`/stay/mypage/rides/${id}`);revalidatePath("/stay/mypage/rides");revalidatePath("/admin/stay/rides");redirect(`/stay/mypage/rides/${id}${action==="confirm"?"?confirmed=success":"?cancelled=success"}`);
}
export async function startRideStripeCheckout(formData:FormData){
  const {customer}=await requireStayUser();const id=idOf(formData);if(!/^[0-9a-f-]{36}$/i.test(id))return;
  const admin=createSupabaseAdminClient(),{data:ride}=await admin.from("stay_ride_bookings").select("id,booking_number,total_amount,card_fee_rate,status,payment_status,stay_customers(email)").eq("id",id).eq("customer_id",customer.id).maybeSingle();
  if(!ride||ride.status!=="confirmed"||ride.payment_status!=="unpaid"||ride.total_amount<1)redirect(`/stay/mypage/rides/${id}?payment=failed`);
  let checkoutUrl:string;
  try{
    const fee=Math.round(ride.total_amount*Number(ride.card_fee_rate??3.6)/100),expected=ride.total_amount+fee,origin=new URL(process.env.SITE_URL||"https://formosajapan.com").origin,email=(ride.stay_customers as unknown as {email:string}|null)?.email;
    const session=await getStripeClient().checkout.sessions.create({mode:"payment",payment_method_types:["card"],customer_email:email||undefined,client_reference_id:ride.id,line_items:[{price_data:{currency:"jpy",product_data:{name:`配車予約 ${ride.booking_number}`},unit_amount:expected},quantity:1}],metadata:{paymentType:"stay_ride",rideBookingId:ride.id,bookingNumber:ride.booking_number,expectedAmount:String(expected)},success_url:`${origin}/ec/stay/mypage/rides/${ride.id}?payment=stripe_success`,cancel_url:`${origin}/ec/stay/mypage/rides/${ride.id}/stripe-cancel`});
    if(!session.url)throw new Error("Stripe URLがありません。");
    const {error}=await admin.from("stay_ride_bookings").update({status:"payment_pending",payment_status:"payment_pending",payment_method:"stripe_card",card_fee_amount:fee,stripe_checkout_session_id:session.id,updated_at:new Date().toISOString()}).eq("id",ride.id).eq("status","confirmed").eq("payment_status","unpaid");if(error)throw error;checkoutUrl=session.url;
  }catch(error){console.error("配車Stripe決済を開始できませんでした。",error);redirect(`/stay/mypage/rides/${id}?payment=failed`)}
  redirect(checkoutUrl);
}
