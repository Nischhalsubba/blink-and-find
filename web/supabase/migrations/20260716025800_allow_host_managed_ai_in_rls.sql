drop policy if exists online_players_insert_secure on public.online_players;
create policy online_players_insert_secure
on public.online_players
for insert
to anon, authenticated
with check (
  device_id = private.require_device()
  or (device_id like 'ai-opponent:%' and private.is_room_host(room_id))
);

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
      and (
        p.device_id = private.require_device()
        or (p.device_id like 'ai-opponent:%' and private.is_room_host(online_results.room_id))
      )
  )
);

notify pgrst, 'reload schema';
