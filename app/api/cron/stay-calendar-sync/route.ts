import { syncAllEnabledStayCalendarFeeds } from "@/lib/stay/calendar-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await syncAllEnabledStayCalendarFeeds();
    if (result.failed > 0) console.error("Airbnbカレンダーの定期同期で失敗がありました。", result);
    return Response.json({ ok: result.failed === 0, ...result, syncedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Airbnbカレンダーの定期同期に失敗しました。", error);
    return Response.json({ ok: false, message: "Calendar sync failed" }, { status: 500 });
  }
}
