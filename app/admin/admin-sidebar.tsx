"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ClipboardList, LayoutDashboard, Settings, Truck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/config/site";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/estimates", label: "見積管理", icon: ClipboardList },
  { href: "/admin/customers", label: "顧客管理", icon: Users },
  { href: "/admin/orders", label: "注文管理", icon: Boxes },
  { href: "/admin/shipping", label: "発送管理", icon: Truck },
  { href: "/admin/settings", label: "設定", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64 lg:border-b-0 lg:border-r">
    <div className="flex h-16 items-center justify-between px-5 lg:h-20 lg:px-6"><Link href="/admin" className="flex items-center gap-3"><Image src={withBasePath("/brand/icon-512.png")} width={36} height={36} alt="SK EC Pro" className="rounded-lg" /><span><span className="block text-sm font-bold">SK EC Pro</span><span className="block text-[10px] font-medium uppercase tracking-widest text-slate-400">Admin</span></span></Link><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">LIVE</span></div>
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-4 lg:py-4" aria-label="管理画面ナビゲーション">{navigation.map(({ href, label, icon: Icon, exact }) => { const active = exact ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={cn("flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition", active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}><Icon size={18} />{label}</Link>; })}</nav>
    <div className="hidden border-t border-slate-100 p-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block"><p className="text-xs leading-5 text-slate-400">Formosa Japan<br />Secure Administration</p></div>
  </aside>;
}
