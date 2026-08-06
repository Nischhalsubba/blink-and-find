<!-- interactive-readme-standard:start -->

<div align="center">

# blink-and-find

**Branch-aware technical guide for [`agent/reduce-supabase-request-flood`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/reduce-supabase-request-flood)**

<p><img alt="branch: agent/reduce-supabase-request-flood" src="https://img.shields.io/static/v1?label=&message=branch%3A%20agent%2Freduce-supabase-request-flood&color=5965F2&style=flat-square"> <img alt="Next.js" src="https://img.shields.io/static/v1?label=&message=Next.js&color=24292F&style=flat-square"> <img alt="React" src="https://img.shields.io/static/v1?label=&message=React&color=24292F&style=flat-square"> <img alt="Tailwind CSS" src="https://img.shields.io/static/v1?label=&message=Tailwind%20CSS&color=24292F&style=flat-square"> <img alt="TypeScript" src="https://img.shields.io/static/v1?label=&message=TypeScript&color=24292F&style=flat-square"> <img alt="CSS" src="https://img.shields.io/static/v1?label=&message=CSS&color=24292F&style=flat-square"> <img alt="JavaScript" src="https://img.shields.io/static/v1?label=&message=JavaScript&color=24292F&style=flat-square"> <img alt="docs: branch-aware" src="https://img.shields.io/static/v1?label=&message=docs%3A%20branch-aware&color=8250DF&style=flat-square"></p>

<p>
  <a href="https://github.com/Nischhalsubba/blink-and-find/tree/agent/reduce-supabase-request-flood"><strong>Browse source</strong></a> ·
  <a href="https://github.com/Nischhalsubba/blink-and-find/issues"><strong>Issues</strong></a> ·
  <a href="https://github.com/Nischhalsubba/blink-and-find/codespaces/new?ref=agent%2Freduce-supabase-request-flood"><strong>Open in Codespaces</strong></a>
</p>

</div>

> [!IMPORTANT]
> This guide is generated from the files actually present on `agent/reduce-supabase-request-flood`. It links to detected source paths, preserves project-authored notes, and avoids claiming components that were not found.

## At a glance

| Item | Detected value |
|---|---|
| Purpose | A web or interface project documented from the files currently present on this branch. |
| Branch role | Compared with `main` |
| Stack | Next.js, React, Tailwind CSS, TypeScript, CSS, JavaScript, HTML |
| Manifests | package.json |
| Prerequisites | Node.js |
| Delivery | GitHub Actions |
| License | No license file detected |

## Branch scope

This branch differs from the default branch in the following detected paths:

- [`README.md`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/README.md)
- [`src/components/AppOnlinePresence.tsx`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/src/components/AppOnlinePresence.tsx)
- [`src/components/OnlineAvailablePlayers.tsx`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/src/components/OnlineAvailablePlayers.tsx)
- [`src/lib/onlinePresence.ts`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/src/lib/onlinePresence.ts)

## Quick start

```bash
npm install
npm run dev
npm run start
npm run build
npm run lint
```

### Configuration surface

- `.env.example`

> Never commit secrets, private keys, production credentials, customer data, or unredacted infrastructure details.

## Repository map

```mermaid
flowchart TD
    ROOT["blink-and-find / agent/reduce-supabase-request-flood"]
    ROOT --> P0[".github/"]
    ROOT --> P1["docs/"]
    ROOT --> P2["public/"]
    ROOT --> P3["src/"]
    ROOT --> P4["supabase/"]
    ROOT --> P5["tests/"]
    ROOT --> P6[".env.example"]
    ROOT --> P7[".node-version"]
    ROOT --> P8[".npmrc"]
    ROOT --> P9[".nvmrc"]
    ROOT --> P10["components.json"]
    ROOT --> P11["DEPLOYMENT.md"]
    ROOT --> P12["eslint.config.mjs"]
    ROOT --> P13["next-env.d.ts"]
    ROOT --> P14["next.config.ts"]
    ROOT --> P15["package.json"]
    ROOT --> P16["playwright.config.ts"]
    ROOT --> P17["postcss.config.mjs"]
    ROOT --> MORE["+ 1 more top-level entries"]
```

