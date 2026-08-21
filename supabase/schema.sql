-- Zombie Clicker — cuentas + save en la nube (Supabase)
-- Pegar entero en SQL Editor. Idempotente para re-aplicar.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint profiles_display_name_len check (char_length(display_name) between 3 and 16),
  constraint profiles_display_name_fmt check (display_name ~ '^[A-Za-z0-9_]+$')
);

create unique index if not exists profiles_display_name_lower
  on public.profiles (lower(display_name));

create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  total_brains_earned double precision not null default 0,
  prestige_souls integer not null default 0,
  best_bps double precision not null default 0
);

create index if not exists saves_leaderboard_idx
  on public.saves (prestige_souls desc, total_brains_earned desc);

alter table public.profiles enable row level security;
alter table public.saves enable row level security;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public
  on public.profiles
  for select
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists saves_select_own on public.saves;
create policy saves_select_own
  on public.saves
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists saves_insert_own on public.saves;
create policy saves_insert_own
  on public.saves
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists saves_update_own on public.saves;
create policy saves_update_own
  on public.saves
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists saves_delete_own on public.saves;
create policy saves_delete_own
  on public.saves
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Anon no lee payload. Authenticated solo su fila.
revoke all on public.saves from anon;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.saves to authenticated;

create or replace function public.display_name_taken(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where lower(display_name) = lower(p_name)
  );
$$;

grant execute on function public.display_name_taken(text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.saves (user_id, payload)
  values (new.id, '{}'::jsonb)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
