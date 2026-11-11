# AF-R025 — Programme detail story headline leading

Date: 11 November 2026 IST. Writer: CHATGPT_ACTIVE. Draft PR #773.

## Reproduction

The programme detail template renders a public h2 reading How the programme took shape inside .campaign-story-layout. Its CSS explicitly used line-height 1.08, below the accepted 1.12 to 1.24 multiline editorial ratio. Direct source evaluation confirmed actual 1.08 and minimum 1.12. This is a verified source mismatch and potential narrow-screen wrapping risk, not a claim of observed live overlap.

Test-only SHA ea3f0113569b34fcbc69be36b517c4a151aa028b adds focused Vitest source assertion. Hosted test-only workflow 43056226323 requires terminal outcome verification; a cancellation must not be counted as a failing regression.

## Correction

Source commit 442d9be23de0afcf4136fe1953b38ac209e9c062 changes only the h2 ratio to 1.14 in campaign.css. Browser test commit 98d2aa75adcdcbea719e8b7c429558bdf9bbf77c adds real Taleem public route acceptance for computed heading leading, wrapping, and horizontal geometry at 320 and 390px. No copy, page layout, images, donations, beneficiary data, authentication or infrastructure changes.

## Release boundaries

Require complete exact-head fast/production/database/browser/final verify CI, independent source review, separate ready-state checks and expected-head protected merge. This does not certify physical 200/400% zoom or assistive technology and cannot close full AF-R025. Financial #684 remains held for separately scoped payee/provider activation. Historical 149-item totals unchanged.

Rollback: narrowly revert the CSS ratio, focused Vitest/browser tests and evidence.