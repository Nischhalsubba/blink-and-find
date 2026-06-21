-- Optional hardening for online score submission.
-- Run after supabase/schema.sql and supabase/production_features.sql.

create or replace function public.submit_online_result(
  p_room_id uuid,
  p_round_number integer,
  p_player_id uuid,
  p_player_device_id text,
  p_player_name text,
  p_target_number integer,
  p_raw_time_ms integer,
  p_penalty_ms integer,
  p_final_time_ms integer,
  p_wrong_taps integer
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_room public.online_rooms%rowtype;
  v_player public.online_players%rowtype;
  v_round public.online_rounds%rowtype;
  v_result_id uuid;
begin
  select * into v_room from public.online_rooms where id = p_room_id;
  if not found then raise exception 'Room not found'; end if;

  select * into v_player from public.online_players where id = p_player_id and room_id = p_room_id;
  if not found then raise exception 'Player not found in room'; end if;

  if v_player.device_id is distinct from p_player_device_id then
    raise exception 'Player device mismatch';
  end if;

  select * into v_round from public.online_rounds where room_id = p_room_id and round_number = p_round_number;
  if not found then raise exception 'Round not found'; end if;

  if v_room.current_round <> p_round_number then raise exception 'Inactive round'; end if;
  if v_round.target_number <> p_target_number then raise exception 'Target mismatch'; end if;
  if p_raw_time_ms < 150 or p_raw_time_ms > 1800000 then raise exception 'Invalid raw time'; end if;
  if p_wrong_taps < 0 or p_wrong_taps > 500 then raise exception 'Invalid wrong taps'; end if;
  if p_final_time_ms <> p_raw_time_ms + p_penalty_ms then raise exception 'Final time mismatch'; end if;

  if v_room.game_type = 'same_challenge' and v_room.current_player_id is distinct from p_player_id then
    raise exception 'Not this player turn';
  end if;

  if v_room.game_type = 'live_race' and coalesce(v_room.round_start_at, v_round.start_at) > now() then
    raise exception 'Live race not started';
  end if;

  insert into public.online_results (
    room_id, round_number, player_id, player_name, target_number,
    raw_time_ms, penalty_ms, final_time_ms, wrong_taps, client_tap_at
  ) values (
    p_room_id, p_round_number, p_player_id, coalesce(nullif(trim(p_player_name), ''), v_player.name), p_target_number,
    p_raw_time_ms, p_penalty_ms, p_final_time_ms, p_wrong_taps, now()
  )
  on conflict (room_id, round_number, player_id) do nothing
  returning id into v_result_id;

  if v_result_id is not null then
    update public.online_players
    set total_time_ms = total_time_ms + p_final_time_ms,
        wrong_taps = wrong_taps + p_wrong_taps,
        is_connected = true
    where id = p_player_id;
  end if;
end;
$$;

grant execute on function public.submit_online_result(uuid, integer, uuid, text, text, integer, integer, integer, integer, integer) to anon, authenticated;

alter table public.online_results enable row level security;

drop policy if exists "online_results_insert" on public.online_results;
create policy "online_results_insert" on public.online_results
for insert with check (
  final_time_ms = raw_time_ms + penalty_ms
  and raw_time_ms between 150 and 1800000
  and wrong_taps between 0 and 500
  and exists (
    select 1 from public.online_players p
    where p.id = online_results.player_id and p.room_id = online_results.room_id
  )
);

drop policy if exists "online_results_update" on public.online_results;
create policy "online_results_update" on public.online_results
for update using (true)
with check (
  final_time_ms = raw_time_ms + penalty_ms
  and raw_time_ms between 150 and 1800000
  and wrong_taps between 0 and 500
);
