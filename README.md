# Blink & Find

Memorize. Hide. Hunt the scattered number.

Blink & Find is a fast-paced number hunting game where players find a flashed target number inside a scattered board. It supports quick solo play, same-device multiplayer, and Supabase-backed online Same Challenge rooms for two-device play.

## Current Features

- One-tap **Play Now** local game
- **Play with Friend** online entry with Create / Join pill choices
- Single-player and same-device multiplayer modes
- Online Same Challenge rooms with Supabase sync
- Online invite links with auto-join support
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
4. Player A copies the invite link.
5. Player B opens the invite link or joins with the room code.
6. Player A starts the game.
7. Each player takes a turn on their own device.
8. Every player gets the same board and target for that round.
9. Each new round reshuffles and repositions the board.
10. Results are saved centrally in Supabase.

### Live Race

Live Race has the shared room foundation, but simultaneous race gameplay is not complete yet. It is planned after Same Challenge polish, reconnect support, and invite UX improvements.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Radix UI primitives
- Supabase
- Vercel

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

The SQL creates:

- `online_rooms`
- `online_players`
- `online_rounds`
- `online_results`

It also enables Realtime and Row Level Security policies for the MVP anonymous-room flow.

## Quality Checks

```bash
npm run typecheck
npm run build
```

## Deployment Notes

This project is ready for Vercel deployment.

Because the app now uses Tailwind CSS, Radix UI, Supabase, and shadcn-style components, make sure Vercel installs fresh dependencies after pulling the latest `package.json` changes.

Recommended Vercel settings:

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: default Next.js output

Add these Vercel environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

If a deployment fails after dependency changes, clear the build cache and redeploy.

## Product Notes

The board intentionally avoids strict rows and columns. For online play, board generation is deterministic per round, so players in the same room receive the same scattered layout. The next round uses a new seed, so the positions change without ruining multiplayer fairness. Chaos, but with paperwork.

## Current Priority Status

- Priority 1: Two-device Same Challenge QA is confirmed working.
- Priority 2: Documentation cleanup is in progress.
- Next priority: Invite UX polish, including native share and QR support.
