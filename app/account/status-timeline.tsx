import { Check, Circle, Clock3 } from "lucide-react";

const steps = [
  { label: "受付", statuses: ["新規"] }, { label: "見積作成", statuses: ["見積作成中"] },
  { label: "お客様確認", statuses: ["お客様確認中"] }, { label: "承認", statuses: ["approved"] }, { label: "決済", statuses: ["paid", "発注済"] },
  { label: "中国発送", statuses: ["中国発送"] }, { label: "国際配送", statuses: ["国際配送中"] },
  { label: "国内発送", statuses: ["国内発送"] }, { label: "完了", statuses: ["完了"] },
] as const;

export function StatusTimeline({ status }: { status: string }) {
  const current = steps.findIndex((step) => step.statuses.some((entry) => entry === status));
  return <ol className="mt-6 grid gap-0 sm:grid-cols-9">{steps.map((step, index) => { const completed = current >= 0 && index < current; const active = index === current; const Icon = completed ? Check : active ? Clock3 : Circle; return <li key={step.label} className="relative flex min-h-16 gap-3 pb-4 sm:block sm:min-h-0 sm:pb-0 sm:text-center">{index < steps.length - 1 && <span className={`absolute left-4 top-8 h-full w-0.5 sm:left-1/2 sm:top-4 sm:h-0.5 sm:w-full ${completed ? "bg-emerald-400" : "bg-slate-200"}`} />}<span className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 sm:mx-auto ${completed ? "border-emerald-500 bg-emerald-500 text-white" : active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-300"}`}><Icon size={14} /></span><p className={`pt-1 text-sm font-semibold sm:mt-3 sm:pt-0 ${completed ? "text-emerald-700" : active ? "text-blue-700" : "text-slate-400"}`}>{step.label}</p></li>; })}</ol>;
}
