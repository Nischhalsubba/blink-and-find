-- Blink & Find app event log bucket
-- Run this in Supabase SQL Editor to collect client errors and gameplay activity.
-- The app writes logs with the public anon key. Reading logs is intentionally not
-- exposed through RLS; use Supabase SQL Editor or service-role tooling to inspect.

create extension if not exists pgcrypto;

create table if not exists public.app_event_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'info' check (level in ('debug', 'info', 'warn', 'error')),
  category text not null default 'app',
  event_name text not null,
  message text,
  path text,
  device_id text,
  player_id text,
  player_name text,
  room_id uuid,
  room_code text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_event_logs_created_at_idx on public.app_event_logs(created_at desc);
create index if not exists app_event_logs_level_created_at_idx on public.app_event_logs(level, created_at desc);
create index if not exists app_event_logs_event_name_created_at_idx on public.app_event_logs(event_name, created_at desc);
create index if not exists app_event_logs_room_id_created_at_idx on public.app_event_logs(room_id, created_at desc);
create index if not exists app_event_logs_device_id_created_at_idx on public.app_event_logs(device_id, created_at desc);

alter table public.app_event_logs enable row level security;

-- Browser clients may insert telemetry. They cannot read logs through the anon key.
drop policy if exists "app_event_logs_insert" on public.app_event_logs;
create policy "app_event_logs_insert" on public.app_event_logs
for insert
with check (true);

-- Keep accidental public reads closed. Supabase SQL Editor still works as postgres.
drop policy if exists "app_event_logs_select_none" on public.app_event_logs;
create policy "app_event_logs_select_none" on public.app_event_logs
for select
using (false);

-- Handy examples for Supabase SQL Editor:
-- Recent errors:
-- select created_at, event_name, message, path, room_code, metadata
-- from public.app_event_logs
-- where level = 'error'
-- order by created_at desc
-- limit 100;
--
-- Recent online room activity:
-- select created_at, event_name, room_code, message, metadata
-- from public.app_event_logs
-- where category = 'online_room'
-- order by created_at desc
-- limit 200;
