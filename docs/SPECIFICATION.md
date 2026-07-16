# SK EC Pro システム仕様書

| 項目 | 内容 |
| --- | --- |
| システム名 | SK EC Pro |
| 運営者 | Formosa Japan |
| 公開URL | `https://formosajapan.com/ec` |
| 文書種別 | 現行実装仕様（As-Built） |
| 基準日 | 2026-07-15 |

## 1. 目的と対象範囲

SK EC Proは、中国EC商品の購入代行について、見積依頼の受付から正式見積、承認、決済、注文・発送状況の確認までを一元管理するWebシステムである。

本書は、現行ソースコードおよびSupabaseマイグレーションを基準に、以下を対象とする。

- 一般公開サイトと見積依頼フォーム
- お客様向け見積・進捗確認ページ
- Googleログインを使用するお客様マイページ
- 管理者向け見積・顧客・注文管理画面
- 見積書PDF、メール送信、Stripe Checkout、銀行振込管理
- Supabase Database・Auth・Storage・RLS
- Vercel公開、SEO、PWA準備、環境変数

## 2. 利用者と権限

| 利用者 | 認証 | 主な機能 |
| --- | --- | --- |
| 一般利用者 | 不要 | サービス閲覧、見積依頼、見積番号による見積・進捗確認、承認・決済 |
| お客様 | Supabase Auth（Google） | 自分の見積・注文・プロフィール・発送状況の確認 |
| 管理者 | Supabase Auth（Google）＋メール許可リスト | 全見積の管理、金額編集、PDF生成、メール送信、入金確認、顧客・注文確認 |

管理者判定には `ADMIN_EMAILS` のカンマ区切りメールアドレスを使用する。将来のRBAC追加を考慮し、認可処理は認証クライアントから分離している。

## 3. システム構成

| レイヤー | 採用技術・役割 |
| --- | --- |
| フロントエンド／サーバー | Next.js 16 App Router、React 19、TypeScript |
| UI | Tailwind CSS 4、Radix UI、Lucide Icons |
| DB・認証・ファイル | Supabase Database、Auth、Storage |
| メール | Resend |
| 決済 | Stripe Checkout、Stripe Webhook |
| PDF | PDFKit、Noto Sans JP |
| ホスティング | Vercel想定 |
| DNS・ドメイン | Cloudflare想定、`formosajapan.com` |

Next.jsの `basePath` は `/ec` である。以下のURL表はすべて公開時に `/ec` を先頭に付与する。

## 4. URL・画面仕様

### 4.1 一般公開画面

| URL | 画面・機能 |
| --- | --- |
| `/` | SK EC Proトップページ |
| `/about` | サービス・運営者案内 |
| `/pricing` | 料金案内 |
| `/purchase-agent` | 購入代行案内 |
| `/contact` | お問い合わせ案内 |
| `/privacy` | プライバシーポリシー |
| `/terms` | 利用規約 |
| `/estimate` | 無料見積依頼フォーム |
| `/estimate/[estimateNumber]` | お客様向け正式見積、承認、支払方法選択 |
| `/status/[estimateNumber]` | 見積番号による進捗確認 |
| `/login` | Googleログイン |
| `/auth/callback` | Supabase OAuthコールバック |

### 4.2 お客様マイページ

| URL | 画面・機能 |
| --- | --- |
| `/account` | お客様情報、進行中案件数、総見積件数 |
| `/account/estimates` | ログイン中のお客様に紐づく見積一覧 |
| `/account/estimates/[id]` | 見積詳細、商品画像、金額、PDF、承認・決済、進捗 |
| `/account/estimates/[id]/pdf` | お客様本人の見積書PDF |
| `/account/orders` | 注文一覧 |
| `/account/orders/[id]` | 注文・支払・配送詳細 |
| `/account/profile` | 氏名、メール、電話番号、住所の表示 |

未ログイン時は `/login?next=/account` へ誘導する。取得データは認証ユーザーIDにより絞り込み、RLSでも他人のデータ取得を拒否する。

### 4.3 管理画面

| URL | 画面・機能 |
| --- | --- |
| `/admin` | ダッシュボード |
| `/admin/estimates` | 見積一覧、ステータス表示 |
| `/admin/estimates/[id]` | 案件・メモ・見積金額・画像・入金の管理 |
| `/admin/estimates/[id]/pdf` | 管理者用見積書PDF表示 |
| `/admin/customers` | 顧客一覧 |
| `/admin/orders` | 注文一覧 |
| `/admin/shipping` | 発送管理画面 |
| `/admin/settings` | 設定画面 |

