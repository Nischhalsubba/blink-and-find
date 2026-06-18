-- Blink & Find online room schema
-- Run this file in the Supabase SQL Editor before enabling Online Play.

create extension if not exists pgcrypto;

create table if not exists public.online_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  game_type text not null check (game_type in ('same_challenge', 'live_race')),
  status text not null default 'lobby' check (status in ('lobby', 'ready', 'playing', 'round_summary', 'finished', 'abandoned')),
  host_player_id uuid,
  settings jsonb not null,
  current_round integer not null default 1,
  current_player_id uuid,
  round_start_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.online_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.online_rooms(id) on delete cascade,
  name text not null,
  device_id text not null,
  is_host boolean not null default false,
  is_connected boolean not null default true,
  total_time_ms integer not null default 0,
  wrong_taps integer not null default 0,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(room_id, device_id)
);

alter table public.online_rooms
  add constraint if not exists online_rooms_host_player_id_fkey
  foreign key (host_player_id) references public.online_players(id) on delete set null;

alter table public.online_rooms
  add constraint if not exists online_rooms_current_player_id_fkey
  foreign key (current_player_id) references public.online_players(id) on delete set null;

create table if not exists public.online_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.online_rooms(id) on delete cascade,
  round_number integer not null,
  seed integer not null,
  target_number integer not null,
  board_size integer not null,
  status text not null default 'waiting' check (status in ('waiting', 'preview', 'playing', 'complete')),
  start_at timestamptz,
  created_at timestamptz not null default now(),
  unique(room_id, round_number)
);

create table if not exists public.online_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.online_rooms(id) on delete cascade,
  round_number integer not null,
  player_id uuid not null references public.online_players(id) on delete cascade,
  player_name text not null,
  target_number integer not null,
  raw_time_ms integer not null,
  penalty_ms integer not null,
  final_time_ms integer not null,
  wrong_taps integer not null,
  placement integer,
  client_tap_at timestamptz,
  server_received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(room_id, round_number, player_id)
);

create index if not exists online_rooms_code_idx on public.online_rooms(code);
create index if not exists online_players_room_id_idx on public.online_players(room_id);
create index if not exists online_rounds_room_id_idx on public.online_rounds(room_id);
create index if not exists online_results_room_id_idx on public.online_results(room_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists online_rooms_set_updated_at on public.online_rooms;
create trigger online_rooms_set_updated_at
before update on public.online_rooms
for each row execute function public.set_updated_at();

drop trigger if exists online_players_set_updated_at on public.online_players;
create trigger online_players_set_updated_at
before update on public.online_players
for each row execute function public.set_updated_at();

alter publication supabase_realtime add table public.online_rooms;
alter publication supabase_realtime add table public.online_players;
alter publication supabase_realtime add table public.online_rounds;
alter publication supabase_realtime add table public.online_results;

alter table public.online_rooms enable row level security;
alter table public.online_players enable row level security;
alter table public.online_rounds enable row level security;
alter table public.online_results enable row level security;

-- MVP policies: anonymous browser clients can create/join rooms and write results.
-- Room code privacy is casual-game level, not banking-level. Future auth can tighten this.
drop policy if exists "online_rooms_select" on public.online_rooms;
create policy "online_rooms_select" on public.online_rooms for select using (true);

drop policy if exists "online_rooms_insert" on public.online_rooms;
create policy "online_rooms_insert" on public.online_rooms for insert with check (true);

drop policy if exists "online_rooms_update" on public.online_rooms;
create policy "online_rooms_update" on public.online_rooms for update using (true) with check (true);

drop policy if exists "online_players_select" on public.online_players;
create policy "online_players_select" on public.online_players for select using (true);

drop policy if exists "online_players_insert" on public.online_players;
create policy "online_players_insert" on public.online_players for insert with check (true);

drop policy if exists "online_players_update" on public.online_players;
create policy "online_players_update" on public.online_players for update using (true) with check (true);

drop policy if exists "online_rounds_select" on public.online_rounds;
create policy "online_rounds_select" on public.online_rounds for select using (true);

drop policy if exists "online_rounds_insert" on public.online_rounds;
create policy "online_rounds_insert" on public.online_rounds for insert with check (true);

drop policy if exists "online_rounds_update" on public.online_rounds;
create policy "online_rounds_update" on public.online_rounds for update using (true) with check (true);

drop policy if exists "online_results_select" on public.online_results;
create policy "online_results_select" on public.online_results for select using (true);

drop policy if exists "online_results_insert" on public.online_results;
create policy "online_results_insert" on public.online_results for insert with check (true);

drop policy if exists "online_results_update" on public.online_results;
create policy "online_results_update" on public.online_results for update using (true) with check (true);
