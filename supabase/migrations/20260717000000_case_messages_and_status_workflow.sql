alter table public.customers add column if not exists admin_memo text;

alter table public.estimates drop constraint if exists estimates_status_check;
update public.estimates set status = case status
  when '新規' then '見積作成中' when 'お客様確認中' then '見積確認待ち'
  when 'approved' then '入金待ち' when 'paid' then '発注作業中'
  when '発注済' then '発注完了（中国物流拠点到着待ち）'
  when '中国発送' then '画像確認待ち'
  when '国際配送中' then '日本発送待ち' when '国内発送' then '日本発送待ち'
  else status end;
alter table public.estimates alter column status set default '見積作成中';
alter table public.estimates add constraint estimates_status_check check (status in ('見積作成中','見積確認待ち','入金待ち','発注作業中','発注完了（中国物流拠点到着待ち）','画像確認待ち','日本発送待ち','完了','キャンセル'));

create table public.estimate_messages (
  id uuid primary key default gen_random_uuid(), estimate_id uuid not null references public.estimates(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer','admin')), sender_user_id uuid references auth.users(id) on delete set null,
  body text not null default '' check (char_length(body) <= 5000), created_at timestamptz not null default now()
);
create index estimate_messages_estimate_created_idx on public.estimate_messages(estimate_id, created_at);
create table public.estimate_message_attachments (
  id uuid primary key default gen_random_uuid(), message_id uuid not null references public.estimate_messages(id) on delete cascade,
  storage_path text, original_name text not null, mime_type text not null, file_size integer not null check (file_size between 1 and 10485760),
  is_image boolean not null default false, expires_at timestamptz, deleted_at timestamptz, created_at timestamptz not null default now()
);
create index estimate_message_attachments_expiry_idx on public.estimate_message_attachments(expires_at) where deleted_at is null and is_image;
create table public.estimate_tracking_numbers (
  id uuid primary key default gen_random_uuid(), estimate_id uuid not null references public.estimates(id) on delete cascade,
  sort_order integer not null check (sort_order between 1 and 5), carrier text not null default '', tracking_number text not null default '', note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (estimate_id, sort_order)
);
alter table public.estimate_messages enable row level security;
alter table public.estimate_message_attachments enable row level security;
alter table public.estimate_tracking_numbers enable row level security;
create policy "estimate_messages_select_own" on public.estimate_messages for select to authenticated using (estimate_id in (select e.id from public.estimates e join public.customers c on c.id=e.customer_id where c.auth_user_id=(select auth.uid())));
create policy "estimate_message_attachments_select_own" on public.estimate_message_attachments for select to authenticated using (message_id in (select m.id from public.estimate_messages m join public.estimates e on e.id=m.estimate_id join public.customers c on c.id=e.customer_id where c.auth_user_id=(select auth.uid())));
create policy "estimate_tracking_numbers_select_own" on public.estimate_tracking_numbers for select to authenticated using (estimate_id in (select e.id from public.estimates e join public.customers c on c.id=e.customer_id where c.auth_user_id=(select auth.uid())));
grant select on public.estimate_messages, public.estimate_message_attachments, public.estimate_tracking_numbers to authenticated;
insert into storage.buckets (id,name,public,file_size_limit) values ('estimate-messages','estimate-messages',false,10485760) on conflict (id) do update set public=false,file_size_limit=10485760;

create or replace function public.expire_stale_estimates() returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare affected integer; begin
  update public.estimates set status='キャンセル' where status='見積確認待ち' and updated_at < now()-interval '1 month';
  get diagnostics affected=row_count; return affected;
end; $$;
revoke all on function public.expire_stale_estimates() from public,anon,authenticated;
grant execute on function public.expire_stale_estimates() to service_role;

create or replace function public.sync_order_from_estimate() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.status in ('入金待ち','発注作業中','発注完了（中国物流拠点到着待ち）','画像確認待ち','日本発送待ち','完了') then
    insert into public.orders(order_no,estimate_id,customer_id,payment_status,shipping_status,ordered_at)
    values ('ORD-'||new.estimate_no,new.id,new.customer_id,case when new.paid_at is not null then 'paid' else 'unpaid' end,
      case new.status when '画像確認待ち' then '画像確認待ち' when '日本発送待ち' then '日本発送待ち' when '完了' then '完了' else '受付' end,
      coalesce(new.approved_at,new.updated_at,now()))
    on conflict(estimate_id) do update set payment_status=excluded.payment_status,shipping_status=excluded.shipping_status,updated_at=now();
  end if; return new;
end; $$;
