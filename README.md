# Blink & Find

Memorize. Hide. Hunt the scattered number.

Blink & Find is a fast-paced number hunting game where players race to find a flashed target number inside a scattered board. It supports single-player practice, same-device multiplayer, and the new Supabase-backed online room foundation.

## Current Features

- Minimal setup screen
- Single-player and same-device multiplayer modes
- Online room create/join lobby
- Same Challenge and Live Race room types
- Central room/player/round/result tables through Supabase
- Dynamic player count
- Dynamic round count
- Easy, normal, and hard board sizes
- Scattered handwritten-style number layout
- Fair seeded board generation for online play
- Pre-turn ready screen
- Target preview countdown
- Timer-based scoring
- Wrong-tap penalties
- Round summaries
- Final rankings and round history
- Saved settings and best scores via local storage
- Copyable result summary
- Sound effects with mute toggle
- Mobile vibration feedback
- Optional auto-continue after correct taps
- Keyboard navigation for number tiles
- ARIA live status updates
- Reduced-motion support
- PWA manifest and app icon
- shadcn/ui component system with Tailwind CSS

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

Then open Supabase SQL Editor and run:

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

The board intentionally avoids strict rows and columns. The placement is deterministic for online play, so every player in the same room receives the same scattered layout. That keeps the handmade feel without ruining multiplayer fairness, because chaos is fun only until someone loses by math crime.

## Online Play Status

The current online work includes the Supabase foundation, create/join room flow, lobby sync, and seeded online board generation. Same Challenge gameplay and Live Race gameplay should be connected next on top of this room state.
