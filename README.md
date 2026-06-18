# Blink & Find

Memorize. Hide. Hunt the scattered number.

Blink & Find is a fast-paced number hunting game where players find a flashed target number inside a scattered board. It supports quick solo play, same-device multiplayer, Supabase-backed online Same Challenge rooms, and online Live Race rooms for two-device play.

## Current Features

- One-tap **Play Now** local game
- **Play with Friend** online entry with Create / Join pill choices
- Single-player and same-device multiplayer modes
- Online Same Challenge rooms with Supabase sync
- Online Live Race rooms with shared countdown
- Same-board simultaneous play for Live Race
- Live Race result placement after every player finishes
- Online invite links with auto-join support
- Native share invite flow where supported
- QR code invite for room joining
- Copy-link fallback for invite sharing
- Rejoin-last-room support after refresh
- Active-turn recovery after refresh
- Stale online room cleanup
- Central online history screen
- Recent finished games
- Online player leaderboard
- Room detail with round-by-round results
- Database guardrails for anonymous online play
- Central room/player/round/result tables through Supabase
- Same Challenge and Live Race room types
- Dynamic player count for custom local games
- Dynamic round count
- Easy, normal, and hard board sizes
- Scattered handwritten-style number layout
- Per-round board reshuffle/repositioning
- Fair seeded board generation for online play
- Pre-turn ready screen
- Target preview countdown
- Timer-based scoring
- Wrong-tap penalties
- Round summaries
- Final rankings and round history
- Saved local settings and best scores via local storage
- Online result saving via Supabase
- Copyable local result summary
- Sound effects with mute toggle
- Mobile vibration feedback
- Optional auto-continue after correct taps
- Keyboard navigation for number tiles
- ARIA live status updates
- Reduced-motion support
- PWA manifest and app icon
- shadcn/ui component system with Tailwind CSS

## Online Play

### Same Challenge

Same Challenge is playable now.

Flow:

1. Player A opens the app.
2. Player A taps **Play with Friend**.
3. Player A chooses **Create** and taps **Create Game**.
4. Player A shares the invite link, shows the QR code, or gives Player B the room code.
5. Player B opens the invite link, scans the QR code, or joins with the room code.
6. Player A starts the game.
7. Each player takes a turn on their own device.
8. Every player gets the same board and target for that round.
9. Each new round reshuffles and repositions the board.
10. Results are saved centrally in Supabase.

If a player refreshes, the app saves the last room locally and can restore the room automatically or through **Rejoin Last Room**. If the active player refreshes mid-turn, the app offers **Restart Turn** on the same board and target instead of leaving the room stuck. Tiny mercy, since browsers do enjoy forgetting things at the worst possible time.

Unfinished stale rooms are marked `abandoned` automatically. Lobbies expire after 2 idle hours; active rooms expire after 6 idle hours. Finished rooms stay available on the central history screen.

### Live Race

Live Race is playable now.

Flow:

1. Player A taps **Play with Friend**.
2. Player A opens **Name and options**.
3. Player A selects **Live Race**.
4. Player A creates the room and invites Player B.
5. Player A starts the game after Player B joins.
6. Both players see the same countdown, same target, and same board.
7. When the countdown reaches zero, the target hides and both players race at the same time.
8. Correct taps submit results to Supabase.
9. The round closes when every player has submitted.
10. Results are ranked by final time.

Live Race uses a shared `round_start_at` timestamp for casual latency-tolerant timing. It is fair enough for friends, not yet armored against determined cheating. Stronger server/auth security can come after the no-login MVP.

### History

Open `/history` or tap **View History** on the setup screen to see finished online rooms, winners, player leaderboard, and round-by-round room details.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Radix UI primitives
- Supabase
- Cloudflare Pages

## Development

```bash
npm install
npm run dev
```

Open the local URL shown in your terminal.

## Supabase Setup

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Add your Supabase project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Then open Supabase SQL Editor and run the contents of:

```bash
supabase/schema.sql
```

After that, run the production hardening migration:

```bash
supabase/priority8_hardening.sql
```

The SQL creates:

- `online_rooms`
- `online_players`
- `online_rounds`
- `online_results`

It also enables Realtime, Row Level Security policies for the MVP anonymous-room flow, the `abandon_stale_online_rooms` cleanup helper, and database guardrails for room/result integrity.

## Quality Checks

```bash
npm run typecheck
npm run build
```

## Deployment Notes

This project is hosted on Cloudflare Pages.

Recommended Cloudflare Pages settings:

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: use the default Cloudflare Pages output for the selected Next.js preset

Add these Cloudflare Pages environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

If a deployment fails after dependency changes, retry the deployment after Cloudflare has installed the latest dependency graph. The machines are dramatic, but they do eventually read `package.json`.

## Product Notes

The board intentionally avoids strict rows and columns. For online play, board generation is deterministic per round, so players in the same room receive the same scattered layout. The next round uses a new seed, so the positions change without ruining multiplayer fairness. Chaos, but with paperwork.

## Current Priority Status

- Priority 1: Two-device Same Challenge QA is confirmed working.
- Priority 2: Documentation cleanup is complete, including Cloudflare Pages notes.
- Priority 3: Invite UX polish is complete with native share, QR, and copy fallback.
- Priority 4: Reconnect and refresh handling is complete.
- Priority 5: Online room cleanup is complete.
- Priority 6: Central history screen is complete.
- Priority 7: Live Race gameplay is complete.
- Priority 8: Production security hardening is complete for the anonymous MVP.
- Next priority: Build and dependency hardening.
