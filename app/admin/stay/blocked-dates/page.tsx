import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addBlockedDate, deleteStayCalendarFeed, saveStayCalendarFeed, syncStayCalendarFeed, updateStayCalendarFeed } from "../actions";
import { DeleteButton } from "./delete-button";

export default async function Blocks({ searchParams }: { searchParams: Promise<{ ical?: string; count?: string }> }) {
  const query = await searchParams;
  const admin = createSupabaseAdminClient();
  const [{ data: listings }, { data: rows }, { data: feeds }] = await Promise.all([
    admin.from("stay_listings").select("id,code").order("sort_order"),
    admin.from("stay_blocked_dates").select("*,stay_listings(code)").order("start_date"),
    admin.from("stay_calendar_feeds").select("id,listing_id,name,feed_url,last_synced_at,last_sync_status,last_sync_error,stay_listings(code)").order("created_at"),
  ]);
  const f322 = listings?.find((listing) => listing.code === "F322");
  const message = query.ical === "success" ? `Airbnbカレンダーを同期しました（${query.count ?? 0}件）。` : query.ical === "invalid" ? "AirbnbのiCal URLを確認してください。" : query.ical === "save_failed" ? "カレンダー設定を保存できませんでした。" : query.ical === "sync_failed" ? "設定は保存されましたが、同期に失敗しました。" : "";

  return <>
    <h1 className="text-3xl font-bold">管理者ブロック日</h1>
    {query.ical && <p role="status" className={`mt-5 rounded-lg p-4 text-sm ${query.ical === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message}</p>}
    <section className="mt-6 rounded-xl border border-blue-200 bg-white p-5">
      <h2 className="text-lg font-bold">Airbnbカレンダー連携</h2>
      <p className="mt-2 text-sm text-slate-500">1つのリスティングへ複数のiCal URLを登録できます。それぞれの予約済み期間をまとめてブロックします。</p>
      <form action={saveStayCalendarFeed} className="mt-4 grid gap-3 sm:grid-cols-[10rem_12rem_1fr_auto]">
        <select name="listingId" required defaultValue={f322?.id} className="rounded-lg border p-2">{listings?.map((listing) => <option value={listing.id} key={listing.id}>{listing.code}</option>)}</select>
        <Input name="calendarName" placeholder="カレンダー名" maxLength={100} />
        <Input name="feedUrl" type="url" placeholder="https://www.airbnb.jp/calendar/ical/....ics?t=..." required />
        <Button>追加して同期</Button>
      </form>
      <div className="mt-4 space-y-3">{feeds?.map((feed) => {
        const code = (feed.stay_listings as unknown as { code: string })?.code;
        return <div key={feed.id} className="rounded-lg bg-slate-50 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><b>{code}・{feed.name}</b><p className="mt-1 break-all text-xs text-slate-500">{feed.feed_url.replace(/([?&]t=)[^&]+/, "$1••••••••")}</p><p className="mt-1 text-xs text-slate-500">最終同期: {feed.last_synced_at ? new Date(feed.last_synced_at).toLocaleString("ja-JP") : "未同期"} / {feed.last_sync_status ?? "-"}{feed.last_sync_error ? `（${feed.last_sync_error}）` : ""}</p></div>
            <div className="flex gap-2"><form action={syncStayCalendarFeed}><input type="hidden" name="feedId" value={feed.id} /><Button variant="outline">今すぐ同期</Button></form><form action={deleteStayCalendarFeed}><input type="hidden" name="feedId" value={feed.id} /><DeleteButton label="連携削除" message={`${code}の「${feed.name}」と同期済みブロック日を削除しますか？`} /></form></div>
          </div>
          <details className="mt-3"><summary className="cursor-pointer text-sm font-bold text-blue-600">連携設定を編集</summary><form action={updateStayCalendarFeed} className="mt-3 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[10rem_12rem_1fr_auto]"><input type="hidden" name="feedId" value={feed.id} /><select name="listingId" required defaultValue={feed.listing_id} className="rounded-lg border p-2">{listings?.map((listing) => <option value={listing.id} key={listing.id}>{listing.code}</option>)}</select><Input name="calendarName" defaultValue={feed.name} maxLength={100} required /><Input name="feedUrl" type="url" defaultValue={feed.feed_url} required /><Button>変更して同期</Button></form></details>
        </div>;
      })}</div>
    </section>
    <form action={addBlockedDate} className="mt-6 grid gap-3 rounded-xl bg-white p-5 sm:grid-cols-4"><select name="listingId" required className="rounded-lg border p-2">{listings?.map((listing) => <option value={listing.id} key={listing.id}>{listing.code}</option>)}</select><Input name="startDate" type="date" required /><Input name="endDate" type="date" required /><Input name="reason" placeholder="Airbnb予約・清掃など" required /><Input name="memo" placeholder="管理メモ" /><Button>ブロックを追加</Button></form>
    <div className="mt-6 rounded-xl bg-white p-5">{rows?.map((row) => <p key={row.id} className="border-b py-3">{(row.stay_listings as unknown as { code: string })?.code}：{row.start_date}〜{row.end_date}（{row.reason}）{row.calendar_feed_id && <span className="ml-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">Airbnb同期</span>}</p>)}</div>
  </>;
}
