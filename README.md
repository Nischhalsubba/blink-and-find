# Blink & Find

Memorize. Hide. Hunt the scattered number.

Blink & Find is a fast-paced number hunting game where players race to find a flashed target number inside a scattered board. It supports single-player practice and fair turn-based multiplayer where every player in a round receives the same board and target.

## Current Features

- Minimal setup screen
- Single-player and multiplayer modes
- Dynamic player count
- Dynamic round count
- Easy, normal, and hard board sizes
- Scattered handwritten-style number layout
- Fair same-board/same-target multiplayer rounds
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
- Vercel

## Development

```bash
npm install
npm run dev
```

Open the local URL shown in your terminal.

## Quality Checks

```bash
npm run typecheck
npm run build
```

## Deployment Notes

This project is ready for Vercel deployment.

Because the app now uses Tailwind CSS, Radix UI, and shadcn-style components, make sure Vercel installs fresh dependencies after pulling the latest `package.json` changes.

Recommended Vercel settings:

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: default Next.js output

If a deployment fails after dependency changes, clear the build cache and redeploy.

## Product Notes

The board intentionally avoids strict rows and columns. The placement is deterministic, so every player in the same round receives the same scattered layout. That keeps the handmade feel without ruining multiplayer fairness, because chaos is fun only until someone loses by math crime.
