import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireStayUser } from "@/lib/stay/auth";
import { BookingForm } from "./booking-form";
import type { BookingQuote } from "./actions";

export default async function BookPage({ params, searchParams }: { params: Promise<{ listingId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { listingId } = await params;
  const q = await searchParams;
  const { customer } = await requireStayUser(`/stay/book/${listingId}`);
  const admin = createSupabaseAdminClient();
  const { data: listing } = await admin.from("stay_listings").select("*").eq("id", listingId).eq("booking_enabled", true).maybeSingle();
  if (!listing) notFound();

  const guests = Math.min(Number(listing.max_guests), Math.max(1, Number(q.guests) || 1));
  let quote: BookingQuote | null = null;
  if (q.checkIn && q.checkOut) {
    const { data } = await admin.rpc("calculate_stay_price", { p_listing_id: listingId, p_check_in: q.checkIn, p_check_out: q.checkOut, p_guest_count: guests, p_discount: 0 });
    quote = data as BookingQuote | null;
  }

  return <main className="mx-auto max-w-3xl px-5 py-10">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Booking Request</p>
    <h1 className="mt-2 text-3xl font-bold">{listing.name} を予約</h1>
    <BookingForm listingId={listingId} checkIn={q.checkIn ?? ""} checkOut={q.checkOut ?? ""} guests={guests} maxGuests={Number(listing.max_guests)} name={customer.name} email={customer.email} phone={customer.phone} initialQuote={quote}/>
  </main>;
}
