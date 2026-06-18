# QA Audit

This audit covers the completed priorities and the core online flow. It is intentionally boring. Boring QA is good QA. Exciting QA usually means something is on fire.

## Current Completed Priorities

- Priority 1: Two-device Same Challenge QA
- Priority 2: Documentation cleanup
- Priority 3: Invite UX polish
- Priority 4: Reconnect and refresh handling
- Priority 5: Online room cleanup
- Priority 6: Central history screen

## Code-level Audit

### Priority 1: Same Challenge

Checks:

- Host can create a room.
- Guest can join through link, QR, or code.
- Same Challenge uses seeded board generation.
- Same round gives both players the same board and target.
- New round uses a fresh seed and new board positions.
- Results are submitted once per player per round.
- Final room status becomes `finished`.

### Priority 2: Docs

Checks:

- README reflects Cloudflare Pages as the host.
- Deployment docs mention Cloudflare environment variables.
- Roadmap status matches the implemented priorities.
- Online QA checklist matches the current Create / Join flow.

### Priority 3: Invite UX

Checks:

- Host lobby shows room code.
- Host lobby shows QR code.
- Native share is used when supported.
- Copy Link works as fallback.
- Guest lobby messaging is clear.
- Invite links include `room=CODE&join=1`.

### Priority 4: Reconnect

Checks:

- Current room session is saved to localStorage.
- Rejoin Last Room appears when a saved room exists.
- Refreshing host lobby restores the room.
- Refreshing guest lobby restores the room.
- Refreshing waiting screen restores the waiting state.
- Refreshing active player mid-turn shows Restart Turn.
- Abandoned room clears saved session.

### Priority 5: Cleanup

Checks:

- Stale lobbies are abandoned after policy cutoff.
- Stale active rooms are abandoned after policy cutoff.
- Finished rooms are retained for history.
- App-side cleanup runs during online entry, create, join, restore, and refresh.
- SQL helper exists for manual or scheduled cleanup.

### Priority 6: History

Checks:

- `/history` route exists.
- Setup screen links to `/history`.
- Finished rooms load from Supabase.
- Abandoned rooms are hidden.
- Recent games show winner, player count, and completion date.
- Player leaderboard ranks by wins, average time, and wrong taps.
- Current browser/device is marked with **You** when applicable.
- Selected room detail shows standings and round-by-round results.
- Loading, empty, and error states exist.

## Manual End-to-End Test Plan

### Local quick play

1. Open app.
2. Click Play Now.
3. Confirm ready screen opens.
4. Play all rounds.
5. Confirm final results appear.

### Online happy path

1. Device A opens app.
2. Device A taps Play with Friend.
3. Device A chooses Create.
4. Device A taps Create Game.
5. Device A shares invite.
6. Device B opens invite.
7. Device B auto-joins.
8. Device A starts game.
9. Device A plays turn.
10. Device B plays turn.
11. Round summary appears.
12. Start next round.
13. Confirm board positions changed.
14. Finish all rounds.
15. Confirm final results appear on both devices.
16. Confirm Supabase room status is `finished`.

### History path

1. Finish an online Same Challenge game.
2. Open `/history` or tap View History.
3. Confirm the room appears in Recent games.
4. Confirm the winner matches the final result screen.
5. Click View on the room.
6. Confirm player totals appear.
7. Confirm round-by-round rows match the game results.
8. Confirm the leaderboard includes both players.
9. Confirm current browser shows **You** when applicable.
10. Confirm abandoned rooms do not appear.

### Reconnect path

1. Create online room.
2. Refresh host lobby.
3. Confirm room restores.
4. Join on second device.
5. Refresh guest lobby.
6. Confirm guest restores.
7. Start game.
8. Refresh waiting player.
9. Confirm waiting screen restores.
10. Refresh active player during turn.
11. Confirm Restart Turn appears.
12. Restart and finish the turn.

### Cleanup path

1. Run latest `supabase/schema.sql`.
2. Create a test room and leave it unfinished.
3. Run:

```sql
select public.abandon_stale_online_rooms(interval '0 minutes', interval '0 minutes');
```

4. Confirm unfinished test room becomes `abandoned`.
5. Confirm finished rooms remain `finished`.
6. Try joining the abandoned room and confirm clean error.

## Known Limitations

- Live Race has room foundation only.
- Supabase RLS is still MVP-friendly and will be tightened in Priority 8.
- Dependency pinning and CI are still pending in Priority 9.
- Full mobile matrix testing is still pending in Priority 10.
