import { Building2, Mail, Palette, Settings2 } from "lucide-react";
import { PageHeader } from "../admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const settings = [
  { title: "会社情報", description: "運営会社名、所在地、連絡先を管理します。", icon: Building2 },
  { title: "ブランド設定", description: "ロゴ、ブランドカラー、表示名を設定します。", icon: Palette },
  { title: "メール設定", description: "送信元、通知先、自動返信を設定します。", icon: Mail },
  { title: "システム設定", description: "見積番号や業務ステータスを設定します。", icon: Settings2 },
];
export default function SettingsPage() { return <><PageHeader title="設定" description="管理画面と購入代行業務の基本設定を管理します。" /><div className="grid gap-5 md:grid-cols-2">{settings.map(({ title, description, icon: Icon }) => <Card key={title}><CardHeader className="flex-row items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Icon size={21} /></span><div><CardTitle>{title}</CardTitle><CardDescription className="mt-2 leading-6">{description}</CardDescription></div></CardHeader><CardContent><Button variant="outline" className="w-full sm:w-auto">設定を開く</Button></CardContent></Card>)}</div></>; }
