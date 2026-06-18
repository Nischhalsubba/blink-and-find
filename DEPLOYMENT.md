# Deployment Notes

## Platform

Current deployment target: Cloudflare Pages.

Production URL:

```txt
https://blink-and-find.hinischalsubba.workers.dev/
```

## Build Settings

Use the Cloudflare Pages Next.js preset.

Recommended settings:

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: use the default output from Cloudflare's Next.js preset

## Environment Variables

Add these in Cloudflare Pages Project Settings > Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Do not commit real Supabase values to GitHub. Public keys belong in Cloudflare/local env config, not in the repo. The repo does not need to cosplay as a leak bucket.

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

The project uses Tailwind CSS, shadcn/ui-style components, Radix UI primitives, Supabase, QR code generation, and Next.js. If Cloudflare fails after a package update, retry the deployment so the latest dependency graph is installed cleanly.

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
- Host sees room code, QR code, native share/copy buttons
- Host can share invite through native share where supported
- Host can copy invite link as fallback
- Guest can auto-join from invite link
- Guest can join manually by room code
- Guest can scan QR code to join
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

Before marking a deployment as good, confirm Cloudflare Pages is building the latest GitHub commit on `main`. If production is behind, trigger a new Cloudflare Pages deployment. Machines enjoy technicalities. Apparently this is culture now.
