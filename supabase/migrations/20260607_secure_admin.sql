create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.admin_users force row level security;
revoke all privileges on table public.admin_users from anon, authenticated;

do $$
declare
  admin_id uuid;
begin
  select id
  into admin_id
  from auth.users
  where lower(email) = lower('kieleckijakub634@gmail.com')
  limit 1;

  if admin_id is null then
    raise exception 'Nie znaleziono użytkownika kieleckijakub634@gmail.com w Supabase Auth.';
  end if;

  insert into public.admin_users (user_id)
  values (admin_id)
  on conflict (user_id) do nothing;
end;
$$;
