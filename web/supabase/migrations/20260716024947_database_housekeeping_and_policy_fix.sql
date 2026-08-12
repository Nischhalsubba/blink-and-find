alter table private.device_credentials enable row level security;
alter table private.write_rate_limits enable row level security;

alter table private.write_rate_limits
  add column if not exists id bigint generated always as identity;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'private.write_rate_limits'::regclass
      and contype = 'p'
  ) then
    alter table private.write_rate_limits
      add constraint write_rate_limits_pkey primary key (id);
  end if;
end $$;

drop index if exists public.online_players_room_device_uidx;
drop index if exists public.online_results_room_round_player_uidx;
drop index if exists public.online_rooms_status_updated_idx;
drop index if exists public.online_rounds_room_round_uidx;

drop policy if exists online_results_insert_secure on public.online_results;
create policy online_results_insert_secure
on public.online_results
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.online_players p
    where p.id = online_results.player_id
      and p.room_id = online_results.room_id
      and p.device_id = private.require_device()
  )
);

notify pgrst, 'reload schema';
