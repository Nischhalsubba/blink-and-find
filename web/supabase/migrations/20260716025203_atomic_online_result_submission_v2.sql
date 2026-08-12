create or replace function public.submit_online_result_v2(
  p_room_id uuid,
  p_round_number integer,
  p_player_id uuid,
  p_target_number integer,
  p_raw_time_ms integer,
  p_penalty_ms integer,
  p_final_time_ms integer,
  p_wrong_taps integer,
  p_client_tap_at timestamptz default now()
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  v_device text := private.require_device();
  v_room public.online_rooms%rowtype;
  v_player public.online_players%rowtype;
  v_inserted_id uuid;
  v_next_player_id uuid;
  v_active_players integer;
  v_result_count integer;
  v_total_rounds integer;
  v_status text;
begin
  select * into v_room from public.online_rooms where id = p_room_id for update;
  if not found then raise exception 'ROOM_NOT_FOUND' using errcode = 'P0001'; end if;

  select * into v_player from public.online_players where id = p_player_id and room_id = p_room_id;
  if not found then raise exception 'PLAYER_NOT_IN_ROOM' using errcode = 'P0001'; end if;

  if v_player.device_id <> v_device
    and not (v_player.device_id like 'ai-opponent:%' and private.is_room_host(p_room_id, v_device)) then
    raise exception 'PLAYER_NOT_OWNED' using errcode = '42501';
  end if;

  insert into public.online_results (
    room_id, round_number, player_id, player_name, target_number,
    raw_time_ms, penalty_ms, final_time_ms, wrong_taps, client_tap_at
  ) values (
    p_room_id, p_round_number, p_player_id, v_player.name, p_target_number,
    p_raw_time_ms, p_penalty_ms, p_final_time_ms, p_wrong_taps, p_client_tap_at
  )
  on conflict (room_id, round_number, player_id) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return jsonb_build_object('inserted', false, 'roomId', p_room_id, 'roundNumber', p_round_number, 'status', v_room.status);
  end if;

  update public.online_players
  set total_time_ms = total_time_ms + p_final_time_ms,
      wrong_taps = wrong_taps + p_wrong_taps,
      updated_at = now()
  where id = p_player_id;

  select count(*) into v_active_players
  from public.online_players
  where room_id = p_room_id and (is_connected or is_host or device_id like 'ai-opponent:%');

  select count(*) into v_result_count
  from public.online_results
  where room_id = p_room_id and round_number = p_round_number;

  v_total_rounds := greatest(1, coalesce((v_room.settings->>'totalRounds')::integer, 1));

  if v_room.game_type = 'same_challenge' then
    select p.id into v_next_player_id
    from public.online_players p
    where p.room_id = p_room_id
      and (p.is_connected or p.is_host or p.device_id like 'ai-opponent:%')
      and not exists (
        select 1 from public.online_results r
        where r.room_id = p_room_id and r.round_number = p_round_number and r.player_id = p.id
      )
    order by p.joined_at, p.id
    limit 1;

    if v_next_player_id is not null then
      update public.online_rounds set status = 'waiting', start_at = null
      where room_id = p_room_id and round_number = p_round_number;
      update public.online_rooms
      set status = 'ready', current_player_id = v_next_player_id, round_start_at = null, updated_at = now()
      where id = p_room_id;
      v_status := 'ready';
    else
      with ranked as (
        select id, row_number() over (order by final_time_ms, server_received_at, id)::integer as placement
        from public.online_results where room_id = p_room_id and round_number = p_round_number
      )
      update public.online_results r set placement = ranked.placement
      from ranked where r.id = ranked.id and r.placement is distinct from ranked.placement;

      update public.online_rounds set status = 'complete', start_at = null
      where room_id = p_room_id and round_number = p_round_number;

      v_status := case when p_round_number >= v_total_rounds then 'finished' else 'round_summary' end;
      update public.online_rooms
      set status = v_status, current_player_id = null, round_start_at = null, updated_at = now()
      where id = p_room_id;
    end if;
  else
    if v_result_count >= v_active_players and v_active_players > 0 then
      with ranked as (
        select id, row_number() over (order by final_time_ms, server_received_at, id)::integer as placement
        from public.online_results where room_id = p_room_id and round_number = p_round_number
      )
      update public.online_results r set placement = ranked.placement
      from ranked where r.id = ranked.id and r.placement is distinct from ranked.placement;

      update public.online_rounds set status = 'complete'
      where room_id = p_room_id and round_number = p_round_number;

      v_status := case when p_round_number >= v_total_rounds then 'finished' else 'round_summary' end;
      update public.online_rooms
      set status = v_status, current_player_id = null, round_start_at = null, updated_at = now()
      where id = p_room_id;
    else
      v_status := v_room.status;
    end if;
  end if;

  return jsonb_build_object(
    'inserted', true,
    'resultId', v_inserted_id,
    'roomId', p_room_id,
    'roundNumber', p_round_number,
    'status', v_status,
    'completedResults', v_result_count,
    'activePlayers', v_active_players
  );
end $$;

revoke all on function public.submit_online_result_v2(uuid,integer,uuid,integer,integer,integer,integer,integer,timestamptz) from public;
grant execute on function public.submit_online_result_v2(uuid,integer,uuid,integer,integer,integer,integer,integer,timestamptz) to anon, authenticated;
notify pgrst, 'reload schema';
