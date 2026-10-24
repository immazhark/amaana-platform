# Mission Control — 149-row acceleration checkpoint

**Date:** 25 October 2026 IST. **Owner:** `CHATGPT_ACTIVE`, sole repository writer. **Source of record:** [Comprehensive 149-row audit](../AMAANA_MISSION_CONTROL_AUDIT_2026-10-25.md), canonical execution register and current GitHub/Railway evidence. This checkpoint is a work plan, not a rewritten historical classification or proof of completion.

## Accounting and evidence rules

149 canonical items = 26 Not Started + 59 Implemented (historical source classification) + 61 Partial + 1 Completed + 1 Superseded + 1 Not Applicable. Each item is individually documented in the linked audit, Blocks A/B/C. The 26 not-started headings include an extra appended research note for AF-N13; that note is **not** a 27th row. The 59/61 classifications do not automatically change when one narrower sub-scope is verified. There is no measured per-item historical inactivity time; do not fabricate stall attribution.

Use immutable evidence chain: exact source commit → fail-first focused tests → full scoped CI/build/browser/db → ready-state promotion/verify → SHA-guarded merge → deployment ancestry → scoped live/provider/manual acceptance. `/api/health/version` and `/api/health/ready` verify runtime release identity/readiness, not payments, privacy, content accuracy, mobile field Web Vitals or accessibility on physical devices.

## Production and active protected changes