`/admin` 配下はセッション確認に加え、サーバー側でも管理者メール許可リストを検証する。未ログインまたは権限なしの場合はログイン画面へ遷移する。

## 5. 見積依頼仕様

### 5.1 お客様情報

- 氏名、メールアドレス、都道府県、プライバシーポリシー同意は必須
- 会社名、電話番号、中国ECサイト名、配送方法、希望納期、出品者への確認事項、備考を入力可能
- メールアドレス形式、文字数、URL形式はサーバー側でも検証する

### 5.2 商品入力

- 1回の見積依頼は1～10商品
- 商品ごとに商品URL、商品画像、数量、色、サイズ、型番、希望内容を入力可能
- 数量は1以上の整数で必須
- 商品URLまたは商品画像のどちらか1つ以上が必須。両方指定可能
- 商品の追加・削除、画像のドラッグ＆ドロップ、プレビュー、個別削除に対応

### 5.3 商品画像

| 項目 | 制限 |
| --- | --- |
| 形式 | JPEG（`.jpg`、`.jpeg`）、PNG、WebP |
| 枚数 | 1商品につき最大10枚 |
| ファイルサイズ | 1枚につき最大10MB |
| 検証 | MIMEタイプ、拡張子、ファイルシグネチャをサーバーで検証 |
| Storage | 非公開バケット `estimate-images` |
| 保存パス | `<見積番号>/<商品番号>/image<連番>.<拡張子>` |

画像保存途中で失敗した場合、アップロード済み画像および作成済み見積を削除し、不完全な依頼を残さない。

### 5.4 受付完了処理

1. Supabaseの `create_estimate` RPCで顧客、見積、商品を登録する。
2. 商品画像をStorageへ保存し、画像メタデータをDBへ登録する。
3. Resendで管理者宛受付メールとお客様宛自動返信メールを送信する。
4. 受付番号（見積番号）をお客様へ表示する。

`ESTIMATE_TEST_MODE=true` の場合はDB・画像保存後にメール送信を省略する。

## 6. 見積金額仕様

### 6.1 商品明細

- 商品名
- 商品URL
- 数量
- 単価
- 小計（数量 × 単価）

### 6.2 調整金額と合計

以下を円単位の整数として保存する。

- 商品合計
- 中国国内送料
- 国際送料
- 代行手数料
- その他費用
- 割引
- 消費税（将来利用を含む）

計算式は次のとおり。

```text
商品合計 = Σ（数量 × 単価）
合計金額 = 商品合計 + 中国国内送料 + 国際送料 + 代行手数料 + その他費用 - 割引 + 消費税
```

管理画面では入力時にリアルタイム再計算し、保存時にサーバー側でも再計算する。PDF、見積画面、お客様マイページ、Stripe決済は同じ見積データと計算ロジックを使用する。

## 7. 案件ステータス仕様

DBには内部値を保存し、画面では日本語ラベルを表示する。

| 内部値 | 表示名 | 用途 |
| --- | --- | --- |
| `新規` | 新規／受付 | 見積依頼受付直後 |
| `見積作成中` | 見積作成中 | 管理者が見積作成中 |
| `お客様確認中` | お客様確認中 | 正式見積の確認待ち |
| `approved` | 承認済 | お客様が見積を承認 |
| `paid` | 入金済／決済済 | Stripe決済または銀行入金確認済み |
| `発注済` | 発注済 | 中国側へ発注済み |
| `中国発送` | 中国発送 | 中国国内輸送中 |
| `国際配送中` | 国際配送中 | 日本向け国際輸送中 |
| `国内発送` | 国内発送 | 日本国内配送中 |
| `完了` | 完了 | 取引完了 |
| `キャンセル` | キャンセル | 取引中止 |

管理者はプルダウンでステータスを変更し、案件メモを保存できる。変更時には `updated_at` を更新する。

進捗タイムラインは完了済みを緑、現在位置を青、未着手をグレーで表示する。キャンセルは通常の進行経路から分離して表示する。

## 8. 見積承認・決済仕様

### 8.1 見積承認

- 見積番号、見積日時、商品一覧、各費用、合計金額を表示する
- 「見積を承認する」操作で `status=approved`、`approved_at=<承認日時>` を保存する
- 銀行振込を選択した場合は支払方法も同時に保存する
- 承認済み見積は再承認できない
- キャンセル済み見積は承認・決済できない

### 8.2 銀行振込

- お客様の承認後、管理画面に「入金確認」を表示する
- 管理者が入金確認すると `status=paid`、`paid_at=<入金日時>` を保存する
- 二重入金確認を防止する

### 8.3 Stripeクレジットカード

