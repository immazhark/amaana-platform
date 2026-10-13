## 2026-10-13 — independent body rejection correction

Ownership: CODEX_ACTIVE on fix/request-body-cancellation-20261013, based on security3414858b. Consolidated14269ad full CI38365252911 passed all selected gates;282 guarded-merged3414858b;215 final CI38379820058 running. Production unchanged. Canonical media URL and disabled fixture/Web-Vitals flags set with skipDeploys. N-28 implemented: oversized stream rejection previously awaited cancellation indefinitely if underlying cancel never settled. New fake-timer regression fails on the original with rejection stalled; non-awaited best-effort cancel preserves immediate RequestBodyTooLargeError.107 tests across7 body/payment/assistance/webhook suites passed, with typecheck and focused ESLint. Direct-transfer multipart parsing now reuses the bounded Uint8Array directly instead of an extra full-size ArrayBuffer copy (up to5.25MiB per request); assistance already used direct typed bytes and is unchanged.32 body/upload route tests, typecheck and focused ESLint pass after this optimization. Keep this independent commit unintegrated until current release gate finishes; do not mutate the validated release head. Keep current release head unchanged while implementing independently.

## 2026-10-13 — PR backlog reconciled to two release PRs

Ownership: HANDOFF_PENDING. Closed11 verified superseded PRs278,279,280,281,274,249,253,258,240,247,241 with per-PR retained-scope evidence; no branches deleted. Recovered missing real-scrypt tests via existing254: refreshed02ef12c0 passed targeted CI38364040345, guarded mergec3e05f5a. Reconciled original216 without reverting newer work: refreshed025a8247 passed targeted CI38364789878, guarded merge3633cb172edcd671f13227740d76da95c9a5a3d1. Only282 consolidated release and215 main-promotion PR remain open. No new PR created in this cleanup batch.

Preserved unique importer batching/deduplication/UTC timestamps, donation card containment, isolated PostgreSQL cases, scoped Stylelint and readable-label browser regressions. Current safeguards remain:12px status badge, postbuild image weight, privacy migration checks, real-scrypt observer tests and payment/media boundaries. Local891 unit tests passed/9 skipped;41 importer/planner passed/4 PostgreSQL skipped; full ESLint/Stylelint/typecheck passed. Prior original216 full CI38252706957 passed exact retained importer/CSS source; refreshed targeted verification does not certify final integrated browser/database acceptance.

Earlier consolidated03b95b1a full CI38362023764 passed plan/fast/database/production/browser/final verify. It does not certify newer3633cb17. Final combined release gates required before promoting282→215→main. No live deployment or current-production closure asserted. Historical95 closure totals remain unreconciled. Production remains2a8c35ad; Railway migration preflight is configured for next deployment, with OAuth variable-value compatibility still unverified.

## 2026-10-13 — remaining importer/CSS reconciliation

Ownership: CODEX_ACTIVE refreshing existing PR216 onto consolidatedc3e05f5a. PR254 exact refreshed head02ef12c0 passed stacked CI38364040345 and mergedc3e05f5a. Open backlog now215,216,282;11 superseded PRs closed with evidence.

PR216 unique work retained from39b671a1: bulk master/factual-lock reads, scoped media deduplication preserving first metadata and repeat idempotency, UTC updatedAt parity for four bulk legacy category writes; donation CSS folded into one authority with shrinkable grid and link wrapping; importer/browser/CI coverage and scoped Stylelint. Keep newer status badge.75rem, postbuild weight guard, historical-pageview migration checks, route reporting and current stacked security work. Never copy its stale package/workflow/globals snapshots wholesale. 41 importer/planner cases passed locally, including7 importer model cases;4 actual PostgreSQL cases skipped locally. Combined unit891 passed/9 skipped, full ESLint/Stylelint/typecheck passed. Both new browser specs parse. Exact refreshed-head hosted gates and final integration database/browser acceptance remain required. Previous exact-head CI38252706957 passed but does not certify this refreshed candidate. No production data writes or deployment.

## 2026-10-13 — superseded PR cleanup and missing coverage recovery

Ownership: CODEX_ACTIVE for existing PR254 refresh onto consolidated03b95b1a. Closed11 superseded PRs:278,279,280,281,274,249,253,258,240,247,241, after comparing actual source/test deltas and fresh heads. Each closure body explains retained coverage; no branch deletion, stale merge or production closure.

Four PRs remain:215 production release;282 consolidation;216 unique importer/CSS work;254 unique real-scrypt coverage. Unlike the superseded candidates,254's password-work-factors.test.ts is absent and password.test.ts still has malformed four-field over-ceiling fixtures in consolidated. Restore exactly its two test blobs without changing authentication runtime. Seven actual-password tests pass with real Node scrypt calls; typecheck/ESLint pass. Add these paths and tests to existing stacked verification so the refreshed existing PR gets exact-head validation. Preserve both histories when refreshing; no force push.

PR216 exact-head CI38252706957 passed39b671a1. Its importer batching, timestamp and test changes are not fully preserved in282; keep open pending scoped reconciliation, rather than merge stale CSS/workflow snapshots. Historical95 totals remain unreconciled. Newer remediation is not deployed; main remains2a8c35ad.

## 2026-10-13 — notification and release-preflight batch complete

Ownership: HANDOFF_PENDING; source integration70e213e70eed102b29dfa67e09cbdc95cf81ffd0. PR288 merged433fccec after exact-head CI38361087739 passed. PR289 merged70e213e after exact-head CI38361613600 passed.

N-25 checkout credentials recovery: same server UUID, provider order and token hash;37 related tests passed. N-26 notification retry ownership: atomic claim requires snapshot attempts equality;15 notification tests passed. Removing equality reproduces an unwanted provider send in the new race regression; fixed source passes. Files: order/route.ts and provider-order.test.ts; notifications.ts, notifications-claim.test.ts and notifications-worker.test.ts. Combined local suite888 passed/9 skipped;97 suites passed/1 skipped; full lint and typecheck passed.

N-27 deployment configuration blocker: Railway production predeploy was only an inline environment check and did not run migrations. Updated existing service b40482be-5e5d-48cc-b36b-39beabfd5d5c in environment38aede68-35aa-42de-adbc-49802e6d44e4 to node prisma/railway-predeploy.mjs with300s timeout. Six wrapper tests passed; describe-service readback verifies both fields. Wrapper runs bounded-retry migrations; production skips preview content import and staging seed. Configuration applies on the next deploy; no deployment or database write triggered by this change.

Railway deployment bb65fc78-088e-4df2-b7b6-80c59fd62da8 is SUCCESS at main2a8c35ad5e553ac0cc78b8027a35b592d1876826; canRollback true. Latest release CI38361776442 for70e213e was queued at checkpoint. OAuth exposes variable names only, so canonical media URL, actual credential values and migration state are not remotely certified. Legacy PUBLIC_MEDIA_S3 credential names remain defined alongside MEDIA_S3 names; safe cleanup remains a release preflight item. No new production closure asserted.

