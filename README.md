<!-- interactive-readme-standard:start -->

<div align="center">

# blink-and-find

**Branch-aware technical guide for [`agent/fix-pr5-ci`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/fix-pr5-ci)**

<p><img alt="branch: agent/fix-pr5-ci" src="https://img.shields.io/static/v1?label=&message=branch%3A%20agent%2Ffix-pr5-ci&color=5965F2&style=flat-square"> <img alt="Next.js" src="https://img.shields.io/static/v1?label=&message=Next.js&color=24292F&style=flat-square"> <img alt="React" src="https://img.shields.io/static/v1?label=&message=React&color=24292F&style=flat-square"> <img alt="Tailwind CSS" src="https://img.shields.io/static/v1?label=&message=Tailwind%20CSS&color=24292F&style=flat-square"> <img alt="TypeScript" src="https://img.shields.io/static/v1?label=&message=TypeScript&color=24292F&style=flat-square"> <img alt="CSS" src="https://img.shields.io/static/v1?label=&message=CSS&color=24292F&style=flat-square"> <img alt="JavaScript" src="https://img.shields.io/static/v1?label=&message=JavaScript&color=24292F&style=flat-square"> <img alt="docs: branch-aware" src="https://img.shields.io/static/v1?label=&message=docs%3A%20branch-aware&color=8250DF&style=flat-square"></p>

<p>
  <a href="https://github.com/Nischhalsubba/blink-and-find/tree/agent/fix-pr5-ci"><strong>Browse source</strong></a> ·
  <a href="https://github.com/Nischhalsubba/blink-and-find/issues"><strong>Issues</strong></a> ·
  <a href="https://github.com/Nischhalsubba/blink-and-find/codespaces/new?ref=agent%2Ffix-pr5-ci"><strong>Open in Codespaces</strong></a>
</p>

</div>

> [!IMPORTANT]
> This guide is generated from the files actually present on `agent/fix-pr5-ci`. It links to detected source paths, preserves project-authored notes, and avoids claiming components that were not found.

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

- [`README.md`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/README.md)

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
    ROOT["blink-and-find / agent/fix-pr5-ci"]
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
    ROOT --> P10["AGENTS.md"]
    ROOT --> P11["components.json"]
    ROOT --> P12["DEPLOYMENT.md"]
    ROOT --> P13["eslint.config.mjs"]
    ROOT --> P14["next-env.d.ts"]
    ROOT --> P15["next.config.ts"]
    ROOT --> P16["package.json"]
    ROOT --> P17["playwright.config.ts"]
    ROOT --> MORE["+ 2 more top-level entries"]
```

| Responsibility | Detected source paths |
|---|---|
| Interface | [`public`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/fix-pr5-ci/public), [`src`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/fix-pr5-ci/src) |
| Data | [`supabase`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/fix-pr5-ci/supabase) |
| Quality | [`tests`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/fix-pr5-ci/tests) |
| Documentation | [`docs`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/fix-pr5-ci/docs) |
| Delivery | [`.github`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/fix-pr5-ci/.github) |

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

Relevant detected files: [`src/lib/onlineSession.ts`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/src/lib/onlineSession.ts), [`supabase/migrations/20260716025133_restore_host_managed_ai_authorization.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/supabase/migrations/20260716025133_restore_host_managed_ai_authorization.sql).

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

Detected data areas: [`supabase`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/fix-pr5-ci/supabase), [`src/lib/supabase.ts`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/src/lib/supabase.ts), [`supabase/presence_invites.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/supabase/presence_invites.sql), [`supabase/schema.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/supabase/schema.sql), [`supabase/deferred_invite_rooms.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/supabase/deferred_invite_rooms.sql), [`supabase/hardened_online_results.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/supabase/hardened_online_results.sql), [`supabase/app_event_logs.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/supabase/app_event_logs.sql), [`supabase/guest_multiplayer_abuse_guards.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/supabase/guest_multiplayer_abuse_guards.sql), [`supabase/production_features.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/supabase/production_features.sql), [`supabase/priority8_hardening.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/supabase/priority8_hardening.sql), [`supabase/migrations/20260716025133_restore_host_managed_ai_authorization.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/supabase/migrations/20260716025133_restore_host_managed_ai_authorization.sql), [`supabase/migrations/20260716024947_database_housekeeping_and_policy_fix.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/supabase/migrations/20260716024947_database_housekeeping_and_policy_fix.sql).

</details>
<details>
<summary><strong>Background jobs and scheduled work</strong></summary>

```mermaid
flowchart LR
    EVENT["Event / schedule"] --> QUEUE["Queue or job definition"]
    QUEUE --> WORKER["Worker / processor"]
    WORKER --> RESULT["Persist result or emit side effect"]
    WORKER -->|failure| RETRY["Retry, alert, or dead-letter path"]
```

