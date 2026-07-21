"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteStayBooking } from "../../actions";

export function DeleteBookingForm({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleDelete() {
    if (!confirm("この予約を削除してもよろしいですか？この操作は元に戻せません。")) return;
    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      await deleteStayBooking(formData);
      router.push("/admin/stay/bookings?deleted=success");
    });
  }

  return <div className="mt-8 border-t border-red-200 pt-6">
    <p className="mb-4 text-sm text-red-600">この予約はキャンセル済みです。カレンダーの空き状況を復元するには、予約を削除できます。この操作は元に戻せません。</p>
    <Button type="button" variant="destructive" disabled={pending} onClick={handleDelete}>
      {pending ? "削除中…" : "この予約を削除する"}
    </Button>
  </div>;
}