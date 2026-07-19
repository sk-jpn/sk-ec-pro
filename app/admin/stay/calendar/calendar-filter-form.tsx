"use client";

type Listing = { id: string; code: string; name: string };

export function CalendarFilterForm({ month, selectedId, listings }: { month: string; selectedId?: string; listings: Listing[] }) {
  return <form className="flex flex-col gap-2 sm:flex-row">
    <input type="hidden" name="month" value={month} />
    <select
      name="listingId"
      defaultValue={selectedId}
      className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
      aria-label="リスティング"
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
    >
      {listings.map((listing) => <option value={listing.id} key={listing.id}>{listing.code}・{listing.name}</option>)}
    </select>
    <button className="min-h-10 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white">表示</button>
  </form>;
}
