"use client";

import { Button } from "@/components/ui/button";
import { deleteStayCustomer } from "./actions";

export function DeleteStayCustomerForm({ id, name }: { id: string; name: string }) {
  return <form action={deleteStayCustomer} onSubmit={(event) => { if (!window.confirm(`${name} の宿泊顧客データと関連データをすべて削除します。元に戻せません。削除しますか？`)) event.preventDefault(); }}><input type="hidden" name="id" value={id}/><input type="hidden" name="confirmation" value="delete"/><Button variant="destructive">顧客と関連データを削除</Button></form>;
}
