"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedDouble, Boxes, ClipboardList, LayoutDashboard, MessageSquare, Settings, ShoppingCart, Truck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/config/site";

const purchaseNavigation = [
  { href: "/admin/estimates", label: "見積管理", icon: ClipboardList },
  { href: "/admin/messages", label: "メッセージ", icon: MessageSquare },
  { href: "/admin/customers", label: "顧客管理", icon: Users },
  { href: "/admin/orders", label: "注文管理", icon: Boxes },
  { href: "/admin/shipping", label: "発送管理", icon: Truck },
];

function NavigationLink({ href, label, icon: Icon, active, nested = false }: { href: string; label: string; icon: typeof LayoutDashboard; active: boolean; nested?: boolean }) {
  return <Link href={href} className={cn("flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition", nested && "lg:min-h-10 lg:pl-8 lg:text-[13px]", active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}><Icon size={nested ? 16 : 18} />{label}</Link>;
}

export function AdminSidebar() {
  const pathname = usePathname();
  return <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64 lg:border-b-0 lg:border-r">
    <div className="flex h-16 items-center justify-between gap-3 px-5 lg:h-20 lg:px-6"><Link href="/admin" className="min-w-0"><Image src={withBasePath("/brand/sk-ec-pro-logo.png")} width={150} height={56} alt="SK EC Pro" className="h-auto w-28 sm:w-32" priority /></Link><div className="text-right"><span className="block text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400">Admin</span><span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">LIVE</span></div></div>
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-4 lg:py-4" aria-label="管理画面ナビゲーション">
      <NavigationLink href="/admin" label="Dashboard" icon={LayoutDashboard} active={pathname === "/admin"} />
      <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-100 bg-slate-50/70 p-1 lg:block lg:w-full lg:p-1.5">
        <div className="flex min-h-10 shrink-0 items-center gap-3 px-3 text-sm font-bold text-slate-800"><ShoppingCart size={18} className="text-blue-600" />購入代行管理</div>
        <div className="flex gap-1 lg:mt-1 lg:flex-col">{purchaseNavigation.map(({ href, label, icon }) => <NavigationLink key={href} href={href} label={label} icon={icon} nested active={pathname.startsWith(href)} />)}</div>
      </div>
      <NavigationLink href="/admin/stay" label="宿泊管理" icon={BedDouble} active={pathname.startsWith("/admin/stay")} />
      <NavigationLink href="/admin/settings" label="設定" icon={Settings} active={pathname.startsWith("/admin/settings")} />
    </nav>
    <div className="hidden border-t border-slate-100 p-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block"><p className="text-xs leading-5 text-slate-400">Formosa Japan<br />Secure Administration</p></div>
  </aside>;
}
