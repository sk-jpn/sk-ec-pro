import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { AdminAccountBar } from "./admin-account-bar";
import { AdminSidebar } from "./admin-sidebar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "Dashboard｜SK EC Pro Admin", template: "%s｜SK EC Pro Admin" }, robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if ((await headers()).get("x-sk-admin-login") === "1") return children;
  const user = await requireAdminUser();
  return <div className="min-h-screen bg-slate-50 text-slate-950"><AdminSidebar /><main className="lg:pl-64"><div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8"><AdminAccountBar user={user} />{children}</div></main></div>;
}
