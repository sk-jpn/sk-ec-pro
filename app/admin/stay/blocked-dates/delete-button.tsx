"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({ message, label = "削除" }: { message: string; label?: string }) {
  return <Button type="submit" variant="destructive" size="sm" onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}><Trash2 size={14} />{label}</Button>;
}
