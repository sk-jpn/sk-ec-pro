import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { BASE_PATH, SITE_URL, withBasePath } from "@/config/site";
import { stayLocales, type StayLocale } from "@/lib/stay/i18n";
import { StayLanguageProvider, StayLanguageSwitcher } from "./stay-language";

const stayDescription = "SK Stayの部屋予約ページです。空室と宿泊料金を確認し、オンラインで予約リクエストを送信できます。";

export const metadata: Metadata = {
  title: { default: "部屋予約｜SK Stay", template: "%s｜SK Stay" },
  description: stayDescription,
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: { canonical: `${SITE_URL}/stay` },
  openGraph: {
    title: "部屋予約｜SK Stay",
    description: stayDescription,
    type: "website",
    url: `${SITE_URL}/stay`,
    siteName: "SK Stay",
    locale: "ja_JP",
    images: [{ url: `${BASE_PATH}/stay/sk-stay-logo.png`, width: 948, height: 434, alt: "SK Stay" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "部屋予約｜SK Stay",
    description: stayDescription,
    images: [`${BASE_PATH}/stay/sk-stay-logo.png`],
  },
};

export default async function StayLayout({children}:{children:React.ReactNode}){const cookieStore=await cookies();const raw=cookieStore.get("stay_locale")?.value;const locale:StayLocale=stayLocales.includes(raw as StayLocale)?raw as StayLocale:"ja";return <StayLanguageProvider locale={locale}><div lang={locale} className="min-h-screen bg-slate-50 text-slate-950"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8"><Link href="/stay"><Image src={withBasePath("/stay/sk-stay-logo.png")} width={190} height={87} alt="SK Stay" className="h-auto w-36 sm:w-40" priority/></Link><div className="flex items-center gap-3"><nav className="flex items-center gap-3 text-sm font-medium"><Link href="/stay/search">空室検索</Link><Link href="/stay/mypage">マイページ</Link></nav><StayLanguageSwitcher/></div></div></header>{children}</div></StayLanguageProvider>}
