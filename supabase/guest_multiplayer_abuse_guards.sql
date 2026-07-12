-- Abuse guards for Blink & Find guest multiplayer.
-- Apply after the existing schema and hardening SQL.

create or replace function public.guard_online_result_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.room_id is distinct from old.room_id
    or new.round_number is distinct from old.round_number
    or new.player_id is distinct from old.player_id
    or new.player_name is distinct from old.player_name
    or new.target_number is distinct from old.target_number
    or new.raw_time_ms is distinct from old.raw_time_ms
    or new.penalty_ms is distinct from old.penalty_ms
    or new.final_time_ms is distinct from old.final_time_ms
    or new.wrong_taps is distinct from old.wrong_taps
    or new.client_tap_at is distinct from old.client_tap_at
    or new.server_received_at is distinct from old.server_received_at
    or new.created_at is distinct from old.created_at then
    raise exception 'Submitted results are immutable';
  end if;
  if new.placement is not null and new.placement < 1 then
    raise exception 'Placement must be positive';
  end if;
  return new;
end;
$$;

drop trigger if exists online_results_guard_update on public.online_results;
create trigger online_results_guard_update
before update on public.online_results
for each row execute function public.guard_online_result_update();

create or replace function public.guard_online_invite_insert()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  recent_count integer;
begin
  if char_length(new.from_device_id) not between 8 and 200
    or char_length(new.to_device_id) not between 8 and 200
    or char_length(trim(new.from_name)) not between 1 and 40
    or char_length(trim(new.to_name)) not between 1 and 40 then
    raise exception 'Invalid invite identity';
  end if;
  select count(*) into recent_count
  from public.online_game_invites
  where from_device_id = new.from_device_id
    and created_at >= now() - interval '5 minutes';
  if recent_count >= 10 then
    raise exception 'Invite rate limit exceeded';
  end if;
  return new;
end;
$$;

drop trigger if exists online_game_invites_guard_insert on public.online_game_invites;
create trigger online_game_invites_guard_insert
before insert on public.online_game_invites
for each row execute function public.guard_online_invite_insert();

create or replace function public.guard_online_invite_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.from_device_id is distinct from old.from_device_id
    or new.from_name is distinct from old.from_name
    or new.to_device_id is distinct from old.to_device_id
    or new.to_name is distinct from old.to_name
    or new.game_type is distinct from old.game_type
    or new.settings is distinct from old.settings
    or new.created_at is distinct from old.created_at
    or new.expires_at is distinct from old.expires_at then
    raise exception 'Invite identity and settings are immutable';
  end if;
  if old.status <> 'pending' and new.status is distinct from old.status then
    raise exception 'Completed invites cannot change status';
  end if;
  if new.status not in ('pending', 'accepted', 'declined', 'cancelled', 'expired') then
    raise exception 'Invalid invite status';
  end if;
  return new;
end;
$$;

drop trigger if exists online_game_invites_guard_update on public.online_game_invites;
create trigger online_game_invites_guard_update
before update on public.online_game_invites
for each row execute function public.guard_online_invite_update();

create or replace function public.guard_leaderboard_score_insert()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  recent_count integer;
begin
  if char_length(new.player_id) not between 8 and 200
    or char_length(trim(new.player_name)) not between 1 and 40
    or char_length(new.mode) not between 1 and 40
    or new.score_ms not between 150 and 3600000
    or new.wrong_taps not between 0 and 999
    or new.accuracy_percent not between 0 and 100 then
    raise exception 'Invalid leaderboard score';
  end if;
  select count(*) into recent_count
  from public.leaderboard_scores
  where player_id = new.player_id
    and created_at >= now() - interval '1 hour';
  if recent_count >= 30 then
    raise exception 'Leaderboard rate limit exceeded';
  end if;
  return new;
end;
$$;

drop trigger if exists leaderboard_scores_guard_insert on public.leaderboard_scores;
create trigger leaderboard_scores_guard_insert
before insert on public.leaderboard_scores
for each row execute function public.guard_leaderboard_score_insert();

create or replace function public.guard_player_profile_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if char_length(new.player_id) not between 8 and 200
    or char_length(trim(new.display_name)) not between 1 and 40 then
    raise exception 'Invalid player profile';
  end if;
  if tg_op = 'UPDATE' and new.player_id is distinct from old.player_id then
    raise exception 'Player identity is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists player_profiles_guard_write on public.player_profiles;
create trigger player_profiles_guard_write
before insert or update on public.player_profiles
for each row execute function public.guard_player_profile_write();

create or replace function public.guard_online_presence_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if char_length(new.device_id) not between 8 and 200
    or char_length(trim(new.display_name)) not between 1 and 40
    or new.status not in ('online', 'available', 'in_game', 'offline') then
    raise exception 'Invalid presence state';
  end if;
  if tg_op = 'UPDATE' and new.device_id is distinct from old.device_id then
    raise exception 'Presence identity is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists online_presence_guard_write on public.online_presence;
create trigger online_presence_guard_write
before insert or update on public.online_presence
for each row execute function public.guard_online_presence_write();

drop policy if exists online_presence_insert on public.online_presence;
create policy online_presence_insert on public.online_presence
for insert to anon, authenticated
with check (
  char_length(device_id) between 8 and 200
  and char_length(trim(display_name)) between 1 and 40
  and status in ('online', 'available', 'in_game', 'offline')
);

drop policy if exists online_presence_update on public.online_presence;
create policy online_presence_update on public.online_presence
for update to anon, authenticated
using (char_length(device_id) between 8 and 200)
with check (
  char_length(device_id) between 8 and 200
  and char_length(trim(display_name)) between 1 and 40
  and status in ('online', 'available', 'in_game', 'offline')
);

drop policy if exists online_game_invites_insert on public.online_game_invites;
create policy online_game_invites_insert on public.online_game_invites
for insert to anon, authenticated
with check (
  status = 'pending'
  and expires_at > created_at
  and expires_at <= created_at + interval '5 minutes'
  and char_length(from_device_id) between 8 and 200
  and char_length(to_device_id) between 8 and 200
);

drop policy if exists online_game_invites_update on public.online_game_invites;
create policy online_game_invites_update on public.online_game_invites
for update to anon, authenticated
using (status in ('pending', 'accepted'))
with check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired'));

drop policy if exists leaderboard_scores_insert on public.leaderboard_scores;
create policy leaderboard_scores_insert on public.leaderboard_scores
for insert to anon, authenticated
with check (
  char_length(player_id) between 8 and 200
  and char_length(trim(player_name)) between 1 and 40
  and char_length(mode) between 1 and 40
  and score_ms between 150 and 3600000
  and wrong_taps between 0 and 999
  and accuracy_percent between 0 and 100
);

drop policy if exists player_profiles_insert on public.player_profiles;
create policy player_profiles_insert on public.player_profiles
for insert to anon, authenticated
with check (
  char_length(player_id) between 8 and 200
  and char_length(trim(display_name)) between 1 and 40
);

drop policy if exists player_profiles_update on public.player_profiles;
create policy player_profiles_update on public.player_profiles
for update to anon, authenticated
using (char_length(player_id) between 8 and 200)
with check (
  char_length(player_id) between 8 and 200
  and char_length(trim(display_name)) between 1 and 40
);