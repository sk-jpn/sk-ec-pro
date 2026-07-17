export const ESTIMATE_STATUSES = [
  "見積作成中",
  "見積確認待ち",
  "入金待ち",
  "発注作業中",
  "発注完了（中国物流拠点到着待ち）",
  "画像確認待ち",
  "日本発送待ち",
  "完了",
  "キャンセル",
] as const;

export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];

export function isEstimateStatus(value: unknown): value is EstimateStatus {
  return typeof value === "string" && ESTIMATE_STATUSES.some((status) => status === value);
}

export function estimateStatusLabel(status: EstimateStatus) { return status; }
