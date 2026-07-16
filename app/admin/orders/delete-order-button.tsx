"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteOrder, type DeleteOrderState } from "./actions";

const initialState: DeleteOrderState = { success: false, message: "" };

export function DeleteOrderButton({ orderId, orderNo }: { orderId: string; orderNo: string }) {
  const [state, action, pending] = useActionState(deleteOrder, initialState);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`${orderNo} の注文データを削除しますか？\n見積データは削除されません。`)) {
          event.preventDefault();
        }
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        <Trash2 size={14} />
        {pending ? "削除中…" : "削除"}
      </Button>
      {state.message && (
        <p aria-live="polite" className={`max-w-48 whitespace-normal text-right text-xs ${state.success ? "text-emerald-700" : "text-red-600"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
