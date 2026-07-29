create or replace function public.authorize_online_player_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_device text := private.require_device();
  v_is_ai boolean := new.device_id like 'ai-opponent:%';
  v_caller_is_host boolean := private.is_room_host(coalesce(new.room_id, old.room_id), v_device);
begin
  perform private.check_write_rate('player', 60, interval '1 minute');

  if tg_op = 'INSERT' then
    if new.device_id <> v_device and not (v_is_ai and v_caller_is_host) then
      raise exception 'Cannot join as another device' using errcode = '42501';
    end if;
    if not exists (select 1 from public.online_rooms r where r.id = new.room_id and r.status = 'lobby') then
      raise exception 'Room is not joinable';
    end if;
    if (select count(*) from public.online_players p where p.room_id = new.room_id) >=
       (select max_players from public.online_rooms r where r.id = new.room_id) then
      raise exception 'Room is full';
    end if;
  else
    if old.device_id <> v_device and not v_caller_is_host then
      raise exception 'Cannot update another player' using errcode = '42501';
    end if;
    if new.id is distinct from old.id
      or new.room_id is distinct from old.room_id
      or new.device_id is distinct from old.device_id
      or new.joined_at is distinct from old.joined_at then
      raise exception 'Player identity fields are immutable';
    end if;
    if old.device_id <> v_device
      and old.device_id not like 'ai-opponent:%'
      and (new.name is distinct from old.name
        or new.total_time_ms is distinct from old.total_time_ms
        or new.wrong_taps is distinct from old.wrong_taps) then
      raise exception 'Host may only manage connection state for another human player';
    end if;
  end if;

  return new;
end $$;

create or replace function public.authorize_online_result_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_device text := private.require_device();
  v_player public.online_players%rowtype;
  v_room public.online_rooms%rowtype;
  v_round public.online_rounds%rowtype;
  v_expected_penalty integer;
  v_can_submit boolean;
begin
  perform private.check_write_rate('result', 30, interval '1 minute');

  select * into v_player from public.online_players where id = new.player_id and room_id = new.room_id;
  if not found then raise exception 'Player does not belong to room' using errcode = '42501'; end if;

  v_can_submit := v_player.device_id = v_device
    or (v_player.device_id like 'ai-opponent:%' and private.is_room_host(new.room_id, v_device));
  if not v_can_submit then raise exception 'Cannot submit another player result' using errcode = '42501'; end if;

  select * into v_room from public.online_rooms where id = new.room_id for update;
  if not found then raise exception 'Room does not exist'; end if;
  select * into v_round from public.online_rounds where room_id = new.room_id and round_number = new.round_number;
  if not found then raise exception 'Round does not exist'; end if;

  if v_room.status not in ('ready','playing','round_summary') then raise exception 'Room is not accepting results'; end if;
  if v_round.target_number <> new.target_number then raise exception 'Target does not match round'; end if;
  if v_room.game_type = 'same_challenge' and v_room.current_player_id is distinct from new.player_id then raise exception 'Not this player turn'; end if;

  v_expected_penalty := new.wrong_taps * coalesce((v_room.settings->>'penaltySeconds')::integer, 0) * 1000;
  if new.penalty_ms <> v_expected_penalty or new.final_time_ms <> new.raw_time_ms + new.penalty_ms then raise exception 'Invalid score calculation'; end if;
  if new.client_tap_at is not null and (new.client_tap_at > now() + interval '30 seconds' or new.client_tap_at < now() - interval '10 minutes') then raise exception 'Invalid client timestamp'; end if;

  new.player_name := v_player.name;
  new.server_received_at := now();
  return new;
end $$;

revoke all on function public.authorize_online_player_write() from public, anon, authenticated;
revoke all on function public.authorize_online_result_write() from public, anon, authenticated;
notify pgrst, 'reload schema';