- Stripe Checkoutを使用する
- カード選択時のみ見積合計の3.5%を決済手数料として加算する
- 手数料は `Math.round(見積合計 × 0.035)` で円単位に丸める
- 手数料率は `config/payment.ts` に集約し、将来変更可能とする
- Checkout作成時に見積番号、金額、支払済み状態をサーバーで再検証する
- Stripe Webhookの署名を検証し、決済完了時に `status=paid`、`paid_at`、Checkout Session ID等を保存する
- WebhookではStripeの支払額とDB上の支払予定額が一致することを確認する

## 9. 見積書PDF仕様

| 項目 | 仕様 |
| --- | --- |
| 用紙 | A4縦 |
| 日本語フォント | Noto Sans JP |
| デザイン | 白基調、青系アクセント、法人向け印刷デザイン |
| ブランド | Formosa Japan、サービス名 SK EC Pro |
| ロゴ | 差し替え・追加可能なオプション構成 |

PDFには次を表示する。

- 見積番号、発行日、お客様名、メールアドレス、都道府県
- 商品名またはURL、画像サムネイル、数量、単価、小計
- 商品合計、中国国内送料、国際送料、代行手数料、その他、割引、消費税
- 合計金額（税込）
- 支払方法、有効期限
- `contact@formosajapan.com`
- `https://formosajapan.com/ec`

PDF生成処理は画面ルートから分離され、Bufferを返す共通関数である。管理画面のブラウザ表示、お客様のPDF取得、見積メール添付で同じ生成処理を利用する。

## 10. メール仕様

- 送信サービス: Resend
- 送信元: `RESEND_FROM_EMAIL`（本番値 `contact@formosajapan.com`）
- Reply-To: `RESEND_FROM_EMAIL`
- お問い合わせ先: `contact@formosajapan.com`
- 見積受付時に管理者通知とお客様自動返信を送る
- 管理画面から正式見積メールを送信し、見積書PDFを添付する
- APIキーと送信元は環境変数のみで管理し、ソースへハードコードしない

## 11. お客様マイページ仕様

### 11.1 アカウント紐付け

Googleログイン後、`claim_customer_account` RPCにより、ログインメールアドレスと既存顧客メールアドレスが一致する未紐付けデータを認証ユーザーへ紐付ける。

### 11.2 ホーム

- お客様名
- メールアドレス
- 登録日
- 現在進行中の案件数
- 総見積件数

### 11.3 見積・注文

- 見積一覧: 見積番号、見積日、現在ステータス、合計金額
- 見積詳細: 商品、URL、画像、数量、バリエーション、希望内容、各費用、PDF、決済状況、進捗
- 注文一覧・詳細: 注文番号、注文日、支払状況、発送状況、配送会社、追跡番号
- プロフィール: 氏名、メール、電話番号、住所を表示

## 12. 管理画面仕様

管理者は次の操作を行える。

- 見積一覧・詳細の確認
- 商品URL、画像サムネイル、数量、色、サイズ、型番、希望内容の確認
- 画像クリックによる拡大表示
- ステータスと案件メモの更新
- 商品名、数量、単価、各送料・手数料・割引・税の編集と保存
- 見積書PDFのブラウザ表示
- 正式見積メールの送信
- 銀行振込の入金確認
- 顧客、注文、配送情報の参照
- 右上でGoogleアカウント名の確認とログアウト

## 13. データモデル

### 13.1 テーブル

| テーブル | 役割 | 主な項目 |
| --- | --- | --- |
| `customers` | 顧客情報 | 氏名、会社名、メール、電話、都道府県、住所、`auth_user_id` |
| `estimates` | 見積・案件本体 | 見積番号、顧客ID、ステータス、メモ、各費用、割引、税、承認・支払情報、発行日、有効期限、作成・更新日時 |
| `estimate_items` | 見積商品 | 商品順、URL、商品名、数量、単価、色、サイズ、型番、希望内容 |
| `estimate_item_images` | 商品画像メタデータ | 商品ID、Storageパス、元ファイル名、MIMEタイプ、表示順 |
| `profiles` | 認証ユーザープロフィール | ユーザーID、氏名、メール、電話、住所、作成・更新日時 |
| `orders` | 注文・配送情報 | 注文番号、見積ID、顧客ID、注文日、支払・発送状況、配送会社、追跡番号 |

### 13.2 主なリレーション

```text
auth.users 1 ── 1 profiles
auth.users 1 ── N customers
customers  1 ── N estimates
estimates  1 ── N estimate_items
estimate_items 1 ── N estimate_item_images
estimates  1 ── 0..1 orders
customers  1 ── N orders
```

