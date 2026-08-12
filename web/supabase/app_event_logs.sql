-- Blink & Find app event log bucket
-- Browser clients may insert bounded telemetry. Public reads remain disabled.

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.app_event_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'info' check (level in ('debug', 'info', 'warn', 'error')),
  category text not null default 'app' check (char_length(category) between 1 and 80),
  event_name text not null check (char_length(event_name) between 1 and 120),
  message text check (message is null or char_length(message) <= 1200),
  path text not null check (char_length(path) between 1 and 500),
  device_id text not null check (
    device_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ),
  player_id text check (player_id is null or char_length(player_id) <= 100),
  player_name text check (player_name is null or char_length(player_name) <= 120),
  room_id uuid,
  room_code text check (room_code is null or char_length(room_code) <= 20),
  user_agent text check (user_agent is null or char_length(user_agent) <= 500),
  metadata jsonb not null default '{}'::jsonb check (
    jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 32768
  ),
  created_at timestamptz not null default now()
);

create index if not exists app_event_logs_created_at_idx on public.app_event_logs(created_at desc);
create index if not exists app_event_logs_level_created_at_idx on public.app_event_logs(level, created_at desc);
create index if not exists app_event_logs_event_name_created_at_idx on public.app_event_logs(event_name, created_at desc);
create index if not exists app_event_logs_room_id_created_at_idx on public.app_event_logs(room_id, created_at desc);
create index if not exists app_event_logs_device_id_created_at_idx on public.app_event_logs(device_id, created_at desc);

alter table public.app_event_logs enable row level security;

revoke all on table public.app_event_logs from public, anon, authenticated;
grant insert on table public.app_event_logs to anon, authenticated;

drop policy if exists "app_event_logs_insert" on public.app_event_logs;
create policy "app_event_logs_insert" on public.app_event_logs
for insert
to anon, authenticated
with check (
  created_at >= now() - interval '5 minutes'
  and created_at <= now() + interval '1 minute'
  and device_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and char_length(category) between 1 and 80
  and char_length(event_name) between 1 and 120
  and char_length(path) between 1 and 500
  and (message is null or char_length(message) <= 1200)
  and (user_agent is null or char_length(user_agent) <= 500)
  and jsonb_typeof(metadata) = 'object'
  and pg_column_size(metadata) <= 32768
);

create or replace function private.enforce_app_event_log_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if (
    select count(*)
    from public.app_event_logs
    where device_id = new.device_id
      and created_at >= now() - interval '1 minute'
  ) >= 30 then
    raise exception 'app event log rate limit exceeded'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_app_event_log_rate_limit() from public, anon, authenticated;

drop trigger if exists app_event_logs_rate_limit on public.app_event_logs;
create trigger app_event_logs_rate_limit
before insert on public.app_event_logs
for each row execute function private.enforce_app_event_log_rate_limit();

comment on table public.app_event_logs is
  'Bounded client telemetry. Public clients can insert validated rows only; reads remain private.';