Historical register95; current open/unintegrated/integrated/live-closed/reopened totals remain unreconciled. Next: final-head release gates, env/migration/privacy compatibility, guarded parent/main promotion, then deployment/live verification. No live emails, payments, refunds or beneficiary-sensitive tests performed.

## 2026-10-13 — notification retry continuation

Ownership: CODEX_ACTIVE on fix/notification-attempt-claim-20261013 by owner cx. PR288 integrated433fccec after exact-head CI38361087739 passed. N-26: selected attempt count can become stale before a due retry claim, but completion/failure uses that old count. Atomic claim now requires selected attempts equality as well as max-attempt/due-time guards.15 tests across4 notification suites, typecheck and focused ESLint passed. Removing equality reproduces an unwanted provider send in the new race test; corrected candidate passes. Await exact-head hosted verification before guarded integration. Consolidated release gates remain queued; no production promotion.

## 2026-10-13 — checkout persistence continuation

Ownership: CODEX_ACTIVE on fix/checkout-outcome-recovery-20261013 by owner cx. N-25 confirmed: provider order exists and donation write may commit despite lost acknowledgement, but checkout returns500 and loses original receipt access. Own-ID/token/provider-order recovery implemented; five new regressions;37 related tests plus typecheck and focused ESLint passed. No schema change or real provider requests. Await exact-head hosted CI and guarded merge. Final consolidated release CI remains queued; no promotion.

## 2026-10-13 — completed integration batch and release handoff

Ownership: HANDOFF_PENDING; current batch safely completed. Integration head197ca9078da6a2c885843b10150f9ede576af8d1 contains guarded merges: PR286 e5875b3c (CI38357703887), corrected PR2851c44ee9c (d95ef0ae / CI38359261238), PR287197ca907 (a1adbe80 / CI38360005569). All targeted hosted gates passed on exact task heads. Earlier full CI38356018038 passed9dfd0df8 only; latest full release gates remain pending.

N-23: media stack merge resolution reverted strict qualified transfer timestamps and forged/named-empty attachment checks with six source/test blobs. Restore parent validation before merge; retain media readiness scope. Combined validation332 tests across22 suites plus types/ESLint passed. Do not double-count original defects.

N-24: direct-transfer create may commit without acknowledgement, stranding receipt credentials and blocking retry. Preassign server UUID; recover by own ID and matching receipt-token hash; preserve duplicate-reference409 and fail closed on absent/unavailable/mismatched outcomes. Five new regressions;64 related tests passed. Full local unit suite882 passed/9 skipped;97 suites passed/1 skipped; full lint and typecheck passed. No schema change.

Production main remains2a8c35ad5e553ac0cc78b8027a35b592d1876826; no new deploy/live closure asserted. Historical register95; current open/unintegrated/integrated/production-closed/reopened totals unreconciled. Next: exact final-head release gates, environment/migration compatibility and privacy preflight before security/main promotion. No live charges/refunds or beneficiary tests performed.

## 2026-10-13 — current execution checkpoint

Ownership: CODEX_ACTIVE by explicit owner handoff. See docs/EXECUTION_CHECKPOINT_2026-10-13.md for current evidence. PR286 integrated at e5875b3c. PR285 corrective d95ef0ae restores six parent validation files reverted by its merge resolution (N-23); fresh hosted CI required. Combined candidate:99 focused tests and typecheck passed. Main remains2a8c35ad; no new production deployment or closure. Historical95 entries; current totals unreconciled.

## 2026-10-13 — combined corrective integration candidate

- Actual d59f5e66 CI38306526542 result: fast/database/production passed; browser and final verify FAILED. Browser summary1156passed,5failed,1flaky. Four404 cases consistently measured .98 line-height/font ratio despite earlier fallback edits; one impact fixture failed and the second was flaky after injected main DOM disappeared. No full/cross-browser success for this head is claimed.
- R-025 root cause: later experience-finish.css shared state/error `font` shorthand resets line-height to .98. Change that authoritative shorthand to1.05 for the shared state/receipt/404/error/loading heading family, preserving sizes/fonts and all existing test thresholds. Keep the four real404 assertions.
- Impact harness correction: replace mutation of React-owned main DOM with a server-rendered disposable impact-typography page importing the real impact CSS module. Retain both100/200% cases, exact font, opacity and color assertions; no weakened thresholds or retries. Production fixture preparation removes the entire fixture subtree; actual disabled-build removal probe passes.
- N-21 parked artwork cap fix included: bounded shared-cap encoder,11focused tests, postbuild image guard, actual7derivative evidence and3failing cap-bypass mutation cases. Local source/geometry/alpha unchanged; hosted sharp0.35.5 and full18-image checks pending.
- N-22 source-confirmed optimizer freshness mismatch: managed-media handler returns max-age60/s-maxage300, but global minimumCacheTTL31536000 overrides shorter upstream policies. Official Next image docs and exact v16.3.8 image-optimizer.ts confirm max(minimum,upstream). Lower floor to60; remove conflicting generic /media immutable config header so the handler owns success/error policies; explicitly retain year-long immutable source headers on /brand,/hero,/programme-artwork. Cap optimizer source bodies to existing5MiB managed-upload limit. Add three real optimizer/source-header browser cases with a disposable read-only source using an existing approved WebP; syntax and actual-config parsing pass locally.
- N-22 remains PARTIAL: nominal freshness policy is corrected, but existing caches, stale/error revalidation behavior, CDN purge and real consent-withdrawal acceptance are not certified. Do not describe this as immediate revocation or complete media privacy. Reference https://nextjs.org/docs/app/api-reference/components/image#minimumcachettl and vercel/next.js v16.3.8 packages/next/src/server/image-optimizer.ts; no private-header forwarding/auth-bypass claim.
- Ready for one guarded fast-forward from PR d59f5e66 after its run completed, including parked f3ab3447 ancestry. Fresh candidate lint/types/build/budgets/browser required. No security/main merge, deployment, live transaction or zero-defect/AAA certification.

## 2026-10-13 — parked validation and remaining boundaries

