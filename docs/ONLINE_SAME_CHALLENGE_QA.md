# Online Same Challenge QA

Use this checklist for Priority 1: proving the online Same Challenge flow works on two different devices.

## Setup

- Deploy the latest `main` branch to Vercel.
- Confirm Vercel has `NEXT_PUBLIC_SUPABASE_URL`.
- Confirm Vercel has `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Confirm the Supabase schema has been run successfully.
- Use two real devices or two browsers with separate local storage profiles.

## Happy Path

1. On Device A, open the deployed app.
2. Tap **Play with Friend**.
3. Confirm a room is created automatically.
4. Tap **Copy Invite**.
5. Open the invite link on Device B.
6. Confirm Device B joins the room automatically.
7. Confirm Device A sees both players in the lobby.
8. On Device A, tap **Start Game**.
9. Confirm Device A sees the ready screen.
10. Confirm Device B sees a waiting screen.
11. On Device A, tap **Show Target**.
12. Confirm the target appears, then hides.
13. Finish Device A's turn.
14. Confirm Device B becomes the active player.
15. Confirm Device B plays the same board and target.
16. Finish Device B's turn.
17. Confirm both devices reach the round summary.
18. On Device A, start the next round.
19. Finish all rounds.
20. Confirm final results appear on both devices.

## Sync Checks

- Player list updates without manual refresh.
- Room status updates without manual refresh.
- Waiting screen changes when the active player changes.
- Round summary appears after all players finish.
- Final result appears after the last round.

## Data Checks in Supabase

After one full game, check the tables:

- `online_rooms` has one room with status `finished`.
- `online_players` has both players.
- `online_rounds` has one row per round.
- `online_results` has one row per player per round.

For a 2-player, 5-round game, expect:

- `online_rounds`: 5 rows
- `online_results`: 10 rows

## Failure Cases

- Guest opens invite before host copies it: no action needed.
- Guest joins with bad room code: app should show an error.
- Device refresh during lobby: player may need to rejoin through the invite.
- Device refresh during active game: reconnect support is a later priority.

## Priority 1 Result

Mark Priority 1 complete only after the happy path works on two real devices.
