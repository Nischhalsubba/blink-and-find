# Deployment Notes

## Platform

Recommended deployment target: Vercel.

## Build Settings

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: use the default Next.js output

## Environment Variables

Add these in Vercel Project Settings > Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Do not commit real Supabase values to GitHub. Public keys belong in Vercel/local env config, not in the repo, because the repo does not need to cosplay as a leak bucket.

## Supabase Database

Open the Supabase SQL Editor and run:

```bash
supabase/schema.sql
```

This creates online room tables, MVP Row Level Security policies, and Realtime publication entries.

## Required Checks Before Deploy

Run locally before production deployment:

```bash
npm install
npm run typecheck
npm run build
```

## Dependency Notes

The project uses Tailwind CSS, shadcn/ui-style components, Radix UI primitives, Supabase, and Next.js. If Vercel fails after a package update, clear the Vercel build cache and redeploy so the latest dependency graph is installed cleanly.

## PWA Assets

The app includes:

- `/manifest.json`
- `/icon.svg`
- `/og-image.svg`

These are referenced from the Next.js metadata in `src/app/layout.tsx`.

## Manual QA Checklist

After deployment, test:

- Setup screen opens cleanly on desktop and mobile
- Online button opens `/online`
- Host can create an online room
- Guest can join by room code
- Lobby updates when the second player joins
- Host can copy invite link
- Host can start the online room
- Single-player game starts
- Same-device multiplayer game shows the ready screen for each player
- Target preview hides correctly
- Wrong taps add penalty
- Correct tap ends the turn
- Auto-continue can be toggled
- Sound can be muted
- Mobile vibration does not block play when unsupported
- Keyboard arrow navigation moves focus between number tiles
- Round summary appears after all local players finish
- Final result screen shows ranking and history
- Copy result works in browsers that support clipboard access
