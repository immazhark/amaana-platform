# Source, finance and backlog reconciliation — 12 November 2026 IST

## 12 November 2026 IST — AF-R009 and AF-N08 bounded security defect closure

**AF-R009 (P0) Implemented → Completed:** In current main `6e5dbf1bbdb353ecbac88c71d91df833d94d0b2c`, `serializeStructuredData()` JSON encodes and escapes `<`, `>`, `&`, U+2028 and U+2029. Focused `structured-data.test.ts` and `structured-data-rendering.test.tsx` cover the script-breakout payload, private path exclusion and round-trip correctness. Live read-only parsed JSON-LD/unsafe-character checks were completed on eight public routes (`/`, `/about`, `/impact`, `/donate`, `/stories`, `/team`, `/medical-support/mr-khaja`, `/our-work/eid-gift-kits`); no invalid JSON, unsafe literal `<>&` or raw U+2028/U+2029 detected. This closes the named serializer escaping defect only, not every future route or runtime-shape defect. AF-R008 was independently merged in #788.

**AF-N08 (P0) Implemented → Completed:** `src/lib/cron-authorization.ts` now compares **UTF-8 byte lengths** of the configured and presented Bearer credentials before `timingSafeEqual`. `src/app/api/jobs/notifications/route.test.ts` tests fully-multibyte, mixed-byte and other multibyte mismatches return private HTTP401 with no retention/email action, and an exact matching multibyte credential remains accepted. No live cron or notification activation was attempted or needed to confirm the isolated exception fix.

**Exact release evidence:** `src/lib/structured-data.ts`, `src/lib/cron-authorization.ts` and the referenced tests are unchanged between the latest independently live-ready website source `b18e1518e938049f12876a069ebfa8e8cfee39cb` and current main `6e5dbf1bbdb353ecbac88c71d91df833d94d0b2c` (GitHub commit comparison). Full #788 exact-head CI `43137396702` passed plan/fast/database/production/browser/verify; separate ready-state `43141026663` succeeded and SHA-guarded merge `6e5dbf1bbdb353ecbac88c71d91df833d94d0b2c` completed. The live website was checked separately at `b18e1518e938049f12876a069ebfa8e8cfee39cb` main/production/ready. This does not imply the notification worker was activated.

**Reconciled original 149:** 10 Completed / 50 Implemented / 62 Partial / 25 Not started / 1 Superseded / 1 Not applicable. **Active queue 137** (P0 30, P1 72, P2 35). AF-R024 Team route fix is independently in draft PR #789 with full exact-head checks running. Financial PR #684 and media privacy #785 remain independent. This candidate changes docs/CSV only and requires its own CI, ready-state and guarded merge; no code, payment, donor data, public-media publication, schema, secrets, cron or infrastructure activation.

---


## 12 November 2026 IST — AF-R010 and AF-N09 verified bounded closures

- **AF-R010 Completed (P0):** Fresh source at merged main `3c227d267dfc5ba65a2afa242a7bda0fd667d282` has no `innerHTML` references in `e2e/visual-system.spec.mjs` and no assignment to `innerHTML` in `e2e/all-page-audit.spec.mjs`. `head.innerHTML()` only reads HTML. `page.setContent` remains for an isolated source-rendered synthetic error fixture and is outside the prohibited raw DOM write. Full exact-head browser acceptance, production, database, fast and verify CI `43128164786` SUCCESS after historical fix; test fixtures unchanged from deployed source.
- **AF-N09 Completed (P1):** `src/app/api/admin/media/curated-gallery/publish/route.ts` catches exceptions and returns constant `Curated gallery publication failed safely.`, HTTP 500 and private no-store/noindex headers. It logs only a bounded error name, not exception message or stack. `error-boundary.test.ts` injects synthetic auth/runtime/database exceptions and non-Error failures and preserves origin/permission/authentication guards; latest full exact-head fast/production CI `43128164786` SUCCESS. No privileged publish endpoint was invoked live and no real media was changed.

Both fixed source paths are unchanged between last deployed source `b18e1518e938049f12876a069ebfa8e8cfee39cb` and merged source `3c227d267dfc5ba65a2afa242a7bda0fd667d282` (only docs/scripts/test changed); Railway website #784 `e2838175-8cdf-4975-b113-6258db92c6a3` SKIPPED, and independently verified public `/api/health/version` main/production `b18e1518e938049f12876a069ebfa8e8cfee39cb` and `/api/health/ready` ready. #784 exact head `41149c499a98e06f602264694afabd00d2b237e5`, full CI `43128164786` SUCCESS, separate ready-state `43132279837` SUCCESS, guarded merge `3c227d267dfc5ba65a2afa242a7bda0fd667d282`.

