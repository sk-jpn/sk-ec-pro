"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, House, PackageCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "ホーム", icon: House, exact: true },
  { href: "/account/estimates", label: "見積", icon: FileText },
  { href: "/account/orders", label: "注文", icon: PackageCheck },
  { href: "/account/profile", label: "プロフィール", icon: UserRound },
];

export function AccountNav() {
  const pathname = usePathname();
  return <nav className="flex gap-2 overflow-x-auto" aria-label="マイページナビゲーション">{links.map(({ href, label, icon: Icon, exact }) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return <Link key={href} href={href} className={cn("flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition", active ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700")}><Icon size={16} />{label}</Link>;
  })}</nav>;
}
