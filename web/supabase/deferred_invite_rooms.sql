-- Allow online invites to be created before a room exists.
-- Run this once after the original presence_invites.sql migration.

alter table public.online_game_invites
  alter column room_id drop not null;

alter table public.online_game_invites
  alter column room_code drop not null;
