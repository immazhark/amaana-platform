# AF-R025 — Education sponsorship heading leading

Date: 11 November 2026 IST. Writer: CHATGPT_ACTIVE. PR #772.

## Reproduction

Public route /get-involved/sponsor-education contains school/college and closing sponsorship h2 headings. Both use a shared CSS shorthand with unitless line-height 1.06. The existing direct editorial heading range is 1.12–1.24. Long public headings can wrap on narrow screens. This establishes source-level mismatch and reflow risk; no confirmed live overlap is claimed.

Test-only head: 2b88196c6325b44c667bfc5003c8ca5e3abf29af. Direct evaluation against actual branch stylesheet observed ratio 1.06 versus required minimum 1.12. GitHub test-only run 43054984537 was cancelled after branch advanced; do not classify it as executed hosted RED.

## Correction

CSS fix c761a7efa45cacbb84d7cdc9286515d03497683d changes the one shared h2 shorthand from 1.06 to 1.14. Browser regression 916929fd08132b6af6c530f69821e2eaa4494c58 checks both actual headings at 320px and 390px for line ratio, wrapping and horizontal bounds. No copy, brand, geometry, payment, auth, media, secrets, schema or Railway settings were changed.

## Release boundaries

Full exact-head CI, independent source review, separate ready-state check and expected-head guarded merge required. Source and emulated-browser assertions are not complete WCAG/device acceptance. Historical AF-R025 and 149-row classifications remain unchanged. Financial #684 is held for independent payee/routing and separately authorized activation.

Rollback: narrowly revert the CSS ratio, source and browser tests, and evidence/coordination.