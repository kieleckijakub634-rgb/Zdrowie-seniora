create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  plan text not null default 'monthly',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;
revoke all privileges on table public.subscriptions from anon, authenticated;
grant select on table public.subscriptions to authenticated;

drop policy if exists "users_select_own_subscription" on public.subscriptions;
create policy "users_select_own_subscription"
  on public.subscriptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
