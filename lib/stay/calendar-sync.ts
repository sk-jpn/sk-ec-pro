import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseIcalBlockedPeriods } from "@/lib/stay/ical";

export function validatedAirbnbCalendarUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !(host === "airbnb.jp" || host.endsWith(".airbnb.jp") || host === "airbnb.com" || host.endsWith(".airbnb.com")) || !url.pathname.endsWith(".ics")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function syncStayCalendarFeedById(feedId: string) {
  const admin = createSupabaseAdminClient();
  const { data: feed, error: feedError } = await admin.from("stay_calendar_feeds").select("id,listing_id,feed_url,is_enabled").eq("id", feedId).maybeSingle();
  if (feedError || !feed || !feed.is_enabled) throw new Error("カレンダー設定を確認できませんでした。");
  const safeUrl = validatedAirbnbCalendarUrl(feed.feed_url);
  if (!safeUrl) throw new Error("AirbnbのiCal URLを確認してください。");
  try {
    const response = await fetch(safeUrl, { cache: "no-store", signal: AbortSignal.timeout(15_000), headers: { accept: "text/calendar" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const source = await response.text();
    if (source.length > 2_000_000) throw new Error("カレンダーファイルが大きすぎます。");
    const periods = parseIcalBlockedPeriods(source);
    const { data: existing, error: existingError } = await admin.from("stay_blocked_dates").select("id,external_uid").eq("calendar_feed_id", feed.id);
    if (existingError) throw existingError;
    for (const period of periods) {
      const { error } = await admin.from("stay_blocked_dates").upsert({ listing_id: feed.listing_id, start_date: period.startDate, end_date: period.endDate, reason: "Airbnb予約", admin_memo: period.summary, calendar_feed_id: feed.id, external_uid: period.uid }, { onConflict: "calendar_feed_id,external_uid" });
      if (error) throw error;
    }
    const activeUids = new Set(periods.map((period) => period.uid));
    const staleIds = (existing ?? []).filter((row) => row.external_uid && !activeUids.has(row.external_uid)).map((row) => row.id);
    if (staleIds.length) {
      const { error } = await admin.from("stay_blocked_dates").delete().in("id", staleIds);
      if (error) throw error;
    }
    await admin.from("stay_calendar_feeds").update({ last_synced_at: new Date().toISOString(), last_sync_status: "success", last_sync_error: null, updated_at: new Date().toISOString() }).eq("id", feed.id);
    return periods.length;
  } catch (error) {
    const message = error instanceof Error ? error.message : "同期できませんでした。";
    await admin.from("stay_calendar_feeds").update({ last_synced_at: new Date().toISOString(), last_sync_status: "failed", last_sync_error: message.slice(0, 500), updated_at: new Date().toISOString() }).eq("id", feed.id);
    throw new Error(message);
  }
}

export async function syncAllEnabledStayCalendarFeeds() {
  const admin = createSupabaseAdminClient();
  const { data: feeds, error } = await admin.from("stay_calendar_feeds").select("id").eq("is_enabled", true);
  if (error) throw new Error("有効なカレンダーを取得できませんでした。");
  const results = await Promise.allSettled((feeds ?? []).map(async ({ id }) => ({ id, count: await syncStayCalendarFeedById(id) })));
  return { total: results.length, succeeded: results.filter((result) => result.status === "fulfilled").length, failed: results.filter((result) => result.status === "rejected").length };
}
