import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { estimateStatusLabel, type EstimateStatus } from "./estimates/statuses";

export function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) { return <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-emerald-600">SK EC Pro Admin</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div>{action}</header>; }
export function StatusBadge({ status }: { status: EstimateStatus }) { const variant = status === "見積作成中" ? "warning" : ["見積確認待ち", "画像確認待ち", "日本発送待ち"].includes(status) ? "info" : ["発注作業中", "発注完了（中国物流拠点到着待ち）", "完了"].includes(status) ? "success" : status === "キャンセル" ? "secondary" : "outline"; return <Badge variant={variant}>{estimateStatusLabel(status)}</Badge>; }
export function NoData({ title, description }: { title: string; description: string }) { return <Card><CardContent className="flex min-h-96 flex-col items-center justify-center text-center"><span className="grid size-14 place-items-center rounded-full bg-slate-100 text-slate-400"><Inbox size={26} /></span><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p></CardContent></Card>; }
