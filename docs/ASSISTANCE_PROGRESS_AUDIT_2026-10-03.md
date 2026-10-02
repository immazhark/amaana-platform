# Assistance progress and action presentation — 3 October 2026

Base b8d75553b254705baabd42f4a0f80f57a406ddcc. Branch fix/public-controls-20261003. Scope: existing private assistance form presentation.

## Confirmed findings

- P2 Live progress labels were12.16px, metadata12.48px, sequence numerals10.88px; disabled opacity.48 made forthcoming steps unnecessarily difficult to read. Progress labels/metadata are now14px, numbers12px, using existing navy/gold/secondary tokens. Upcoming controls remain genuinely disabled, with a muted brand surface and full-opacity text. Current-step border/blue surface and keyboard outline remain distinct.
- P2 CSS Modules treated `.stepActions .v2-button` as two local classes, although the actual button uses the global v2-button. Desktop forward action consequently stayed left-aligned. Changed to a scoped global descendant and logical inline margin; mobile remains full-width, forward above Back. Existing global mobile rules had masked the width error, so no claim of previously broken mobile width is made.
- P3 Removed duplicated progress button size/weight declarations while preserving approved geometry, responsive two-column progress and four-step validation/submission logic.

## Verification

Production build/types/lint (three unchanged warnings),20 planner regressions, content/factual/editorial/global CSS and diff guards pass. CSS345202/348160 and JavaScript819031/819200; caps unchanged. Detector identifies only the unchanged3px privacy-note border; approved privacy emphasis preserved, no new finding.

All19 local Chromium browser tests pass in47seconds. Six widths320/390/768/1024/1440/1920 cover24 step/viewports, label readability/target size/full opacity, action right alignment and mobile width, real keyboard focus/activation, retained values, no horizontal overflow and WCAG A/AA axe checks. Existing seven private assistance journeys cover client/server validation, private evidence multipart transport and tracking credentials. Six existing full-page surface/artwork/WCAG checks also pass. No real request submitted.

Initial expanded default axe scan reported an existing nested-aside best-practice advisory, outside the established WCAG tags; new checks use the same WCAG A/AA scope as existing full-page tests. The first keyboard check raced the existing two-frame focus update; corrected to wait for actual step focus then traverse with Shift+Tab, no application behavior or focus requirement weakened.

Presentation-only form CSS now selects assistance-surface, transactional journeys, banner and typography suites plus public-performance. Form TSX/API/auth/unknown/global changes and release checkpoints remain full coverage.

## Delivery

Exact-head PR CI, integration merge/build, Railway review delivery and live verification pending. Main/production promotion remains protected. Canonical content, approved artwork, privacy/payment/indexing controls and fixed Companion untouched. This is a bounded form audit; no claim that the whole website is defect-free.
