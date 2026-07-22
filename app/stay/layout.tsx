import type { Metadata } from "next";
import { cookies } from "next/headers";
import { stayLocales, type StayLocale } from "@/lib/stay/i18n";
import { StayHeader } from "./stay-header";
import { StayLanguageProvider } from "./stay-language";

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

export default async function StayLayout({children}:{children:React.ReactNode}){const cookieStore=await cookies();const raw=cookieStore.get("stay_locale")?.value;const locale:StayLocale=stayLocales.includes(raw as StayLocale)?raw as StayLocale:"ja";return <StayLanguageProvider locale={locale}><div lang={locale} className="min-h-screen bg-slate-50 text-slate-950"><StayHeader/>{children}</div></StayLanguageProvider>}
