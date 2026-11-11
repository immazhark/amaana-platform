# AF-R025 — Impact card programme title heading leading

Date: 11 November 2026 IST. Writer: CHATGPT_ACTIVE. PR #775.

## Verified reproduction

The Impact overview renders programme titles as h3 inside .v2-impact-tile-copy. The source CSS module declared line-height 1.08, below the established direct editorial multiline leading range 1.12–1.24. This is a verified source mismatch and potential narrow-screen reflow concern, not claimed observed field text overlap.

Test-only commit 7eef84b76084e8b5a0aea0f97cc8ffb5e90dc69b created one Vitest invariant. Hosted RED run 43059592023, fast job 130658334841 failed exactly the new impact-tile-heading-leading.test.ts; 291 other test files passed, 3 skipped.

## Minimal correction

CSS commit 05404783003f2f70dc7897ca4a0cb915daaf4ad6 changes only the published programme h3 line-height 1.08 to 1.16. The documented impact metric strong, route data, labels, identities, card geometry and brand colors do not change.

Browser regression 7099b24ada6d812e2790d996a2a10848ea6aabf9 loads actual /impact CSS at 320px and 390px and injects synthetic, offscreen text into an h3 to measure computed line-height and wrapping fragments. No invented programme result or beneficiary record is published.

## Acceptance and limits

Require exact-head full fast, production, database, browser and verify CI, independent review, separate ready-state CI, then expected-head guarded merge. Does not certify physical assistive-technology or zoom acceptance, nor complete historical AF-R025. Concurrent PRs #772–774 remain independent. PR #684 financial activation held. No payments, auth/RBAC, secrets, schema, media, CSP or Railway changes; historical 149-item total unchanged.

Rollback: narrow revert of one CSS declaration and source/browser regressions/evidence.