"use client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
export default function EstimateDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <Alert className="border-red-200 bg-red-50"><AlertCircle className="mb-3 text-red-600" /><AlertTitle>見積詳細を読み込めませんでした</AlertTitle><AlertDescription>Supabaseへの接続を確認して、もう一度お試しください。</AlertDescription><Button variant="outline" className="mt-4" onClick={reset}>再読み込み</Button></Alert>; }
