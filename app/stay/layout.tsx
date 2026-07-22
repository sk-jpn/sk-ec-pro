import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { withBasePath } from "@/config/site";
import { stayLocales, type StayLocale } from "@/lib/stay/i18n";
import { StayLanguageProvider, StayLanguageSwitcher } from "./stay-language";

const stayTitle = "宿泊予約｜SK STAY";
const stayDescription = "以前ご宿泊いただいたお客様向けの宿泊予約ページです。空室と料金を確認し、予約リクエストを送信できます。";
const stayUrl = "https://www.formosajapan.com/ec/stay";
const stayOgImageUrl = `${stayUrl}/og-image.jpg`;

export const metadata: Metadata = {
  title: { default: stayTitle, template: "%s｜SK STAY" },
  description: stayDescription,
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: { canonical: stayUrl },
  openGraph: {
    title: stayTitle,
    description: stayDescription,
    type: "website",
    url: stayUrl,
    siteName: "SK Stay",
    locale: "ja_JP",
    images: [{ url: stayOgImageUrl, width: 1200, height: 630, alt: "SK Stay", type: "image/jpeg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: stayTitle,
    description: stayDescription,
    images: [stayOgImageUrl],
  },
};

export default async function StayLayout({children}:{children:React.ReactNode}){const cookieStore=await cookies();const raw=cookieStore.get("stay_locale")?.value;const locale:StayLocale=stayLocales.includes(raw as StayLocale)?raw as StayLocale:"ja";return <StayLanguageProvider locale={locale}><div lang={locale} className="min-h-screen bg-slate-50 text-slate-950"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8"><Link href="/stay"><Image src={withBasePath("/stay/sk-stay-logo.png")} width={190} height={87} alt="SK Stay" className="h-auto w-36 sm:w-40" priority/></Link><div className="flex items-center gap-3"><nav className="flex items-center gap-3 text-sm font-medium"><Link href="/stay/search">空室検索</Link><Link href="/stay/mypage">マイページ</Link></nav><StayLanguageSwitcher/></div></div></header>{children}</div></StayLanguageProvider>}
