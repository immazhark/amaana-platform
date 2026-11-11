# AF-R025 — Conditional programme infographic heading leading

**Date:** 11 November 2026 IST  
**Status:** bounded source correction implemented; exact-head CI and release checks pending.  
**Writer:** CHATGPT_ACTIVE, sole repository implementation writer.

## Verified source-level defect

The conditional `campaign-data-visual` section in `src/components/programme-detail.tsx` renders only when a reviewed `highlightMedia` exists. Its `h2` rule in `src/app/our-work/[slug]/campaign.css` explicitly used **`line-height: 1`**, below the established AF-R025 heading minimum of **1.12**.

The public Eid Gift Kits route inspected during this task did not display this conditional section. Therefore this finding is a verified CSS source inconsistency and a synthetic multi-line rendering risk, **not** a confirmed production overlap or a published media defect.

## Test-first and correction

1. Test-only PR #766 head `844319746f0873088a5714377220ecf2e759be7b`, CI `43027025752` fast job `130544293083`: **RED** at `src/app/direct-editorial-heading-leading.test.ts`, exactly `expected 1 to be greater than or equal to 1.12`. This new assertion checks the real `.campaign-data-visual h2` source declaration.
2. Fix commit `4623e08226bd348808eba15816b60fe37a692966`: change only this selector's ratio **1 → 1.14**, preserving the established typography hierarchy, size, color, spacing, layout, image handling and all public copy.
3. Browser regression commit `3572608c07595561a66554f84c9dd33b0a250c15`: read the actual campaign CSS into an isolated Playwright page with synthetic conditional-section markup. Validate wrapping and computed line height at **320px and 390px**. No beneficiary record or image is created or published.
4. **Pending:** new complete exact-head CI (plan/fast/browser/production/database/verify), independent review, separate ready-state promotion and protected merge with expected head SHA. After any website deployment, verify Railway source SHA and independent public version/readiness. Do not treat the first RED CI as acceptance of the corrected head.

## Boundary and rollback

This sub-scope does not certify full AF-R025 closure or physical screen-reader/200–400% zoom acceptance. Historical 149-row backlog totals are unchanged. It changes no payment, auth, schema, secret, CSP, service configuration, consent, identifiable media or public factual statements. Financial PR #684 stays on hold. The separate AF-R024 CSS calc audit PR #765 may merge during this branch; reconcile coordination file after that merge and rerun exact-head CI if changed.

Rollback: revert the isolated CSS declaration, associated tests and evidence record if browser acceptance identifies a compatibility regression. Do not weaken existing public heading protections.
