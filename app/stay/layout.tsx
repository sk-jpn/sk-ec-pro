import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { withBasePath } from "@/config/site";
import { stayLocales, type StayLocale } from "@/lib/stay/i18n";
import { StayLanguageProvider, StayLanguageSwitcher } from "./stay-language";

export default async function StayLayout({children}:{children:React.ReactNode}){const cookieStore=await cookies();const raw=cookieStore.get("stay_locale")?.value;const locale:StayLocale=stayLocales.includes(raw as StayLocale)?raw as StayLocale:"ja";return <StayLanguageProvider locale={locale}><div lang={locale} className="min-h-screen bg-slate-50 text-slate-950"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8"><Link href="/stay"><Image src={withBasePath("/brand/sk-ec-pro-logo.png")} width={150} height={56} alt="SK EC Pro" className="h-auto w-32"/></Link><div className="flex items-center gap-3"><nav className="flex items-center gap-3 text-sm font-medium"><Link href="/stay/search">空室検索</Link><Link href="/stay/mypage">マイページ</Link></nav><StayLanguageSwitcher/></div></div></header>{children}</div></StayLanguageProvider>}
