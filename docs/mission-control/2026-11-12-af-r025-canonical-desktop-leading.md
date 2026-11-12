# AF-R025 — canonical desktop heading leading, 12 November 2026 IST

## Reproduction and bounded scope

Existing `src/app/canonical-content.css` gives base `.canonical-block h2` leading `1.15`, but the explicit `@media(min-width:1400px)` override changes the same canonical article h2 to `1.08`. This violates the previously accepted 1.12–1.24 readable multiline heading range; it is not a request to change fonts, copy, brand or layout. The historical direct editorial-heading fix and existing `src/app/direct-editorial-heading-leading.test.ts` do not check this second desktop-specific selector.

**RED-first:** New `src/app/canonical-desktop-heading-leading.test.ts` asserts the explicit 1400px override's unitless ratio is in 1.12–1.24. Checked the unmodified main CSS: the ratio is **1.08** and therefore fails. New Playwright coverage checks real canonical heading leading, visible box and horizontal containment on the public About route at 1440px and 1920px.

**GREEN:** One CSS declaration `line-height:1.08` → `1.14` in the exact media query, restoring the established editorial range. All other declarations unchanged. No new dependencies.

**Release:** Isolated source/test PR from main `6e5dbf1bbdb353ecbac88c71d91df833d94d0b2c`, full exact-head fast/browser/database/production and final verify, independent review, separate ready-state CI and expected-head merge. CSS under src triggers website deployment; after merge separately verify Railway SHA, public readiness and no collateral layout regression. Do not claim broader 200%/400% zoom or physical assistive tech acceptance from this single scope. Backlog AF-R025 remains Partial unless remaining heading/zoom coverage passes. No donor/payment/media/finance/auth/schema/CSP/cron/infra changes.
