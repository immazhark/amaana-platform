# Revision — 4 November 2026 IST, supersedes original 400% root-font wording

- **Actual first browser evidence:** PR #641 initial exact-head run `41724596687` failed three 400%-root-font tests on `/contact`, `/donate`, `/request-assistance`. All measured 1,927px document scroll width under a 1280px desktop CSS viewport with `html { font-size:400% }`. 1,416 other Chromium tests passed, one /impact performance case passed on retry. Fast, isolated database and production jobs passed.
- **Diagnosis:** A 400% root font on unchanged desktop CSS viewport does **not** model actual browser zoom: media queries/breakpoints stay desktop. An actual 400% zoom-equivalent 1280px viewport has 320px CSS layout width. The original test assumed these were equivalent. This is invalid test modeling, not evidence to rewrite production CSS.
- **Corrected test source:** `b1d1aa69e40dd61ce8616ab934bdf0d22bc27adc`, same branch, retains 200% root text at 390px and checks 400%-zoom-equivalent **320px CSS viewport** at normal root font. Each route still requires visible main H1, actual computed root font and no document overflow. No production code changed. Both remain synthetic proxies, NOT physical native browser zoom or screen-reader acceptance.
- **Release:** New exact-head hosted run, full browser/database/build/security as selected, separate ready-state, expected-head merge required. One CHATGPT_ACTIVE writer also executes independent non-overlapping PR #642 while #641 CI runs. Historical 149 counts unchanged.

---

# AF-R042 — Public critical-route synthetic text resize (4 November 2026 IST)

**Scope and boundary:** Add browser acceptance at 200%/400% **root text enlargement**, not native browser zoom, screen-reader or real assistive-device acceptance. Keep AF-R042 Partial and the historical 149-item denominator unchanged.

**Baseline:** Main `4acb5fe255fff915a3e1bffbe05964e373dd5bce`, PR #640 fully tested, guarded-merged and independently live-verified in Railway and public version/readiness; no open PRs at claim. Sole implementation writer `CHATGPT_ACTIVE`.

**Candidate:** Draft PR #641, branch `test/public-critical-text-resize-20261104`, initial source head `3482fd6add97fc800a860ed318a02ff95106e0ad`. New `e2e/public-critical-text-resize.spec.mjs` supplies six browser cases: Contact, Donate and Request Assistance at 390px with 200% root font, and at 1280px with 400% root font. The font scale is installed before hydration to avoid mixed computed layouts. Assert response success, visible primary heading, actual computed root scale, title horizontal geometry and absence of page horizontal overflow. Network intercepts only anonymous analytics; never submit forms or load live payments.

**Evidence class:** Tests of existing behavior, not a claimed repaired runtime defect. If a test fails, inspect actual DOM and distinguish invalid fixture assumptions from genuine reflow; implement only a separately reproduced minimal correction. Do not weaken accessibility assertions to hide a defect. Repository exact-head browser/fast/build/database/verify, independent review, separate ready-state CI, expected-head merge and runtime identity verification remain required.

**Privacy/security:** Synthetic/public observations only; no donor or beneficiary records, schema, auth, checkout CSP, payment, notifications/cron, media, secrets or production-infrastructure changes.

**Rollback:** Revert the bounded PR. Physical browser 200/400% zoom, keyboard-only end-to-end journeys and NVDA/VoiceOver/TalkBack require separate human acceptance.
