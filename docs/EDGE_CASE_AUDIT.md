# Blink & Find Edge Case Audit

This audit maps the requested 1-20 edge-case areas to the code-level protections now in the app. It is not a replacement for two-device manual QA, because browsers, phones, and networks enjoy inventing new ways to disappoint everyone.

## Verification commands

Run before shipping:

```bash
npm install
npm run verify
```

`npm run verify` runs lint, typecheck, production build, and Playwright smoke tests.

## Highest-priority fixes

| Edge case | Status | Verification |
|---|---|---|
| One-player online room can start when capacity is 1 | Fixed in UI rules. `max_players = 1` requires only one player to start. | Playwright checks one-player capacity input; manual QA should create capacity-1 room and confirm Start Solo Online Game. |
| Host leaves or refreshes before/during game | Partially fixed. Session restore, stale cleanup, and manual back/rejoin are present; true host-transfer after close still needs a server-side action. | Manual two-tab test. |
| Same device opens multiple tabs | Guarded by device ID rejoin and unique result constraints. | Open same room twice on same browser profile. |
| Player disconnects mid-Live Race | Partially fixed. Snapshot refresh, stale cleanup, and focus/online refresh reduce stuck states; explicit race timeout is still a future server policy. | Manual network-throttle test. |
| Refresh during active online turn | Fixed at session/snapshot level; turn UI must be manually verified. | Refresh while active in Same Challenge and Live Race. |
| Public room fills while user joins | Fixed. Full rooms are filtered/disabled in public lobby and join validates capacity. | Create room, fill it, reload public lobby. |
| Missing production migration | Fixed with graceful fallbacks for public rooms, leaderboard, and profile sync. | Test with base schema only. |
| Clipboard/share blocked on mobile | Fixed with manual-copy status fallback. | Test in Messenger/in-app browser. |
| Impossible score submissions | Fixed client-side and with SQL constraints. | Submit invalid score in unit/manual DB test. |
| Corrupted localStorage | Mostly fixed by defensive reads across profile, analytics, errors, leaderboard, stats. | Manually corrupt keys and reload. |

## 1. Online Room Creation

| Case | Status |
|---|---|
| Capacity 1 room | Fixed. UI allows min 1, helper normalizes 1-8, SQL allows 1-8. |
| Capacity below 1 / negative | Fixed. Normalized to 1. |
| Capacity above 8 | Fixed. Normalized to 8. |
| Decimal capacity | Fixed. Floored. |
| Empty capacity | Fixed. Falls back before save/start. |
| Offline creation | Graceful error path exists; manual network test required. |
| Missing Supabase env | Handled by setup card. |
| Missing public/private migration | Graceful fallback message. |
| Room code collision | Existing retry loop. |
| Double click create | Busy flag disables repeated create in UI; manual verification required. |
| Invalid game type/settings | Mostly guarded by typed UI and clamping. |

## 2. Online Room Join

| Case | Status |
|---|---|
| Lowercase/spaced code | Fixed by trim/uppercase normalization. |
| Invalid code | Supabase error shown. |
| Abandoned room | Blocked. |
| Already-started room | Blocked for new players. |
| Full room | Fixed by capacity validation. |
| Same device rejoins | Existing player reused. |
| Old finished invite | Rejoins completed room/final state. |
| Public room becomes private/full before join | Join fails cleanly. |
| Network drops during join | Error displayed; retry is manual. |

## 3. Lobby

| Case | Status |
|---|---|
| Host alone, capacity 1 | Fixed. Start allowed. |
| Host alone, capacity > 1 | Intentional wait for friend. |
| Start clicked repeatedly | Busy flag blocks repeat. |
| Guest joining while host starts | Snapshot refresh reduces race; DB still accepts start. Manual QA needed. |
| Host removes guest | Fixed before start. |
| Host removes self | Blocked. |
| Non-host removes guest | Blocked. |
| Host refreshes | Session restore. |
| Guest refreshes | Session restore. |
| Public lobby full rooms | Filtered/disabled. |

## 4. Same Challenge

| Case | Status |
|---|---|
| Single-player online Same Challenge | Fixed when capacity is 1. |
| Duplicate result submission | Guarded by unique DB constraint/upsert. |
| Wrong player out of turn | UI prevents normal path; stronger DB policy is future hardening. |
| Missing seed/target | Round generation picks from seeded board. |
| Board mismatch | Server round seed/size is source of truth. |
| Player never plays | Stale cleanup handles abandoned room. |
| Next round double-click | Existing upsert limits duplicate round row. |

## 5. Live Race

| Case | Status |
|---|---|
| Single-player Live Race | Fixed when capacity is 1. |
| Slow internet/countdown drift | Uses shared start timestamp. |
| Late join after start | Blocked. |
| Refresh during countdown/race | Session/snapshot restore. Manual QA required. |
| Duplicate result | Existing-result check prevents double submit. |
| Impossible result | Client validation and SQL checks. |
| One player never finishes | Stale cleanup handles room eventually; explicit per-round timeout remains future work. |

## 6. Challenge Link

