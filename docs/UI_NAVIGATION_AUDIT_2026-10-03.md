# Shared navigation resilience audit — 2026-10-03

Scope: shared public header; retain approved visual design, content, header banners and fixed Companion.

## Confirmed defects

- Mobile navigation remains active through 1020px, but the old dismissing backdrop disappears above 760px. Reproduced at 900×600.
- Opening navigation does not contain background-page scrolling.
- Resizing an open menu to desktop hides it visually without clearing its state (`aria-expanded=true`); returning to mobile unexpectedly reopens it.
- Short-screen menu height uses a stale fixed offset rather than the shared chrome-height token.

## Correction

Scoped header CSS aligns backdrop and menu breakpoints, uses viewport/chrome tokens, and contains page scrolling only while mobile navigation is open. Closing, route changes and desktop resizing release containment. Desktop resizing clears menu state and focuses the visible home link. Focus trapping reuses immutable menu links instead of querying/filtering them on every keypress. Dismissal restores the existing toggle's focus synchronously; no delayed frame is required because the toggle remains mounted.

## Verification

Eleven new checks cover 320/390/768/900/1020px at 320/1000px height, visible dismissal, 44px link targets, reachable final CTA, keyboard wrapping/Escape, header WCAG A/AA checks, desktop resize/reset, route navigation and no horizontal overflow. All 11 pass locally on the final optimized implementation. A final 900×600 screenshot/DOM confirms backdrop display:block, body overflow:hidden and menu bottom599px within600px viewport.

CI selection includes navigation resilience, shared chrome/footer, typography, banner standardization and public performance. Unknown paths, authentication, architectural/global changes and production/manual releases retain full acceptance. Planner regression verifies that boundary. No budget increases, content invention, permission/payment/database changes or production promotion.

## Delivery

Production build passes with JavaScript819175/819200 and CSS345824/348160 bytes; caps unchanged. Type/lint and392 unit checks pass (six database-dependent skips), plus21 CI-planner regression checks. Three existing lint warnings unchanged; detector emits no findings.

PR [#136](https://github.com/immazhark/amaana-platform/pull/136) head `52fa5a362270cf2a52f9408cdbfa65b48e9d5dc4` passed CI37099076391: 57 Chromium checks on first attempt in1.5minutes. Merge `838bf7d7519cf50996cf49c51f084eb78a39c31a` passed integration CI37099358020, retaining build/budgets/coverage/server smoke while reusing exact-tree browser acceptance. Local/tested/merged tree `d2cdefbfba7bf12fec6607a64c845dcd38e3a88d` identical.

Railway review deployment `79349c3e-b715-4e54-8aef-3f5c28fc2621` SUCCESS on exact merge SHA. Live desktop /about screenshot/DOM verifies loaded new header CSS Module, menu closed/expanded=false, normal body scrolling, no horizontal overflow and preserved gradient/geometry/Arabic banner branding and fixed Companion. Mobile/tablet proof is local/seeded CI; no live cloud-browser viewport resizing claim. Main/PR104 production promotion remains protected. This is a targeted audit, not a claim that every page is defect-free.
