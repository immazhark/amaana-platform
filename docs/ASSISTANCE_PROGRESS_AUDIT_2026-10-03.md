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

PR [#134](https://github.com/immazhark/amaana-platform/pull/134) merged asf72eca09957a63e9f7b922563484977b7f8bbb1c. Exact tested remote head3d9ac4705d643f93d914d4337d6a8045b8050783 matches local treeed649737de03c5d1b2ecf55a4e03564daf38f342. PR CI37054686962 SUCCESS:68 Chromium first-attempt pass in2.2minutes,392 unit checks pass (six database-dependent fast skips). Integration push37055303488 SUCCESS; exact-tree browser acceptance reused, duplicate browser/database skipped; production build/budgets/coverage/server smoke green.

Railway review deploymentd43c96f0-3698-46fb-94e9-64994a923bb4 SUCCESS on exact application merge SHA. Live desktop /request-assistance#request-form screenshot/DOM verifies all four progress labels14px,44px targets, opacity1, muted upcoming surfaces with real disabled attributes, active blue surface, forward action right-gap0 and no horizontal overflow. Local/seeded tests cover six widths and all four steps; live verification is desktop. JavaScript819031/819200 and CSS345202/348160, caps unchanged.

Task complete, ownership IDLE. Next: owner continues UI observations; subsequent confirmed defects use a separate atomic branch. Protected PR104/main release, canonical facts/copy, approved artwork, media/privacy/payment/indexing and fixed Companion preserved. No claim of a defect-free whole website. Documentation closure branch docs/assistance-progress-delivery-20261003.
