# SK EC Pro システム仕様書

| 項目 | 内容 |
| --- | --- |
| システム名 | SK EC Pro / SK STAY |
| 運営者 | Formosa Japan |
| 公開URL | `https://www.formosajapan.com/ec` |
| 宿泊URL | `https://www.formosajapan.com/ec/stay` |
| 文書種別 | 現行ソース実装仕様（As-Built） |
| 基準日 | 2026-07-22 |

## 1. 目的とサービス境界

本システムは、一つのNext.jsアプリで次のサービスを提供する。

1. 中国EC購入代行: 公開案内、見積、承認、決済、顧客・注文・配送管理
2. SK STAY: リピーター向けの宿泊・配車予約、顧客マイページ、管理業務

購入代行サイトは検索公開する。SK STAYはURL共有限定であり、ログイン必須の入口やBasic認証は設けない一方、`/ec/stay`と全子ページを検索対象外にする。SK STAYを公開ヘッダー、フッター、sitemapへ追加しない。

## 2. システム構成

| レイヤー | 技術・役割 |
| --- | --- |
| Web | Next.js 16.2.10 App Router、React 19.2.4、TypeScript |
| UI | Tailwind CSS 4、Radix Slot、Lucide Icons |
| DB/Auth/Storage | Supabase |
| メール | Resend |
| 決済 | Stripe Checkout、Stripe Webhook |
| PDF | PDFKit、Noto Sans JP / Noto Sans SC |
| フォーム保護 | Cloudflare Turnstile、honeypot、DB rate limit |
| 地図・距離 | Google Maps Routes API |
| ホスティング | Vercel |

`next.config.ts`の`basePath`は`/ec`である。本書のアプリ内パスは、特記がない限り先頭に`/ec`を付けたURLで公開される。

## 3. 利用者・認証・認可

| 利用者 | 認証 | 主な範囲 |
| --- | --- | --- |
| 公開利用者 | 不要 | 公開ページ、見積依頼、問い合わせ、番号共有ページ |
| 購入代行顧客 | Google / Microsoft OAuth | 自分の見積、メッセージ、注文、プロフィール |
| 宿泊閲覧者 | 不要 | SK STAYトップ、空室検索、部屋詳細 |
| 宿泊顧客 | Google / Microsoft OAuth | 予約、決済、領収書、メッセージ、配車、プロフィール |
| 管理者 | Google OAuth + `ADMIN_EMAILS` | 全管理機能 |

- SupabaseのMicrosoft provider名は`azure`である。
- 管理者はGoogleのみとし、レイアウト、Proxy、Server Action／Route Handlerでサーバー側認可を行う。
- 宿泊新規登録ではOAuth開始前に氏名・メールを入力し、一時Cookie経由でOAuth callbackへ渡す。
- Service Role Keyはサーバー限定とする。

## 4. URL仕様

### 4.1 購入代行・公開ページ

| パス | 機能 |
| --- | --- |
| `/` | 公開トップ |
| `/purchase-agent` | 中国EC購入代行案内 |
| `/pricing` | 料金案内 |
| `/estimate` | 見積依頼 |
| `/estimate/[estimateNumber]` | 正式見積、承認、決済 |
| `/status/[estimateNumber]` | 案件進捗 |
| `/original-products` | オリジナル商品 |
| `/faq` | FAQ |
| `/about` | 運営・サービス案内 |
| `/contact` | 問い合わせ |
| `/terms` / `/privacy` | 規約・プライバシー |
| `/login` | 顧客ログイン・登録 |
| `/auth/callback` | 共通OAuth callback |

### 4.2 購入代行顧客マイページ

| パス | 機能 |
| --- | --- |
| `/account` | 顧客サマリー |
| `/account/estimates` | 見積一覧 |
| `/account/estimates/[id]` | 見積、画像、承認、決済、進捗 |
| `/account/estimates/[id]/pdf` | 本人用見積書PDF |
| `/account/messages` | 案件メッセージ一覧 |
| `/account/orders` / `/account/orders/[id]` | 注文・配送 |
| `/account/profile` | 顧客情報・住所・退会 |

