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

Status: Next.

Planned:

- Save current room id/code in localStorage.
- Restore current room after refresh.
- Show **Rejoin last room**.
- Preserve local player identity through device id.
- Handle abandoned rooms cleanly.

## Priority 5: Online room cleanup

Status: Not started.

Planned:

- Mark old rooms as abandoned.
- Add cleanup SQL or scheduled cleanup instructions.
- Avoid central database clutter from half-created rooms.

## Priority 6: Central history screen

Status: Not started.

Planned:

- Recent online games.
- Room result history.
- Best online scores.
- Player history by device/name.

## Priority 7: Live Race gameplay

Status: Foundation only.

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
