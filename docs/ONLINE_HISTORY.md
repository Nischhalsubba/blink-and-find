# Central Online History

Priority 6 adds a central history screen powered by the Supabase online room tables. Finally, the results are not just disappearing into the browser like a dramatic magician with poor version control.

## Route

```txt
/history
```

The setup screen links to this route through **View History**.

## What It Shows

The history screen includes:

- Total finished online games
- Total players counted across rooms
- Total configured rounds
- Total saved turn results
- Recent finished games
- Winner for each room
- Player leaderboard
- Selected room detail
- Round-by-round result table

## Data Source

The screen reads from existing Supabase tables:

- `online_rooms`
- `online_players`
- `online_results`

Only rooms with:

```sql
status = 'finished'
```

appear in history. Abandoned rooms are intentionally hidden. They had their chance.

## Leaderboard Rules

Players are grouped by browser/device and player name.

Sorting rules:

1. Most wins
2. Lowest average game time
3. Fewest wrong taps

The current browser is marked with a **You** badge when it appears in the leaderboard.

## Room Detail Rules

Each selected room shows:

- Room code
- Completed time
- Player ranking
- Winner badge
- Total time per player
- Wrong taps per player
- Every round result
- Target number per round
- Final time per turn

## QA Checklist

1. Finish at least one online Same Challenge game.
2. Open `/history`.
3. Confirm the finished room appears in Recent games.
4. Confirm the winning player is correct.
5. Click **View** on the room.
6. Confirm room details show player totals.
7. Confirm round results match Supabase `online_results`.
8. Confirm the leaderboard shows the players.
9. Confirm the current browser shows **You** when applicable.
10. Confirm abandoned rooms do not appear.
11. Confirm `/history` empty state appears when there are no finished games.

## Known Limits

- This is anonymous-device history, not account-based history.
- A player using another browser/device is counted separately.
- Renaming yourself can create a separate leaderboard entry for the same browser.

That is acceptable for the current no-login MVP. Real accounts can ruin everyone’s day later.
