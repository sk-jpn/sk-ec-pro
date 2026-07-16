import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { withBasePath } from "@/config/site";

export function SiteHeader({ showBrandNotice = false }: { showBrandNotice?: boolean }) {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      {showBrandNotice && (
        <div className="border-b border-blue-100 bg-blue-50 text-blue-950">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-1 px-5 py-2.5 text-xs leading-5 sm:flex-row sm:items-center sm:justify-center sm:gap-3 sm:px-8 sm:text-center">
            <p><span className="font-semibold">タオバオの達人は、SK EC Proへ名称変更しました。</span><span className="ml-1.5 text-blue-700">運営会社とサービス提供主体はこれまでと同じです。</span></p>
            <Link href="/about" className="shrink-0 font-semibold text-blue-700 underline decoration-blue-300 underline-offset-4 transition hover:text-blue-900">名称変更について</Link>
          </div>
        </div>
      )}
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="relative h-[3.75rem] w-40 overflow-hidden" aria-label="SK EC Pro ホーム">
          <Image
            src={withBasePath("/brand/sk-ec-pro-logo.png")}
            alt="SK EC Pro"
            fill
            sizes="160px"
            priority
            className="object-cover"
          />
        </Link>
        <nav className="hidden items-center gap-4 text-[13px] font-medium text-slate-600 lg:flex" aria-label="メインナビゲーション">
          <Link className="transition hover:text-blue-600" href="/purchase-agent">中国EC購入代行</Link>
          <Link className="transition hover:text-blue-600" href="/pricing">料金</Link>
          <Link className="transition hover:text-blue-600" href="/original-products">当社オリジナル製品</Link>
          <Link className="transition hover:text-blue-600" href="/faq">FAQ</Link>
          <Link className="transition hover:text-blue-600" href="/contact">お問い合わせ</Link>
          <Link className="transition hover:text-blue-600" href="/account">My Page</Link>
          <Link className="rounded-full bg-slate-950 px-5 py-2.5 text-white transition hover:bg-blue-600" href="/estimate">
            無料見積
          </Link>
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          <details className="group relative">
            <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-slate-200 bg-white text-slate-700" aria-label="メニューを開く"><Menu size={19} /></summary>
            <nav className="absolute right-0 top-12 grid w-64 gap-1 rounded-2xl border border-slate-100 bg-white p-3 text-sm font-medium text-slate-700 shadow-2xl" aria-label="モバイルナビゲーション">
              <Link className="rounded-xl px-3 py-3 hover:bg-blue-50" href="/purchase-agent">中国EC購入代行</Link><Link className="rounded-xl px-3 py-3 hover:bg-blue-50" href="/pricing">料金</Link><Link className="rounded-xl px-3 py-3 hover:bg-blue-50" href="/original-products">当社オリジナル製品</Link><Link className="rounded-xl px-3 py-3 hover:bg-blue-50" href="/faq">FAQ</Link><Link className="rounded-xl px-3 py-3 hover:bg-blue-50" href="/contact">お問い合わせ</Link><Link className="rounded-xl px-3 py-3 hover:bg-blue-50" href="/account">My Page</Link>
            </nav>
          </details>
          <Link className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white" href="/estimate">無料見積</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-10 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
      <Link href="/" className="flex items-center gap-3 text-slate-950">
        <span className="relative block h-16 w-44 overflow-hidden">
          <Image
            src={withBasePath("/brand/sk-ec-pro-logo.png")}
            alt="SK EC Pro"
            fill
            sizes="176px"
            className="object-cover"
          />
        </span>
        <span className="max-w-48 text-[11px] leading-relaxed text-slate-400">Formosa Japan</span>
      </Link>
      <div className="flex flex-wrap gap-6">
        <Link href="/purchase-agent" className="hover:text-blue-600">中国EC購入代行</Link>
        <Link href="/pricing" className="hover:text-blue-600">料金</Link>
        <Link href="/original-products" className="hover:text-blue-600">当社オリジナル製品</Link>
        <Link href="/faq" className="hover:text-blue-600">FAQ</Link>
        <Link href="/#shops" className="hover:text-blue-600">当社運営ショップ</Link>
        <Link href="/#why" className="hover:text-blue-600">選ばれる理由</Link>
        <Link href="/contact" className="hover:text-blue-600">お問い合わせ</Link>
        <Link href="/account" className="hover:text-blue-600">マイページ</Link>
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        <Link href="/about" className="hover:text-blue-600">会社概要</Link>
        <Link href="/terms" className="hover:text-blue-600">利用規約</Link>
        <Link href="/privacy" className="hover:text-blue-600">プライバシーポリシー</Link>
      </div>
      <p className="text-xs">© 2026 SK EC Pro</p>
    </footer>
  );
}