| Responsibility | Detected source paths |
|---|---|
| Interface | [`public`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/reduce-supabase-request-flood/public), [`src`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/reduce-supabase-request-flood/src) |
| Data | [`supabase`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/reduce-supabase-request-flood/supabase) |
| Quality | [`tests`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/reduce-supabase-request-flood/tests) |
| Documentation | [`docs`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/reduce-supabase-request-flood/docs) |
| Delivery | [`.github`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/reduce-supabase-request-flood/.github) |

## Website or application map

```mermaid
flowchart TD
    APP["blink-and-find"]
    APP --> R0["src/app"]
    APP --> R1["public"]
    R0 --> F0["src/app/layout.tsx"]
    R0 --> F1["src/app/error.tsx"]
    R0 --> F2["src/app/page.tsx"]
    R0 --> F3["src/app/opengraph-image.tsx"]
    R0 --> F4["src/app/daily/page.tsx"]
    R0 --> F5["src/app/stats/page.tsx"]
    R0 --> F6["src/app/telemetry/page.tsx"]
    R0 --> F7["src/app/rules/page.tsx"]
    R0 --> F8["src/app/challenge/page.tsx"]
    R0 --> F9["src/app/comfort/page.tsx"]
    R0 --> F10["src/app/time-attack/page.tsx"]
    R0 --> F11["src/app/streak/page.tsx"]
```

## Architecture and responsibility flow

```mermaid
flowchart LR
    USER["User / contributor"]
    USER --> A0["Interface: public, src"]
    A0 --> A1["Data: supabase"]
    A1 --> A2["Quality: tests"]
    A2 --> A3["Documentation: docs"]
    A3 --> A4["Delivery: .github"]
    A4 --> DELIVERY["Delivery: GitHub Actions"]
```

<details>
<summary><strong>Authentication and authorization flow</strong></summary>

```mermaid
flowchart LR
    USER["User"] --> SIGNIN["Sign-in or identity step"]
    SIGNIN --> VERIFY["Verify credentials / session"]
    VERIFY --> AUTHORIZE["Resolve permissions"]
    AUTHORIZE --> PROTECTED["Protected feature or data"]
    VERIFY -->|failure| RECOVER["Error or recovery path"]
```

Relevant detected files: [`src/lib/onlineSession.ts`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/src/lib/onlineSession.ts).

> The diagram expresses the responsibility sequence only. Confirm exact providers, token formats, roles, and recovery behavior in the linked source.

</details>
<details>
<summary><strong>Data flow and model surface</strong></summary>

```mermaid
flowchart LR
    INPUT["User or system input"] --> VALIDATE["Validate and normalize"]
    VALIDATE --> LOGIC["Application logic"]
    LOGIC --> STORE["Persistent or local storage"]
    STORE --> READ["Query / retrieval"]
    READ --> OUTPUT["UI, API, report, or export"]
```

