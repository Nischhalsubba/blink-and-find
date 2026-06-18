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

Do not commit real Supabase values to GitHub. Public keys belong in Vercel/local env config, not in the repo. The repo does not need to cosplay as a leak bucket.

## Supabase Database

Open the Supabase SQL Editor and run the contents of:

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
- **Play Now** starts a local solo game immediately
- **Play with Friend** opens `/online`
- Online screen shows **Create** and **Join** pill choices
- Host can create an online room from **Create Game**
- Host can copy invite link
- Guest can auto-join from invite link
- Guest can join manually by room code
- Lobby updates when the second player joins
- Host can start the online room
- Same Challenge turn flow works on two devices
- Board positions change on the next round
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

## Release Verification

Before marking a deployment as good, confirm the Vercel Production deployment points to the latest GitHub commit on `main`. If Production is behind, redeploy the newest commit manually from Vercel Deployments. Computers enjoy technicalities. Apparently this is culture now.
