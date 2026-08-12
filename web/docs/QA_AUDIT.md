# QA Audit

This audit covers the completed priorities and the core online flow. It is intentionally boring. Boring QA is good QA. Exciting QA usually means something is on fire.

## Current Completed Priorities

- Priority 1: Two-device Same Challenge QA
- Priority 2: Documentation cleanup
- Priority 3: Invite UX polish
- Priority 4: Reconnect and refresh handling
- Priority 5: Online room cleanup
- Priority 6: Central history screen
- Priority 7: Live Race gameplay
- Priority 8: Production security hardening
- Priority 9: Build and dependency hardening
- Priority 10: Mobile gameplay QA

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

### Priority 7: Live Race

Checks:

- Live Race option starts a playable room instead of a placeholder.
- Host creates a shared round with `round_start_at`.
- Every player sees the same countdown.
- Every player sees the same target during countdown.
- The target hides when the shared race starts.
- Every player receives the same seeded board layout.
- Results submit once per player per round.
- Wrong taps add penalties.
- Round closes when every player has submitted.
- Placements are assigned by final time.
- Host can start the next round.
- Final results appear after the last round.
- Finished Live Race rooms appear in `/history`.

### Priority 8: Security

Checks:

- `supabase/priority8_hardening.sql` exists.
- Room, player, round, and result sanity constraints are documented.
- Room transition trigger is documented.
- Result validation trigger is documented.
- Public-key anonymous limitations are documented.

### Priority 9: Build

Checks:

- `latest` package versions were removed.
- Node version files exist.
- npm exact-save settings exist.
- ESLint flat config exists.
- GitHub Actions CI exists.
- `npm run check` exists.
- Production audit script exists.
- Lockfile generation is documented as a required local follow-up.

### Priority 10: Mobile

Checks:

- Active game mobile header is compact.
- Quit button is shortened on mobile.
- Target/timer row is compact on mobile.
- Dynamic viewport units are used.
- Safe-area padding is used.
- Number grid is bounded by available viewport space.
- Mobile QA checklist exists.

## Manual End-to-End Test Plan

### Local quick play

1. Open app.
2. Click Play Now.
3. Confirm ready screen opens.
4. Play all rounds.
5. Confirm final results appear.

### Same Challenge happy path

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

### Live Race happy path

1. Device A opens app.
2. Device A taps Play with Friend.
3. Device A chooses Create.
4. Device A opens Name and options.
5. Device A selects Live Race.
6. Device A taps Create Game.
7. Device B joins through invite link, QR, or room code.
8. Device A starts game.
9. Confirm both devices see the same countdown.
10. Confirm both devices see the same target during countdown.
11. Confirm the target hides on both devices when countdown ends.
12. Confirm both players can tap at the same time.
13. Tap wrong numbers and confirm penalties apply.
14. Tap the correct number on both devices.
15. Confirm each device sees submitted/waiting state.
16. Confirm round summary appears after all players finish.
17. Confirm placements sort by final time.
18. Start next round.
19. Confirm board positions change.
20. Finish all rounds.
21. Confirm final results appear.
22. Open `/history` and confirm the room appears.

### History path

1. Finish an online Same Challenge or Live Race game.
2. Open `/history` or tap View History.
3. Confirm the room appears in Recent games.
4. Confirm the winner matches the final result screen.
5. Click View on the room.
6. Confirm player totals appear.
7. Confirm round-by-round rows match the game results.
8. Confirm the leaderboard includes both players.
9. Confirm current browser shows **You** when applicable.
10. Confirm abandoned rooms do not appear.

### Mobile path

1. Open production in a mobile browser.
2. Start Easy, Normal, and Hard local games.
3. Confirm no active-game header overflow.
4. Confirm Target and Timer cards remain compact.
5. Confirm the board is the largest screen area.
6. Confirm all tiles remain tappable.
7. Open in Messenger or another in-app browser.
8. Confirm no horizontal overflow.
9. Create and join online room on mobile.
10. Confirm invite panel, QR code, and history screen remain usable.

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

### Build path

1. Run `npm install` locally.
2. Commit the generated `package-lock.json`.
3. Run `npm run check`.
4. Run `npm run audit:prod`.
5. Push and confirm GitHub Actions passes.
6. Deploy latest commit to Cloudflare.

## Known Limitations

- Live Race is latency-tolerant, not cheat-proof.
- True player-proof security still requires auth, signed tokens, or server-side endpoints.
- A real `package-lock.json` must be generated locally with npm and committed.
- Full manual mobile matrix testing still needs your physical devices after deployment.
