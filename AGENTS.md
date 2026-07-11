# Repository Instructions

## Setup

Blink & Find is a Next.js, React, TypeScript, Tailwind CSS, Supabase, Playwright, and Cloudflare-hosted browser game.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Use Node.js 20.9 or newer and npm 10 or newer.

Online features require:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Apply the SQL files in this order:

1. `supabase/schema.sql`
2. `supabase/priority8_hardening.sql`

## Commands

| Task | Command |
|---|---|
| Start development server | `npm run dev` |
| Lint | `npm run lint` |
| Type-check | `npm run typecheck` |
| Build production bundle | `npm run build` |
| Run quality checks | `npm run check` |
| Run Playwright | `npm run e2e` |
| Run Playwright UI | `npm run e2e:ui` |
| Run checks and E2E | `npm run verify` |
| Audit production dependencies | `npm run audit:prod` |
| Start production server | `npm run start` |

## Key files and folders

- `src/app/page.tsx`: route-level phase rendering for local play.
- `src/hooks/useGameController.ts`: local game orchestration and state transitions.
- `src/engine/board.ts`: random, custom, seeded, and zig-zag board generation.
- `src/lib/onlineRooms.ts`: Supabase room creation, round progression, recovery, and result handling.
- `src/lib/scoreValidation.ts`: result-submission validation.
- `src/lib/seo.ts`: canonical URL, route inventory, metadata copy, and structured data.
- `src/components/StartScreen.tsx`: game-mode selection and custom setup.
- `src/components/GameScreen.tsx`: active gameplay experience.
- `src/components/ReadyScreen.tsx`: turn preparation.
- `src/components/RoundSummary.tsx`: per-round feedback.
- `src/components/ResultScreen.tsx`: final ranking and replay flow.
- `src/app/globals.css`: core layout, board, focus, feedback, and reduced-motion behavior.
- `src/app/colorful.css`: current colorful product theme.
- `src/app/design-system.css`: shared presentation primitives.
- `supabase/`: schema and production-hardening migration.
- `tests/`: Playwright desktop and mobile scenarios.
- `.github/workflows/ci.yml`: lint, typecheck, build, browser smoke tests, and dependency audit.
- `docs/PRODUCT_AND_ENGINEERING_CASE_STUDY.md`: product and architecture reference.

## Architecture rules

- Keep route components thin and move game behavior into hooks, engines, and libraries.
- Keep board generation deterministic when a seed is supplied.
- Preserve stable room, round, player, and result contracts across Supabase changes.
- Keep local-game state and online-room state conceptually separate.
- Prefer pure helpers for board generation, scoring, validation, parsing, and ranking.
- Do not duplicate SEO constants or route metadata outside `src/lib/seo.ts` without a clear reason.
- Keep shared UI behavior in reusable components rather than adding route-specific copies.
- Preserve the distinction between casual Live Race fairness and server-authoritative competition.

## Board and scoring conventions

- Board sizes must remain positive integers.
- Custom required numbers must be unique positive integers.
- Seeded board functions must return identical results for identical inputs.
- Wrong-tap penalties must be included explicitly in the final score.
- Any score submitted online must pass validation before persistence.
- Do not silently change existing score semantics without a migration and release note.

## Supabase and online-room conventions

- Treat room codes as public join secrets, not strong authentication credentials.
- Keep Row Level Security policies aligned with application queries.
- Review anonymous insert and update permissions after every schema change.
- Preserve stale-room cleanup behavior.
- Do not trust client-provided placement, elapsed time, or identity without validation.
- Use optimistic UI carefully and reconcile against persisted room snapshots.
- Keep recovery behavior for refreshed active turns.
- Test Same Challenge and Live Race separately; they use different progression models.

## Accessibility

- Preserve keyboard access for every number tile and game control.
- Keep visible focus indicators.
- Expose important status updates through live regions.
- Do not communicate correct, wrong, ready, or warning states by color alone.
- Keep reduced-motion behavior working across new animations.
- Verify mobile safe areas and small-screen board sizing.
- Keep Comfort, Practice, and Zen modes genuinely lower-pressure.
- Test screen-reader reading order on setup, gameplay, summaries, and results.

## Testing and verification

Before committing meaningful changes:

1. Run `npm run check`.
2. Run `npm run e2e`.
3. Run `npm run audit:prod`.
4. Test solo play through final results.
5. Test same-device multiplayer.
6. Test Same Challenge creation, join, turn advancement, refresh, and finish.
7. Test Live Race countdown, simultaneous play, result submission, and placement.
8. Test custom board sizes and required-number input.
9. Test wrong-tap penalties.
10. Test Daily, Time Attack, Streak, Practice, Comfort, and Zen modes.
11. Test persistence and rejoin behavior.
12. Test keyboard navigation and reduced motion.
13. Inspect desktop and mobile layouts.
14. Verify metadata, sitemap, robots, manifest, and social preview on production.

## Do not

- Do not claim anonymous multiplayer is cheat-proof.
- Do not replace deterministic seeded generation with ordinary random shuffling for online rounds.
- Do not weaken Supabase policies merely to make a failing UI call succeed.
- Do not store service-role or private credentials in browser-exposed variables.
- Do not trust client-submitted scores without validation.
- Do not hard-code deployment URLs outside the centralized SEO configuration.
- Do not present the repository thumbnail as a browser screenshot.
- Do not claim a production screenshot was captured unless the deployment was actually loaded and inspected.
