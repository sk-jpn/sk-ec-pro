"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteCustomer, type DeleteCustomerState } from "./actions";

const initialState: DeleteCustomerState = { success: false, message: "" };

export function DeleteCustomerForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState(deleteCustomer, initialState);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="customerId" value={customerId} />
      <label className="block text-sm font-semibold text-red-900">
        確認のため「顧客データを削除する」と入力してください
        <Input name="confirmation" required autoComplete="off" className="mt-2 border-red-200 focus-visible:ring-red-500" />
      </label>
      {state.message && <p role="alert" className="rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-800">{state.message}</p>}
      <Button type="submit" variant="destructive" size="lg" disabled={pending} className="w-full sm:w-auto">
        <Trash2 size={17} />
        {pending ? "削除しています…" : "顧客データを全削除"}
      </Button>
    </form>
  );
}
