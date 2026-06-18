-- Priority 8: production hardening for Blink & Find online rooms.
-- Run after supabase/schema.sql.

-- Basic data sanity. These checks prevent broken room/result rows even if a browser misbehaves.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'online_rooms_code_sanity') then
    alter table public.online_rooms
      add constraint online_rooms_code_sanity check (code ~ '^[A-Z2-9]{5,8}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'online_rooms_round_sanity') then
    alter table public.online_rooms
      add constraint online_rooms_round_sanity check (current_round between 1 and 50);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'online_players_name_sanity') then
    alter table public.online_players
      add constraint online_players_name_sanity check (char_length(trim(name)) between 1 and 40);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'online_players_score_sanity') then
    alter table public.online_players
      add constraint online_players_score_sanity check (total_time_ms >= 0 and wrong_taps >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'online_rounds_sanity') then
    alter table public.online_rounds
      add constraint online_rounds_sanity check (round_number between 1 and 50 and board_size between 9 and 400 and target_number between 1 and board_size);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'online_results_time_sanity') then
    alter table public.online_results
      add constraint online_results_time_sanity check (
        raw_time_ms >= 0
        and penalty_ms >= 0
        and final_time_ms = raw_time_ms + penalty_ms
        and wrong_taps >= 0
        and wrong_taps <= 999
        and raw_time_ms <= 3600000
      );
  end if;
end $$;

-- Protect room state transitions from obvious corruption.
create or replace function public.protect_online_room_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status in ('finished', 'abandoned') and new.status <> old.status then
    raise exception 'Closed rooms cannot be reopened';
  end if;

  if new.current_round < old.current_round then
    raise exception 'Room rounds cannot move backwards';
  end if;

  if old.status <> 'lobby' and new.settings <> old.settings then
    raise exception 'Room settings cannot change after the lobby';
  end if;

  if old.host_player_id is not null and new.host_player_id is distinct from old.host_player_id then
    raise exception 'Room host cannot be changed after assignment';
  end if;

  if new.current_player_id is not null and not exists (
    select 1 from public.online_players p
    where p.id = new.current_player_id and p.room_id = new.id
  ) then
    raise exception 'Current player must belong to this room';
  end if;

  return new;
end;
$$;

drop trigger if exists online_rooms_protect_transition on public.online_rooms;
create trigger online_rooms_protect_transition
before update on public.online_rooms
for each row execute function public.protect_online_room_transition();

-- Validate every result against the actual room, round, player, target, and penalty settings.
create or replace function public.validate_online_result()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  result_room public.online_rooms%rowtype;
  result_round public.online_rounds%rowtype;
  result_player public.online_players%rowtype;
  expected_penalty_ms integer;
begin
  select * into result_room from public.online_rooms where id = new.room_id;
  if not found then
    raise exception 'Result room does not exist';
  end if;

  if result_room.status in ('finished', 'abandoned', 'lobby') then
    raise exception 'Results can only be written for active rooms';
  end if;

  select * into result_round
  from public.online_rounds
  where room_id = new.room_id and round_number = new.round_number;
  if not found then
    raise exception 'Result round does not exist';
  end if;

  if result_round.target_number <> new.target_number then
    raise exception 'Result target does not match the round target';
  end if;

  select * into result_player from public.online_players where id = new.player_id;
  if not found or result_player.room_id <> new.room_id then
    raise exception 'Result player must belong to the room';
  end if;

  expected_penalty_ms := new.wrong_taps * coalesce((result_room.settings ->> 'penaltySeconds')::integer, 0) * 1000;
  if new.penalty_ms <> expected_penalty_ms then
    raise exception 'Result penalty does not match wrong taps';
  end if;

  new.player_name := result_player.name;
  return new;
end;
$$;

drop trigger if exists online_results_validate on public.online_results;
create trigger online_results_validate
before insert or update on public.online_results
for each row execute function public.validate_online_result();

-- Tighten RLS checks while keeping the current anonymous-room MVP working.
drop policy if exists "online_rooms_insert" on public.online_rooms;
create policy "online_rooms_insert" on public.online_rooms for insert with check (
  code ~ '^[A-Z2-9]{5,8}$'
  and current_round = 1
  and status = 'lobby'
  and jsonb_typeof(settings) = 'object'
);

drop policy if exists "online_players_insert" on public.online_players;
create policy "online_players_insert" on public.online_players for insert with check (char_length(trim(name)) between 1 and 40);

drop policy if exists "online_rounds_insert" on public.online_rounds;
create policy "online_rounds_insert" on public.online_rounds for insert with check (board_size between 9 and 400 and target_number between 1 and board_size);

drop policy if exists "online_results_insert" on public.online_results;
create policy "online_results_insert" on public.online_results for insert with check (
  raw_time_ms >= 0 and penalty_ms >= 0 and final_time_ms = raw_time_ms + penalty_ms
);

drop policy if exists "online_results_update" on public.online_results;
create policy "online_results_update" on public.online_results for update using (true) with check (
  raw_time_ms >= 0 and penalty_ms >= 0 and final_time_ms = raw_time_ms + penalty_ms
);