- N-21 sensitivity: detached byte-cap bypass mutation makes3 of11 focused tests fail (oversize fallback, nonmonotonic fallback, bounded rejection); actual candidate remains unchanged. Baseline actual-generation guard fails on422226-byte Taleem; bounded candidate397472 passes. This verifies enforcement rather than merely expected happy-path values.
- N-13 rechecked against actual PR215 advisory: GHSA-vfj7-8cjw-p6xm / CVE-2026-93687 affects braces<=3.0.3; GitHub Advisory Database still lists no patched version (https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Current lock chain eslint-config-next16.3.8→@next/eslint-plugin-next16.3.8→fast-glob3.3.1→micromatch4.0.8→braces3.0.3 is development-only. Docker still asserts braces is absent after prune --omit=dev. No downgrade, suppression, unaudited fork or claim of a new full audit/patch.
- Analytics review: page views and Web Vitals reuse normalizePublicAnalyticsPath; dynamic public slugs group as :slug, private routes are excluded, bodies are bounded and schema-strict. This source review does not close historical nonconforming paths, production migration, retention, live privacy or cost gates.
- Impact contrast review correction: base impact.css contains older light-surface inks, but later impact-wow.css resolves principle labels/paragraphs to canonical gold-ink/muted through brand aliases. No additional confirmed rendered defect established; no extra stylesheet change committed for those two selectors.
- d59f5e66 CI38306526542 browser remains active; other gates passed. Keep artwork code parked and preserve the running suite. No production release actions.

## 2026-10-13 — N-21 generated artwork bypassed image budget (parked)

- Root cause: the fast hero/artwork weight guard runs before `npm run build`; prebuild refinement creates ignored derivatives afterward. d59f5e66 production log contains Taleem422226 bytes against the existing MAX_ARTWORK_BYTES409600 cap. The same baseline pipeline reproduced all seven production byte counts locally; a weight check after baseline generation correctly fails on Taleem.
- Correction: shared-cap encoding helper keeps preferred quality88 when fitting, tries bounded qualities86/84/82/80/78/76, and throws before the oversized output write when none fits. Add the existing weight checker to npm postbuild after the secret-boundary gate, so production/browser builds cannot report success with oversized generated artwork. Add 11 focused encoder boundary/error tests to the existing fast image step. No budget increase or new dependency.
- Actual-file validation: candidate Taleem397472 bytes at quality82 (24754 bytes/5.86% smaller); other six derivatives remain byte-identical at quality88. All seven retain1536×1024 geometry and alpha channels; every downloaded approved source SHA-256 unchanged. Local 14-image subset (7sources+7derivatives) passes weight guard. Preferred/limit/oversize/nonmonotonic/floor/invalid/error cases11/11 pass; syntax passes. Visual comparison preserves the established composition; measured Taleem PSNR36.93dB relative to the prior encoding, not an assertion of lossless output.
- Local encoder is runtime sharp0.35.4; repository pins0.35.5. Exact old output bytes match hosted baseline, but fresh hosted generator/quality/budget validation remains required. Outputs and approved source image files are not committed or regenerated through AI.
- R-053 remains partial: mobile transfer <=150KB and external consent-cleared media delivery are not certified. Track new N-21 as implemented candidate, not deployed.
- Based on PR HEAD d59f5e66; CI38306526542 fast/database/production passed (755unit/9skipped; JS818786/819200,CSS346526/348160), browser still active. Park this follow-up until that browser run completes, then use one guarded integration update. No security/main merge, Railway deployment or live/payment check.

## 2026-10-13 — integrated follow-up candidate after gallery CI passed

- Verified baseline d246e366: run 38303371341 completed successfully across plan, fast, database, production, browser and final verify. Browser log: 1,154 Chromium passed (23.6m), 24 Firefox/WebKit smoke passed (35.3s), no reported flakes. Three new gallery reorder/removal/empty-state regressions included. Fast: 755 unit passed, 9 skipped; production JS818773/819200, CSS346461/348160. Three lint warnings were present on this baseline; parked cleanup addresses them without suppressions and needs fresh hosted verification.
- Candidate batch: gallery cleanup captures current DOM/trigger array safely; typed authorization route table removes unused adapter argument; R-075 static source index; R-024 five explicit sub-12px font declarations (status/pathway/donation/placeholder/impact index); R-025 active error/404 heading .8→1.05 in root and duplicated policy styles; R-019 impact index opacity/background and light-tile caption ink.
- Impact evidence: old index at 62% opacity calculates 4.40:1 over #f7f0de. Opaque #122239 on #fffdf8 calculates 15.73:1 regardless of underlying imagery. Light-tile caption moves #80620d→canonical #604407: 7.94–8.88:1 across #f7f0de/#fffdf8. Palette preserved. This is a scoped numerical/source check, not live image-wide contrast certification.
- Validation: all 79 CSS inventory files inspected for explicit px/rem/clamp and font-shorthand minima; 507 font declarations reviewed. Added eight browser cases: real404×four, actual donation labels×two, disposable impact-style fixtures×two. Node syntax checks pass; new candidate lint/build/unit/browser and budgets pending. No tests or limits weakened.
- Publish only after fresh PR HEAD/ancestry guard; expected old PR head d246e366. R-012, R-019, R-024 and R-025 remain partial; R-075 implemented pending hosted/live serving. No security/main merge, Railway deployment, payment or live verification performed.

## 2026-10-13 — R-024 public stylesheet minimum review

- Read all 79 CSS files from the original repository tree at PR d246e366; root/public/component CSS inventory has no missing fetches. Review targeted explicit px/rem declarations and bounded clamp values, not inherited/em/calculated font sizes or live computed styles.
- Two further sub-12px declarations found: donation-route metadata .68rem and decorative placeholder label clamp(.62rem,1.2vw,.72rem). Raise both to .75rem; earlier parked status/pathway corrections bring this batch to four minimum-size declarations. Placeholder remains decorative/aria-hidden; no semantic or beneficiary-data change.
- Add two actual donation-page browser cases at 390px, verifying both labels equal 12px at 100% and 24px at 200% root size. Together with four R-025 real-404 cases, this batch adds six browser regressions. Node syntax check passes; hosted browser results pending.
- R-024 remains partial until browser, inherited/computed typography, and human acceptance are verified. No claim of universal readable sizing or AAA compliance.
- Parked batch is based on 469a6813; PR d246e366/browser run 38303371341 continues. No security/main merge or deployment.

## 2026-10-13 — R-025 error-heading line spacing

- Current root `not-found.tsx` and `error.tsx` use `.v2-not-found` / `.v2-error-page`; both active headings receive line-height .8 from the globally imported `error-experience.css`. Error heading includes an explicit line break. This is confirmed source evidence; no live overlap measurement claimed.
- Raise the shared heading rule to 1.05 in root error styling and its duplicated policy-route rule, avoiding a later route stylesheet restoring .8. No changes to heading words, route boundaries, redirects, fonts or theme.
- Add four real-404 browser cases (390/1440px × 100/200% root font), checking HTTP404, the actual accessible heading, correct root scaling, and line height at least font size. Syntax check passed; browser execution pending. Existing thresholds unchanged.
- R-025 remains partial: other legacy display rules and broader human typography acceptance are not certified by this narrow correction.
- Parked batch now includes gallery cleanup, R-075 public source index, two R-024 label minimums, and this R-025 correction. Current PR d246e366/browser run 38303371341 still pending; no source update interrupting that run and no deployment.

## 2026-10-13 — R-024 remaining shared-label minimum

- Raise `.status-badge` (globals) and `.canonical-pathway span` (canonical-content) from .72rem to .75rem. At a 16px root, both now reach 12px; at a 32px root, both scale to 24px. Color, spacing, layout and content remain unchanged; replacement length is identical.
- Reviewed the original AM-05/AM-25 findings against current root/public CSS. Legacy tight-heading selectors remain in route styles, but were absent from their current page components; no current rendering failure inferred and no broad deletion performed.
- R-024 stays partial: this is two additional label declarations, not site-wide AAA certification or a completed human acceptance check.
- Based on parked R-075 commit 893dac77, which includes cleanup b5ff59ed. PR HEAD d246e366 and browser run 38303371341 remain active and unchanged. These updates are parked for one guarded integration batch after the running suite completes.

## 2026-10-13 — R-075 public source index (parked integration follow-up)

- Scope: add `public/llms.txt` with 15 canonical links to existing public information and policy routes. No beneficiary, donor, receipt or administrative detail links; no invented impact figures, social URLs or tax promises.
- Compliance: domestic Indian sources only; no FCRA registration; provisional Section 12A/80G approvals; normal acknowledgements are not tax-deduction certificates. Wording checked against the current compliance page.
- Evidence: original `AMAANA_MASTER_REMEDIATION_PLAN(2).md` identifies AM-27; file absence verified at PR HEAD d246e366. Local link/origin/format check passed. This is a small text convention, not a security critical or a guarantee of model indexing.
- Validation baseline: d246e366 fast/database/production gates passed; browser run 38303371341 still active. 77 actual-module local boundary/navigation probes pass. Parked cleanup b5ff59ed still awaits hosted lint/browser verification.
- Publication: keep PR HEAD unchanged until its active browser suite completes; combine this source index with the parked cleanup for the next integration batch. No security/main merge or production deployment performed.

# Current remediation checkpoint — 12 October 2026

This repository copy preserves the recovered reconstructed register below. Its original classification counts are historical, not current closure counts. Source: Amaana_Reconstructed_95_Finding_Status_2026-10-12.md (190 lines; recovered in full from the owner's project files).

- Integration: c7a4d5570e523784b29ea6f9fd475c18de2ff536. PR #277 merged after full CI 38249290059 succeeded; governance/policy label subset of R-024 is integrated, deployment pending.
- R-024 remains partial. #280 covers 61 declarations across 21 public stylesheets; #281 covers 19 shared chrome declarations across three stylesheets. #278 covers assistance labels; #279 private tracking/receipt labels; #216 donation-route labels and enlarged-text containment. Source occurrences are not separate defect closures.
- #216 repaired two failing enlarged-text cases at 39b671a1ea1f20cdfcf98969d3fd4df04f09bd43. CI 38252706957 passed fast/database/production; browser pending at this checkpoint. Historical passing importer checks do not certify pending browser checks.
- R-050: #274 refreshed onto integration e8ae478 at ffd2b81ff8e2b3aa72f15b3977b9ebc5f6a1c04d, preserving all eight tests and both histories. Fresh combined-head validation remains required.
- Typography test additions in #278/#279/#280/#281 are being reconciled with integrated #277 by retaining both append-only test blocks; source changes remain unchanged. New commit checks supersede prior-head results.
- Previously integrated payment/error-handling corrections are recorded in AI_HANDOFF_LEDGER.md. Do not use older PR references below as current integration state.
- Production has not been promoted during this batch. Last confirmed deployed main: 2a8c35ad5e553ac0cc78b8027a35b592d1876826. Do not mark any new correction Production Verified without deployment and live evidence.
- Terminal execution was unavailable after automatic approval review hit an account usage limit. Repository connector operations and hosted CI remain available. Modified JavaScript test syntax was parsed in the tool runtime; this does not replace browser execution.

## Live remediation delta — PR #282 (12 October 2026)

This section supersedes historical status labels in the reconstructed 95-row
inventory **only for the rows listed below**. Do not treat a commit, a passed
unit test or an integrated PR as evidence of a Railway deployment.

| Finding | Current branch evidence | Engineering disposition | Live deployment |
|---|---|---|---|
| R-012 Anonymous administrative boundaries | Protected routes require authentication/permissions; admin route inventory and anonymous-access coverage added to CI | Partially audited; complete independent review outstanding | No verified deployment |
| R-024 Metadata at 200% font scaling | One remaining /our-work 390px flake: 32px root observed before a separate 12px label reading. Enlarged stylesheet is now applied at document initialization and root/labels checked atomically after reload | Test-harness correction candidate. Browser rerun must prove 24px labels; no threshold weakening | No verified deployment |
| R-041 Donation and admin money controls | Razorpay + direct transfer + 3 admin rupee inputs use numeric/decimal keyboard text controls, schema validation, and Prisma Decimal(12,2) max-value guard | Code implemented; client/server regression tests passed on earlier candidate; broader human acceptance pending | No verified deployment |
| R-047 Per-route bundle analysis | Next 16 app-build-manifest absence handled; reports route count and honest aggregate bytes instead of invented per-route transfer figures | **Partial:** no reliable route-specific JS/CSS attribution until a suitable build artifact is available | No verified deployment |
| R-050 Wheel-only Lenis keyboard handoff | Keyboard teardown and explicit Home/End fallback with tests | Code implemented; full-browser rerun needed to certify the former flaky case | No verified deployment |
| R-053 Checked-in image weights | All 11 local WebP images total 2,044,648 bytes; largest 348,636 bytes. A 400 KiB per-image CI guard was added for local hero/artwork imagery | **Partial:** remote curated S3/CDN imagery and mobile responsive transfer measurements remain unverified | No verified deployment |
| R-071 Streaming loading states | Roll back five parent-route loading boundaries and the unused skeleton to restore full server HTML and canonical redirects | **Regression detected** in run 38285272953: 1,088 passed, 56 failed, 7 flaky; missing headings/metadata and a 200 response on a required 307/308 redirect. Corrective rollback requires fresh CI | No verified deployment |
| R-077 Real-user Core Web Vitals | Sampled opt-in observability and privacy-safe page-view grouping; a new migration groups eligible historical detail slugs by date while preserving totals, backed by isolated PostgreSQL checks | **Candidate only:** fresh CI, staging and production rollout verification needed. Nonconforming historic paths still require inventory/privacy review | No verified deployment |

**Current release boundary:** PR #282 is draft, targeting the P0 security
integration branch rather than `main`. Production promotion, live payment
confirmation, screen-reader review and actual Core Web Vitals measurements are
separate release gates.

**Evidence discipline:** The source register is reconstructed, not a recovered
original 95-defect ledger. Defects not listed above retain their previous
classification pending issue-by-issue review.

## Retained source register (historical snapshot)

# Amaana — Reconstructed Finding Register and Deployment Status

Status checked: 12 October 2026, IST.

## Provenance and limitations

The earlier conversation reported a 95-entry deduplicated working inventory but did not expose a recoverable individual-row ledger. This document is a new 95-row reconstruction from the retained audit sources and verified implementation records. R-001–R-095 are identifiers assigned now; they are not represented as the missing historical IDs or an exact recovery of the earlier 95 rows. The inventory includes confirmed defects, stale findings already addressed in the baseline, feature requests and unresolved verification tasks. It is not 95 confirmed live vulnerabilities. Supplement N-01–N-14 records later findings separately; overlaps in the original audits were not added together as if unique defects.

Live source: main 2a8c35ad5e553ac0cc78b8027a35b592d1876826. Railway website deployment bb65fc78-088e-4df2-b7b6-80c59fd62da8 reports SUCCESS. PR215 remains open and unmerged on security integration f5578c31829aeb76ac4e30060cc658342942d762; that integration is 48 commits ahead of deployed main. Source present in the deployed commit is not a claim that every manual/runtime/external-provider acceptance was freshly executed.

## Overview of the reconstructed 95 rows

| State | Rows |
|---|---:|
| Already addressed in deployed baseline | 10 |
| Implemented; not deployed | 30 |
| Partial; not closed | 14 |
| Open | 30 |
| Unverified | 11 |
| Total | 95 |

These are tracking-row counts, not a certified defect-free percentage. The 40 addressed/implemented rows include existing baseline capabilities and test-tooling changes; they must not be advertised as 40 newly fixed live defects.

## Register

### Security

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| R-001 | Next.js vulnerable release | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-01 | 16.3.8 is in deployed main. |
| R-002 | Sharp/librsvg vulnerable release | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-08 | 0.35.5 is in deployed main; do not infer permission to rasterize untrusted SVGs. |
| R-003 | source-map-js vulnerable release | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-16 | 1.2.2 is in deployed lockfile. |
| R-004 | Storage module lacks explicit server-only boundary | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-02; #215 | Server-only marker implemented in remediation branch. |
| R-005 | Public-prefixed media credential names | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-02; #215 | Renamed to MEDIA_S3_*; production variable cleanup remains part of release. |
| R-006 | Incomplete dedicated media credentials silently fall back | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-02; #217 | Reject a half-configured credential pair. |
| R-007 | Client-bundle secret scanner misses names or literal values | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-02; #218–#220/#244 | Scan names, configured values and legacy identifiers after production builds. |
| R-008 | JSON-LD input lacks runtime shape validation | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-24; #215 | Zod validation implemented. |
| R-009 | JSON-LD serializer lacks full sensitive-character escaping | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-24; #215 | Extended <, >, &, U+2028/U+2029 escaping and tests. |
| R-010 | Raw innerHTML assignments in test fixtures | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-23; #215 | Replaced fixture assignment. Test tooling; not a demonstrated production XSS. |
| R-011 | Dynamic new Function execution in audit harness | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-23; #215 | Use temporary ESM and normal import. Test tooling. |
| R-012 | Complete anonymous admin/API access audit | Unverified | Not established | Unconfirmed | AM-06 | Authentication exists; login HTTP200 alone is not an auth bypass. Full current route review unverified. |
| R-013 | Admin edge Access/WAF/allow-list requirement | Unverified | Not established | Unconfirmed | AM-06 | No fresh evidence of an applied edge restriction. |
| R-014 | CSP unsafe-inline script allowance | Open | No completed rollout | No verified new fix | AM-07 | Nonce/hash strategy and compatible checkout verification remain open. |
| R-015 | Cloudflare analytics beacon CSP violation | Unverified | Not established | Unconfirmed | AM-07a | Allow-list versus disabling injection decision not verified. |
| R-016 | Overbroad CSP img-src https allowance | Open | No completed rollout | No verified new fix | AM-07b | Media-origin enumeration/tightening not completed. |
| R-017 | CSP report-only rollout and enforced-payment acceptance | Open | No completed rollout | No verified new fix | AM-07b | No completed compatible staged CSP rollout. |
| R-018 | HSTS preload/subdomain HTTPS review | Unverified | Not established | Unconfirmed | AM-26 | Header exists; complete subdomain review and preload decision unverified. |

### Accessibility

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| R-019 | Governance/muted/gold text contrast outside corrected surfaces | Partial; impact correction candidate | Opaque high-contrast impact index and canonical light-tile caption ink | Not deployed | AM-05 | Index calculated 15.73:1; caption 7.94–8.88:1 over documented cream stops. New browser style cases pending; other selectors and full human acceptance remain open. |
| R-020 | Policy labels/aside contrast tokens | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-05; #223 | Existing accessible semantic tokens applied and ratio tests added. |
| R-021 | Captions and appeal text contrast | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-05; #222 | Targeted accessible ink replacements implemented. |
| R-022 | Impact/Contact/initiative supporting-text contrast | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-05; #230 | Three affected surfaces switched to accessible meta ink. |
| R-023 | Dark admin-sidebar eyebrow contrast | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-05; #239 | Separate foreground tokens for light content and dark sidebar. |
| R-024 | Sub-12px text declarations | Partial; correction candidate | Companion scalable typography plus five label minima | Not deployed | AM-05 | Status/pathway/donation/placeholder/impact index use .75rem. Reviewed 79 CSS files and 507 font declarations including shorthand. Actual donor labels and disposable impact fixtures test 100/200%; fresh candidate browser and broader acceptance pending. |
| R-025 | Overly tight multiline heading line heights | Partial; canonical correction candidate | Shared state/error font shorthand .98→1.05 | Not deployed | AM-25 / CI38306526542 | Four real404 cases exposed the later canonical shorthand reset; fallback edits alone did not win. Keep line-height≥font assertions, fresh rerun pending. Other legacy/human acceptance remains open. |
| R-026 | Remaining gold-on-light text contrast | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-05 | Needs selector/background-specific verification; not blanket certification. |
| R-027 | Assistance step errors lack linked inline messages | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #224 | Persistent aria-invalid/aria-describedby errors implemented. |
| R-028 | Assistance focus precedes error DOM commit | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #225 | Focus scheduled after rendered inline errors. |
| R-029 | Donation native validation lacks durable inline errors | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #226 | Native invalid events render linked field errors before focus. |
| R-030 | Donation server-rejected fields do not receive focus | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #228 | Focus the first server-rejected control. |
| R-031 | Donation error handling steals focus during correction | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #229 | Announce/focus an error once; preserve editing focus. |
| R-032 | Cancelled RAF suppresses donation error focus | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #237 | Mark focus complete only within the executed callback. |
| R-033 | Invalid giving-intent radio group is not focused | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #248 | RadioNodeList-aware focus; hosted browser regressions passed. |
| R-034 | Contact social links fail visible-label-in-name matching | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #227 | Accessible names begin with visible platform/handle. |
| R-035 | Public-media link accessible name mismatch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #231 | Accessible name includes visible action. |
| R-036 | Gallery Enlarge accessible name mismatch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #232 | Enlarge action matches visible label. |
| R-037 | Appeal/reflection card accessible action mismatch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #233 | Visible action included in accessible name. |
| R-038 | Impact tile accessible action mismatch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #234 | Visible action included in accessible name. |
| R-039 | Participation-card accessible action mismatch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #235 | Visible action announced first. |
| R-040 | Story archive accessible action mismatch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #236 | Accessible action includes visible label. |
| R-041 | Amount fields use number controls instead of decimal input UX | Open | No completed rollout | No verified new fix | AM-11 | Complete conversion of flagged amount controls not evidenced. |
| R-042 | Real screen-reader/keyboard/200%-zoom acceptance | Unverified | Not established | Unconfirmed | AM-05/AM-11 | Automated checks do not replace the outstanding human acceptance. |

### Performance

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| R-043 | Homepage always-dynamic rendering / avoidable TTFB | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-09; prior P0-2 | ISR exists in deployed source; prior live measurements improved. |
| R-044 | Footer cumulative layout shift | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-09; prior CLS finding | Earlier live audit measured CLS0.0002; no claim of a new current field measurement. |
| R-045 | Appeal-cover runtime N+1 media queries | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-09 | Bounded batch media lookup exists in deployed source. |
| R-046 | Seed/master-content/category import N+1 operations | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-23; #216 | Bulk operations implemented; full candidate CI passed. |
| R-047 | Missing per-route bundle analysis | Open | No completed rollout | No verified new fix | AM-09/AM-13 | No completed analyzer evidence/route breakdown. |
| R-048 | Current throttled-mobile LCP/TBT/TTI acceptance | Unverified | Not established | Unconfirmed | AM-09 | Fresh full target measurements not established. |
| R-049 | Unproven Companion/motion hydration bottleneck | Unverified | Not established | Unconfirmed | AM-09 | Requires profiling; scanner claim is not a confirmed component defect. |
| R-050 | Lenis activates after native keyboard handoff | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-09; #249 | Cancel pending import/initialization after handoff. |
| R-051 | Outdated browser/polyfill target | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-09 | Evergreen browserslist is deployed; residual byte savings still need measurement. |
| R-052 | Remaining raw image elements | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-10 | Most media optimized; complete remaining-element audit not closed. |
| R-053 | Oversized WebP assets/mobile variants | Partial; generated-output correction candidate | Bounded derivative encoder and postbuild weight guard | Parked; not deployed | AM-10 / N-21 | Taleem derivative422226→397472B locally; six other generated outputs byte-identical. Shared400KiB cap preserved. Fresh hosted checks, <=150KB mobile delivery and external media remain open. |
| R-054 | Hero preload/priority/sizes consistency | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-10 | Existing optimized hero delivery; every relevant hero not newly certified. |
| R-055 | Missing image formats/responsive caching pipeline | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-10 | AVIF/WebP, responsive sizes and immutable caching exist. |
| R-056 | Missing ingestion blur/LQIP placeholders | Open | No completed rollout | No verified new fix | AM-29 | No complete ingestion pipeline implementation established. |

### CSS/tooling

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| R-057 | Too many stylesheets loaded globally | Open | No completed rollout | No verified new fix | AM-12 | Global import count remains a structural issue. |
| R-058 | Route styles are not fully isolated | Open | No completed rollout | No verified new fix | AM-12 | Complete route/module isolation not implemented. |
| R-059 | Missing governed cascade layers | Open | No completed rollout | No verified new fix | AM-12 | Full layer migration not implemented. |
| R-060 | Stacked duplicate donation stylesheet revisions | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-12; #216 | Consolidated into one governed rule set; not deployed. |
| R-061 | Hard-coded colors outside canonical tokens | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-05/AM-12 | Targeted fixes made; sitewide literal target not met. |
| R-062 | Excessive important declarations | Open | No completed rollout | No verified new fix | AM-12 | Complete cleanup not implemented. |
| R-063 | Competing button/card/section/media systems | Open | No completed rollout | No verified new fix | AM-12 | Complete unified-system consolidation not implemented. |
| R-064 | Appended reconciliation/override stylesheets | Open | No completed rollout | No verified new fix | AM-12 | Full fold-and-delete migration remains open. |
| R-065 | Missing Prettier formatting and check gate | Open | No completed rollout | No verified new fix | AM-18 | Complete formatter configuration/CI gate not established. |
| R-066 | Incomplete Stylelint design-token/duplicate-selector governance | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-18; #216 | Scoped zero-warning Stylelint introduced; whole-site governance incomplete. |
| R-067 | Global CSS <=60KB target not achieved | Open | No completed rollout | No verified new fix | AM-12 | Existing budget passes do not establish this smaller global-CSS target. |
| R-068 | Unused CSS <10% on key routes unverified | Unverified | Not established | Unconfirmed | AM-12 | Current route-specific coverage measurements missing. |
| R-069 | Strict accessibility/import-cycle lint coverage gaps | Open | No completed rollout | No verified new fix | AM-18 | Requested strict/cycle rule rollout not completed. |

### SEO/release

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| R-070 | Gallery branch apparently absent from main | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-03; #175 | Consolidated approved media selection exists; redundant branches superseded, not wholesale cherry-picked. |
| R-071 | Missing route skeletons | Open | No completed rollout | No verified new fix | AM-17 | Previous loading experiment retired after regressions; safe replacement pending. |
| R-072 | Homepage description exceeds target length | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-21; #221 | Trim implemented on remediation branch. |
| R-073 | Missing NGO/WebSite/alternateName/social/appeal action schema | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-20/AM-32 | These existing schema fields are in deployed source; absent-schema claim is stale. |
| R-074 | Missing verified registry link/entity enrichment | Open | No completed rollout | No verified new fix | AM-20/AM-32 | Further registry-based disambiguation not completed. |
| R-075 | Missing llms.txt | Implemented; integration pending | Parked follow-up based on b5ff59ed | Not deployed | AM-27 | Static source index: 15 canonical public links, conservative compliance wording; local checks pass, hosted/live serving pending. |
| R-076 | Cloudflare email-protection broken link | Unverified | Not established | Unconfirmed | AM-22 | No verified current correction. |
| R-077 | Missing real-user Web Vitals attribution | Open | No completed rollout | No verified new fix | AM-28 | Page-view analytics exists; LCP/INP/CLS attribution does not. |
| R-078 | Dated audit documents not archived | Open | No completed rollout | No verified new fix | AM-19 | No complete archive cleanup. |
| R-079 | Excess remote branches / branch hygiene | Open | No completed rollout | No verified new fix | AM-19 | No complete reviewed pruning. |
| R-080 | Rich-results and entity-schema live acceptance | Unverified | Not established | Unconfirmed | AM-20 | Source schema existence is not external validator acceptance. |
| R-081 | Complete truthful build/type/performance release gates | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-04/AM-13; #220/#241/#243 | CI/type generation exists; added remediation checks and complete Lighthouse-required gate are not all in main. |
| R-082 | Preview noindex/redirect and current search-index acceptance | Unverified | Not established | Unconfirmed | AM-13; source launch checklist | Current full preview redirect/Search Console acceptance not revalidated. |

### Product

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| R-083 | Donate landing page in-page flow and amount presets | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-14 | Appeal checkout exists; complete requested landing-page conversion flow not closed. |
| R-084 | Expanded donation intentions beyond current supported set | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-14/AM-31 | GENERAL/SADAQAH/ZAKAT exist; additional requested categories not completed. |
| R-085 | Monthly recurring donations | Open | No completed rollout | No verified new fix | AM-14 | Subscriptions workflow not completed. |
| R-086 | Persistent Donate CTA across all pages | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-14 | Appeal-specific mobile support CTA exists; global requested coverage incomplete. |
| R-087 | Persistent verified-impact trust bar | Open | No completed rollout | No verified new fix | AM-30 | Full requested component not established; existing factual content is not equivalent. |
| R-088 | Zakat calculator with reviewed rules/data | Open | No completed rollout | No verified new fix | AM-31 | Calculator not built; review rules/data before implementation. |
| R-089 | Hijri/event countdown expansion | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-31 | Companion/prayer/Hijri features exist; full Ramadan/Eid expansion not closed. |
| R-090 | Qurbani live sponsorship tiers/counter | Open | No completed rollout | No verified new fix | AM-31 | Programme pages exist; requested live sponsorship feature not completed. |
| R-091 | Consent-based Shukr donor wall | Open | No completed rollout | No verified new fix | AM-31 | No completed consent-backed donor wall. |
| R-092 | Seasonal campaign goal/progress features | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-31 | Seasonal programme content exists; complete new campaign feature scope pending. |
| R-093 | Wasiyyah/legacy-giving page | Open | No completed rollout | No verified new fix | AM-31 | Not completed. |
| R-094 | Islamic charity education content pipeline | Open | No completed rollout | No verified new fix | AM-31 | Dedicated reviewed content pipeline not completed. |
| R-095 | Live transparency/financial breakdown dashboard | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-31 | Transparency page exists; full live financial dashboard not established. |

## Later findings and coverage gaps

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| N-01 | Duplicate asset entries within one import batch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #216 | First-entry deduplication implemented; full CI passed. |
| N-02 | Bulk category updates omit updatedAt | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #216 | UTC timestamps implemented; rollback-only PostgreSQL parity tests passed. |
| N-03 | Confirmation accepts a different returned payment identity | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #250 | Bind returned provider identity to requested payment. |
| N-04 | Malformed provider payment reaches reconciliation | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #251 | Runtime validation of consumed provider fields. |
| N-05 | Invalid provider order ID reaches donation persistence | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #252 | Reject empty/unusable order identity before writing. |
| N-06 | Malformed failed-payment identity reaches persistence | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #253 | Reject before transaction/event writes. |
| N-07 | Older failure overwrites newer authorization | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #258 | Atomic AUTHORIZED/payment-ID predicate; includes #253 prerequisite. |
| N-08 | Multibyte job credential crashes timing-safe comparison | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #255 | Compare actual UTF-8 buffer lengths before equality. |
| N-09 | Gallery publish HTTP500 exposes raw exception text | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #257 | Return generic error; retain bounded diagnostic logging. |
| N-10 | Cron repeatedly builds website without DATABASE_URL | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #259 | Isolated worker built/tested; full application CI now passed. Schedule removed and URL corrected live; repaired worker not deployed. |
| N-11 | Scrypt work-factor tests exercise malformed fixtures | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #254 | Correct fixtures plus observation of actual crypto factor calls. Tests only. |
| N-12 | Private-record tests mock critical security helpers | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #256 | Actual-helper origin/token/body-boundary coverage. Tests only; no new runtime defect claimed. |
| N-13 | Development-tool braces stack-exhaustion advisory | Open; no patched release listed | Current development-only lock chain verified | No new fix or live exposure claim | GHSA-vfj7-8cjw-p6xm / CVE-2026-93687 | braces3.0.3 remains affected; GitHub lists no patched version. Runtime prune asserts absence. Do not confuse with the older CVE-2024-4068 fixed by3.0.3 or suppress/downgrade lint. |
| N-14 | Destination stream closed early errors | Unverified | Not established | Unconfirmed | Successful browser CI logs | Cancellation can reproduce one mechanism; actual CI cause remains unconfirmed. |

N-10 exception: containment is active in Railway (schedule removed; production URL corrected with skipDeploys), but the repaired worker has not been deployed. Scheduled notifications remain suspended. N-11 and N-12 are coverage corrections, not claimed new runtime vulnerabilities.

## Current candidate evidence

- PR216: full hosted CI38185274773 passed; independent review/integration pending.
- PR241 and PR247–258: ready/unmerged candidate records show successful full hosted checks; independent approval remains separate.
- PR259: current head95770878b67e5f93ea125fea884f42680d563351. Worker-image CI38188479558 and complete application CI38188479539 both report SUCCESS. Plan, fast, database, production, browser and verify passed; production-promotion readiness was skipped. PR remains draft/unmerged at the status read. This is candidate verification, not production release approval.
- No production/main merge or Railway deployment was performed for this report.

## Source documents

1. AMAANA_MASTER_REMEDIATION_PLAN(2).md — AM-01–AM-32 and subordinate requirements; 10 October2026.
2. AMAANA_MAIN_RELEASE_AUDIT(2).md — main2a8c35ad source audit and earlier-finding scoreboard.
3. amaana-foundation-complete-audit-&-remediation-blueprint-master-document(2).md — consolidated technical/product requirements; stale claims explicitly reconciled.
4. amaana_foundation_site_audit_remediation_blueprint(2).md — generic source; inaccurate stack/unsupported claims are not applied literally.
5. Current GitHub PR metadata and Railway deployment/configuration reads.

## Safety dispositions

No unsupported Shariah-compliant badge, invented Qurbani sponsorship prices, donor totals, registry identifiers or social links are approved by this report. Adding unsafe-eval or rewriting the intentional light theme is not a defect fix. Public admin login HTTP200, PUBLIC_-named server variables and standard escaped JSON-LD are not by themselves proof of an authentication bypass, credential leak or XSS exploit. Third-party security/CDN/provider settings and true screen-reader/payment checks stay unverified where current evidence is missing.

### Browser regression root-cause correction — 12 October 2026

CI 38285272953: 1,088 passed, 56 failed, 7 flaky. Newly added parent-route `loading.tsx` boundaries made public route checks inspect the streaming fallback before required page content and produced HTTP 200 for a legacy redirect that requires 307/308. Remove these five boundaries and unused skeleton code, preserving server-rendered response semantics. CSS also exceeded the 340 KiB cap by 3,484 bytes; removing the new CSS asset is safer than raising the budget. R-071 remains deferred. The full browser and production CI must pass on a fresh commit before integration; no production verification is claimed.

### R-024 parked-batch integration — 13 October 2026 IST

Baseline `87aa9c61` passed CI 38294121822: 1,151 Chromium and 24 Firefox/WebKit tests, fast/database/production/final verify green; JS 818,586/819,200 B and CSS 346,363/348,160 B. This evidence does not validate the newer candidate.

Integrate parked `58c10229` with recovery `a4e9fa78` / `fdab2ad9`: root-relative Companion typography; repair two literal backslash-n sequences preventing flex wrapping; add source regression guard and deterministic loaded-prayer browser checks at 200% text size. Source guard 2/2 and CI planner 33/33 pass locally; browser spec syntax passes. Local Chromium is unavailable. Hosted candidate browser/build validation remains pending; R-024 is not fully closed or deployed.

CI retains its per-ref concurrency group and disables cancellation of running checks. Required release checks and asset limits remain unchanged.

### Public media operational boundary corrections — 13 October 2026 IST

| ID | Confirmed source defect | Correction | Validation | Deployment |
|---|---|---|---|---|
| N-15 | Public helpers bypassed readiness-only public/private bucket separation | Enforce separation before S3 client creation across upload, curated upload, read and delete | Baseline rejects missing in all four operations; corrected probes pass | Parked candidate; not deployed |
| N-16 | Invalid public delivery URL could be rejected after S3 upload; credentials/query/fragments accepted | Validate before persistence and share safe-base policy with readiness | Five unsafe configurations reproduced; corrected probes pass | Parked candidate; not deployed |
| N-17 | Public media publication database lookup escaped the route error handler | Guard lookup; return empty no-store 503 with Retry-After and noindex on failure | Real-handler probe failed on baseline and passes after correction, before S3 access | Parked candidate; not deployed |
| N-18 | Public object reads were unbounded and did not reject truncated bodies | Reject oversized metadata before reading, bound streamed bytes to existing 5 MiB upload limit, close on overflow, verify completeness | Restoring only old reader fails three guards; corrected reader preserves valid streamed bytes/metadata | Parked candidate; not deployed |

Combined local actual-module/handler probes: 18/18 pass with inert external transports and persistence adapters. Add 18 hosted Vitest cases (17 storage, one route); local TypeScript syntax parsed, but Vitest dependencies unavailable. Hosted lint/typecheck/unit/build/browser checks remain required. No live storage, deletion, upload or production configuration inspection occurred; no claim that production private records were exposed.

### Origin guard and R-024 flaky acceptance correction — 13 October 2026 IST

N-19: production origin validation fell back to untrusted Host when NEXT_PUBLIC_APP_URL was missing, threw for malformed configuration, and accepted HTTP/credentialed/opaque-origin configurations. Require configured HTTPS origin in production; reject bad configuration without throwing; preserve development HTTP fallback. Five baseline cases failed; eight actual-helper probes now pass. No production misconfiguration/exploitation is claimed.

CI 38297387285 at `2697dec3` passed required jobs, but Chromium reported 1,149 passed / 2 flaky (shared Companion scaling at 390px/1280px). Firefox/WebKit 24 passed. Source/build budgets passed: JS 818,586/819,200 B; CSS 346,461/348,160 B. Two tests read 12px at the 24px kicker assertion after a separate root style mutation.

New consolidated candidate integrates N-15–N-18 from parked `0c695485`, adds N-19 source/tests, and reloads shared 200% typography checks with persistent enlarged styles and atomic root/text measurement. Normal and enlarged reading/prayer checks and wrapping assertions remain. Local actual-module probes 26/26 pass; browser spec syntax and new TypeScript test syntax parse. Fresh hosted combined lint/type/unit/build/browser validation remains required. R-024 and R-012 are not fully closed; nothing new is deployed.

### Stable gallery lifecycle — 13 October 2026 IST

N-20 source finding: array-index selection substitutes photos after reorder and can retain hidden body overflow/key ownership after selected item removal or an empty collection. Candidate preserves image identity and cleans up the modal, restoring connected thumbnail focus.

14 actual navigation-helper cases pass locally; 14 Vitest and three actual-component browser mutation cases added. The client wrapper is a disposable acceptance fixture excluded from production. Script/spec/unit syntax passed; rendered lifecycle, lint/type/build and client-byte verification pending. No defect closure/deployment/AAA certification claimed. Baseline 38300163971: fast/database/production passed; hosted units 704 passed / 9 skipped; browser running at last read.

### Actual-helper privileged media API matrix — 13 October 2026 IST

R-012 gains 37 start/upload/publish/status cases retaining real session resolution, permission checks and origin validation. Persistence and external work are inert. Missing/unresolved sessions and each missing scoped permission reject before domain/storage activity. Valid scopes across one or multiple roles reach an explicit authorized checkpoint, without publishing. Mutation origins reject before cookie/DB lookup. Query checks verify ACTIVE status, hashed session token and future expiry predicate; errors retain private/noindex headers.

Local actual-helper matrix: 37/37 pass. Restoring an always-allow permission mutation in a detached scratch copy causes 12 failures; production auth helpers are unchanged. Hosted Vitest validation remains pending; no full authenticated/live/external-edge certification claimed. R-012 stays partial.

Baseline `0d193c3e` passed full CI 38300163971: units 704 passed / 9 skipped; Chromium 1,151 passed without reported flakes; Firefox/WebKit 24 passed; fast/database/production/final verify successful. JS 818,586/819,200 B; CSS 346,461/348,160 B. The new candidate integrates parked N-20 plus this coverage; fresh combined checks must pass before release.

### N-20 cleanup warning follow-up — 13 October 2026 IST

d246e366 CI 38303371341 fast passed with three lint warnings: one unused test parameter and two effect cleanup ref reads. Hosted units 755 passed / 9 skipped; database passed; production totals JS 818,773/819,200 B and CSS 346,461/348,160 B. Browser still pending at the checkpoint.

Park a follow-up that uses a typed direct status-handler table, captures the dialog/ref array inside the effect, and recognizes removal via captured DOM connection state before focus restoration. No lint suppression or rule changes. Local test syntax parsed; fresh hosted lint/type/rendered-lifecycle and budget verification required. No extra defect count or production closure claimed.

| N-21 | Generated artwork bypassed the prebuild-only image weight check | Shared-cap bounded encoding plus postbuild image enforcement | 11 focused tests and actual7-derivative validation pass locally; baseline oversized guard reproduces failure | Parked candidate; not deployed |

| N-22 | One-year optimizer floor overrides managed media short source-cache policy | Lower floor60, explicit static-source year caching, 5MiB optimizer input cap and three browser cases | Config parsed and fixtures excluded locally; real optimizer and legacy-cache/withdrawal acceptance pending | Partial candidate; not deployed |