### 4.3 SK STAY

| パス | 機能 |
| --- | --- |
| `/stay` | リピーター向け宿泊予約トップ |
| `/stay/search` | 建物・部屋・空室カレンダー・料金検索 |
| `/stay/listings` / `/stay/listings/[id]` | 部屋一覧・詳細 |
| `/stay/book/[listingId]` | 予約リクエスト |
| `/stay/login` / `/stay/signup` | 宿泊顧客ログイン・登録 |
| `/stay/mypage` | 宿泊顧客サマリー |
| `/stay/mypage/bookings` | 宿泊予約一覧 |
| `/stay/mypage/bookings/[id]` | 予約詳細、確認、決済、キャンセル |
| `/stay/mypage/bookings/[id]/receipt` | 支払済み領収書PDF |
| `/stay/messages` / `/stay/messages/[threadId]` | 宿泊メッセージ |
| `/stay/profile` | 宿泊プロフィール・英語名 |
| `/stay/mypage/rides` | 配車予約一覧 |
| `/stay/mypage/rides/new` | 配車予約作成・料金見積 |
| `/stay/mypage/rides/[id]` | 配車詳細、確認、決済、キャンセル |
| `/stay/og-image.jpg` | SK STAY専用OGP画像 |

### 4.4 管理画面

| パス | 機能 |
| --- | --- |
| `/admin` | 全体ダッシュボード |
| `/admin/estimates` / `/admin/estimates/[id]` | 見積管理 |
| `/admin/estimates/new` | 手動見積 |
| `/admin/customers` / `/admin/customers/[id]` | 購入代行顧客管理 |
| `/admin/customers/new` | 顧客作成 |
| `/admin/messages` | 案件メッセージ |
| `/admin/orders` / `/admin/shipping` | 注文・発送管理 |
| `/admin/purchase` / `/admin/settings` | 購入・設定 |
| `/admin/stay` | 宿泊管理ダッシュボード |
| `/admin/stay/calendar` | 月間空室・予約カレンダー |
| `/admin/stay/bookings` / `/admin/stay/bookings/[id]` | 宿泊予約管理 |
| `/admin/stay/customers` / `/admin/stay/customers/[id]` | 宿泊顧客管理 |
| `/admin/stay/listings` / `/admin/stay/listings/[id]` | 部屋・建物・画像管理 |
| `/admin/stay/blocked-dates` | 手動ブロック、iCal feed |
| `/admin/stay/pricing` / `/admin/stay/settings` | 料金ルール・長期割引 |
| `/admin/stay/messages` / `/admin/stay/messages/[threadId]` | 宿泊メッセージ管理 |
| `/admin/stay/rides` | 配車料金・予約管理 |

## 5. 購入代行見積仕様

### 5.1 入力・保護

- 1回につき1～10商品
- 商品ごとにURL、数量、色、サイズ、型番、希望内容、画像を入力可能
- 商品URLまたは画像のいずれかを必須とする
- 画像は1商品につき最大1枚、JPEG/PNG/WebP、10MB以下
- MIME、拡張子相当、ファイルシグネチャをサーバー検証する
- `/api/estimate`は`honeypot → DB rate limit → Turnstile → 入力検証 → DB/Storage/メール`の順に処理する
- `/api/contact`も同じ保護順序を使用する

### 5.2 登録・通知

1. RPCで顧客、見積、商品を登録する。
2. `estimate-images`へ画像を保存する。
3. 管理者通知と顧客自動返信をResendで送る。
4. 見積番号を表示する。

途中失敗時は可能な範囲で画像・DBデータをロールバックする。`ESTIMATE_TEST_MODE=true`ではメール送信を省略できる。

### 5.3 正式見積・決済

- 商品金額、各送料、代行手数料、その他費用、割引、税、デポジットを整数円で扱う
- 画面、PDF、決済で共通計算ロジックを使用する
- 銀行振込とStripeクレジットカードを提供する
- 購入代行のStripeカード手数料率は`3.6%`（`config/payment.ts`）
- Checkout前に対象、状態、金額をサーバー再検証する
- Webhook署名と支払金額を検証して支払状態を更新する

