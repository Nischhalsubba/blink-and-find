# Mobile QA

Priority 10 focuses on mobile playability, because phone browsers love inventing new ways to make a square board behave like soup.

## Completed Mobile Fixes

- Active game header now uses a compact mobile layout.
- `Back to Setup` becomes `Back` on small screens.
- Sound and Auto buttons are shorter on mobile.
- Wrong/penalty badges use smaller sizing on mobile.
- Target and timer cards are shorter on mobile.
- Board card receives more vertical room.
- Global app shell uses dynamic viewport units (`dvh`, `dvw`).
- Safe-area padding is respected for browser UI and device cutouts.
- Number grid is capped to available width and height.
- Mobile tile font size is raised slightly for readability.

## Primary Device Classes

Test these sizes manually after deployment:

| Device class | What to verify |
|---|---|
| Small phone | Header does not overflow, tiles remain tappable |
| Large phone | Board uses available space without awkward gaps |
| Tablet | Board remains centered and not tiny |
| Messenger / in-app browser | No horizontal overflow from top controls |
| Landscape phone | No overlap disaster, even if less comfortable |

## Manual QA Checklist

### Setup screen

1. Open `/` on mobile.
2. Confirm **Play Now** is visible without scrolling.
3. Confirm **Play with Friend** is visible.
4. Open **Change settings**.
5. Confirm pill choices wrap cleanly.
6. Confirm inputs are tappable.
7. Tap **View History** and confirm `/history` loads.

### Active game screen

1. Start a local game on Easy.
2. Confirm header does not overflow horizontally.
3. Confirm Sound, Auto, and Back controls fit.
4. Confirm Target and Timer row is compact.
5. Confirm board area is the largest part of the screen.
6. Confirm bottom status bar is visible.
7. Tap several tiles and confirm feedback is visible.
8. Confirm wrong feedback does not push layout around.
9. Finish a round and confirm summary state is usable.

### Board density

1. Test Easy board.
2. Confirm numbers are very readable.
3. Test Normal board.
4. Confirm randomness feels scattered, not strict columns.
5. Test Hard board.
6. Confirm tiles are dense but still tappable.
7. Confirm no tile is clipped by the board edge.

### Online mobile flow

1. Open `/online` on phone.
2. Create a room.
3. Confirm invite panel fits.
4. Confirm QR code is visible.
5. Confirm Copy Link works.
6. Join from another phone.
7. Start Same Challenge.
8. Finish a round.
9. Start Live Race.
10. Confirm countdown and board fit.
11. Open `/history` and confirm tables are scrollable/usable.

## Known Mobile Limits

- Hard board is intentionally dense.
- In-app browsers can reduce viewport height unpredictably.
- Landscape phone support is functional, not luxurious.

Tiny rectangles were never meant to host competitive number hunting, but here we are, defying nature with CSS.
