# SK EC Pro

Formosa Japanが運営する、中国EC購入代行・顧客管理・宿泊予約を一つのNext.jsアプリで提供するプロジェクトです。

- 公開サイト: `https://www.formosajapan.com/ec`
- 宿泊予約（URL共有限定）: `https://www.formosajapan.com/ec/stay`
- 技術仕様: [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md)

## 主な機能

### 中国EC購入代行

- サービス案内、料金、FAQ、お問い合わせ
- 1～10商品の見積依頼、商品画像アップロード
- 正式見積、承認、銀行振込、Stripe Checkout
- 顧客マイページ、案件メッセージ、注文・配送状況
- 管理者による顧客・見積・注文・発送管理
- 見積書PDF、Resendメール通知

### SK STAY 宿泊予約

- `建物 → 部屋 → カレンダー → 予約リクエスト` の空室検索
- Google／Microsoft OAuthを使う宿泊顧客マイページ
- 予約確認、キャンセル、Stripe決済、領収書PDF、メッセージ
- 日本語・英語・中国語・韓国語の表示切替
- 管理者向け月間カレンダー、手動予約、顧客・料金・画像管理
- Airbnb iCal取込、手動ブロック、競合防止
- 宿泊に紐づく配車予約、距離制／定額料金、管理者確認
- `/ec/stay` 全体を`noindex, nofollow`とし、公開ナビゲーションとsitemapから除外
- SK STAY専用のtitle、description、canonical、OGP、Twitter Card

## 技術構成

- Next.js `16.2.10`（App Router / Turbopack）
- React `19.2.4` / TypeScript
- Tailwind CSS 4 / Radix Slot / Lucide
- Supabase Database / Auth / Storage / RLS
- Stripe Checkout / Webhook
- Resend
- PDFKit
- Cloudflare Turnstile
- Vercel

`next.config.ts`の`basePath`は`/ec`です。ソース上の`app/stay`は公開URLでは`/ec/stay`になります。

## セットアップ

### 1. 依存関係

```bash
npm install
```

### 2. 環境変数

```bash
cp .env.example .env.local
```

主な環境変数:

| 変数 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase公開キー |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー管理処理 |
| `ADMIN_EMAILS` | 管理者Googleアカウント許可リスト |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | メール送信 |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | 公開フォーム保護 |
| `STAY_ADMIN_NOTIFICATION_EMAIL` | 宿泊予約の管理者通知先 |
| `CRON_SECRET` | iCal自動同期API |
| `GOOGLE_MAPS_API_KEY` | 配車経路・距離取得 |
| `BANK_TRANSFER_DETAILS` | 銀行振込案内 |
| `RECEIPT_ISSUER_NAME` | 宿泊領収書の発行者名（任意） |
| `RECEIPT_ISSUER_ADDRESS` | 宿泊領収書の発行者住所（任意） |
| `RECEIPT_REGISTRATION_NUMBER` | 適格請求書登録番号（任意） |

全項目と既定値は`.env.example`および仕様書を参照してください。秘密値はGitへコミットしません。

### 3. Supabase

ローカルまたは対象プロジェクトへ`supabase/migrations/`を順番に適用します。

```bash
npx supabase db push --yes
```

注意: lintやbuildの成功は、リモートDBへのmigration適用を意味しません。コード検証とDB反映は別々に確認してください。本番DBへ直接SQLを実行せず、必ずmigrationを使用します。

Supabase Authでは次を設定します。

- 顧客・宿泊顧客: Google、Microsoft（Supabase provider名は`azure`）
- 管理者: Googleのみ
- Callback URL: `https://www.formosajapan.com/ec/auth/callback`

### 4. 開発サーバー

```bash
npm run dev
```

アクセス先は`http://localhost:3000/ec`です。

## 品質確認

```bash
npm run lint
npm run build
```

Turbopackは実行環境によってプロセス生成やポートbindingの制限を受けることがあります。制限による失敗とコードエラーを分けて確認してください。

## デプロイ時の確認

- Vercel環境変数
- Supabase migration、RLS、Storage bucket、OAuth redirect URL
- Stripe Webhook: `/ec/api/stripe/webhook`
- Resend送信ドメイン
- Turnstile本番キー
- iCal cron secret
- `/ec/stay`の`noindex, nofollow`とsitemap除外
- `/ec/stay`のOGP画像: `/ec/stay/og-image.jpg`
- Google／Microsoftログイン、Stripe、メール、PDFの実環境動作

## 主要ディレクトリ

| パス | 内容 |
| --- | --- |
| `app/` | App Router画面、Route Handler、Server Action |
| `app/account/` | 購入代行顧客マイページ |
| `app/admin/` | 管理画面 |
| `app/stay/` | SK STAYの公開・認証・マイページ |
| `app/admin/stay/` | SK STAY管理画面 |
| `lib/` | 認証、計算、PDF、Supabase、Stripe、宿泊共通処理 |
| `supabase/migrations/` | DB差分migration |
| `public/ec/stay/og-image.jpg` | SK STAY OGP画像の原本 |
| `docs/SPECIFICATION.md` | 現行実装仕様 |

## 運用上の境界

- `/ec`配下の購入代行公開ページは検索公開する
- `/ec/stay`と子ページはURLを知る利用者がアクセスできるが検索結果には表示しない
- `/ec/admin`は管理者許可リストをサーバー側でも検証する
- Service Role Key、Stripe Secret、Resend Key、Turnstile Secretをブラウザへ公開しない
- migration適用、デプロイ、OAuth・決済・メールのライブ確認は個別に記録する
