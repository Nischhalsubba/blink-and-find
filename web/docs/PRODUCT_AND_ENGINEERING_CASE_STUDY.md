# Blink & Find — Product and Engineering Case Study

> A product, UX, game-engine, multiplayer, data-model, accessibility, SEO, testing, deployment, and maintenance case study for Blink & Find.

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Repository Snapshot](#repository-snapshot)
3. [Product Context](#product-context)
4. [Problem Statement](#problem-statement)
5. [Target Users](#target-users)
6. [Core Product Promise](#core-product-promise)
7. [Game Loop](#game-loop)
8. [Game Modes](#game-modes)
9. [Information Architecture](#information-architecture)
10. [Local Game Architecture](#local-game-architecture)
11. [Board Generation](#board-generation)
12. [Scoring and Penalties](#scoring-and-penalties)
13. [Online Multiplayer](#online-multiplayer)
14. [Same Challenge](#same-challenge)
15. [Live Race](#live-race)
16. [Supabase Data Model](#supabase-data-model)
17. [Recovery and Cleanup](#recovery-and-cleanup)
18. [Frontend Architecture](#frontend-architecture)
19. [Visual Design System](#visual-design-system)
20. [Accessibility](#accessibility)
21. [Performance](#performance)
22. [SEO and Discoverability](#seo-and-discoverability)
23. [Testing and CI](#testing-and-ci)
24. [Security and Trust Model](#security-and-trust-model)
25. [Deployment](#deployment)
26. [Repository Statistics](#repository-statistics)
27. [Risk Register](#risk-register)
28. [Roadmap](#roadmap)
29. [Portfolio Review Notes](#portfolio-review-notes)
30. [AI Coding Agent Notes](#ai-coding-agent-notes)
31. [Launch Checklist](#launch-checklist)
32. [Disclaimer](#disclaimer)

---

## Executive Summary

Blink & Find is a browser-based number-hunting memory game built with Next.js, React, TypeScript, Tailwind CSS, Supabase, and Playwright.

The core mechanic is intentionally simple:

1. show a target number
2. hide it
3. scatter numbers across the board
4. ask the player to find the match
5. score the result using elapsed time and wrong-tap penalties

The product extends that mechanic into a broader game platform with:

- local solo play
- same-device multiplayer
- Same Challenge online rooms
- Live Race online rooms
- Daily Challenge
- Time Attack
- Streak
- Practice
- Comfort
- Zen
- profiles
- personal statistics
- leaderboards
- history
- rules, tutorial, tips, modes, and FAQ content

Its strongest product quality is the way a lightweight cognitive game scales from a one-tap local experience into deterministic multiplayer without requiring a complex account system.

Its largest engineering risk is trust. Anonymous rooms, browser-visible timing, and client-originated results are suitable for friendly play, but they are not inherently cheat-resistant. The system must keep that distinction explicit.

---

## Repository Snapshot

| Attribute | Current state |
|---|---|
| Repository | `Nischhalsubba/blink-and-find` |
| Visibility | Public |
| Default branch | `main` |
| Product type | Browser memory and reaction game |
| Framework | Next.js 16.2 |
| UI | React 19.2 |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS 4 plus custom CSS |
| Backend | Supabase |
| Deployment | Cloudflare Workers/Pages domain configured |
| Browser tests | Playwright desktop and mobile projects |
| CI | Lint, typecheck, build, smoke tests, dependency audit |
| PWA | Manifest and icon present |

Configured production URL:

```text
https://blink-and-find.hinischalsubba.workers.dev
```

---

## Product Context

Number-search games are easy to understand but difficult to sustain as products. A single board is a novelty. A repeatable game needs pacing, fairness, progression, difficulty, feedback, replayability, and social motivation.

Blink & Find treats the paper-game idea as a reusable system rather than one screen.

The product supports:

- quick play without setup friction
- configurable custom matches
- competitive and low-pressure modes
- asynchronous and simultaneous online play
- repeat visits through daily and streak mechanics
- personal progress through stats and achievements
- discoverability through route-level content and SEO

---

## Problem Statement

Players should be able to start a number-hunting game immediately, understand what to do without instruction overhead, and choose between personal practice and friendly competition.

The product must solve several related problems:

- make the target memorable but temporary
- make the board difficult without becoming illegible
- keep scoring understandable
- penalize mistakes consistently
- generate fair online boards
- recover from refreshes and dropped sessions
- remain usable on small screens
- support keyboard and reduced-motion preferences
- explain online trust limitations honestly

A random board alone is not a product. It is an array with ambition.

---

## Target Users

### Primary users

- casual browser-game players
- friends wanting a quick competitive game
- users practicing visual scanning and attention
- people looking for a low-install, no-account game

### Secondary users

- children using Comfort or Practice mode
- older players who benefit from larger targets
- teachers or facilitators using custom number sets
- repeat players tracking personal scores
- users sharing seeded challenges

### User assumptions

The game assumes players can:

- recognize positive integers
- use touch, mouse, or keyboard controls
- understand time-based ranking
- accept that public anonymous rooms are casual rather than secure competition

---

## Core Product Promise

> Remember one number, find it fast, and choose whether the challenge is calm, personal, shared, or competitive.

The product should feel:

- immediate
- colorful
- legible
- fair
- forgiving for beginners
- replayable for returning users
- transparent about penalties and results

---

## Game Loop

The local game loop moves through five primary phases:

1. `setup`
2. `ready`
3. active gameplay phases
4. `roundSummary`
5. `finished`

The root page does not implement game behavior directly. It reads the controller and chooses the screen appropriate to the current phase.

### Setup

The player chooses:

- mode
- player names
- board size
- total rounds
- preview duration
- penalty seconds
- custom required numbers

### Ready

The next player and round are identified before the target appears. This prevents handoff confusion in same-device multiplayer.

### Preview

The target number appears for a configured duration.

### Hunt

The target hides, the timer runs, and the player searches the scattered board.

### Feedback

Correct and wrong selections trigger visible state changes, status copy, optional sound, and optional vibration.

### Summary

The round result is recorded and either the next player, next round, or final ranking is shown.

---

## Game Modes

### Solo

Local timed play with stored settings and best scores.

### Same-device multiplayer

Several players take turns on one device. The ready screen supports device handoff and avoids exposing the next target too early.

### Same Challenge

Players on separate devices receive the same board and target. Turns occur sequentially.

### Live Race

Players receive the same board and target and begin after a shared countdown timestamp.

### Daily Challenge

A stable daily seed gives players a comparable challenge for the day.

### Time Attack

The player finds as many targets as possible during a fixed time window.

### Streak

The run continues until a wrong selection ends it.

### Practice

Players can learn the board mechanic without ordinary scoring pressure.

### Comfort

The mode lowers cognitive and physical pressure using smaller boards, larger tiles, longer preview time, and gentler penalties.

### Zen

The target remains available and no score deadline dominates the experience.

---

## Information Architecture

The route inventory includes:

- `/`
- `/daily`
- `/challenge`
- `/time-attack`
- `/streak`
- `/comfort`
- `/zen`
- `/tutorial`
- `/practice`
- `/stats`
- `/leaderboard`
- `/profile`
- `/tips`
- `/modes`
- `/faq`
- `/rules`
- `/online`
- `/history`

This structure supports three jobs:

1. play the game
2. understand and improve
3. review progress and competition

The breadth is useful, but route proliferation requires consistent navigation, metadata, and quality control.

---

## Local Game Architecture

`src/app/page.tsx` is a thin phase renderer.

`useGameController` is responsible for local orchestration, including:

- configuration
- phase transitions
- player state
- round state
- board state
- target selection
- timer state
- penalties
- result accumulation
- persistence
- sound and vibration preferences
- replay and reset behavior

This separation makes the route easier to understand and lowers the chance that presentation changes break game state.

### Recommended boundary

Keep these concerns separate:

- route rendering
- game controller
- board engine
- scoring helpers
- storage helpers
- online room synchronization
- visual components

---

## Board Generation

The board engine supports several generation strategies.

### Random board

Creates shuffled values from `1` to the board size.

### Custom board

Ensures required positive integers are included, then fills remaining slots with unique values.

### Seeded board

Uses deterministic shuffling so the same seed and board size return the same board.

### Seeded custom board

Combines required values with deterministic filler generation.

### Zig-zag board

Reverses alternating logical rows after shuffling. This creates a snake-like scan pattern without abandoning the scattered visual presentation.

### Seeded zig-zag board

Used online so all players receive equivalent content.

### Invariants

Board generation should preserve:

- positive integer values
- uniqueness
- configured board size
- required numbers
- determinism when seeded
- stable behavior across clients

These properties deserve direct unit tests because multiplayer fairness depends on them.

---

## Scoring and Penalties

A result includes:

- raw elapsed time
- wrong-tap count
- penalty duration
- final time
- round number
- player identity
- target number

The conceptual score is:

```text
final time = raw elapsed time + wrong-tap penalties
```

The lowest accumulated final time wins ordinary timed matches.

### UX requirements

- penalty values must be visible before play
- wrong taps need immediate feedback
- final results must distinguish raw time and penalties when detail is useful
- rankings must be deterministic for tied or near-tied results
- online submissions must be validated before persistence

---

## Online Multiplayer

The multiplayer layer uses Supabase for:

- room creation
- room joining
- player presence
- round creation
- result persistence
- state recovery
- history
- leaderboards
- stale-room cleanup

A five-character room code is generated from an alphabet that excludes easily confused characters.

### Shared deterministic content

The room stores a round seed and target. Clients derive the same board locally.

Benefits include:

- less network payload
- consistent board state
- easier recovery
- repeatable debugging
- fair content comparison

The client algorithm becomes part of the multiplayer protocol. Changing it without versioning can break old rooms or comparisons.

---

## Same Challenge

Same Challenge is sequential.

A round progresses through players based on join order. Completed player IDs are derived from stored results.

The progression logic can repair state when:

- the room lacks a current player
- the current player already completed the round
- every player completed the round
- a refresh interrupted advancement

When all players finish:

- placements are written
- the next seeded round is created, or
- the room is marked finished

This repair logic is valuable because browser multiplayer inevitably encounters refreshes, tab closures, weak connections, and humans pressing Back at exactly the wrong time.

---

## Live Race

Live Race is simultaneous.

The server-visible room state includes a shared start timestamp. Clients count down to that value before accepting play.

### Strengths

- simple synchronization
- same board and target
- easy casual competition
- no dedicated game server required

### Limitations

- client clocks can differ
- network delays affect state arrival
- browser timers can be throttled
- determined users can manipulate clients
- anonymous identity is weak

The current design is appropriate for friendly play, not prize-bearing competition.

---

## Supabase Data Model

The core tables are:

### `online_rooms`

Stores:

- room code
- game type
- settings
- status
- current round
- current player
- shared start timestamp
- lifecycle timestamps

### `online_players`

Stores:

- room membership
- display name
- device identifier
- host status
- connection state
- accumulated totals

### `online_rounds`

Stores:

- room
- round number
- seed
- target number
- board size
- status
- start timestamp

### `online_results`

Stores:

- room and round
- player identity
- target
- raw time
- penalties
- final time
- wrong taps
- placement

### Database responsibilities

The database layer should enforce:

- valid room relationships
- one appropriate result per player and round
- expected status transitions
- acceptable score ranges
- room-level access boundaries
- cleanup of abandoned sessions

---

## Recovery and Cleanup

The product includes recovery for:

- last joined room
- refreshed lobby
- refreshed active turn
- stale current-player state
- incomplete round progression

Stale-room policies currently distinguish:

- idle lobbies
- active rooms
- finished rooms

Finished rooms remain available for history, while abandoned unfinished rooms are cleaned up or marked accordingly.

Recovery deserves browser coverage because it spans local storage, database state, and route behavior.

---

## Frontend Architecture

### Routes

Next.js App Router provides the game and content surfaces.

### Components

Major screens include:

- `StartScreen`
- `ReadyScreen`
- `GameScreen`
- `RoundSummary`
- `ResultScreen`

### Engine

Pure board-generation logic lives under `src/engine`.

### Hooks

Game orchestration lives in reusable hooks rather than the route.

### Libraries

`src/lib` contains:

- online room behavior
- Supabase configuration
- score validation
- persistence
- telemetry
- SEO constants
- presence preferences

### Types

Typed contracts reduce ambiguity across local and online state.

---

## Visual Design System

The current identity uses:

- soft pink, lavender, cyan, yellow, and green gradients
- purple primary actions
- bright rounded surfaces
- large friendly typography
- glass-like panels
- scattered rotated number tiles
- strong feedback rings

Core tokens include:

- background: `#fff7fd`
- foreground: `#182033`
- primary: `#7c3aed`
- secondary: `#fff1c7`
- accent: `#dff7ff`
- success: `#22c55e`
- warning: `#fbbf24`
- destructive: `#ef4444`

The design deliberately avoids a strict spreadsheet grid. Number tiles are positioned and rotated to preserve the paper-game scanning challenge.

---

## Accessibility

### Existing strengths

- keyboard-accessible number tiles
- visible focus styling
- ARIA live status updates
- reduced-motion media query
- text labels for states
- responsive tile sizing
- touch-friendly controls
- Comfort, Practice, and Zen alternatives
- mobile safe-area spacing

### Required review areas

- screen-reader announcements during phase changes
- focus movement between setup, ready, play, and results
- accessible names for all icon controls
- color contrast over gradients
- error recovery in online forms
- timer communication without excessive announcements
- vibration alternatives
- multiplayer status semantics

Automated accessibility tooling should supplement, not replace, keyboard and screen-reader testing.

---

## Performance

### Positive factors

- deterministic boards generated locally
- no heavy game-rendering engine
- static content routes
- limited visual assets
- route-level Next.js rendering
- small game-state model

### Risks

- large custom boards up to 225 tiles
- several real-time room subscriptions
- repeated history and leaderboard queries
- social-preview asset loading
- browser timer activity
- mobile layout work during animated feedback

### Recommendations

- profile 225-tile boards on low-end mobile devices
- virtualize only if measurement proves necessary
- reduce unnecessary room snapshot refetches
- debounce presence updates
- set performance budgets for route JavaScript
- inspect Supabase query plans as history grows
- compress and verify social images

---

## SEO and Discoverability

The repository centralizes SEO in `src/lib/seo.ts`.

Implemented structured content includes:

- canonical site URL
- title templates
- route descriptions
- keyword inventory
- Open Graph metadata
- Twitter card metadata
- WebSite schema
- VideoGame schema
- WebApplication schema
- HowTo schema
- rules, modes, tips, FAQ, and tutorial routes
- sitemap
- robots
- PWA manifest

The route inventory gives the product more discoverable surfaces than a single client-only game page.

### Important verification

The layout references a social-preview asset. Production deployment should confirm that the referenced file returns successfully and renders correctly on social crawlers.

---

## Testing and CI

The package scripts provide:

- lint
- typecheck
- build
- production dependency audit
- Playwright E2E
- combined verification

Playwright is configured for:

- desktop Chromium
- Pixel 7 mobile emulation
- retained traces on failure
- screenshots on failure
- local dev-server startup

The CI workflow runs:

1. checkout
2. Node setup
3. dependency installation
4. Chromium installation
5. lint
6. typecheck
7. build
8. smoke tests
9. production dependency audit

### Recommended unit tests

- custom-number parsing
- board-size clamping
- random board invariants
- seeded determinism
- required-number inclusion
- score calculation
- validation bounds
- room-code format
- round-target selection
- placement ordering

### Recommended browser tests

- solo complete flow
- same-device handoff
- custom setup
- wrong tap
- mute and vibration preferences
- Daily Challenge
- Time Attack
- Streak
- Practice
- Comfort
- Zen
- room create and join
- rejoin after refresh
- active-turn recovery
- Live Race countdown
- history and leaderboard

---

## Security and Trust Model

### Current model

The product favors low-friction anonymous play.

This means:

- room codes provide discoverability control, not strong authentication
- publishable Supabase credentials are browser-visible by design
- Row Level Security is essential
- device IDs are identifiers, not verified identities
- client timing is observable and modifiable
- submitted results require validation

### Threats

- fabricated score submissions
- joining guessed room codes
- room-state manipulation
- repeated spam submissions
- profile-name abuse
- excessive presence updates
- replayed requests
- database policy drift

### Recommendations

- validate score ranges server-side or in database functions
- rate-limit sensitive writes
- keep room settings immutable after play starts
- constrain result updates
- add authenticated competitive mode only if needed
- log suspicious timing and duplicate submissions
- test RLS policies independently from the UI

---

## Deployment

The configured production domain uses a Cloudflare-hosted URL.

Before release:

1. run `npm install`
2. run `npm run check`
3. run `npm run e2e`
4. run `npm run audit:prod`
5. apply Supabase schema and hardening migration
6. configure public Supabase environment variables
7. verify Realtime behavior
8. verify all game modes
9. verify metadata and social image
10. verify sitemap, robots, manifest, and icons
11. test desktop and mobile production URLs
12. capture real browser screenshots

A fresh production screenshot was not captured in this documentation pass because the execution environment could not resolve the deployed domain.

---

## Repository Statistics

The README includes live GitHub badges for:

- stars
- forks
- open issues
- latest commit activity

Product statistics should be grounded in measured values such as:

- available modes
- route count
- completed rooms
- active players
- rounds played
- median score
- Daily Challenge participation
- retention

No behavioral metric should be invented merely because a portfolio card has an empty space where a number would look impressive.

---

## Risk Register

| Risk | Severity | Mitigation |
|---|---:|---|
| Client-fabricated scores | High | server/database validation and rate limits |
| RLS policy drift | High | policy tests and migration review |
| Live Race clock differences | Medium/High | server timestamps and casual-play positioning |
| Board algorithm change breaks fairness | High | deterministic unit tests and versioning |
| Refresh interrupts room state | Medium | recovery and repair paths |
| Large board harms mobile performance | Medium | profiling and board-size budgets |
| Social preview missing in production | Medium | deployment verification |
| Anonymous room abuse | Medium | rate limits and moderation boundaries |
| Route quality becomes inconsistent | Medium | shared patterns and route QA |
| Thumbnail mistaken for screenshot | Low | explicit labeling |

---

## Roadmap

### Phase 1: Reliability

- expand unit coverage
- test deterministic board invariants
- test score validation
- test room recovery
- verify CI against lockfile installation

### Phase 2: Security

- strengthen result validation
- add policy-level tests
- add write rate limits
- audit anonymous update permissions
- make room settings immutable after start

### Phase 3: Multiplayer quality

- improve reconnect feedback
- clarify player connection state
- test high-player-count rooms
- improve race synchronization diagnostics
- add room-version compatibility

### Phase 4: Accessibility

- complete screen-reader pass
- improve phase announcements
- test all routes by keyboard
- audit contrast
- test Comfort and Zen with target users

### Phase 5: Performance

- profile large boards
- audit Supabase subscription frequency
- inspect bundle size
- set route budgets
- optimize history queries

### Phase 6: Portfolio presentation

- verify production deployment
- capture real desktop and mobile screenshots
- record a short gameplay walkthrough
- show Same Challenge and Live Race flows
- add measured product analytics only when real

---

## Portfolio Review Notes

This repository demonstrates:

- product expansion from a simple mechanic
- game-loop design
- state-machine thinking
- deterministic content generation
- multiplayer synchronization
- Supabase schema and policy work
- accessibility-aware interaction design
- mobile game UI
- SEO for a browser game
- Playwright and CI integration

A truthful portfolio summary would be:

> Designed and developed a browser-based number-hunting memory game with solo, same-device, seeded asynchronous, and live multiplayer modes; deterministic board generation; Supabase-backed rooms and history; accessible mobile interactions; route-level SEO; and desktop/mobile Playwright coverage.

Do not claim:

- cheat-proof competition
- authenticated identity when using anonymous rooms
- independently verified production uptime from this documentation pass
- user-growth metrics that were not measured
- cognitive or medical benefits without research

---

## AI Coding Agent Notes

Inspect in this order:

1. `AGENTS.md`
2. `README.md`
3. `package.json`
4. `src/app/page.tsx`
5. `src/hooks/useGameController.ts`
6. `src/engine/board.ts`
7. `src/lib/scoreValidation.ts`
8. `src/lib/onlineRooms.ts`
9. online types
10. Supabase schema and hardening migration
11. core screens
12. route inventory and SEO
13. Playwright configuration and tests
14. CI workflow

### Safe first changes

- add unit tests
- improve labels and focus handling
- verify social preview
- improve error messages
- add policy tests
- improve type boundaries
- profile board rendering

### Avoid

- weakening RLS to fix an application error
- replacing seeded generation with ordinary randomness
- trusting client-provided placements
- changing room transitions without recovery tests
- adding authentication without a product need
- presenting the repository thumbnail as a runtime screenshot

---

## Launch Checklist

### Product

- [ ] Solo flow works
- [ ] Same-device multiplayer works
- [ ] Same Challenge works
- [ ] Live Race works
- [ ] Daily Challenge works
- [ ] Time Attack works
- [ ] Streak works
- [ ] Practice works
- [ ] Comfort works
- [ ] Zen works

### Game engine

- [ ] Board sizes are valid
- [ ] Custom numbers remain unique
- [ ] Required values appear
- [ ] Seeded boards are deterministic
- [ ] Zig-zag ordering is stable
- [ ] Scores include penalties correctly

### Multiplayer

- [ ] Room creation works
- [ ] Invite links work
- [ ] QR joining works
- [ ] Rejoin works
- [ ] Active-turn recovery works
- [ ] Round advancement works
- [ ] Placements are correct
- [ ] Stale rooms are handled
- [ ] RLS policies are verified

### Accessibility

- [ ] Keyboard navigation works
- [ ] Focus is visible
- [ ] Status updates are announced
- [ ] Reduced motion works
- [ ] Feedback is not color-only
- [ ] Mobile touch targets are adequate

### Engineering

- [ ] `npm run check` succeeds
- [ ] `npm run e2e` succeeds
- [ ] `npm run audit:prod` succeeds
- [ ] CI succeeds
- [ ] Supabase migrations are applied
- [ ] Environment variables are configured

### SEO and deployment

- [ ] Production URL resolves
- [ ] Canonical URL is correct
- [ ] Metadata renders
- [ ] Social preview loads
- [ ] JSON-LD validates
- [ ] Sitemap loads
- [ ] Robots file loads
- [ ] Manifest and icons load
- [ ] Real desktop screenshot captured
- [ ] Real mobile screenshot captured

---

## Disclaimer

Blink & Find is a casual browser game. It should not be presented as a medical, diagnostic, therapeutic, or scientifically validated cognitive-training product without appropriate evidence. Anonymous online rooms and client-visible timing are designed for friendly competition, not cheat-proof tournaments. The repository thumbnail is a designed presentation asset based on the real interface and is not a browser screenshot. A fresh production screenshot and runtime verification were not completed in this pass because the execution environment could not resolve the deployment domain.
