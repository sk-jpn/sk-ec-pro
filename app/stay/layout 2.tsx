import Link from "next/link";
import Image from "next/image";
import { withBasePath } from "@/config/site";
export default function StayLayout({children}:{children:React.ReactNode}){return <div className="min-h-screen bg-slate-50 text-slate-950"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8"><Link href="/stay"><Image src={withBasePath("/brand/sk-ec-pro-logo.png")} width={150} height={56} alt="SK EC Pro" className="h-auto w-32"/></Link><nav className="flex items-center gap-4 text-sm font-medium"><Link href="/stay/search">空室検索</Link><Link href="/stay/mypage">マイページ</Link></nav></div></header>{children}</div>}
