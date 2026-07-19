import Link from "next/link";
import { STAY_STATUSES, stayDate, yen } from "@/lib/stay/presentation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function Bookings() {
  const { data: rows } = await createSupabaseAdminClient().from("stay_bookings").select("id,booking_number,check_in_date,check_out_date,guest_count,total_amount,status,payment_status,requested_at,stay_customers(name),stay_listings(name)").order("requested_at", { ascending: false });
  return <>
    <h1 className="text-3xl font-bold">宿泊予約管理</h1>
    <div className="mt-6 overflow-x-auto rounded-xl bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50"><tr>{["予約番号", "顧客", "部屋", "チェックイン・アウト", "人数", "合計", "状態"].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead>
        <tbody>{(rows ?? []).map(row => <tr key={row.id} className="border-t">
          <td className="p-3"><Link className="font-bold text-blue-600" href={`/admin/stay/bookings/${row.id}`}>{row.booking_number}</Link></td>
          <td className="p-3">{(row.stay_customers as unknown as { name: string })?.name}</td>
          <td className="p-3">{(row.stay_listings as unknown as { name: string })?.name}</td>
          <td className="whitespace-nowrap p-3"><span className="block">チェックイン {stayDate(row.check_in_date)} 15:00</span><span className="block">チェックアウト {stayDate(row.check_out_date)} 10:00</span></td>
          <td className="p-3">{row.guest_count}</td>
          <td className="p-3">{yen(row.total_amount)}</td>
          <td className="p-3">{STAY_STATUSES[row.status]}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </>;
}