- Current runtime on `amaanafoundation.org`: `b033e99982caaeb295726bf19df64ca1ffa7f7a3` (#433). Railway `a8d650de-9e24-4569-81d8-58d2b81e297b` SUCCESS, public release identity/readiness verified.
- GitHub main on this checkpoint: `fe22ccd540ce1653dce815a95910e81619e23e60`; #434 read-only CSS audit tooling and #435 release docs merged through full/ready-state gates. Railway correctly SKIPPED deployment of these non-runtime-only changes under service watchPatterns.
- PR #436 `29abca0d02c0aa99f63bd48bf5d34cccac0fe23d`: isolated-browser regression that repository config/credential files return rejection and no redirect, full run `40137005603`, browser pending at checkpoint; remain draft.
- PR #437 `bd50c6932a57105072c3b6071a117c1ce4943640`: change public CSS audit fetch to `redirect:'manual'` so it cannot follow an unexpected off-origin response, fail-first unit regression, full run `40137745603`, browser pending at checkpoint; remain draft.
- After first protected merge, reconcile later candidate to new main by normal merge and run fresh exact-head acceptance; never force-push, bypass required browser checks or claim a pending test passed.

## Four synchronized engineering divisions

### Architecture & Core Engineering

**Ready:** Finish #437's bounded read-only redirect guard after acceptance; gather SQL concurrency/identity evidence for N01-N07 and R045/R046 in an isolated database. Map R043 dynamic page freshness to measured real response times before changing cache. Inventory fund/donor/settlement models read-only.

**Blocked:** New fund registry, disbursement approvals, donor records, provider mandates and sponsorship reservation schemas require approved financial/RBAC/data contract and migration rollback. Do not mutate production to test.

### Product & Design Governance

**Ready:** Capture representative browser coverage and 200/400% zoom screenshots for AF-R019/R024/R025/R057/R068. Existing independent hosted browser runs #433 `40129948886` and #434 `40133473638` both logged decoded initial CSS Home `172441` bytes/3 stylesheets and About `165842` bytes/3 stylesheets; same values in both isolated builds. No unused-selector percentage, compressed transfer or field Web Vital claim. Review critical route/component geometry against canonical system.

**Blocked:** R042 still requires human physical TalkBack/VoiceOver/NVDA acceptance. Urdu/Telugu PR #374 stays draft until authoritative reviewed translations, RTL/error/legal parity. Qurbani, Fidya and other campaigns require approved cost, calendar and religious text. Do not use fictional beneficiaries or photos.

### Quality & Security Shield

**Ready:** Finish #436's isolated public artifact exposure regression. Extend anonymous admin/API scope matrices and source-bound origin/CSP negative tests; keep secret values out of logs. AF-N13 withdrawn development advisory needs exact advisory mapping and runtime exclusion evidence, not a fictitious code patch. Diagnose N14 early-closed streams with sanitized traces before claiming a bug.

**Blocked:** Cloudflare Access/WAF and HSTS preload enforcement need a verified zone/hostname/DNS/certificate/recovery inventory. Provider/payment-security acceptance cannot be simulated with actual donor charges; use synthetic signed fixtures and isolated databases.

### Release & Operations

**Ready:** Read-only GitHub PR/run/commit comparison, deployment status, readiness, 4xx/5xx logs, secret-boundary and payload budgets. Preserve provenance where main is ahead of runtime due to Railway watchPatterns. Confirm any real source change with fresh runtime SHA after Railway SUCCESS.

**Blocked:** Do not activate #264 notification sending; WABA/CRM consent/provider authorization remains separate. No automatic 80G statement/certificate issuance or actual refund/donation; tax status and responsible sign-off unresolved.

## Independent primary-source research checks

1. Cloudflare Access policies support application-path constraints and more-specific policy precedence. Inspect real admin paths, origin bypass/recovery and identity allowlists before enabling; [official Cloudflare Access path documentation](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/).
2. Preload affects **all** subdomains; inventory TLS and submission status first, [HSTS reference](https://https.cio.gov/hsts/). Presence of the site's preload header alone does not prove eligibility or registration.
3. Google for Nonprofits currently requires country-specific eligibility and Goodstack verification. The official India policy includes FCRA-related requirements; verify this organization's **actual** status before marking eligibility, [Google India eligibility](https://support.google.com/nonprofits/answer/3215869?co=GENIE.CountryCode%3DIN&hl=en).
4. Form 10BD submission/10BE certificate are separate tax statutory processes for qualifying approved organizations, per [Income Tax Department manual](https://www.incometax.gov.in/iec/foportal/help/statutory-forms/popular-form/form10bd-10be). Ordinary payment acknowledgements do not constitute Form 10BE. Any 2025 Act form renumbering/current filing requirements require responsible professional review before software/issuance claims.
5. Organization schema may help identify an entity but must match truthful site and registry details; [Google Search Central Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization).
6. For AF-R076 native mailto anchors currently exist and original Cloudflare transformation defect is unproven; do not introduce an untested replacement.

## Atomic batch order and acceptance

1. **Security test-only:** #436 browser full pass → verify → ready-state pass → SHA-guarded merge. Expected Railway SKIPPED is legitimate for `e2e/**`-only.
2. **Audit transport:** reconcile #437 against accepted main → fast/native Node tests, database, production and browser CI → ready-state → SHA-guarded merge. `scripts/**`-only change should skip runtime deploy, not be misrepresented as a runtime release.
3. **Evidence lane:** run fixed public CSS byte CLI, capture rendered selector coverage on mobile/desktop states, narrow an actual CSS defect; do not close AF-R057/R068 before complete coverage.
4. **Security/DB lane:** inventory every admin/API and true database transition; add fail-first regressions in separate branches and no production-data test.
5. **Provider/policy lane:** prepare non-operative reviewed contracts for finance, tax, security, locales and religious areas; allow external review to decide activation separately.

**Release stop conditions:** failed or incomplete browser/CI; unknown live runtime SHA for runtime changes; unreviewed beneficiary data/imagery; unresolved finance/rulings/legal claims; unapproved real payment/refund, statutory form or notification delivery; missing production rollbacks or migration acceptance. Evidence is required for every status change.

**Register total remains unchanged: 1 Complete / 59 Implemented / 61 Partial / 26 Not Started / 1 Superseded / 1 Not Applicable.**