Relevant detected files: [`supabase/migrations/20260729093000_enable_safe_multiplayer_cleanup_cron.sql`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/supabase/migrations/20260729093000_enable_safe_multiplayer_cleanup_cron.sql).

</details>

## Quality, security, and operations

<table>
<tr>
<td width="33%" valign="top">

### Quality

- [`tests`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/fix-pr5-ci/tests)

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

- [`src/lib/analytics.ts`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/src/lib/analytics.ts)
- [`src/lib/appLogger.ts`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/src/lib/appLogger.ts)
- [`src/app/telemetry/page.tsx`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/src/app/telemetry/page.tsx)
- [`src/components/TelemetryDashboard.tsx`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/src/components/TelemetryDashboard.tsx)
- [`src/components/AppTelemetry.tsx`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/src/components/AppTelemetry.tsx)

Define useful logs, metrics, traces, alerts, and rollback signals for production-facing branches.

</td>
</tr>
</table>

## Delivery flow

```mermaid
flowchart LR
    CHANGE["Change on agent/fix-pr5-ci"] --> CHECK["Tests and quality checks"]
    CHECK --> REVIEW["Review architecture and documentation impact"]
    REVIEW --> BUILD["Build or package"]
    BUILD --> DEPLOY["Deploy or release"]
    DEPLOY --> VERIFY["Verify health and rollback readiness"]
```

### Automation detected

