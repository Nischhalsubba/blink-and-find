-- Keep stale multiplayer records bounded without weakening browser authorization.

create or replace function private.is_multiplayer_cleanup()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select current_setting('blink_find.multiplayer_cleanup', true) = 'on';
$$;

revoke all on function private.is_multiplayer_cleanup() from public, anon, authenticated, service_role;
grant execute on function private.is_multiplayer_cleanup() to postgres;

create or replace function public.authorize_online_presence_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_device text;
begin
  if private.is_multiplayer_cleanup() then return new; end if;
  v_device := private.require_device();
  perform private.check_write_rate('presence', 120, interval '1 minute');
  if new.device_id <> v_device then raise exception 'Cannot write another device presence' using errcode='42501'; end if;
  if tg_op='UPDATE' and new.device_id is distinct from old.device_id then raise exception 'Presence identity is immutable'; end if;
  new.last_seen_at := now();
  return new;
end $$;

create or replace function public.authorize_invite_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_device text;
begin
  if private.is_multiplayer_cleanup() then return new; end if;
  v_device := private.require_device();
  perform private.check_write_rate('invite', 20, interval '5 minutes');
  if tg_op='INSERT' then
    if new.from_device_id <> v_device then raise exception 'Cannot invite as another device' using errcode='42501'; end if;
    if new.to_device_id = new.from_device_id then raise exception 'Cannot invite yourself'; end if;
    if new.status <> 'pending' or new.expires_at <= now() or new.expires_at > now()+interval '5 minutes' then raise exception 'Invalid invite'; end if;
  else
    if v_device not in (old.from_device_id, old.to_device_id) then raise exception 'Not an invite participant' using errcode='42501'; end if;
    if old.status <> 'pending' and new.status is distinct from old.status then raise exception 'Invite already completed'; end if;
    if new.from_device_id is distinct from old.from_device_id or new.to_device_id is distinct from old.to_device_id or new.room_id is distinct from old.room_id or new.room_code is distinct from old.room_code or new.game_type is distinct from old.game_type or new.settings is distinct from old.settings or new.created_at is distinct from old.created_at or new.expires_at is distinct from old.expires_at then raise exception 'Invite payload is immutable'; end if;
    if v_device=old.to_device_id and new.status not in ('accepted','declined','expired') then raise exception 'Recipient may only accept or decline'; end if;
    if v_device=old.from_device_id and new.status not in ('cancelled','expired') then raise exception 'Sender may only cancel'; end if;
    new.responded_at := case when new.status <> 'pending' then now() else old.responded_at end;
  end if;
  return new;
end $$;

create or replace function public.authorize_online_player_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_device text;
  v_is_ai boolean;
  v_caller_is_host boolean;
begin
  if private.is_multiplayer_cleanup() then return new; end if;
  v_device := private.require_device();
  v_is_ai := new.device_id like 'ai-opponent:%';
  v_caller_is_host := private.is_room_host(coalesce(new.room_id, old.room_id), v_device);
  perform private.check_write_rate('player', 60, interval '1 minute');
  if tg_op = 'INSERT' then
    if new.device_id <> v_device and not (v_is_ai and v_caller_is_host) then raise exception 'Cannot join as another device' using errcode = '42501'; end if;
    if not exists (select 1 from public.online_rooms r where r.id = new.room_id and r.status = 'lobby') then raise exception 'Room is not joinable'; end if;
    if (select count(*) from public.online_players p where p.room_id = new.room_id) >= (select max_players from public.online_rooms r where r.id = new.room_id) then raise exception 'Room is full'; end if;
  else
    if old.device_id <> v_device and not v_caller_is_host then raise exception 'Cannot update another player' using errcode = '42501'; end if;
    if new.id is distinct from old.id or new.room_id is distinct from old.room_id or new.device_id is distinct from old.device_id or new.joined_at is distinct from old.joined_at then raise exception 'Player identity fields are immutable'; end if;
    if old.device_id <> v_device and old.device_id not like 'ai-opponent:%' and (new.name is distinct from old.name or new.total_time_ms is distinct from old.total_time_ms or new.wrong_taps is distinct from old.wrong_taps) then raise exception 'Host may only manage connection state for another human player'; end if;
  end if;
  return new;
end $$;

create or replace function public.authorize_online_room_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_device text;
begin
  if private.is_multiplayer_cleanup() then return new; end if;
  v_device := private.require_device();
  perform private.check_write_rate('room', 60, interval '1 minute');
  if tg_op='INSERT' then
    if new.status <> 'lobby' or new.current_round <> 1 or jsonb_typeof(new.settings) <> 'object' then raise exception 'Invalid room creation'; end if;
    return new;
  end if;
  if not private.is_room_member(old.id, v_device) then raise exception 'Only room members may update a room' using errcode='42501'; end if;
  if old.status in ('finished','abandoned') and new.status <> old.status then raise exception 'Closed rooms cannot be reopened'; end if;
  if new.current_round < old.current_round then raise exception 'Room rounds cannot move backwards'; end if;
  if old.status <> 'lobby' and new.settings is distinct from old.settings then raise exception 'Settings are locked after lobby'; end if;
  if old.host_player_id is not null and new.host_player_id is distinct from old.host_player_id then raise exception 'Room host is immutable'; end if;
  if new.current_player_id is not null and not exists(select 1 from public.online_players p where p.id=new.current_player_id and p.room_id=new.id) then raise exception 'Current player must belong to room'; end if;
  if (new.max_players is distinct from old.max_players or new.visibility is distinct from old.visibility) and not private.is_room_host(old.id, v_device) then raise exception 'Only host may change room configuration' using errcode='42501'; end if;
  return new;
end $$;

revoke all on function public.authorize_online_presence_write() from public, anon, authenticated, service_role;
revoke all on function public.authorize_invite_write() from public, anon, authenticated, service_role;
revoke all on function public.authorize_online_player_write() from public, anon, authenticated, service_role;
revoke all on function public.authorize_online_room_write() from public, anon, authenticated, service_role;

create or replace function private.cleanup_multiplayer()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  perform set_config('blink_find.multiplayer_cleanup', 'on', true);
  update public.online_game_invites set status='expired', responded_at=now() where status='pending' and expires_at < now();
  update public.online_presence set status='offline', available_to_play=false, current_room_id=null where status<>'offline' and last_seen_at < now()-interval '2 minutes';
  update public.online_players set is_connected=false where is_connected=true and updated_at < now()-interval '3 minutes';
  update public.online_rooms set status='abandoned', current_player_id=null, round_start_at=null where status not in ('finished','abandoned') and updated_at < now()-interval '6 hours';
  delete from private.write_rate_limits where occurred_at < now()-interval '1 day';
end $$;

revoke all on function private.cleanup_multiplayer() from public, anon, authenticated, service_role;
grant execute on function private.cleanup_multiplayer() to postgres;

create extension if not exists pg_cron;
revoke all on schema cron from public, anon, authenticated, service_role;
revoke all on all tables in schema cron from public, anon, authenticated, service_role;
revoke all on all sequences in schema cron from public, anon, authenticated, service_role;

do $$
declare existing_job record;
begin
  for existing_job in select jobid from cron.job where jobname = 'blink-find-cleanup-multiplayer' loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end $$;

select cron.schedule('blink-find-cleanup-multiplayer', '*/5 * * * *', $cron$select private.cleanup_multiplayer();$cron$);
select private.cleanup_multiplayer();
notify pgrst, 'reload schema';
