-- Blink & Find production feature migration
-- Run after supabase/schema.sql to enable public rooms, profiles, leaderboard, and stronger score constraints.

create extension if not exists pgcrypto;

alter table public.online_rooms
  add column if not exists visibility text not null default 'private';

alter table public.online_rooms
  add column if not exists max_players integer not null default 4;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'online_rooms_visibility_check') then
    alter table public.online_rooms
      add constraint online_rooms_visibility_check check (visibility in ('private', 'public'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'online_rooms_max_players_check') then
    alter table public.online_rooms
      add constraint online_rooms_max_players_check check (max_players between 2 and 8);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'online_results_basic_score_check') then
    alter table public.online_results
      add constraint online_results_basic_score_check check (
        raw_time_ms between 150 and 1800000
        and wrong_taps between 0 and 500
        and penalty_ms >= 0
        and final_time_ms = raw_time_ms + penalty_ms
      );
  end if;
end $$;

create index if not exists online_rooms_visibility_status_updated_at_idx
  on public.online_rooms(visibility, status, updated_at desc);

create table if not exists public.player_profiles (
  id uuid primary key default gen_random_uuid(),
  player_id text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  player_name text not null,
  mode text not null default 'classic',
  score_ms integer not null,
  wrong_taps integer not null default 0,
  accuracy_percent integer not null default 100,
  created_at timestamptz not null default now(),
  check (score_ms between 150 and 1800000),
  check (wrong_taps between 0 and 500),
  check (accuracy_percent between 0 and 100),
  check (char_length(player_name) between 1 and 40)
);

create index if not exists leaderboard_scores_mode_score_idx
  on public.leaderboard_scores(mode, score_ms asc, wrong_taps asc, created_at asc);

create trigger player_profiles_set_updated_at
before update on public.player_profiles
for each row execute function public.set_updated_at();

alter table public.player_profiles enable row level security;
alter table public.leaderboard_scores enable row level security;

drop policy if exists "player_profiles_select" on public.player_profiles;
create policy "player_profiles_select" on public.player_profiles for select using (true);

drop policy if exists "player_profiles_insert" on public.player_profiles;
create policy "player_profiles_insert" on public.player_profiles for insert with check (true);

drop policy if exists "player_profiles_update" on public.player_profiles;
create policy "player_profiles_update" on public.player_profiles for update using (true) with check (true);

drop policy if exists "leaderboard_scores_select" on public.leaderboard_scores;
create policy "leaderboard_scores_select" on public.leaderboard_scores for select using (true);

drop policy if exists "leaderboard_scores_insert" on public.leaderboard_scores;
create policy "leaderboard_scores_insert" on public.leaderboard_scores for insert with check (true);

-- Keep the Realtime publication aware of public lobby changes.
do $$
begin
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'leaderboard_scores'
  ) then
    alter publication supabase_realtime add table public.leaderboard_scores;
  end if;
end $$;
