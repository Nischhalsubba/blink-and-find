# Blink & Find Design System

## 1. Design principles

Blink & Find is a new-concept number-hunting game, so the design must teach the loop before it asks players to perform. The interface should feel welcoming, clear, and quick.

- Welcome first, explain second, challenge third.
- Keep the core loop visible: remember, find, improve.
- Make beginner-safe choices obvious.
- Preserve high contrast during gameplay.
- Use calm language for mistakes and recovery.

## 2. Audience and product feel

Primary audience:

- New players who do not yet know what a number-hunting game is.
- Casual players who want a fast round.
- Friends comparing scores online.
- Players who benefit from Comfort or Zen modes.

Product feel:

- Professional enough to trust.
- Friendly enough to try.
- Clear enough to understand in 10 seconds.
- Game-like without becoming noisy.

## 3. Typography

Recommended font stack:

- Display: Lexend, Inter, SF Pro Display, Segoe UI, system-ui, sans-serif.
- Body: Inter, SF Pro Text, Segoe UI, system-ui, sans-serif.
- Numbers: inherit body/display with tabular numeric behavior where useful.

Usage:

- Hero headings: Display, 700-900, tight tracking.
- Card titles: Display, 700-800.
- Body copy: Body, 400-500, line-height 1.55-1.7.
- Buttons and badges: Body, 700, short labels.
- Game numbers: 800-900, large enough to scan quickly.

## 4. Color system

Core palette:

| Token | Hex | Use |
|---|---:|---|
| Background | #fff7ed | App background |
| Surface | #fffaf3 | Cards and panels |
| Text | #1f2937 | Main readable text |
| Muted text | #64748b | Helper copy |
| Primary | #2f5bea | Main actions and focus |
| Primary foreground | #ffffff | Text on primary |
| Secondary | #f5e8d2 | Soft controls |
| Border | #e7d7bd | Structure and section rules |
| Accent mint | #dff7ee | Calm/comfort states |
| Success | #15803d | Correct feedback |
| Warning | #c66a00 | Timed pressure/info |
| Error | #dc2626 | Wrong taps and failures |

Rules:

- Never use color alone for meaning.
- Keep gameplay target and tile contrast stronger than decorative cards.
- Use warm backgrounds for onboarding and blue for primary progress.
- Red only appears on actual errors or wrong taps.

## 5. Spacing and layout

Base rhythm:

- 4px micro step.
- 8px compact gap.
- 12px form/card inner gap.
- 16px mobile card padding.
- 24px desktop card padding.
- 32px section-to-section space.

Section rule spacing:

- Header with divider: 24-32px bottom padding before the line.
- Content after divider: 32px top padding on desktop, 24px on mobile.
- Do not add padding to inner `ul` or item grids just to fake section spacing. The container owns the spacing.

## 6. Components

### Primary button

Use for the next best action: Play now, Start, Continue, Save score.

States:

- Default: primary fill.
- Hover: slightly stronger fill.
- Focus: visible blue ring.
- Disabled: muted opacity, no hover lift.

### Secondary button

Use for alternate routes: Learn, Customize, Modes, Tips.

### GameModeCard

Use for mode navigation.

Required content:

- Eyebrow: category label.
- Title: mode name.
- Description: one-sentence value.
- CTA label: action-oriented.

### Info cards

Use for rules, tips, FAQ, and onboarding.

- Rounded 24px+.
- Soft white surface.
- Clear title and one paragraph.
- No dense paragraph walls.

### Game HUD

Use compact but readable controls.

- Current objective always visible.
- Round/player grouped together.
- Timer and target appear as strong visual anchors.
- Wrong tap feedback is brief and recoverable.

## 7. Page patterns

### Welcome page

Order:

1. Hero explanation.
2. Play Now.
3. Beginner route.
4. Three-step loop.
5. Mode grid.
6. Progress/social links.

### Learning pages

Order:

1. Page title.
2. Divider line.
3. Content grid with enough top padding.
4. Footer actions.

### Gameplay page

Order:

1. Objective and controls.
2. Target/timer.
3. Board.
4. Status feedback.

### Results page

Order:

1. Winner.
2. Key stats.
3. Save/share.
4. Ranking/history.
5. Play again.

## 8. Accessibility

- Minimum tap target: 44px.
- Visible focus ring on every control.
- Avoid tiny gray text for instructions.
- Use semantic headings in order.
- Use `aria-live` for game feedback.
- Respect reduced motion.
- Keep number tiles readable on mobile.

## 9. Anti-patterns

Avoid:

- Dense setup screens before explaining the game.
- Too many equal-weight CTAs.
- Dark-only UI that makes the app feel intimidating.
- Decorative gradients that reduce text contrast.
- Padding on lists to fix spacing between a divider and the content below it.
- Hiding beginner modes behind advanced labels.
- Sarcastic copy in critical error messages.
