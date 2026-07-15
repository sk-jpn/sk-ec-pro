export const ESTIMATE_STATUSES = [
  "新規",
  "見積作成中",
  "お客様確認中",
  "approved",
  "paid",
  "発注済",
  "中国発送",
  "国際配送中",
  "国内発送",
  "完了",
  "キャンセル",
] as const;

export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];

export function isEstimateStatus(value: unknown): value is EstimateStatus {
  return typeof value === "string" && ESTIMATE_STATUSES.some((status) => status === value);
}

export function estimateStatusLabel(status: EstimateStatus) {
  if (status === "approved") return "承認済";
  if (status === "paid") return "入金済";
  return status;
}
