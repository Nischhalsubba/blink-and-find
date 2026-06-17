# Deployment Notes

## Platform

Recommended deployment target: Vercel.

## Build Settings

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: use the default Next.js output

## Required Checks Before Deploy

Run locally before production deployment:

```bash
npm install
npm run typecheck
npm run build
```

## Dependency Notes

The project uses Tailwind CSS, shadcn/ui-style components, Radix UI primitives, and Next.js. If Vercel fails after a package update, clear the Vercel build cache and redeploy so the latest lock/dependency graph is installed cleanly.

## PWA Assets

The app includes:

- `/manifest.json`
- `/icon.svg`
- `/og-image.svg`

These are referenced from the Next.js metadata in `src/app/layout.tsx`.

## Manual QA Checklist

After deployment, test:

- Setup screen opens cleanly on desktop and mobile
- Single-player game starts
- Multiplayer game shows the ready screen for each player
- Target preview hides correctly
- Wrong taps add penalty
- Correct tap ends the turn
- Auto-continue can be toggled
- Sound can be muted
- Mobile vibration does not block play when unsupported
- Keyboard arrow navigation moves focus between number tiles
- Round summary appears after all players finish
- Final result screen shows ranking and history
- Copy result works in browsers that support clipboard access
