alter table public.estimates add column if not exists memo text;

alter table public.estimates drop constraint if exists estimates_status_check;
alter table public.estimates alter column status set default '新規';

update public.estimates
set status = case status
  when '未対応' then '新規'
  when '対応中' then '見積作成中'
  when '見積送付済' then 'お客様確認中'
  when '注文確定' then '発注済'
  when '購入済' then '発注済'
  when '中国倉庫' then '中国発送'
  when '国際発送済' then '国際配送中'
  else status
end
where status in ('未対応', '対応中', '見積送付済', '注文確定', '購入済', '中国倉庫', '国際発送済');

alter table public.estimates
  add constraint estimates_status_check
  check (status in ('新規', '見積作成中', 'お客様確認中', 'approved', 'paid', '発注済', '中国発送', '国際配送中', '国内発送', '完了', 'キャンセル'));
