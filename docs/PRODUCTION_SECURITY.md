# Production Security Hardening

Priority 8 hardens the anonymous online-room MVP. It does not magically turn a no-login browser game into Fort Knox, because computers remain annoyingly bound by reality.

## What Is Hardened

The migration in `supabase/priority8_hardening.sql` adds database-side guardrails:

- room code format validation
- round number bounds
- player name bounds
- board size and target bounds
- score/time sanity checks
- closed rooms cannot reopen
- room rounds cannot move backwards
- room settings cannot change after lobby
- host player cannot be changed after assignment
- current player must belong to the room
- result player must belong to the room
- result target must match the round target
- result penalty must match wrong taps and room settings
- result player name is normalized from the player row
- stricter insert policies for rooms, players, rounds, and results

## Required Supabase Step

Run this after the normal schema:

```sql
-- in Supabase SQL Editor
-- copy and run the full contents of:
supabase/priority8_hardening.sql
```

## What This Prevents

This blocks accidental or low-effort corruption such as:

- impossible targets
- negative times
- mismatched penalty math
- results for players outside the room
- results for a target that was not in the round
- reopening finished or abandoned rooms
- changing host identity after assignment
- changing settings after the game starts

## What This Does Not Fully Prevent Yet

Because the app intentionally has no login, it cannot fully prove that a browser is truly a specific player. A determined user with the public Supabase key could still attempt to call allowed anonymous operations. The database guardrails reject malformed data, but true player ownership requires one of these:

- Supabase Auth
- signed room/player tokens
- server-side actions or Cloudflare Worker endpoints using a private service role key

That deeper model is the next security evolution if the game becomes public/public, not just friend-to-friend. Tiny browser keys are not magical bouncers, despite their confidence.

## QA Checklist

1. Run `supabase/schema.sql`.
2. Run `supabase/priority8_hardening.sql`.
3. Create a Same Challenge room.
4. Join with a second device.
5. Finish one round.
6. Confirm results save normally.
7. Create a Live Race room.
8. Finish one Live Race round.
9. Confirm placements save normally.
10. Try this invalid result insert in SQL Editor and confirm it fails:

```sql
insert into public.online_results (
  room_id,
  round_number,
  player_id,
  player_name,
  target_number,
  raw_time_ms,
  penalty_ms,
  final_time_ms,
  wrong_taps
)
select
  r.id,
  r.current_round,
  p.id,
  p.name,
  999999,
  1000,
  0,
  1000,
  0
from public.online_rooms r
join public.online_players p on p.room_id = r.id
where r.status in ('ready', 'playing', 'round_summary')
limit 1;
```

Expected result: failure because the target does not match the actual round target.

## Operational Notes

Keep the Supabase `service_role` key out of frontend code. Only the public publishable key belongs in the browser. If server-side endpoints are added later, put the service role key only in Cloudflare server-side environment variables.