| Case | Status |
|---|---|
| Missing/invalid/negative seed | Sanitized. |
| Invalid board size | Sanitized to supported size. |
| Invalid target | Sanitized/fallback target. |
| Same seed opens same board | Deterministic board generation. |
| Manual URL edits | Smoke test covers bad params. |
| Clipboard blocked | Copy/share fallback improved. |

## 7. Daily Challenge

| Case | Status |
|---|---|
| Date changes | Daily key/seed isolates the day. |
| Same board link | Implemented through challenge URL. |
| Replay same daily | Best-score logic retained. |
| localStorage cleared/corrupt | Defensive storage reads. |
| Offline | Client-side route remains usable after load. |

## 8. Local Game

| Case | Status |
|---|---|
| Player count/rounds/penalty invalid | UI clamps common inputs. |
| Empty names | Fallback names. |
| Duplicate names | IDs remain unique. |
| Tap during preview/after complete | UI disables or phase-gates normal play. |
| Timer sleep | Timestamp-based scoring reduces drift. |
| Mobile overflow | Existing viewport/grid fixes. |

## 9. Comfort Mode

| Case | Status |
|---|---|
| Very small phone | Larger 5x5 board and scrollable shell. |
| Repeated wrong taps | Gentle penalty. |
| Leave page mid-timer | Timer cleanup present. |
| Screen-reader status | Status region present. |

## 10. Zen Mode

| Case | Status |
|---|---|
| Correct tap then Skip Board | Fixed by clearing pending advance timer. |
| Leave page before auto-advance | Fixed cleanup on unmount. |
| Change board size during pending advance | Fixed by clearing pending timer. |
| Wrong tap | No penalty, feedback only. |

## 11. Time Attack

| Case | Status |
|---|---|
| Timer reaches zero while tapping | UI/phase handles completion; manual boundary test still needed. |
| Tap after timeout | Should be ignored by phase. |
| Browser sleep | Timestamp ticking reduces drift. |
| Local best corrupted | Defensive localStorage patterns used. |
| Impossible global score | Leaderboard/score validation blocks extreme values. |

## 12. Streak Mode

| Case | Status |
|---|---|
| First tap wrong | Ends run. |
| Correct/wrong double taps | UI state limits duplicate board advancement. |
| Refresh cheating | Local client mode can reset; global leaderboard validation is separate. |
| Missing target | New board generation fallback. |

## 13. Stats / Achievements

| Case | Status |
|---|---|
| No data | Empty states. |
| Corrupt localStorage | Defensive reads. |
| Old schema | Ignored where invalid. |
| Huge history | UI limits recent rows. |
| NaN/negative values | Mostly defensive display; manual data corruption audit recommended. |

## 14. Leaderboard

| Case | Status |
|---|---|
| Missing profile | Auto-created. |
| Empty/long name | Fallback and UI max length. |
| Impossible score | Client and SQL validation. |
| Global table missing | Falls back to local leaderboard. |
| Local leaderboard full | Keeps top 50. |
| Ties | Sorts by score and wrong taps. |

## 15. Profile

| Case | Status |
|---|---|
| No profile | Auto-create. |
| Corrupt profile storage | Reset to default. |
| Empty name | Fallback to Player. |
| Sync table missing | Graceful migration-needed result. |
| Reset profile | New local identity created. |

## 16. Sharing / Clipboard

| Case | Status |
|---|---|
| Clipboard missing/denied | Manual copy fallback message. |
| Native share missing/fails | Falls back to copy/manual copy. |
| SVG download blocked | Error message. |
| Unsafe filename | Sanitized. |

## 17. Supabase / Database

| Case | Status |
|---|---|
| Base schema missing | Online setup message/error. |
| Production migration missing | Feature fallbacks. |
| Realtime disabled | Manual refresh remains. |
| RLS blocks write | User-facing error. |
| Stale room | Cleanup function. |
| Public room query too large | Limited to 8. |

## 18. Realtime / Network

| Case | Status |
|---|---|
| Offline mid-room | Focus/online refresh added. |
| Missed realtime event | Snapshot refetch on events/manual refresh. |
| Duplicate realtime events | Snapshot is source of truth. |
| Background tab returns | Focus/visibility refresh added. |

## 19. Mobile / UI

| Case | Status |
|---|---|
| Small screens | Dynamic viewport and scroll shells. |
| In-app browser clipboard | Manual copy fallback. |
| Long player names | UI wraps/truncates in key areas; manual QA needed. |
| Tables on mobile | Scrollable card shells. |

## 20. SEO / Routes

| Case | Status |
|---|---|
| Unknown route | Next.js 404. |
| Bad challenge params | Sanitized and smoke-tested. |
| Telemetry indexing | Noindex metadata. |
| Sitemap feature routes | Smoke-tested. |

## Remaining honest limitations

These are not fully solved by client-side code alone:

- True anti-cheat needs server-side signed actions or Supabase RPC functions with stricter RLS.
- Host transfer after a closed tab needs presence/heartbeat or server-side ownership reassignment.
- Live Race per-player timeout needs a server policy, not just stale-room cleanup.
- Full verification of two-device, offline, mobile in-app browser, and latency cases still requires manual device testing after deployment.
