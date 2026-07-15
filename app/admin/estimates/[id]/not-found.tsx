import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
export default function EstimateNotFound() { return <Alert><AlertTitle>見積が見つかりません</AlertTitle><AlertDescription>指定された見積は存在しないか、削除された可能性があります。</AlertDescription><Button asChild className="mt-4"><Link href="/admin/estimates">見積一覧へ戻る</Link></Button></Alert>; }
