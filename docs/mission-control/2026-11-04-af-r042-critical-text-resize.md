# AF-R042 — Public critical-route synthetic text resize (4 November 2026 IST)

**Scope and boundary:** Add browser acceptance at 200%/400% **root text enlargement**, not native browser zoom, screen-reader or real assistive-device acceptance. Keep AF-R042 Partial and the historical 149-item denominator unchanged.

**Baseline:** Main `4acb5fe255fff915a3e1bffbe05964e373dd5bce`, PR #640 fully tested, guarded-merged and independently live-verified in Railway and public version/readiness; no open PRs at claim. Sole implementation writer `CHATGPT_ACTIVE`.

**Candidate:** Draft PR #641, branch `test/public-critical-text-resize-20261104`, initial source head `3482fd6add97fc800a860ed318a02ff95106e0ad`. New `e2e/public-critical-text-resize.spec.mjs` supplies six browser cases: Contact, Donate and Request Assistance at 390px with 200% root font, and at 1280px with 400% root font. The font scale is installed before hydration to avoid mixed computed layouts. Assert response success, visible primary heading, actual computed root scale, title horizontal geometry and absence of page horizontal overflow. Network intercepts only anonymous analytics; never submit forms or load live payments.

**Evidence class:** Tests of existing behavior, not a claimed repaired runtime defect. If a test fails, inspect actual DOM and distinguish invalid fixture assumptions from genuine reflow; implement only a separately reproduced minimal correction. Do not weaken accessibility assertions to hide a defect. Repository exact-head browser/fast/build/database/verify, independent review, separate ready-state CI, expected-head merge and runtime identity verification remain required.

**Privacy/security:** Synthetic/public observations only; no donor or beneficiary records, schema, auth, checkout CSP, payment, notifications/cron, media, secrets or production-infrastructure changes.

**Rollback:** Revert the bounded PR. Physical browser 200/400% zoom, keyboard-only end-to-end journeys and NVDA/VoiceOver/TalkBack require separate human acceptance.
