# Blink & Find QA Checklist

Use this checklist before every production deploy. Because browsers are tiny chaos engines wearing brand logos.

## Required commands

```bash
npm install
npm run verify
```

`npm run verify` runs lint, typecheck, production build, and Playwright smoke tests.

## Route smoke check

- `/`
- `/online`
- `/challenge?seed=123&size=100&target=42`
- `/comfort`
- `/zen`
- `/tips`
- `/modes`
- `/faq`
- `/daily`
- `/time-attack`
- `/streak`
- `/stats`
- `/leaderboard`
- `/profile`
- `/telemetry`
- `/sitemap.xml`

## Gameplay checks

- Start a local game from the home screen.
- Finish a local game and save the winner to the leaderboard.
- Start Practice, Daily, Time Attack, Streak, Comfort, and Zen.
- Open a shared challenge link twice and verify the same seed/target loads.
- Confirm wrong taps add penalties in timed modes.
- Confirm Zen mode has no timer and advances after a correct tap.

## Online checks

- Create a private Same Challenge room and join from a second browser/device.
- Create a public room and verify it appears in the public lobby list.
- Remove a non-host player before the game starts.
- Start Same Challenge and finish all rounds.
- Start Live Race and verify both players can play simultaneously.
- Finish an online game and start a rematch.
- Refresh mid-room and confirm session restore works.
- Run stale-room cleanup from the recovery UI.

## Production checks

- Run `supabase/schema.sql` first for base online play.
- Run `supabase/production_features.sql` for public rooms, leaderboard, profiles, and database score constraints.
- Confirm Cloudflare has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Confirm `/sitemap.xml` includes public pages.
- Confirm `/telemetry` records page views and client errors locally.
