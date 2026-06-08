create table if not exists public.ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.ai_daily_usage enable row level security;
alter table public.ai_daily_usage force row level security;
revoke all privileges on table public.ai_daily_usage from anon, authenticated;

create or replace function public.consume_ai_quota(requested_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  if requested_user_id is null then
    return false;
  end if;

  insert into public.ai_daily_usage (user_id, usage_date, request_count, updated_at)
  values (requested_user_id, current_date, 1, now())
  on conflict (user_id, usage_date)
  do update set
    request_count = public.ai_daily_usage.request_count + 1,
    updated_at = now()
  where public.ai_daily_usage.request_count < 30
  returning request_count into current_count;

  return current_count is not null and current_count <= 30;
end;
$$;

revoke all on function public.consume_ai_quota(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid) to service_role;