Detected data areas: [`supabase`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/reduce-supabase-request-flood/supabase), [`src/lib/supabase.ts`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/src/lib/supabase.ts), [`supabase/presence_invites.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/supabase/presence_invites.sql), [`supabase/schema.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/supabase/schema.sql), [`supabase/deferred_invite_rooms.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/supabase/deferred_invite_rooms.sql), [`supabase/hardened_online_results.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/supabase/hardened_online_results.sql), [`supabase/app_event_logs.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/supabase/app_event_logs.sql), [`supabase/production_features.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/supabase/production_features.sql), [`supabase/priority8_hardening.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/supabase/priority8_hardening.sql).

</details>

## Quality, security, and operations

<table>
<tr>
<td width="33%" valign="top">

### Quality

- [`tests`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/reduce-supabase-request-flood/tests)

Detected commands:
- `npm run dev`
- `npm run start`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

</td>
<td width="33%" valign="top">

### Security

- No dedicated security policy or automated dependency configuration was detected.

Review authentication, authorization, input validation, dependency updates, secret handling, and failure recovery before release.

</td>
<td width="34%" valign="top">

### Observability

- [`src/lib/analytics.ts`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/src/lib/analytics.ts)
- [`src/lib/appLogger.ts`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/src/lib/appLogger.ts)
- [`src/app/telemetry/page.tsx`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/src/app/telemetry/page.tsx)
- [`src/components/TelemetryDashboard.tsx`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/src/components/TelemetryDashboard.tsx)
- [`src/components/AppTelemetry.tsx`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/src/components/AppTelemetry.tsx)

Define useful logs, metrics, traces, alerts, and rollback signals for production-facing branches.

</td>
</tr>
</table>

## Delivery flow

```mermaid
flowchart LR
    CHANGE["Change on agent/reduce-supabase-request-flood"] --> CHECK["Tests and quality checks"]
    CHECK --> REVIEW["Review architecture and documentation impact"]
    REVIEW --> BUILD["Build or package"]
    BUILD --> DEPLOY["Deploy or release"]
    DEPLOY --> VERIFY["Verify health and rollback readiness"]
```

### Automation detected

- [`.github/workflows/ci.yml`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/reduce-supabase-request-flood/.github/workflows/ci.yml)

## Contribution flow

```mermaid
flowchart LR
    FORK["Create branch"] --> CHANGE["Make focused change"]
    CHANGE --> TEST["Run relevant checks"]
    TEST --> DOCS["Update README and diagrams"]
    DOCS --> PR["Open pull request"]
    PR --> REVIEW["Review and iterate"]
    REVIEW --> MERGE["Merge when ready"]
```

- Keep changes focused and explain architectural consequences.
- Run the checks relevant to the changed area.
- Update diagrams whenever routes, modules, data models, authentication, jobs, or delivery paths change.
- Add screenshots or recordings for visual behavior changes when useful.
- Use issues for reproducible defects and pull requests for reviewable changes.

## Ownership and support

| Topic | Source |
|---|---|
| Repository | [`Nischhalsubba/blink-and-find`](https://github.com/Nischhalsubba/blink-and-find) |
| Branch | [`agent/reduce-supabase-request-flood`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/reduce-supabase-request-flood) |
| Ownership | No CODEOWNERS file detected |
| Contributing | Use the contribution flow above |
| Support | [Open or review issues](https://github.com/Nischhalsubba/blink-and-find/issues) |
| License | No license file detected |

<details>
<summary><strong>Documentation maintenance checklist</strong></summary>

- [ ] Purpose and branch scope are accurate.
- [ ] Setup and configuration commands still work.
- [ ] Repository, application, API, data, authentication, job, and deployment diagrams match the code.
- [ ] Tests, security controls, observability, and rollback behavior are documented.
- [ ] Links point to real files on this branch.
- [ ] No secrets or private operational details are exposed.

</details>

<!-- interactive-readme-standard:end -->

<!-- project-authored-notes:start -->
<details>
<summary><strong>Project-authored notes preserved from this branch</strong></summary>

# Blink & Find

Memorize. Hide. Hunt the scattered number.

Blink & Find is a free online number hunting memory game where players memorize a target number, find it inside a scattered board, and race friends in Same Challenge or Live Race mode.

## Current Features

- One-tap **Play Now** local game
- Friendly new-player microcopy across setup, ready, gameplay, summary, and results screens
- Dedicated `/rules` page explaining how the game works
- SEO metadata, sitemap, robots file, and structured data
- **Play with Friend** online entry with Create / Join pill choices
- Single-player and same-device multiplayer modes
- Online Same Challenge rooms with Supabase sync
- Online Live Race rooms with shared countdown
- Same-board simultaneous play for Live Race
- Live Race result placement after every player finishes
- Online invite links with auto-join support
- Native share invite flow where supported
- QR code invite for room joining
- Copy-link fallback for invite sharing
- Rejoin-last-room support after refresh
- Active-turn recovery after refresh
- Stale online room cleanup
- Central online history screen
- Recent finished games
- Online player leaderboard
- Room detail with round-by-round results
- Database guardrails for anonymous online play
- CI workflow for lint, typecheck, build, and audit
- Mobile-safe active gameplay layout
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

## How to Play

Open `/rules` for the player-facing guide.

Quick rules:

1. Memorize the target number during preview.
2. Find the matching number after it hides.
3. Wrong taps add penalty seconds.
4. Lowest total time wins.
5. Same Challenge gives each friend the same target and board in turn order.
6. Live Race lets friends race at the same time after a shared countdown.

## Online Play

### Same Challenge

Same Challenge is playable now.

Flow:

1. Player A opens the app.
2. Player A taps **Play with Friend**.
3. Player A chooses **Create** and taps **Create Game**.
4. Player A shares the invite link, shows the QR code, or gives Player B the room code.
5. Player B opens the invite link, scans the QR code, or joins with the room code.
6. Player A starts the game.
7. Each player takes a turn on their own device.
8. Every player gets the same board and target for that round.
9. Each new round reshuffles and repositions the board.
10. Results are saved centrally in Supabase.

If a player refreshes, the app saves the last room locally and can restore the room automatically or through **Rejoin Last Room**. If the active player refreshes mid-turn, the app offers **Restart Turn** on the same board and target instead of leaving the room stuck. Tiny mercy, since browsers do enjoy forgetting things at the worst possible time.

Unfinished stale rooms are marked `abandoned` automatically. Lobbies expire after 2 idle hours; active rooms expire after 6 idle hours. Finished rooms stay available on the central history screen.

### Live Race

Live Race is playable now.

Flow:

1. Player A taps **Play with Friend**.
2. Player A opens **Name and options**.
3. Player A selects **Live Race**.
4. Player A creates the room and invites Player B.
5. Player A starts the game after Player B joins.
6. Both players see the same countdown, same target, and same board.
7. When the countdown reaches zero, the target hides and both players race at the same time.
8. Correct taps submit results to Supabase.
9. The round closes when every player has submitted.
10. Results are ranked by final time.

Live Race uses a shared `round_start_at` timestamp for casual latency-tolerant timing. It is fair enough for friends, not yet armored against determined cheating. Stronger server/auth security can come after the no-login MVP.

### History

Open `/history` or tap **History** on the setup screen to see finished online rooms, winners, player leaderboard, and round-by-round room details.

## SEO

Implemented SEO basics:

- root metadata title and description
- Open Graph and Twitter cards
- JSON-LD for WebSite, VideoGame, WebApplication, and HowTo
- `/sitemap.xml`
- `/robots.txt`
- player-friendly `/rules` page
- PWA manifest description

See `docs/SEO.md` for the indexing and Google Search Console checklist. Search ranking is not guaranteed, because Google is a search engine, not a vending machine with vibes taped to it.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Radix UI primitives
- Supabase
- Cloudflare Pages

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

After that, run the production hardening migration:

```bash
supabase/priority8_hardening.sql
```

The SQL creates:

- `online_rooms`
- `online_players`
- `online_rounds`
- `online_results`

It also enables Realtime, Row Level Security policies for the MVP anonymous-room flow, the `abandon_stale_online_rooms` cleanup helper, and database guardrails for room/result integrity.

## Quality Checks

```bash
npm run check
npm run audit:prod
```

Generate the npm lockfile locally once:

```bash
npm install --package-lock-only
```

Then commit `package-lock.json` so future CI can switch to `npm ci`.

## Deployment Notes

This project is hosted on Cloudflare Pages.

Recommended Cloudflare Pages settings:

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: use the default Cloudflare Pages output for the selected Next.js preset

Add these Cloudflare Pages environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

If a deployment fails after dependency changes, retry the deployment after Cloudflare has installed the latest dependency graph. The machines are dramatic, but they do eventually read `package.json`.

## Product Notes

The board intentionally avoids strict rows and columns. For online play, board generation is deterministic per round, so players in the same room receive the same scattered layout. The next round uses a new seed, so the positions change without ruining multiplayer fairness. Chaos, but with paperwork.

</details>
<!-- project-authored-notes:end -->
