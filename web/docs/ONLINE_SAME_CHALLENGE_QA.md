# Online Same Challenge QA

Use this checklist to prove the online Same Challenge flow works on two different devices.

## Setup

- Deploy the latest `main` branch to Vercel.
- Confirm Vercel has `NEXT_PUBLIC_SUPABASE_URL`.
- Confirm Vercel has `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Confirm the Supabase schema has been run successfully.
- Use two real devices or two browsers with separate local storage profiles.

## Happy Path

1. On Device A, open the deployed app.
2. Tap **Play with Friend**.
3. Confirm the online screen shows **Create** and **Join** pills.
4. On Device A, choose **Create**.
5. Tap **Create Game**.
6. Confirm a room code appears.
7. Tap **Copy Invite**.
8. Open the invite link on Device B.
9. Confirm Device B joins the room automatically.
10. Confirm Device A sees both players in the lobby.
11. On Device A, tap **Start Game**.
12. Confirm Device A sees the ready screen.
13. Confirm Device B sees a waiting screen.
14. On Device A, tap **Show Target**.
15. Confirm the target appears, then hides.
16. Finish Device A's turn.
17. Confirm Device B becomes the active player.
18. Confirm Device B plays the same board and target.
19. Finish Device B's turn.
20. Confirm both devices reach the round summary.
21. On Device A, start the next round.
22. Confirm the next round has a different board layout.
23. Finish all rounds.
24. Confirm final results appear on both devices.

## Sync Checks

- Player list updates without manual refresh.
- Room status updates without manual refresh.
- Waiting screen changes when the active player changes.
- Round summary appears after all players finish.
- Board position changes between rounds.
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

- Guest opens an invite after the room is created: guest should auto-join.
- Guest joins with a bad room code: app should show an error.
- Device refresh during lobby: player may need to rejoin through the invite.
- Device refresh during active game: reconnect support is a later priority.

## Priority 1 Result

Priority 1 is considered complete after the happy path works on two real devices and the final room status becomes `finished` in Supabase.
