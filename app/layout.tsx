import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "SK EC Pro | 中国ECを、もっと簡単に。もっと安心に。",
  description:
    "Taobao、1688、Xianyu、Tmall、Alibabaなどの中国EC商品をお客様に代わって購入し、日本へ発送します。当社運営のYahoo!ショッピング・Amazonもご案内しています。",
  openGraph: {
    title: "SK EC Pro | 中国ECを、もっと簡単に。もっと安心に。",
    description:
      "Taobao、1688、Xianyu、Tmall、Alibabaなどの中国EC商品をお客様に代わって購入し、日本へ発送します。",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
