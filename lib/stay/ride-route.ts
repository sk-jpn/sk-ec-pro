import "server-only";

export async function getDrivingRoute(origin: string, destination: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEYが設定されていません。");
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "routes.distanceMeters,routes.duration" },
    body: JSON.stringify({ origin: { address: origin }, destination: { address: destination }, travelMode: "DRIVE", routingPreference: "TRAFFIC_UNAWARE", languageCode: "ja", units: "METRIC" }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`道路距離を取得できませんでした (${response.status})`);
  const data = await response.json() as { routes?: Array<{ distanceMeters?: number; duration?: string }> };
  const route = data.routes?.[0];
  if (!route?.distanceMeters) throw new Error("入力した場所のルートが見つかりませんでした。");
  return { distanceMeters: route.distanceMeters, durationSeconds: Math.round(Number.parseFloat(route.duration ?? "0s")) };
}

