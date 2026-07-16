"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteCustomerAccount, type ProfileState } from "./actions";

const initialState: ProfileState = { success: false, message: "" };

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteCustomerAccount, initialState);
  return <form action={action} className="mt-6 space-y-4"><label className="block text-sm font-semibold text-red-900">確認のため「アカウントを削除する」と入力してください<Input name="confirmation" required autoComplete="off" className="mt-2 border-red-200 focus-visible:ring-red-500" /></label>{state.message && <p role="alert" className="rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-800">{state.message}</p>}<Button type="submit" variant="destructive" size="lg" disabled={pending} className="w-full sm:w-auto"><Trash2 size={17} />{pending ? "削除しています…" : "アカウントとすべての見積を削除"}</Button></form>;
}
