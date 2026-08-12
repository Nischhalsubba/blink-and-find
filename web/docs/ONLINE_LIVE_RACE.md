# Online Live Race

Priority 7 adds the first playable Live Race mode. Same board, same target, same countdown, everyone taps on their own device at the same time. Finally, multiplayer without politely waiting in line like a DMV simulator.

## Route

Live Race uses the normal online route:

```txt
/online
```

Open **Name and options**, choose **Live Race**, create a room, invite a friend, then start.

## Gameplay Flow

1. Host creates a Live Race room.
2. Guest joins through invite link, QR code, or room code.
3. Host starts the game.
4. Supabase creates a shared round with:
   - seeded board
   - target number
   - shared start time
5. All players see the target during the shared countdown.
6. When the countdown reaches zero, the target hides and the timer starts.
7. Every player races on their own device at the same time.
8. Correct tap submits that player's result.
9. The app waits until every player has submitted.
10. Results are ranked by final time.
11. Host starts the next round, or the final results appear after the last round.

## Fairness Rules

- Every player in a round receives the same board seed.
- Every player receives the same target number.
- Every player uses the same `round_start_at` timestamp.
- Raw time is measured from the shared start time.
- Wrong taps add the configured penalty.
- Placement is assigned when all players finish the round.

This is latency-tolerant enough for the MVP because final time is calculated from the shared start timestamp on the client and submitted to Supabase. It is not anti-cheat secure yet. That comes later, because apparently fun must eventually negotiate with villains.

## Result Storage

Live Race uses the existing tables:

- `online_rooms`
- `online_players`
- `online_rounds`
- `online_results`

Each player's result is stored once per round through the existing unique key:

```sql
unique(room_id, round_number, player_id)
```

When all players have submitted, `placement` is written to each result.

## Reconnect Behavior

If a player refreshes:

- before the countdown finishes, they return to the same countdown if time remains
- after the race starts, they return to the current running race if they have not submitted
- after submitting, they return to the waiting-for-others screen
- after the round completes, they return to the round summary or final results

## QA Checklist

1. Create an online room.
2. Open **Name and options**.
3. Select **Live Race**.
4. Invite a second device.
5. Start the room.
6. Confirm both devices see the same countdown.
7. Confirm both devices see the same target during countdown.
8. Confirm both boards have the same number layout.
9. Let countdown reach zero.
10. Confirm target hides on both devices.
11. Tap wrong numbers and confirm penalty feedback.
12. Tap the correct number on both devices.
13. Confirm each player sees a submitted/waiting screen.
14. Confirm round summary appears after every player finishes.
15. Confirm placement order matches final time.
16. Start the next round.
17. Confirm the next round uses a new board layout.
18. Finish all rounds.
19. Confirm final results appear.
20. Open `/history` and confirm the finished Live Race room appears.

## Known Limits

- This is anonymous-browser multiplayer, not account-based multiplayer.
- It is latency-tolerant, not cheat-proof.
- A player who never submits can keep the round open until stale-room cleanup abandons it.
- Stronger host controls and abuse prevention belong to Priority 8.
