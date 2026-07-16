alter table public.estimates drop constraint if exists estimates_status_check;

alter table public.estimates
  add constraint estimates_status_check
  check (status in (
    '新規',
    '見積作成中',
    '見積作成完了',
    'お客様確認中',
    'approved',
    'paid',
    '発注済',
    '中国発送',
    '国際配送中',
    '国内発送',
    '完了',
    'キャンセル'
  ));