## 6. 購入代行案件・メッセージ

- 顧客は自分に紐づく見積・注文だけを取得できる
- 管理者は明細、金額、ステータス、メモ、入金、画像を管理する
- 顧客・管理者間の案件メッセージと添付に対応する
- 画像添付には有効期限を設定し、期限切れcleanupを行う
- 受領画像確認、追跡番号、注文・発送ステータスを管理する
- 顧客退会と管理者削除では関連DB・Storageを対象にする

## 7. SK STAY検索・予約

### 7.1 検索フロー

`建物 → 部屋 → カレンダー → 予約リクエスト`の順とする。

- 建物グループ: `F322`、`F321`、`F443`
- 部屋: 13室を初期データとして定義
- 月間カレンダーは`○`を予約可、`×`を予約済み・ブロック・受付停止として表示
- 予約可能範囲は実装上18か月
- 部屋画像があれば建物画像より優先する

### 7.2 価格

- DBの`calculate_stay_price`を正とする
- 基本料金、追加人数料金、清掃費、割引、管理調整を分離する
- 7泊・14泊・30泊以上では該当する最も高い1つの長期割引だけを適用する
- 既定割引は10%・20%・30%
- F322の30泊以上は40%
- 割引対象は宿泊料金と追加人数料金で、清掃費は対象外
- 人数変更時はサーバー再計算し、古いレスポンスが最新見積を上書きしないよう制御する

### 7.3 予約競合

- Server ActionだけでなくDB RPCでも入力と価格を再検証する
- listing単位のadvisory lockと日付範囲制約で二重予約を防止する
- 日付範囲はチェックアウト日を含まない`[)`とし、同日チェックアウト／次回チェックインを許可する
- Airbnbブロック、手動ブロック、既存予約を確認する

### 7.4 予約・決済・領収書

- 顧客申請後、管理者確認、顧客確認、支払い、宿泊、完了の状態を管理する
- Stripe Checkoutと、運用上の現金／外部決済案内に対応する
- 未完了Stripe sessionをキャンセルして予約状態へ戻せる
- 支払済み予約は日本語／英語の領収書PDFを取得できる
- 英語領収書にはプロフィールの英語名を使用する
- 顧客・管理者によるキャンセルと、許可状態に限る管理者削除を提供する

## 8. iCal・カレンダー管理

- `stay_calendar_feeds`へ複数feedを登録可能
- Airbnb iCal VEVENTを`stay_blocked_dates`へ同期する
- sourceから消えたイベントは該当feed由来のblockだけ削除し、手動blockを保持する
- 管理画面から保存、更新、削除、手動同期が可能
- `/api/cron/stay-calendar-sync`を`CRON_SECRET`で保護する
- 管理者カレンダーは部屋別の予約・ブロック詳細、`○/×`表示を提供する
- 管理者手動予約も通常の競合防止を通す

## 9. 宿泊画像・多言語

- 部屋画像は複数登録、建物画像は建物グループごとに置換する
- JPEG/PNG/WebP、10MB以下
- Storage bucketは`stay-listings`
- 表示言語は日本語、英語、中国語、韓国語
- localeはCookieに保持し、宿泊レイアウト内だけに適用する
- 領収書PDFは日本語・中国語等のUnicode表示に必要なフォントを埋め込む

## 10. 配車予約

- 宿泊顧客と宿泊予約へ任意で紐づける
- 宿泊に紐づく場合、配車日はチェックイン以上・チェックアウト未満に制限する
- 定額ルートはサーバー側定義から住所と料金を再取得する
- 自由入力ルートはGoogle Mapsから距離・時間を取得する
- 距離制料金の既定値:
  - 初乗り1,000m / 500円
  - 以降232m / 100円
  - 深夜22:00～05:00は距離単位を1.2倍相当に調整
  - 既定割引30%
- 管理者は高速料金、割引、その他料金、合計、日時、住所を確認・調整する
- 管理者確認後に顧客承認と決済へ進む
- 配車のStripe決済手数料は現在0円

