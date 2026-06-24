-- Blink & Find online presence and game invite schema
-- Run this in Supabase SQL Editor after supabase/schema.sql.

create extension if not exists pgcrypto;

create table if not exists public.online_presence (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  display_name text not null,
  status text not null default 'online' check (status in ('online', 'available', 'in_game', 'offline')),
  available_to_play boolean not null default false,
  current_room_id uuid references public.online_rooms(id) on delete set null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.online_game_invites (
  id uuid primary key default gen_random_uuid(),
  from_device_id text not null,
  from_name text not null,
  to_device_id text not null,
  to_name text not null,
  room_id uuid references public.online_rooms(id) on delete cascade,
  room_code text,
  game_type text not null check (game_type in ('same_challenge', 'live_race')),
  settings jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 seconds',
  responded_at timestamptz
);

alter table public.online_game_invites
  alter column room_id drop not null;

alter table public.online_game_invites
  alter column room_code drop not null;

create index if not exists online_presence_available_idx
  on public.online_presence(available_to_play, last_seen_at desc);

create index if not exists online_presence_device_id_idx
  on public.online_presence(device_id);

create index if not exists online_game_invites_to_device_status_idx
  on public.online_game_invites(to_device_id, status, expires_at desc);

create index if not exists online_game_invites_from_device_status_idx
  on public.online_game_invites(from_device_id, status, expires_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists online_presence_set_updated_at on public.online_presence;
create trigger online_presence_set_updated_at
before update on public.online_presence
for each row execute function public.set_updated_at();

create or replace function public.expire_old_game_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer := 0;
begin
  update public.online_game_invites
  set status = 'expired'
  where status = 'pending'
    and expires_at < now();

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

grant execute on function public.expire_old_game_invites() to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'online_presence'
  ) then
    alter publication supabase_realtime add table public.online_presence;
  end if;

  if not exists (
    select 1 from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'online_game_invites'
  ) then
    alter publication supabase_realtime add table public.online_game_invites;
  end if;
end $$;

alter table public.online_presence enable row level security;
alter table public.online_game_invites enable row level security;

drop policy if exists "online_presence_select" on public.online_presence;
create policy "online_presence_select" on public.online_presence for select using (true);

drop policy if exists "online_presence_insert" on public.online_presence;
create policy "online_presence_insert" on public.online_presence for insert with check (true);

drop policy if exists "online_presence_update" on public.online_presence;
create policy "online_presence_update" on public.online_presence for update using (true) with check (true);

drop policy if exists "online_game_invites_select" on public.online_game_invites;
create policy "online_game_invites_select" on public.online_game_invites for select using (true);

drop policy if exists "online_game_invites_insert" on public.online_game_invites;
create policy "online_game_invites_insert" on public.online_game_invites for insert with check (true);

drop policy if exists "online_game_invites_update" on public.online_game_invites;
create policy "online_game_invites_update" on public.online_game_invites for update using (true) with check (true);