- [`.github/workflows/ci.yml`](https://github.com/Nischhalsubba/blink-and-find/blob/agent/fix-pr5-ci/.github/workflows/ci.yml)

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
| Branch | [`agent/fix-pr5-ci`](https://github.com/Nischhalsubba/blink-and-find/tree/agent/fix-pr5-ci) |
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

<div align="center">

<img src="./docs/assets/blink-and-find-thumbnail.svg" width="100%" alt="Blink and Find branded repository thumbnail" />

# Blink & Find

### Memorize a number, hunt it across a scattered board, and race yourself or your friends

A free browser-based number-hunting memory game with solo play, same-device multiplayer, seeded online challenges, live races, daily modes, accessibility controls, persistent stats, and Supabase-backed room history.

[Play online](https://blink-and-find.hinischalsubba.workers.dev/) · [Engineering case study](./docs/PRODUCT_AND_ENGINEERING_CASE_STUDY.md) · [Repository instructions](./AGENTS.md)

![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=111111)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Playwright](https://img.shields.io/badge/E2E-Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white)

![Stars](https://img.shields.io/github/stars/Nischhalsubba/blink-and-find?style=flat-square)
![Forks](https://img.shields.io/github/forks/Nischhalsubba/blink-and-find?style=flat-square)
![Issues](https://img.shields.io/github/issues/Nischhalsubba/blink-and-find?style=flat-square)
![Last commit](https://img.shields.io/github/last-commit/Nischhalsubba/blink-and-find?style=flat-square)

</div>

## Product concept

Blink & Find turns a simple paper-style number hunt into a flexible browser game. A target number appears briefly, then hides. The player scans a scattered board, taps the match, and is scored by speed plus wrong-tap penalties.

The game supports both relaxed personal practice and competitive multiplayer without requiring an account for the core experience.

## Game modes

| Mode | Experience |
|---|---|
| Solo | Local timed rounds with saved settings and best scores |
| Same-device multiplayer | Players take turns on one device |
| Same Challenge | Friends receive the same seeded board and target in turn order |
| Live Race | Multiple players race simultaneously after a shared countdown |
| Daily Challenge | Shared daily board for comparable scores |
| Time Attack | Find as many targets as possible before time expires |
| Streak | Continue until one wrong tap ends the run |
| Practice | Play without score pressure |
| Comfort | Larger tiles, smaller boards, and gentler timing |
| Zen | Endless calm play without timer pressure |

Additional routes include tutorial, rules, tips, FAQ, profiles, statistics, leaderboard, online history, and shared challenge links.

## Core game loop

1. Configure board size, rounds, preview time, penalty, and optional required numbers.
2. Memorize the target during the preview phase.
3. Scan the scattered board after the target hides.
4. Tap the matching number.
5. Apply wrong-tap penalties when needed.
6. Save the turn result and advance the round or player.
7. Rank players by final accumulated time.

## Online play

### Same Challenge

Each player receives the same deterministic board and target for a round. Players complete turns in sequence, and room state advances through Supabase.

### Live Race

All players receive the same board, target, and `round_start_at` timestamp. The shared countdown is appropriate for casual friend competition, but it is not a cheat-resistant esports timing system. Humans do love turning every timer into an Olympic committee eventually.

### Recovery and history

The online layer includes:

- invite links and room codes
- QR-code sharing
- rejoin-last-room support
- active-turn recovery
- stale-room abandonment
- completed-room history
- round-level result storage
- player leaderboards

## Board generation

The engine supports:

- random boards
- custom required numbers
- deterministic seeded boards
- deterministic custom boards
- zig-zag ordering
- seeded zig-zag boards for multiplayer fairness

Online players derive the same layout from the same round seed instead of synchronizing every tile over the network.

## Architecture

```text
src/
├── app/                  routes, metadata, layouts, modes, rules, stats, history
├── components/           setup, ready, gameplay, summaries, results, shared UI
├── engine/               board and game-generation logic
├── hooks/                game controller and reusable browser behavior
├── lib/                  Supabase rooms, SEO, telemetry, validation, persistence
├── types/                local and online game contracts
└── utils/                deterministic and random shuffle helpers

supabase/
├── schema.sql
└── priority8_hardening.sql

tests/                    Playwright desktop and mobile smoke coverage
```

The root route is intentionally thin. It reads the game controller and chooses the correct screen for setup, ready, active play, round summary, or finished results.

## Data and trust model

Online rooms use four primary tables:

- `online_rooms`
- `online_players`
- `online_rounds`
- `online_results`

The project includes Realtime, Row Level Security policies for anonymous-room play, stale-room cleanup, and score-validation guardrails.

Anonymous multiplayer is convenient, but it should not be described as fully tamper-proof. Client-visible timing and identity always deserve suspicion, much like online polls and family WhatsApp statistics.

## Accessibility and mobile support

Implemented considerations include:

- keyboard navigation for number tiles
- visible focus styles
- ARIA live status updates
- text-based warning and status feedback
- reduced-motion support
- mobile-safe active gameplay layout
- comfort and practice modes
- responsive board-density rules
- safe-area-aware page spacing

## SEO and discoverability

The application includes:

- canonical production URL
- root and route-specific metadata
- Open Graph and Twitter cards
- structured data for WebSite, VideoGame, WebApplication, and HowTo
- sitemap and robots files
- PWA manifest and icon
- dedicated rules, tips, FAQ, and modes pages

Production URL:

```text
https://blink-and-find.hinischalsubba.workers.dev
```

## Run locally

Requirements:

- Node.js 20.9 or newer
- npm 10 or newer
- Supabase credentials for online features

```bash
npm install
cp .env.example .env.local
npm run dev
```

Environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Apply:

```text
supabase/schema.sql
supabase/priority8_hardening.sql
```

## Verification

```bash
npm run check
npm run e2e
npm run audit:prod
```

`npm run verify` runs the main quality checks and browser tests.

CI currently performs:

- lint
- TypeScript validation
- production build
- Playwright smoke tests
- production dependency audit

Playwright targets desktop Chromium and a Pixel 7 mobile profile.

## Current status

| Area | Status |
|---|---|
| Local solo play | Implemented |
| Same-device multiplayer | Implemented |
| Same Challenge | Implemented |
| Live Race | Implemented |
| Daily, Time Attack, Streak, Practice, Comfort, and Zen modes | Implemented |
| Supabase room history and leaderboard | Implemented |
| Deterministic online boards | Implemented |
| Desktop and mobile Playwright projects | Configured |
| CI quality workflow | Implemented |
| Production deployment | Documented in source metadata |
| Fresh browser screenshot in this documentation pass | Not captured |

The current execution environment could not resolve the deployed domain or GitHub through ordinary DNS, so no fresh runtime screenshot was fabricated. The repository thumbnail is a designed presentation asset based on the real game interface.

## Known risks

- Anonymous rooms are not equivalent to strong authenticated sessions.
- Live Race timing is casual and latency-tolerant rather than cheat-resistant.
- Client-visible scores still require server-side validation discipline.
- Supabase policies must stay aligned with schema changes.
- Multiplayer recovery logic is more complex than local game flow.
- Social-preview metadata references should be verified during deployment.
- Dependency updates can affect Cloudflare and Next.js compatibility.

## Recommended next work

1. Add stronger server-authoritative validation for competitive results.
2. Add authenticated profiles only if the product truly needs them.
3. Expand unit coverage for board generation and score validation.
4. Add visual regression screenshots for core routes.
5. Verify the deployed social-preview asset.
6. Capture real desktop and mobile production screenshots.
7. Add performance budgets for large custom boards.

## Documentation

- [Product and engineering case study](./docs/PRODUCT_AND_ENGINEERING_CASE_STUDY.md)
- [Repository instructions](./AGENTS.md)
- [Branded repository thumbnail](./docs/assets/blink-and-find-thumbnail.svg)
- [SEO notes](./docs/SEO.md)

## Author

Designed and developed by [Nischhal Subba](https://nischhalsubba.com.np/).

</details>
<!-- project-authored-notes:end -->
