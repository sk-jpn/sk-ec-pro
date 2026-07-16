alter table public.estimates add column if not exists paid_at timestamptz;
alter table public.estimates add column if not exists payment_fee integer not null default 0;
alter table public.estimates add column if not exists stripe_checkout_session_id text;

alter table public.estimates drop constraint if exists estimates_payment_fee_check;
alter table public.estimates add constraint estimates_payment_fee_check check (payment_fee >= 0);

alter table public.estimates drop constraint if exists estimates_status_check;
alter table public.estimates
  add constraint estimates_status_check
  check (status in ('新規', '見積作成中', 'お客様確認中', 'approved', 'paid', '発注済', '中国発送', '国際配送中', '国内発送', '完了', 'キャンセル'));
