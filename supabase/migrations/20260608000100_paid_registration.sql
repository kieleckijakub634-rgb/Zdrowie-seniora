create table if not exists public.pending_registrations (
  id uuid primary key,
  email text not null,
  email_normalized text not null unique,
  full_name text not null,
  phone text not null default '',
  plan text not null check (plan in ('monthly', 'yearly')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  user_id uuid references auth.users(id) on delete set null,
  stripe_session_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  completed_at timestamptz
);

alter table public.pending_registrations enable row level security;
alter table public.pending_registrations force row level security;
revoke all privileges on table public.pending_registrations from anon, authenticated;

create or replace function public.auth_user_id_by_email(target_email text)
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select id
  from auth.users
  where lower(email) = lower(target_email)
  limit 1;
$$;

revoke all on function public.auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.auth_user_id_by_email(text) to service_role;
