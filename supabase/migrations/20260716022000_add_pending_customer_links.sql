create table if not exists public.pending_customer_links (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  google_email text not null,
  status text not null default 'pending' check (status in ('pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pending_customer_links_created_at_idx
  on public.pending_customer_links(created_at desc);

alter table public.pending_customer_links enable row level security;

revoke all on public.pending_customer_links from public;
revoke all on public.pending_customer_links from anon;
revoke all on public.pending_customer_links from authenticated;
grant all on public.pending_customer_links to service_role;

comment on table public.pending_customer_links is
  'Google authenticated users waiting for an administrator-confirmed customer link because their Google email did not match an existing customer.';