**Original 149 IDs:** 8 Completed / 52 Implemented / 62 Partial / 25 Not started / 1 Superseded / 1 Not applicable. **Active 139** (P0 32, P1 72, P2 35). These closures do **not** resolve arbitrary HTML injection, asset-level media privacy issue #785, financial PR #684, or AF-R004/R006/008/009 pending separate acceptance. This candidate changes only governance documents and CSV records, no application or production behavior.

---


## 12 November 2026 IST — AF-R002/R003 vulnerable-release closure

This addendum supersedes only the AF-R002/R003 classifications and counts below. **AF-R002 Completed:** GitHub-reviewed `GHSA-wq5f-xc86-pv6w` affects `sharp <0.35.5`; the patched release is `0.35.5`. The deployed source manifest and lock pin `sharp@0.35.5` with Alpine musl native variant and `@img/sharp-libvips-linuxmusl-x64@1.3.4`; the upstream sharp advisory describes librsvg 2.63.2 in this patched release. **AF-R003 Completed:** `GHSA-68fv-2mgg-jv7q` affects `source-map-js <1.2.2`; the source lock has only `source-map-js@1.2.2`.

Full exact-head CI for #780 `43109665136` SUCCESS (fast/production/database/browser/verify). #781 `43117533290` SUCCESS, with `npm run audit:prod` and pruned production dependency checks passed. Railway website `f9058056-1c6e-4dc3-96b0-1aa312389330` SUCCESS at commit `b18e1518e938049f12876a069ebfa8e8cfee39cb`; independent public `/api/health/version` and `/api/health/ready` returned that same main/production SHA and ready. GitHub compare `b18e1518e938049f12876a069ebfa8e8cfee39cb` → `bd720b5567147dde624cd4d5cf0ce5a7a0fe793d` affects only scripts/docs/CSV; manifest, lock and Dockerfile have not changed since the deployed source. Advisory sources: https://github.com/advisories/GHSA-wq5f-xc86-pv6w and https://github.com/advisories/GHSA-68fv-2mgg-jv7q .

**Updated 149-ID overlay:** 6 Completed, 54 Implemented, 62 Partial, 25 Not started, 1 Superseded, 1 Not applicable. **Active 141:** P0 33, P1 73, P2 35. This closure covers the identified patched-version problems only, not arbitrary SVG security, future CVEs, or live financial acceptance. AF-R004/R005/R006 and held finance PR #684 retain their classifications. No source code, provider, schema, secret, CSP, infrastructure, cron, notification or donor mutation in this docs-only candidate.

---


## Scope and release identity

