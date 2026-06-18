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

Status: Next.

Planned:

- Shared countdown.
- Simultaneous same-board play.
- Client reaction-time submission.
- Round placement ranking.
- Latency-tolerant result handling.

## Priority 8: Production security hardening

Status: Not started.

Planned:

- Stricter Supabase RLS policies.
- Host-only start/advance checks.
- Player-only result writes.
- Basic abuse/rate-limit notes.

## Priority 9: Build and dependency hardening

Status: Not started.

Planned:

- Pin dependency versions.
- Generate/update lockfile.
- Verify `npm run typecheck`.
- Verify `npm run build`.
- Add GitHub Actions CI.
- Verify Cloudflare Pages production build.

## Priority 10: Mobile gameplay QA

Status: Not started.

Planned:

- Test small phones.
- Test large phones.
- Test tablets.
- Verify hard board density.
- Verify invite flow on mobile browsers.
- Verify tap targets and scroll/overflow behavior.
