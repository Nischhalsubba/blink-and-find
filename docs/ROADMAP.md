# Blink & Find Roadmap

This roadmap tracks the current priority plan after the online Same Challenge MVP.

## Priority 1: Two-device Same Challenge QA

Status: Complete.

Confirmed:

- Supabase schema is running.
- Online Create / Join flow works.
- Two-device Same Challenge works.
- Results save to Supabase.
- Final room status is now explicitly marked as `finished`.
- Board layout changes between rounds while staying fair for players in the same round.

Reference checklist: `docs/ONLINE_SAME_CHALLENGE_QA.md`.

## Priority 2: Documentation cleanup

Status: Complete.

Updated:

- `README.md`
- `DEPLOYMENT.md`
- `docs/ONLINE_SAME_CHALLENGE_QA.md`
- `docs/ROADMAP.md`
- Cloudflare Pages deployment notes

## Priority 3: Invite UX polish

Status: Complete.

Completed:

- Native Share button when supported.
- QR code for room invite.
- Copy-link fallback for unsupported browsers.
- Clearer host lobby instructions.
- Better guest join messaging.
- Room code remains visible for manual join.

## Priority 4: Reconnect and refresh handling

Status: Complete.

Completed:

- Save current online room in localStorage.
- Restore room after browser refresh.
- Show **Rejoin Last Room** when a saved room exists.
- Preserve local player identity through device id.
- Keep realtime subscriptions alive after reconnect.
- Block brand-new players from joining a game that already started.
- Handle abandoned rooms by clearing the saved session.
- Recover active player turns after refresh with a **Restart Turn** flow.

## Priority 5: Online room cleanup

Status: Complete.

Completed:

- App-side cleanup marks stale unfinished rooms as `abandoned`.
- Lobby rooms are abandoned after 2 idle hours.
- Ready, playing, and round-summary rooms are abandoned after 6 idle hours.
- Finished rooms are retained for future central history.
- Rejoin flow clears saved sessions for abandoned rooms.
- `supabase/schema.sql` includes cleanup index and `abandon_stale_online_rooms` SQL helper.
- `docs/ONLINE_ROOM_CLEANUP.md` documents policy, verification queries, and QA.
- `docs/QA_AUDIT.md` tracks completed-priority QA and end-to-end checks.

## Priority 6: Central history screen

Status: Complete.

Completed:

- `/history` central online history route.
- Recent finished games table.
- Room winner summary.
- Player leaderboard grouped by browser/device and player name.
- **You** badge for the current browser/device.
- Room detail panel with standings.
- Round-by-round result history.
- Empty, loading, and error states.
- Setup screen **View History** link.
- `docs/ONLINE_HISTORY.md` documents the screen and QA.

## Priority 7: Live Race gameplay

Status: Complete.

Completed:

- Shared `round_start_at` countdown.
- Simultaneous same-board and same-target play.
- Target preview during countdown.
- Target hides when the shared race starts.
- Client reaction-time submission based on the shared start timestamp.
- Wrong-tap penalties in Live Race.
- Result-submitted waiting state.
- Round placement ranking after every player finishes.
- Host-controlled next round flow.
- Final results and central history support.
- `docs/ONLINE_LIVE_RACE.md` documents gameplay, fairness rules, and QA.

## Priority 8: Production security hardening

Status: Complete for the anonymous MVP.

Completed:

- Added `supabase/priority8_hardening.sql` migration.
- Added database sanity checks for rooms, players, rounds, and results.
- Added room transition protection trigger.
- Added result validation trigger.
- Tightened insert policies for rooms, players, rounds, and results.
- Documented no-auth security limits and next-step server/auth options.
- Added `docs/PRODUCTION_SECURITY.md`.

Note: true player-proof authorization still requires auth, signed tokens, or server-side Cloudflare endpoints. The current hardening protects data integrity for the no-login MVP.

## Priority 9: Build and dependency hardening

Status: Complete, with one local lockfile follow-up.

Completed:

- Removed `latest` dependency versions.
- Added explicit package versions.
- Added Node engine metadata.
- Added `packageManager` metadata.
- Added `.nvmrc` and `.node-version`.
- Added `.npmrc` exact-save defaults.
- Added ESLint flat config.
- Added `npm run check`.
- Added production dependency audit script.
- Added GitHub Actions CI.
- Added `docs/BUILD_HARDENING.md`.

Follow-up:

- Generate and commit `package-lock.json` locally with `npm install --package-lock-only`. The GitHub connector cannot safely generate a real npm lockfile without running npm against the registry.

## Priority 10: Mobile gameplay QA

Status: Complete at code and checklist level; physical-device QA still needs deployment testing.

Completed:

- Fixed active-game mobile header overflow.
- Shortened quit action on mobile.
- Compacted target and timer cards on mobile.
- Hardened viewport sizing with `dvh` and `dvw`.
- Added safe-area padding.
- Bounded number grid to available viewport space.
- Improved mobile tile readability.
- Added `docs/MOBILE_QA.md`.
- Updated `docs/QA_AUDIT.md` with mobile QA coverage.

Follow-up:

- Test on small phone, large phone, tablet, and in-app browsers after Cloudflare deploy.
