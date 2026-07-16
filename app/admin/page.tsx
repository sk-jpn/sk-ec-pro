import { Boxes, ClipboardCheck, Clock3, Truck } from "lucide-react";
import { PageHeader } from "./admin-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const metrics = [
  { label: "今日の見積件数", value: "5", note: "本日受付", icon: ClipboardCheck },
  { label: "未返信件数", value: "3", note: "対応が必要です", icon: Clock3 },
  { label: "発送待ち件数", value: "6", note: "中国倉庫", icon: Truck },
  { label: "注文待ち件数", value: "4", note: "入金確認済み", icon: Boxes },
];

export default function AdminDashboard() {
  return <><PageHeader title="Dashboard" description="購入代行業務の状況をひと目で確認できます。指標はダミーデータです。" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(({ label, value, note, icon: Icon }) => <Card key={label}><CardHeader className="flex-row items-center justify-between pb-3"><CardDescription>{label}</CardDescription><span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><Icon size={18} /></span></CardHeader><CardContent><p className="text-3xl font-bold tracking-tight">{value}</p><p className="mt-2 text-xs text-slate-400">{note}</p></CardContent></Card>)}</div><div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]"><Card><CardHeader><CardTitle>最近の見積</CardTitle><CardDescription>一覧ページではSupabaseの実データを表示します</CardDescription></CardHeader><CardContent className="space-y-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center gap-4"><Skeleton className="size-9 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="mt-2 h-3 w-48 max-w-full" /></div></div>)}</CardContent></Card><Card><CardHeader><CardTitle>業務サマリー</CardTitle><CardDescription>今後データ連携される領域</CardDescription></CardHeader><CardContent className="space-y-5">{[["見積対応率", "68%", "w-[68%]"], ["購入完了率", "42%", "w-[42%]"], ["発送完了率", "31%", "w-[31%]"]].map(([label, value, width]) => <div key={label}><div className="mb-2 flex justify-between text-xs text-slate-500"><span>{label}</span><span>{value}</span></div><Skeleton className={`h-2 bg-emerald-200 ${width}`} /></div>)}</CardContent></Card></div></>;
}
