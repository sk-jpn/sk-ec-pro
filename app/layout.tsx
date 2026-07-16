import type { Metadata } from "next";
import localFont from "next/font/local";
import { BASE_PATH, SITE_URL } from "@/config/site";
import "./globals.css";

const siteSans = localFont({
  variable: "--font-site-sans",
  display: "swap",
  src: [
    {
      path: "../node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL),
  title: { default: "SK EC Pro | 中国EC購入代行・輸入サポート", template: "%s | SK EC Pro" },
  description:
    "Taobao、1688、Xianyu、Tmall、Alibabaなどの中国EC商品をお客様に代わって購入し、日本へ発送します。当社運営のYahoo!ショッピング・Amazonもご案内しています。",
  openGraph: {
    title: "SK EC Pro | 中国ECを、もっと簡単に。もっと安心に。",
    description:
      "Taobao、1688、Xianyu、Tmall、Alibabaなどの中国EC商品をお客様に代わって購入し、日本へ発送します。",
    type: "website",
    url: SITE_URL,
    siteName: "SK EC Pro",
    locale: "ja_JP",
    images: [{ url: `${BASE_PATH}/opengraph-image.png`, width: 1200, height: 630, alt: "SK EC Pro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SK EC Pro | 中国EC購入代行・輸入サポート",
    description: "Taobao、1688など中国EC商品の購入から日本への配送まで、Formosa Japanがサポートします。",
    images: [`${BASE_PATH}/opengraph-image.png`],
  },
  alternates: { canonical: SITE_URL },
  icons: { icon: `${BASE_PATH}/icon.png`, apple: `${BASE_PATH}/apple-icon.png` },
  manifest: `${BASE_PATH}/manifest.webmanifest`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${siteSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
