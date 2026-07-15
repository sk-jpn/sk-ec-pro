import type { User } from "@supabase/supabase-js";
import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGoogleAccountName } from "@/lib/auth/authorization";
import { logout } from "./auth-actions";

export function AdminAccountBar({ user }: { user: User }) {
  return <div className="mb-4 flex items-center justify-end gap-3 border-b border-slate-200 pb-4 sm:mb-6">
    <div className="flex min-w-0 items-center gap-2 text-right">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><UserRound size={17} /></span>
      <div className="min-w-0">
        <p className="max-w-52 truncate text-sm font-semibold">{getGoogleAccountName(user)}</p>
        <p className="max-w-52 truncate text-xs text-slate-400">{user.email}</p>
      </div>
    </div>
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm" className="text-slate-500"><LogOut size={15} />ログアウト</Button>
    </form>
  </div>;
}
