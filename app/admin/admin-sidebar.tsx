"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedDouble, LayoutDashboard, Settings, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/config/site";

const purchasePaths = ["/admin/purchase", "/admin/estimates", "/admin/messages", "/admin/customers", "/admin/orders", "/admin/shipping"];

function NavigationLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof LayoutDashboard; active: boolean }) {
  return <Link href={href} className={cn("flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition", active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}><Icon size={18} />{label}</Link>;
}

export function AdminSidebar() {
  const pathname = usePathname();
  return <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64 lg:border-b-0 lg:border-r">
    <div className="flex h-16 items-center justify-between gap-3 px-5 lg:h-20 lg:px-6"><Link href="/admin" className="min-w-0"><Image src={withBasePath("/brand/sk-ec-pro-logo.png")} width={150} height={56} alt="SK EC Pro" className="h-auto w-28 sm:w-32" priority /></Link><div className="text-right"><span className="block text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400">Admin</span><span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">LIVE</span></div></div>
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-4 lg:py-4" aria-label="管理画面ナビゲーション">
      <NavigationLink href="/admin" label="Dashboard" icon={LayoutDashboard} active={pathname === "/admin"} />
      <NavigationLink href="/admin/purchase" label="購入代行管理" icon={ShoppingCart} active={purchasePaths.some((path) => pathname.startsWith(path))} />
      <NavigationLink href="/admin/stay" label="宿泊管理" icon={BedDouble} active={pathname.startsWith("/admin/stay")} />
      <NavigationLink href="/admin/settings" label="設定" icon={Settings} active={pathname.startsWith("/admin/settings")} />
    </nav>
    <div className="hidden border-t border-slate-100 p-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block"><p className="text-xs leading-5 text-slate-400">Formosa Japan<br />Secure Administration</p></div>
  </aside>;
}