## 11. PDF・メール

### 11.1 PDF

- 購入代行見積書: A4、商品・費用・支払い条件・ロゴ
- 宿泊領収書: 予約番号、宿泊期間、内訳、支払情報、発行者情報
- 管理者用はinline、顧客用はdownloadを基本とする
- Route Handlerで認可してから共通生成関数を呼ぶ

### 11.2 メール

- Resendを使用する
- 見積受付、正式見積、承認、メッセージ、宿泊申請、配車申請等を通知する
- APIキーと送信元は環境変数で管理する
- 送信失敗はDB処理と区別して記録・ログ出力する

## 12. データモデル概要

### 12.1 購入代行

`customers`、`profiles`、`estimates`、`estimate_items`、`estimate_item_images`、`estimate_messages`、`estimate_message_attachments`、`orders`等で構成する。

### 12.2 SK STAY

`stay_customers`、`stay_listings`、`stay_building_images`、`stay_listing_images`、`stay_bookings`、`stay_blocked_dates`、`stay_calendar_feeds`、`stay_pricing_rules`、`stay_settings`、`stay_message_threads`、`stay_messages`、`stay_notifications`、`stay_ride_bookings`、`stay_ride_settings`等で構成する。

### 12.3 主要RPC

- 購入代行: 見積作成、手動見積、顧客紐付け、期限切れ、退会処理
- 宿泊: 価格計算、予約作成、空室判定、手動予約、顧客削除・再割当
- 配車: 予約番号生成、時間競合判定
- フォーム: 送信rate limit

DB変更は`supabase/migrations/`へ追加し、本番DBへ直接SQLを実行しない。

## 13. API・Route Handler

| メソッド・パス | 概要 |
| --- | --- |
| `POST /api/estimate` | 見積依頼、画像、メール |
| `POST /api/contact` | 問い合わせメール |
| `GET /api/postal-code` | 郵便番号検索 |
| `POST /api/stripe/webhook` | 購入代行・宿泊・配車決済反映 |
| `GET /api/cron/stay-calendar-sync` | iCal定期同期 |
| `POST /api/stay/rides/quote` | 配車距離・料金見積 |
| `GET /auth/callback` | OAuth callbackとサービス別顧客作成 |
| `GET /stay/og-image.jpg` | `public/ec/stay/og-image.jpg`を返却 |
| 各PDF／領収書route | 権限検証後にPDF返却 |
| Stripe cancel route | 未完了Checkoutをexpireし状態復元 |

## 14. SEO・公開範囲

### 14.1 公開サイト

- ルートmetadataでSK EC Pro用title、description、canonical、Open Graph、Twitter Cardを設定
- `sitemap.xml`は購入代行の公開ページだけを明示列挙する
- `/ec`、`/ec/purchase-agent`、`/ec/pricing`、`/ec/contact`等には`noindex`を付けない

### 14.2 SK STAY

- `app/stay/layout.tsx`で宿泊専用metadataを設定
- title: `宿泊予約｜SK STAY`
- description: `以前ご宿泊いただいたお客様向けの宿泊予約ページです。空室と料金を確認し、予約リクエストを送信できます。`
- canonical: `https://www.formosajapan.com/ec/stay`
- siteName: `SK Stay`
- OGP image: `https://www.formosajapan.com/ec/stay/og-image.jpg`（1200×630 JPEG）
- robots / googlebot: `noindex, nofollow`
- layout継承により`/ec/stay/*`にも適用
- sitemapへ`/ec/stay`と子ページを含めない
- `robots.txt`では`/ec/stay`をDisallowしない。crawlerがmeta robotsを読める状態を保つ

## 15. セキュリティ

- Supabase RLSで顧客データを認証ユーザーへ限定する
- 管理者は`ADMIN_EMAILS`をサーバー側で検証する
- Service Role Key、Stripe Secret、Resend Key、Turnstile SecretをClient Componentへ渡さない
- Storageは用途別bucketと署名付きURLを使用する
- Stripe Webhook署名を必須とする
- 公開フォームはhoneypot、rate limit、Turnstile、入力検証を通す
- Server Action／Route Handlerで対象ID、所有者、状態、金額を再検証する
- 管理・顧客・宿泊private画面はnoindexとする