### 13.3 DB関数・トリガー

| 名称 | 用途 |
| --- | --- |
| `set_updated_at` | 更新時刻を自動更新 |
| `create_estimate` | 顧客・見積・商品を一括登録 |
| `handle_new_auth_user` | Auth登録時にプロフィールを作成 |
| `claim_customer_account` | メール一致する顧客を認証ユーザーへ紐付け |
| `sync_order_from_estimate` | 承認・支払済み見積から注文情報を同期 |

## 14. RLS・セキュリティ仕様

- `customers`、`estimates`、`estimate_items`、`estimate_item_images`、`profiles`、`orders` でRLSを有効化する
- お客様は `auth.uid()` に紐づく自分の顧客・見積・注文データのみ参照可能
- Storageは非公開バケットとし、画像表示時に短時間有効な署名付きURLを発行する
- 管理用・公開処理用のService Role Keyはサーバー専用とし、ブラウザへ公開しない
- Stripe Webhookは署名検証を必須とする
- 公開フォームはクライアントとサーバーの両方で入力検証する
- 管理画面はSupabaseセッションと `ADMIN_EMAILS` の両方で認可する
- `/admin` と `/account` は検索エンジンのインデックス対象外とする

見積番号のみで開ける `/estimate/[estimateNumber]` と `/status/[estimateNumber]` はログイン不要の共有ページである。見積番号は第三者へ推測・共有されないよう取り扱う必要がある。

## 15. API・サーバー処理

| 種別 | パス／処理 | 概要 |
| --- | --- | --- |
| Route Handler | `POST /api/estimate` | 見積依頼登録、画像保存、受付メール送信 |
| Route Handler | `POST /api/stripe/webhook` | Stripe決済完了反映 |
| Server Action | 見積承認 | 承認日時・支払方法・ステータス保存 |
| Server Action | Stripe Checkout作成 | 支払額検証、Checkout URL発行 |
| Server Action | 管理案件更新 | ステータス・メモ保存 |
| Server Action | 管理見積更新 | 明細・金額・発行条件保存 |
| Server Action | 正式見積送信 | PDF生成、Resendメール送信 |
| Server Action | 銀行入金確認 | 入金日時・paidステータス保存 |
| Route Handler | 管理／お客様PDF | 権限検証後にPDFを返却 |

公開URLでは上記パスにも `/ec` が付く。

## 16. SEO・PWA・エラー仕様

- title、description、canonicalを設定する
- Open Graph画像とTwitter Cardを設定する
- favicon、apple iconを設定する
- `robots.txt` と `sitemap.xml` をNext.jsから生成する
- Web App Manifestを生成し、将来のPWA対応に備える
- 404、アプリケーションエラー、グローバルエラー画面を用意する
- サイトURLは `NEXT_PUBLIC_SITE_URL`、既定値は `https://formosajapan.com/ec` とする

## 17. 環境変数

| 変数 | 公開範囲 | 必須用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ブラウザ可 | SupabaseプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ブラウザ可 | Supabase公開キー |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー限定 | 管理DB処理、Storage、公開見積処理 |
| `RESEND_API_KEY` | サーバー限定 | メール送信 |
| `RESEND_FROM_EMAIL` | サーバー限定 | 送信元・Reply-To。`contact@formosajapan.com` |
| `STRIPE_SECRET_KEY` | サーバー限定 | Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | サーバー限定 | Webhook署名検証 |
| `ADMIN_EMAILS` | サーバー限定 | 管理者メール許可リスト（カンマ区切り） |
| `NEXT_PUBLIC_SITE_URL` | ブラウザ可 | canonical等。`https://formosajapan.com/ec` |
| `SITE_URL` | サーバー限定 | サイトオリジン。`https://formosajapan.com` |
| `ESTIMATE_TEST_MODE` | サーバー限定 | `true` で受付メールを送らないテストモード |

秘密値は `.env.local` またはVercel Environment Variablesへ保存し、Gitへコミットしない。

## 18. Supabase側の必要設定

1. `supabase/schema.sql` または各マイグレーションを適用する。
2. Google Providerを有効化し、Google OAuth Client ID／Secretを設定する。
3. Site URLを `https://formosajapan.com/ec` に設定する。
4. Redirect URLsに本番の `https://formosajapan.com/ec/auth/callback` と開発用URLを登録する。
5. 非公開Storageバケット `estimate-images` とStorageポリシーを確認する。
6. RLSポリシー、Authユーザー作成トリガー、注文同期トリガーが有効であることを確認する。

