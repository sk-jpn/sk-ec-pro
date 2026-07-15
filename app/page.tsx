import {
  ArrowRight,
  BadgeCheck,
  Box,
  Calculator,
  Check,
  ClipboardCheck,
  CreditCard,
  Globe2,
  Handshake,
  Headphones,
  Languages,
  Link2,
  MapPinCheck,
  PackageCheck,
  Plane,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Warehouse,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "./components/site-chrome";

const services = [
  {
    name: "Taobao",
    sub: "淘宝",
    text: "中国最大級の総合ECサイト。個人向け商品から専門商品まで幅広く対応。",
    icon: ShoppingBag,
  },
  {
    name: "1688",
    sub: "中国国内向け卸売",
    text: "中国国内向けの卸売サイト。業務用商品やまとめ買い、仕入れに対応。",
    icon: Box,
  },
  {
    name: "Xianyu",
    sub: "闲鱼・咸鱼",
    text: "中古品、廃盤品、コレクター商品、個人出品商品の購入に対応。",
    icon: Search,
  },
  {
    name: "Tmall",
    sub: "天猫",
    text: "ブランド公式店や正規販売店の商品購入に対応。",
    icon: Store,
  },
  {
    name: "Alibaba",
    sub: "法人向け卸売",
    text: "卸売、法人向け商品、大口注文、OEM相談に対応。",
    icon: Globe2,
  },
];

const steps = [
  {
    step: "STEP 1",
    title: "商品URLを送る",
    text: "購入希望商品のURL、数量、仕様などを送っていただきます。",
    icon: Link2,
  },
  {
    step: "STEP 2",
    title: "無料見積",
    text: "商品代金、代行手数料、中国国内送料、国際送料などを確認して見積します。",
    icon: Calculator,
  },
  {
    step: "STEP 3",
    title: "購入・受け取り",
    text: "入金確認後、商品を購入し、中国側の受取先で商品を受け取ります。",
    icon: Warehouse,
  },
  {
    step: "STEP 4",
    title: "日本へ発送",
    text: "必要な確認を行い、日本の指定住所へ国際発送します。",
    icon: Truck,
  },
];

const recommendations = [
  { text: "日本では販売されていない商品を購入したい", icon: ShoppingBag },
  { text: "中国語での出品者とのやり取りが難しい", icon: Languages },
  { text: "Xianyuの中古品や廃盤品を購入したい", icon: Search },
  { text: "1688で商品をまとめて仕入れたい", icon: Box },
  { text: "中国のECサイトで決済手段を用意できない", icon: CreditCard },
];

const shops = [
  {
    name: "Yahoo!ショッピング",
    text: "SK EC Proが運営するYahoo!ショッピング店です。",
    icon: ShoppingBag,
    href: "https://store.shopping.yahoo.co.jp/taobaonotatsujinpro/",
  },
  {
    name: "Amazon",
    text: "SK EC Proの取扱商品を購入できるAmazonストアです。",
    icon: Store,
    href: "https://www.amazon.co.jp/stores/iFormosa/page/8055D27A-D7EF-452A-B983-3D7E673B6287",
  },
];

const reasons = [
  {
    icon: ShieldCheck,
    number: "01",
    title: "安心の日本語サポート",
    text: "中国語が分からなくても大丈夫。お問い合わせから取引完了まで、日本語で丁寧に伴走します。",
  },
  {
    icon: Zap,
    number: "02",
    title: "複雑な業務をシンプルに",
    text: "商品探し、購入手続き、検品、国際発送まで。煩雑な中国ECでのお買い物を分かりやすくサポートします。",
  },
  {
    icon: Handshake,
    number: "03",
    title: "日本への発送まで一貫対応",
    text: "購入した商品を検品し、まとめて日本へ発送。お客様のお手元に届くまで丁寧に対応します。",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-white text-slate-950">
      <SiteHeader showBrandNotice />

      <section id="top" className="relative flex min-h-[820px] items-center pt-36 sm:min-h-[860px] sm:pt-32">
        <div className="hero-glow absolute inset-0" aria-hidden="true" />
        <div className="absolute left-[7%] top-40 size-3 rounded-full bg-blue-300/70 blur-[1px]" aria-hidden="true" />
        <div className="absolute right-[10%] top-36 size-2 rounded-full bg-blue-500/60" aria-hidden="true" />
        <div className="absolute bottom-28 right-[16%] size-4 rounded-full bg-cyan-200/70 blur-[1px]" aria-hidden="true" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-700 shadow-sm shadow-blue-100 backdrop-blur">
              <Sparkles size={14} strokeWidth={2.3} />
              中国EC購入代行と、当社運営ショップのご案内
            </div>
            <h1 className="text-[clamp(3rem,7vw,6.6rem)] font-semibold leading-[1.03] tracking-[-0.065em] text-slate-950">
              中国ECを、<br />もっと簡単に。<br />
              <span className="text-blue-600">もっと安心に。</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Taobao・1688・Xianyu・Tmallなどの中国ECサイトから、お客様に代わって商品を購入し、日本へ発送します。当社が運営するYahoo!ショッピング・Amazonでも商品を販売しています。
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href="#contact" className="group inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">
                まずは無料で相談する
                <ArrowRight size={17} className="transition group-hover:translate-x-1" />
              </a>
              <a href="#services" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600">
                購入代行について見る
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
              {["日本語で完結", "初回相談無料", "個人・法人対応"].map((item) => (
                <span key={item} className="flex items-center gap-1.5"><Check size={14} className="text-blue-600" />{item}</span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[520px] lg:block" aria-hidden="true">
            <div className="absolute inset-8 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="relative rounded-[2.25rem] border border-white/80 bg-white/75 p-5 shadow-[0_30px_100px_-30px_rgba(37,99,235,.32)] backdrop-blur-xl">
              <div className="flex items-center justify-between px-2 pb-5 pt-1">
                <div><p className="text-xs font-medium text-slate-400">PURCHASE FLOW</p><p className="mt-1 font-semibold">ご依頼からお届けまで</p></div>
                <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-blue-600"><Plane size={19} /></span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  [Search, "商品を探す", "中国EC"],
                  [ClipboardCheck, "購入を依頼", "お申し込み"],
                  [PackageCheck, "検品・国際発送", "日本へ発送"],
                  [MapPinCheck, "日本で受け取る", "お届け完了"],
                ].map(([Icon, title, label], index) => {
                  const CardIcon = Icon as typeof Search;
                  return (
                    <div key={title as string} className={`rounded-3xl border p-5 ${index === 3 ? "border-blue-600 bg-blue-600 text-white" : "border-slate-100 bg-white text-slate-950"}`}>
                      <CardIcon size={22} className={index === 3 ? "text-blue-100" : "text-blue-600"} />
                      <p className={`mt-8 text-[11px] ${index === 3 ? "text-blue-100" : "text-slate-400"}`}>0{index + 1} / {label as string}</p>
                      <p className="mt-1 text-sm font-semibold">{title as string}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3.5 text-white">
                <BadgeCheck size={19} className="text-blue-400" />
                <p className="text-xs font-medium">中国ECでの購入から日本への発送までサポート</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="border-y border-slate-100 bg-slate-50/70 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="section-label">Supported Platforms</p>
            <h2 className="section-title">対応している中国ECサイト</h2>
            <p className="section-copy">主要な中国ECサイトの商品購入を代行し、日本への発送までサポートします。</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map(({ name, sub, text, icon: Icon }) => (
              <article key={name} className="service-card group">
                <div className="flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white"><Icon size={21} /></span>
                  <span className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-300">China EC</span>
                </div>
                <div className="mt-7">
                  <h3 className="text-lg font-semibold tracking-tight">{name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{sub}</p>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{text}</p>
                </div>
              </article>
            ))}
            <div className="flex min-h-56 flex-col justify-between rounded-[1.75rem] bg-blue-600 p-6 text-white md:col-span-2 lg:col-span-1">
              <Headphones size={23} />
              <p className="text-sm font-semibold leading-6">掲載外の中国ECサイトも<br />お気軽にご相談ください</p>
            </div>
          </div>
        </div>
      </section>

      <section id="flow" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="section-label">How It Works</p>
            <h2 className="section-title">ご利用の流れ</h2>
            <p className="section-copy">購入したい商品が見つかったら、商品URLをお送りください。お見積りから日本への発送まで順番にご案内します。</p>
          </div>
          <div className="relative mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-blue-100 lg:block" aria-hidden="true" />
            {steps.map(({ step, title, text, icon: Icon }) => (
              <article key={step} className="relative rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_12px_40px_-32px_rgba(15,23,42,.3)]">
                <div className="flex items-center justify-between">
                  <span className="relative grid size-14 place-items-center rounded-full border-4 border-white bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Icon size={21} /></span>
                  <span className="text-xs font-bold tracking-[.14em] text-blue-600">{step}</span>
                </div>
                <h3 className="mt-8 text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/70 py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:px-10">
          <div>
            <p className="section-label">Recommended For</p>
            <h2 className="section-title">このような方に<br className="hidden lg:block" />おすすめ</h2>
            <p className="section-copy">中国ECの商品購入や決済、出品者とのやり取りでお困りの方をサポートします。</p>
          </div>
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {recommendations.map(({ text, icon: Icon }) => (
              <li key={text} className="flex items-center gap-4 py-5 sm:py-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-blue-600 shadow-sm"><Icon size={18} /></span>
                <span className="text-sm font-medium leading-6 text-slate-700 sm:text-base">{text}</span>
                <Check size={18} className="ml-auto shrink-0 text-blue-600" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="shops" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end lg:gap-20">
            <div>
              <p className="section-label">Our Online Shops</p>
              <h2 className="section-title">当社運営ショップ</h2>
              <p className="section-copy">SK EC Proが運営するオンラインショップです。中国から仕入れた商品や当社取扱商品を販売しています。</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {shops.map(({ name, text, href, icon: Icon }) => (
                <article key={name} className="group rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-[0_20px_45px_-28px_rgba(37,99,235,.35)]">
                  <span className="grid size-12 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm"><Icon size={22} /></span>
                  <h3 className="mt-8 text-xl font-semibold tracking-tight">{name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-800" aria-label={`${name}のショップを見る`}>
                    ショップを見る <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="border-y border-slate-100 bg-slate-50/70 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="section-label">Why SK EC Pro</p>
              <h2 className="section-title">はじめてでも、<br className="hidden lg:block" />安心の中国EC。</h2>
              <p className="section-copy">国や言葉の壁を越えて、中国ECでのお買い物をもっと身近にします。</p>
              <div className="mt-9 inline-flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm font-medium text-blue-800">
                <Send size={18} /> 購入から日本への発送まで一貫対応
              </div>
            </div>
            <div className="divide-y divide-slate-100 border-y border-slate-100">
              {reasons.map(({ icon: Icon, number, title, text }) => (
                <article key={number} className="grid gap-5 py-8 sm:grid-cols-[3rem_1fr_auto] sm:items-start sm:gap-6">
                  <span className="text-xs font-semibold text-blue-600">{number}</span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h3>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">{text}</p>
                  </div>
                  <span className="hidden size-12 place-items-center rounded-full border border-slate-100 text-blue-600 sm:grid"><Icon size={21} /></span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="contact-panel mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] px-6 py-20 text-center text-white sm:rounded-[2.75rem] sm:px-10 sm:py-28">
          <div className="relative mx-auto max-w-3xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Let&apos;s get started</p>
            <h2 className="text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">購入したい商品のURLを<br className="hidden sm:block" />お送りください</h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">商品URL、数量、色、サイズなどを確認し、無料でお見積りします。</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/estimate" className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-blue-700 shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5">
                無料見積を依頼する
                <ArrowRight size={17} className="transition group-hover:translate-x-1" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 py-4 text-sm font-semibold text-white transition hover:bg-white/20">
                お問い合わせ
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
