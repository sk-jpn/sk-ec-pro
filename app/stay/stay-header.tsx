"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { withBasePath } from "@/config/site";
import { StayLanguageSwitcher } from "./stay-language";

const rideListPaths = new Set(["/stay/mypage/rides", "/ec/stay/mypage/rides"]);

export function StayHeader() {
  const pathname = usePathname();
  const isRideListPage = rideListPaths.has(pathname);
  const logo = isRideListPage ? "/stay/sk-ride-logo.png" : "/stay/sk-stay-logo.png";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link href="/stay">
          <Image
            src={withBasePath(logo)}
            width={190}
            height={87}
            alt={isRideListPage ? "SK Ride" : "SK Stay"}
            className="h-auto w-36 sm:w-40"
            priority
          />
        </Link>
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link href="/stay/search">空室検索</Link>
            <Link href="/stay/mypage">マイページ</Link>
          </nav>
          <StayLanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