既存DBへ個別マイグレーションを適用する場合は、依存列を考慮し、概ね「ステータス・PDF項目 → 割引 → 承認 → 決済 → 顧客アカウント・注文 → 画像」の順で適用する。

## 19. Vercel・Cloudflare公開仕様

### 19.1 Vercel

- Framework Preset: Next.js
- Production Branch: 運用ブランチに合わせて設定
- 環境変数: 第17章の変数をProductionへ登録
- `vercel.json` によりドメインルート `/` を `/ec` へ誘導する
- Stripe Webhook URLを `https://formosajapan.com/ec/api/stripe/webhook` に設定する
- Resendで `formosajapan.com` の送信ドメイン認証を完了する

### 19.2 Cloudflare DNS

Vercelの「Domains」画面に表示される値を正として、通常は次を設定する。

- apex `formosajapan.com`: Vercel指定のAまたはCNAMEレコード
- `www`: Vercel指定のCNAMEレコード（利用する場合）
- Resend: SPF、DKIM等の認証レコード
- DNS切替時は競合する既存A／AAAA／CNAMEを整理する

DNS値はVercel・Resendプロジェクトごとに異なるため、本書へ固定値を記載しない。

## 20. 非機能要件

| 分類 | 要件 |
| --- | --- |
| レスポンシブ | PC・スマートフォンで主要操作が可能 |
| アクセシビリティ | ラベル、フォーカス、十分な色差、キーボード操作を考慮 |
| 性能 | Server Componentsを基本とし、必要な箇所のみClient Componentsを使用 |
| 可用性 | Vercel・Supabase・Stripe・Resendの稼働状況に依存 |
| 時刻 | 画面表示は原則 `Asia/Tokyo`、DB保存はUTC ISO日時 |
| 金額 | 日本円、整数管理、小数通貨は対象外 |
| ブラウザ | 現行の主要モダンブラウザを対象 |
| 保守性 | 認証、金額計算、PDF、支払設定、DBクライアントを共通モジュール化 |

## 21. 品質確認

変更後は少なくとも以下を実行し、成功を確認する。

```bash
npm run lint
npm run build
```

本番公開後は次を確認する。

- `/ec`、主要公開ページ、404、エラー画面の表示
- Googleログイン、管理者許可リスト、お客様データ分離
- 見積依頼、最大件数・画像制限、Storage保存、受付メール
- 管理画面での金額・ステータス・メモ保存
- 見積書PDFの日本語、画像、印刷レイアウト
- 見積承認の二重実行防止
- Stripeテスト決済、Webhook、銀行振込入金確認
- `robots.txt`、`sitemap.xml`、manifest、OGP、favicon
- モバイル表示と主要ブラウザ表示

## 22. 現行制約と拡張方針

- 一般向け見積・進捗ページは見積番号をアクセスキーとして使用しており、追加の本人認証はない
- お客様プロフィールは現行画面では表示を主目的とし、編集UIは今後の運用要件に合わせて有効化できる
- 注文・発送テーブルは見積から同期する構成で、配送会社・追跡番号・履歴イベントの拡張が可能
- `profiles` と認可モジュールを基盤として、メールログイン、管理者・スタッフRBACを追加可能
- 見積明細を共通データ源として、Stripe以外の決済、再注文、注文履歴を拡張可能
- 顧客IDを基点に、ポイント残高・ポイント履歴・お気に入り商品テーブルを追加可能
- PDF生成は共通Buffer方式のため、メール添付、保管、再発行へ拡張可能
- PWAはmanifest等の基礎構成までで、オフラインキャッシュやPush通知は未実装
- 本番公開の完了には、Vercel、Cloudflare、Supabase、Google OAuth、Resend、Stripe各管理画面での設定と実環境確認が必要

## 23. 主要ソース配置

| パス | 役割 |
| --- | --- |
| `app/` | App Routerの画面、Route Handler、Server Action |
| `app/admin/` | 管理画面 |
| `app/account/` | お客様マイページ |
| `lib/auth/` | 認証・認可共通処理 |
| `lib/estimates/` | 見積計算、画像、PDF用データ取得 |
| `lib/pdf/` | 見積書PDF生成 |
| `lib/supabase/` | Supabaseクライアント |
| `lib/stripe/` | Stripeクライアント |
| `config/payment.ts` | 決済方法、カード手数料率 |
| `config/site.ts` | `/ec` と公開URL |
| `supabase/schema.sql` | 新規環境向け統合DB定義 |
| `supabase/migrations/` | 既存環境向け差分DB定義 |
| `.env.example` | 環境変数の雛形 |
| `next.config.ts` | basePath、PDF関連サーバー設定 |
| `vercel.json` | Vercelのリダイレクト設定 |

