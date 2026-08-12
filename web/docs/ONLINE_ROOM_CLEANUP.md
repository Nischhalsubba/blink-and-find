# Online Room Cleanup

Priority 5 keeps Supabase from becoming a warehouse of abandoned rooms, because apparently every multiplayer app eventually invents digital clutter.

## Cleanup Policy

The app now treats unfinished rooms as stale when they stop changing for too long:

| Room state | Cleanup rule |
|---|---:|
| `lobby` | Abandon after 2 hours idle |
| `ready` | Abandon after 6 hours idle |
| `playing` | Abandon after 6 hours idle |
| `round_summary` | Abandon after 6 hours idle |
| `finished` | Keep for history |
| `abandoned` | Keep as lightweight tombstone |

Finished rooms are retained because Priority 6 will use them for central history.

## App-side Cleanup

The browser app runs safe cleanup when users:

- open `/online`
- create a room
- join a room
- restore a saved room
- refresh an active room

The cleanup marks stale unfinished rooms as:

```sql
status = 'abandoned'
current_player_id = null
```

It does not delete players, rounds, or results. That means debugging and future history screens still have context, instead of leaving everyone to interpret database ashes.

## Database-side Cleanup Helper

`supabase/schema.sql` now includes:

```sql
public.abandon_stale_online_rooms(
  lobby_cutoff interval default interval '2 hours',
  active_cutoff interval default interval '6 hours'
)
```

Run the latest `supabase/schema.sql` in Supabase SQL Editor after deploying this priority.

Manual cleanup command:

```sql
select public.abandon_stale_online_rooms();
```

More aggressive test cleanup:

```sql
select public.abandon_stale_online_rooms(interval '5 minutes', interval '10 minutes');
```

## Verification Queries

Find active unfinished rooms:

```sql
select code, status, created_at, updated_at
from public.online_rooms
where status in ('lobby', 'ready', 'playing', 'round_summary')
order by updated_at asc;
```

Find abandoned rooms:

```sql
select code, status, created_at, updated_at
from public.online_rooms
where status = 'abandoned'
order by updated_at desc;
```

Confirm finished history remains intact:

```sql
select r.code, count(res.id) as result_count
from public.online_rooms r
left join public.online_results res on res.room_id = r.id
where r.status = 'finished'
group by r.code
order by max(r.updated_at) desc;
```

## QA Checklist

After deploying Priority 5:

1. Open `/online` and confirm normal Create / Join still works.
2. Create a room and confirm it appears as `lobby` in Supabase.
3. Join with a second device and complete a game.
4. Confirm the completed room remains `finished`.
5. Run this in Supabase SQL Editor for test-only cleanup:

```sql
select public.abandon_stale_online_rooms(interval '0 minutes', interval '0 minutes');
```

6. Confirm unfinished rooms become `abandoned`.
7. Confirm finished rooms stay `finished`.
8. Try joining an abandoned room code and confirm the app shows a clean error.
9. Confirm Rejoin Last Room clears if the saved room was abandoned.
10. Confirm creating a new room still works after cleanup.

## Notes

This priority intentionally marks stale rooms abandoned instead of deleting them. Deletion can come later if storage ever becomes a problem, but for a game this size, a small tombstone is more useful than mystery disappearance.