Base main `b18e1518e938049f12876a069ebfa8e8cfee39cb` (PR #780). Railway website deployment `f9058056-1c6e-4dc3-96b0-1aa312389330` SUCCESS in production `38aede68-35aa-42de-adbc-49802e6d44e4`, service `b40482be-5e5d-48cc-b36b-39beabfd5d5c`. Independent uncached public `/api/health/version` and `/api/health/ready` reads returned HTTP 200, the exact base SHA/main/production/paymentMode live and ready. Direct workspace HTTP returned 403; an independent retrieval path succeeded. Identity/readiness do not certify payment settlement or all user journeys.

This audit enumerates all canonical IDs in original order, checks current classifications against the master overlay, inventories local branch ancestry, and inspects the finance and first security scopes. It is **not** an exhaustive line-by-line audit of every historical branch or full live acceptance of 149 items.

## PR #684: exact hold

Only open PR at inventory: #684, draft head `1d2918c211a5795202b24614b7b8a6e6131158e9`, branch `feat/af-domestic-upi-qr-reviewed-fallback-20261107`. The fallback is not merged/live. Its body requires independently verified receiving-account ownership, received-funds/UTR-to-appeal reconciliation, an explicit reviewed production activation scope and fresh exact-head/ready-state gates. A poster-to-source QR comparison does not establish bank ownership/settlement. Routine merge approval cannot supply these facts. Preserve the PR/branch; do not activate a payment destination or close it as obsolete.

## Financial feature evidence

| Feature | Source deployed in base | Remaining scope |
|---|---|---|
| Appeal Razorpay checkout | Order/confirm/signed webhooks, INR, eligibility and remaining-balance checks | Real provider payment/settlement/refund acceptance not executed here |
| Direct bank/UPI claims | Pending verification, serializable operator reconciliation, audit and reference uniqueness | Independent credited-transfer matching acceptance |
| Ordinary acknowledgement | Private token lookup, no-store, browser print | Recovery/expiry/download acceptance; not an 80G certificate |
| New QR fallback #684 | Absent from main | Financial hold above |
| General fund registry/designation | Offline helpers; Donation still requires appealId | Persisted approved fund registry/collection workflow |
| Allocation/disbursement | Pure validators only | Persisted ledger and maker-checker workflow |
| Monthly giving | Calendar reminders; page explicitly excludes automatic debit | Provider mandate/subscription integration and operational approval |
| Taleem sponsorship | Enquiry/matching discussion | Automated inventory, reservation, payment and reporting |
| Fidya/Kaffarah/Aqiqah/Waqf | Offline draft with checkoutAllowed:false | Reviewed religious, cost, destination and financial policy |
| Statutory tax workflow | No 10BD/10BE issuance workflow found in inspected source | Current CA sign-off and separately approved scope |
| Donor messages | Queue records can be created | Worker remains parked; delivery not certified |

Evidence: `src/app/api/donations/{order,confirm,direct-transfer,acknowledgement}/route.ts`, `src/lib/direct-donation-reconciliation.ts`, `src/lib/giving-foundation.ts`, `src/lib/giving-designation.ts`, `src/components/giving/GeneralGivingReview.tsx`, `src/lib/special-giving-policy-draft.ts`, `src/app/get-involved/monthly-giving/page.tsx`, `prisma/schema.prisma`. GENERAL intention applies to a selected appeal, not unrestricted foundation funds. No live transactions or private donor data were used.

## Sequential register and clean queue

[Full 149-ID register](149-item-status-2026-11-12.csv) preserves original order and historical classes; [active queue](active-backlog-2026-11-12.csv) excludes four completed and two excluded rows. Counts: **4 Completed, 56 Implemented, 62 Partial, 25 Not started, 1 Superseded, 1 Not applicable =149**. Actionable remaining: **143**. No new full-item promotions in this audit. AF-R008/R009 #780 is released test coverage, not automatic whole-scope closure.

First security findings: R001 and R007 retain prior verified completion; R002 Sharp 0.35.5/libvips package 1.3.4 needs primary advisory/platform mapping; R003 source-map-js 1.2.2 needs primary advisory/full audit mapping; R004 storage imports server-only but client-import rejection proof remains; R005 public-env synthetic tests passed 8/8, historical exposure/provider rotation stays separate; R006 incomplete dedicated credentials throw but focused release/config-presence acceptance remains. R002/R003/R004/R006 remain Implemented and R005 Partial.

## Branch audit defect and correction

A full non-shallow clone failed `node scripts/branch-retention-report.mjs --json`: `Unexpected remote ref format`. Git's `%(refname:short)` abbreviates the normal `refs/remotes/origin/HEAD` symbolic alias as `origin`, so the expected origin/branch parser rejected it. New synthetic normal-clone regression: RED 4 passed/1 failed with that exact error; minimal canonical full-ref correction: GREEN 5 passed/0 skipped. Existing malformed/missing-main/shallow fail-closed tests remain passing. Test asserts symbolic alias is omitted and refs are byte-identical before/after.

Corrected local snapshot: **806 remote branch refs**, main protected 1, contained/review-only 567, unmerged/preserved 238. The sole live open-PR branch #684 is among preserved unmerged refs. CLI protectedOpenPr=0 means it has no live PR input, not that no PR exists. Local ancestry is not remote completeness, line-by-line branch review, retention approval or a deletion list. No refs were deleted or rewritten.

Candidate branch `fix/branch-inventory-canonical-refs-20261112`, base above. Required exact-head CI, independent review, separate ready-state promotion and guarded merge remain separate release stages. Rollback: revert canonical-ref parsing, synthetic regression and associated reconciliation documents/exports. No app runtime, financial, auth/RBAC, schema, secret, CSP, infrastructure, media or notification activation changes.
