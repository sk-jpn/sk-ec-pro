import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireCustomerUser } from "@/lib/auth/require-customer";
import { AccountNav } from "./account-nav";
import { logoutCustomer } from "./auth-actions";
import { withBasePath } from "@/config/site";

export const metadata = { title: { default: "マイページ｜SK EC Pro", template: "%s｜SK EC Pro" }, robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireCustomerUser();
  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8"><Link href="/account"><Image src={withBasePath("/brand/sk-ec-pro-logo.png")} alt="SK EC Pro" width={160} height={60} className="h-auto w-32" /></Link><div className="flex min-w-0 items-center gap-2"><span className="hidden max-w-52 truncate text-sm text-slate-500 sm:block">{user.user_metadata.full_name ?? user.email}</span><form action={logoutCustomer}><Button variant="ghost" size="sm"><LogOut size={15} />ログアウト</Button></form></div></div></header>
    <div className="border-b border-slate-200 bg-slate-100/70"><div className="mx-auto max-w-6xl overflow-hidden px-5 py-3 sm:px-8"><AccountNav /></div></div>
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">{children}</main>
  </div>;
}
