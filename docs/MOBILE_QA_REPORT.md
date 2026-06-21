# Mobile QA Report

This file tracks the remaining physical-device verification for Blink & Find. Automated Playwright coverage includes a mobile Chrome project, but physical iOS, Android, and in-app browsers still need human testing because apparently phones are tiny chaos rectangles with browser engines attached.

## Automated coverage

Run:

```bash
npm run e2e
```

The Playwright config runs desktop Chromium and mobile Chrome smoke coverage.

## Physical-device checklist

| Area | iOS Safari | Android Chrome | Messenger/In-app browser | Notes |
|---|---|---|---|---|
| Home page loads and scrolls correctly | Pending | Pending | Pending | Check no clipped footer/buttons. |
| Practice game starts and finishes | Pending | Pending | Pending | Check tap target size and vibration behavior. |
| Daily Challenge result share/copy | Pending | Pending | Pending | Clipboard fallback should show manual-copy text when blocked. |
| Challenge Link opens with seed/target | Pending | Pending | Pending | Test from copied URL. |
| Comfort Mode 5x5 board usability | Pending | Pending | Pending | Accessibility-focused mode. |
| Zen Mode skip/auto-advance | Pending | Pending | Pending | Timer cleanup should avoid double-advance. |
| Online private room join by invite | Pending | Pending | Pending | Two devices required. |
| Public lobby room visibility | Pending | Pending | Pending | Requires production migration. |
| Capacity-1 online room starts solo | Pending | Pending | Pending | Host should see Start Solo Online Game. |
| Host closes tab in lobby | Pending | Pending | Pending | New host should transfer after heartbeat timeout. |
| Live Race disconnected player timeout | Pending | Pending | Pending | Round should resolve after timeout. |
| Leaderboard local/global save | Pending | Pending | Pending | Global requires production migration. |
| Profile save/sync/reset | Pending | Pending | Pending | Sync requires production migration. |
| Telemetry dashboard | Pending | Pending | Pending | Confirm page view/error entries. |

## Sign-off rule

Do not call mobile QA complete until at least one iOS device, one Android device, and one in-app browser have passed the checklist. The code can prepare the net; only real phones can prove the circus animal jumps through it.