## 16. 環境変数

| 変数 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 公開キー |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー管理処理 |
| `ADMIN_EMAILS` | 管理者許可リスト |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | メール |
| `STAY_ADMIN_NOTIFICATION_EMAIL` | 宿泊管理者通知先 |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Turnstile |
| `CRON_SECRET` | iCal cron |
| `GOOGLE_MAPS_API_KEY` | 配車経路 |
| `BANK_TRANSFER_DETAILS` | 銀行振込案内 |
| `NEXT_PUBLIC_SITE_URL` | metadata用サイトURL |
| `SITE_URL` | メール・Stripe callback用origin |
| `ESTIMATE_TEST_MODE` | 見積受付メール省略 |
| `RECEIPT_ISSUER_NAME` | 領収書発行者名（任意） |
| `RECEIPT_ISSUER_ADDRESS` | 領収書発行者住所（任意） |
| `RECEIPT_REGISTRATION_NUMBER` | 登録番号（任意） |

秘密値は`.env.local`またはVercel Environment Variablesへ保存する。

## 17. Supabase・外部サービス設定

1. `supabase/migrations/`を番号順に適用する。
2. Google／Microsoft providerとcallback URLを設定する。
3. Storage bucket・RLSを確認する。
4. Stripe Webhookを`/ec/api/stripe/webhook`へ設定する。
5. Resend送信ドメインを認証する。
6. Turnstile本番キーを登録する。
7. iCal同期元と`CRON_SECRET`を設定する。
8. 配車を使用する場合は`GOOGLE_MAPS_API_KEY`を設定する。

コードのlint/build成功と、migration適用、外部サービス設定、ライブ動作確認は別の完了条件である。

## 18. 品質確認

変更後の最低確認:

```bash
npm run lint
npm run build
```

本番公開後の確認:

- 公開ページとprivate-by-link境界
- 顧客／管理者／宿泊顧客のOAuthと認可
- 見積、画像、メール、PDF、Stripe Webhook
- 宿泊検索、価格、競合、予約、キャンセル、領収書
- iCal同期、手動block、管理カレンダー
- 配車見積、予約、管理者調整、決済
- `/ec/stay`のtitle、OGP、Twitter、canonical、noindex
- sitemapにSK STAYが含まれないこと

## 19. 現行制約・未検証境界

- URL共有型の見積・進捗ページはURL自体をアクセスキーとして扱う
- SK STAYは検索非公開だがアクセス制限ではない
- PWAはmanifest等の基盤までで、offline cacheやPush通知は未実装
- migrationファイルが存在しても、対象リモートDBへ適用済みとは限らない
- Vercel、OAuth、Stripe、Resend、Turnstile、Google Maps、cronは管理画面側の設定と実環境確認が必要
- LINE等のOGP previewは外部サービス側cacheにより更新が遅れる場合がある

## 20. 主要ソース

| パス | 役割 |
| --- | --- |
| `app/` | 画面、Route Handler、Server Action |
| `app/account/` | 購入代行顧客マイページ |
| `app/admin/` | 管理画面 |
| `app/stay/` | SK STAY |
| `app/admin/stay/` | SK STAY管理 |
| `lib/auth/` | 認証・認可 |
| `lib/estimates/` | 見積画像・計算・PDFデータ |
| `lib/stay/` | 宿泊認証、価格表示、iCal、配車、多言語 |
| `lib/pdf/` | 見積書・宿泊領収書 |
| `lib/supabase/` | Supabase client |
| `lib/stripe/` | Stripe client |
| `config/` | サイト・支払設定 |
| `supabase/migrations/` | DB migration |
| `public/ec/stay/og-image.jpg` | SK STAY OGP原本 |
| `next.config.ts` | basePath、Server Action、PDF設定 |
| `vercel.json` | Vercel redirect |
