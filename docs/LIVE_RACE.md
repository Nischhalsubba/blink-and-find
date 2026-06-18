# Live Race Gameplay

Priority 7 adds the first playable Live Race mode. Same board. Same target. Same countdown. Everyone panics at once, because apparently fairness was not stressful enough.

## Flow

1. Host opens **Play with Friend**.
2. Host creates a room.
3. Host opens **Name and options**.
4. Host selects **Live Race**.
5. Guest joins through invite link, QR, or room code.
6. Host starts the game.
7. Every player sees the same target during a shared countdown.
8. When the countdown reaches zero, the target hides and everyone plays simultaneously.
9. Each player submits one result for the round.
10. When all players finish, the app ranks the round by final time.
11. Host starts the next round.
12. Final results appear after the last round.

## Timing Model

The host starts each live round by writing a shared `round_start_at` timestamp to `online_rooms` and `online_rounds`.

Clients use that timestamp to calculate:

- Countdown time
- Race start time
- Raw reaction time

This keeps the start synchronized across devices without needing everyone to click a button at the same instant, which would be adorable and impossible.

## Scoring

Live Race uses the same scoring model as the rest of the game:

```txt
final time = raw time + wrong tap penalties
```

Wrong taps add the configured penalty seconds.

## Result Submission

Each player can submit one result per round. The app checks for an existing result before writing so refresh/retry does not intentionally double-count a player.

When all players have submitted:

- round results are assigned placements
- the round is marked complete
- the room moves to `round_summary`, or `finished` on the final round

## QA Checklist

1. Create an online room.
2. Select **Live Race** in Name and options.
3. Invite a second device.
4. Start the game.
5. Confirm both devices show the same countdown.
6. Confirm both devices see the same target.
7. Confirm the target hides when the race starts.
8. Confirm both devices can tap numbers simultaneously.
9. Submit one correct result from each device.
10. Confirm the round summary appears after both finish.
11. Confirm fastest final time is ranked first.
12. Start the next round.
13. Confirm the board and target change.
14. Finish all rounds.
15. Confirm final results appear.
16. Open `/history` and confirm the Live Race room appears with saved results.

## Known Limits

- This is client-timed, with server persistence. It is good enough for casual play, not Olympic judging.
- Network lag can affect when updates arrive, but every player calculates time from the shared start timestamp.
- Players who refresh mid-round can rejoin and continue from the shared timestamp if their result was not submitted.
