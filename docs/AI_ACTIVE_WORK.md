## 2026-10-25 — CHATGPT_ACTIVE — Work takeover and #448 guarded merge

Owner explicitly hands implementation to this ChatGPT Work session with standing routine commit/PR/protected-merge authorization. This session is the sole repository writer. Protected main is now `454afc326c6e3d1db6a158ff9a8cd9b789c69ecc` after #448, exact head `bee2d9fd236516da9aef1c846551e91d6dc0c5a9`: full CI `40185446643` all seven jobs SUCCESS; separate ready-state CI `40202264976` plan/promotion/verify SUCCESS; no unresolved review threads. Local planning/parity suite 51/51 PASS. Railway website attempt `9a81a812-5845-45a6-b77f-a1b66e2bfb04` SKIPPED (scripts-only). Fresh uncached public version/readiness reads HTTP200: production/main `d262c8f17fa26bf3bf71c2709acce3b12fd046e0`, paymentMode live; ready.

Continue existing #447 `test/railway-iac-worker-parity-20261025` by normally reconciling #448/main and retaining only the complementary migration runbook plus these coordination records. The #448 auxiliaryServices comparator replaces the overlapping #447 operationalProfiles implementation; do not merge both schemas. Preserve both histories. Require new exact-head CI and separate ready-state promotion before guarded merge. #374 remains draft; #264/#361/#446 remain open; historical 149 totals unchanged.

Railway read-only production inventory: three services, three buckets, zero volumes, no staged work. Website effective RAILPACK/90s readiness/Singapore; worker dedicated Dockerfile/root, annual parked cron, node --check run.mjs, NEVER restart; preview pinned historical source and FAILED deployment, not production website outage. No variables read, sends, payment transactions, database writes or infrastructure apply. Actual #446 IaC import/plan remains BLOCKED: no installed/authenticated Railway CLI here and connected tools expose no config pull/plan. Next operations action: controlled authenticated config pull/migrate preview, preserve() review across all resources, then read-only exact-target config plan; never remove legacy files or apply blindly. Watch-policy rollout is separate.

Warning: truncated output (original token count: 96958)
Total output lines: 2075

## 2026-10-25 — CHATGPT_ACTIVE — PR #433 live; PR #434 merged tooling (no runtime release)

GitHub #433 `bbf6db62ee86063e2a03f709d1168c2f2c6f0d17` passed full seven-job CI `40129948886` and ready-state promotion/verify `40133153027`. Exact-head guarded merge produced main `b033e99982caaeb295726bf19df64ca1ffa7f7a3`; Railway deployment `a8d650de-9e24-4569-81d8-58d2b81e297b` succeeded. Fresh public `/api/health/version` matched `b033e99982caaeb295726bf19df64ca1ffa7f7a3`; `/api/health/ready` returned ready. This is release identity and readiness, not device/CWV/payment acceptance.

PR #434 `c91c0861fe218166ebd46e2411fbc34c5d0da7eb` passed full seven-job CI `40133473638` (including 11/11 focused route-bundle/CSS tests), separate ready-state promotion and verify `40136256260`, and exact-head merge produced main `771cba2e0c0cfe364962bc8db0f43581f8d958e2`. Changes only `.github/workflows/ci.yml`, `scripts/audit-live-route-css.mjs`, `scripts/test-live-route-css.mjs`. Railway attempt `5d749e49-9b1a-4881-be8d-dd1a19f7e5b0` reported SKIPPED by configured website watchPatterns (`src/**`, `public/**`, `prisma/**` and build config; excludes scripts/workflows). Production remains on #433 `b033e99982ca`, verified HTTP200/ready. Correct classification: **#434 merged source/tooling; no production runtime rollout required or claimed**. No forced redeploy or production config changes.

Next evidence lane AF-R057/AF-R068: run `node scripts/audit-live-route-css.mjs --json` from a trusted read-only environment for exact decoded CSS response byte baselines; do not confuse this with transfer bytes, unused CSS or Core Web Vitals. External raw-HTML inspections only confirmed 3/4/3/6/4 CSS link references on Home/Our Work/Impact/Donate/Request Assistance; external source payloads were truncated/rate-limited, so exact stylesheet bytes are **not** available from those samples. Keep the 149 classifications unchanged (1 completed, 59 implemented, 61 partial, 26 not started, 1 superseded, 1 not applicable). Notification delivery issue #264 remains disabled; localization PR #374 remains draft. No payment/provider/secret/finance/legal/privacy alterations.

## 2026-10-25 — ChatGPT handoff: #431 live verified, #433 continuation

Owner-provided 25 October handover explicitly transfers sole repository implementation to CHATGPT_ACTIVE; prior CODEX_ACTIVE entries below are historical. Verified GitHub #431 exact tested head `8dc4c0b7da92d240bef5475071b90443a9b39e0f`: full run `40125762941` all seven jobs SUCCESS. Marked ready with no head movement; separate ready_for_review run `40129381980` passed fail-closed Production promotion readiness and verify. Merged with expected-head guard to main `f9e4ec378cca008916c3e10c6abdbb98662e8c2a`. Railway website deployment `97bbab40-ad88-4a45-9d5e-5ee75233c802` SUCCESS. Fresh public `/api/health/version` HTTP200 returned exact merge SHA, branch main, environment production; `/api/health/ready` HTTP200 returned ready. This verifies release identity/readiness, NOT physical-device accessibility, religious policy, payment transactions or complete historic master closure.

Continue existing #433 `fix/audit-harness-native-loading-20261025` (remote previously `4afc65c78f36cbf4b5c92d2767ac0566f4cbabaf`) after #431 release. Original local docs-only checkpoint `2082c966` was not published; reconstruct its evidence via these current records rather than assuming fast-forward ancestry. #433 source changes cover full prayer-response boundary parsing, native audit verification and safe test DOM fixture. Prior local 2,156 unit PASS/15 skipped, typecheck, standalone content audit and bounded Chromium cases are source-only evidence. Retarget/reconcile #433 to main normally; require its own fresh exact-head hosted build, budgets, database, browser and ready-state promotion before guarded merge. No count change: 1 completed, 59 implemented, 61 partial, 26 not started, 2 excluded; #264 notifications remain disabled; #374 localization remains draft. Preserve content, privacy, compliance and real-transaction gates.

## 2026-10-25 — Complete prayer-response boundary prepared in follow-up433

CODEX_ACTIVE sole writer. Extend existing stacked433 (parent0341da44) with full prayer-response decoder; keep4318dc4c0b7 frozen under40125762941. Required current timetable/date/school/calculation labels are validated before React state. Invalid optional tomorrow and moon/eveningMoon become unavailable independently, retaining valid current timings and existing unconfirmed-date fallback. No prayer calculation/religious text/policy changes.

Three request-integration regressions failed on prior source (object-valued metadata, incomplete tomorrow, malformed confirmed-moon object); fixed decoder passes them and valid-data cases. Fresh full2156 units pass/15skip; TypeScript/scoped lint/spec syntax/diff pass. Independent review confirmed actual API compatibility, current-day preservation and sunset/date logic. Two isolated Chromium cases pass on pinnedPlaywright1.55 (malformed live update + malformed optional moon/tomorrow); tests await accepted sentinel/timetable, not a pre-fetch fallback. Local dev checks used an isolated archive and restored generated AGENTS/next-env/fixture materialization in repo. This is bounded local browser acceptance, not full hosted/physical-device certification.

Follow-up433 now includes audit-tool corrections plus completion of Companion response validation; MEDIUM frontend resilience. Hosted exact-head build/budgets/DB/browser and promotion remain required after parent431 acceptance/release and normal retarget/reconciliation. Historical149 totals remain unchanged; no new deployment claimed. Root report and feature tracker carry this checkpoint.

## 2026-10-25 — Prepared audit-harness correction; primary431 frozen

CODEX_ACTIVE sole writer. Branch fix/audit-harness-native-loading-20261025 is stacked on frozen431 candidate8dc4c0b7; primary431 fast/database/production pass under40125762941, browser running. Do not move431 or merge this follow-up ahead of its dependency.

AF-R011: standalone scripts/verify-master-content.cjs failed with EvalError under --disallow-code-generation-from-strings because it evaluated hand-transpiled source with new Function. Canonical invariants now live in ordinary imported TypeScript Vitest tests; existing standalone entry invokes the pinned repository runner without custom source evaluation. Parent/unique-slug/content/debt-privacy/locked-figure/organisation-heading checks preserved. CLI passes with string generation disabled in its launcher; two intentional bad-input mutations (umbrella count and debt amount) still reject. This is not a claim that every dependency process bans all dynamic execution.

AF-R010: visual-system fallback fixture now uses createElement/className/setAttribute/appendChild, retaining the same DOM hierarchy/selectors rather than innerHTML. Existing full visual browser acceptance remains required; no production XSS incident inferred from the former constant test string.

Fresh full2148 unit tests pass/15skip; TypeScript/scoped ESLint/spec syntax/diff checks pass. No runtime app behavior, dependency, migration, provider, payment or factual copy change; temporary invalid JSON test mutations restored before commit. R010/R011 remain historically Implemented with source correction/testing recorded, not fully closed. Report/feature tracker updated; no new runtime release claim. After431 full+promotion/guarded release, retarget/reconcile this focused follow-up normally and run required exact-head gates.

## 2026-10-25 — Consolidated shared public-shell candidate on existing PR431

Root reconciled the prepared Companion response corrections, complete Mission Control audit and corrected parent-section browser expectation into existing PR431 by normal ancestry. Fresh combined2145 unit tests pass/15skip,13 native calendar/prayer tests pass, TypeScript/scoped ESLint/spec syntax/diff pass. This supersedes the earlier separate-next-PR plan. No competing runtime PR is opened. Reuse fix/public-navigation-current-page-20261025 and run fresh full exact-head CI after publication. Initial431 a420 run40122502771:1348 Chromium passed/1 flaky/1 failed (old test expected page for a parent section); Firefox/WebKit did not run. e2e/public-shell now explicitly checks location+active on detail route and page on exact Our Work route. Both prior continuity prefixes and all history retained. No merge/live claim for consolidated source.

## 2026-10-25 — Mission Control parallel audit and Companion response resilience

CODEX_ACTIVE sole repository writer. Owner explicitly authorized swarm research and all backlog commits/merges/deploys; five independent read-only divisions audited26 not-started,59 implemented,61 partial, release evidence and next-source defects. Root verified exact unique-ID equality against149-row Section7. Full report: AMAANA_MISSION_CONTROL_AUDIT_2026-10-25.md. No forced completion percentages or invented stall reasons.17 partial rows need substantial implementation,27 measured source/acceptance and17 external/manual evidence.

Prepared fix/companion-response-resilience-20261025 from main d6d6fe07 (docs-only after runtime91b3631b). Three live-update response regressions and one malformed-tomorrow prayer regression fail on old source. Runtime filters malformed live entries, retains valid native internal destinations/fallback, and tolerates unavailable tomorrow timings after Isha.2141 local units pass/15skip;13 calendar/prayer Node tests pass; TypeScript/scoped lint/spec parse/diff pass. Independent review corrected browser regression to await a valid sentinel after malformed first entry. Hosted/new browser/build/budgets still required; no release claim for prepared batch. No religious policy/payment/auth/provider/DB change.

PR431 a4204143 remains frozen under40122502771; fast,DB,production pass (JS804357/CSS328563), browser failed one stale parent-section aria-current expectation; correction/fresh full acceptance required. Complete its full+promotion/release before normal next-candidate reconciliation. Current main d6d6fe07 differs from public91b3631b only by feature tracker docs; Railway skipped docs-only deployment. Fresh public version/ready matched91b3631b, HTTP200. #264 delivery stays disabled/open, #374 draft retained, #361 archive recovery remains feature-scoped. AF-N13 official advisory withdrawn23Oct; proposed execution-lane reconciliation only, no invented patch. Historical counts remain1completed/59implemented/61partial/26notstarted/2excluded until accepted row-level changes.
## 2026-10-25 — Work session takeover and public navigation semantics

CODEX_ACTIVE sole implementation writer under owner handoff and renewed explicit commit/merge authorization. Branch fix/public-navigation-current-page-20261025 descends from main 91b3631b. PR #430 c61b285d passed full CI40102771696 and promotion40119313861, then merged with expected-head guard as91b3631b. Railway website a3faf244 SUCCESS; fresh public version HTTP200 reports91b3631b0323b9b0ac97d8298024f16deadce406 and readiness ready. Scrapes01a16f3e-6e7d-735b-bbce-e55fcf2c5642 /01a16f3e-6e87-7421-bdd7-814ed2303319 independently certify this release.

Reproduced three public navigation defects with rendered-component fail-first tests: nested sponsorship footer announces two current pages; feedback footer misidentifies its Contact parent as current page; header labels section parent as current page. Footer now marks exact destinations only; header preserves existing active classes but uses aria-current=location for parent sections. Four component tests pass, all2139 unit tests pass/15skip, TypeScript/scoped ESLint/spec parse/diff checks pass. Two browser cases prepared for390/1440px, not executed locally; full hosted exact-head and promotion remain required. No full AF-R042 closure.

AF-R076 investigation: fresh Firecrawl Contact fetch HTTP200 scrape01a16f3b-85cb-76fd-9b9f-49b511c66a1c lists canonical mailto and donation-support href; no broken Cloudflare href reproduced on this route. Record bounded evidence, do not invent a patch or close other unexamined routes. Preserve #374/#264, financial/privacy gates and existing history. Continue production identity verification and this candidate's protected acceptance.

## 2026-10-24 — Navigation capture target guard prepared locally

CODEX_ACTIVE. The document-level navigation click listener assumed every event target was an Element. A document-target click deterministically threw TypeError from closest(). New focused regression failed before the fix and passes after an instanceof Element guard. Non-element events are ignored before anchor lookup. Scoped ESLint and diff checks pass. This is local source proof only; full hosted acceptance and publication remain pending, no new deployment claimed. Includes prior verified #429 containment checkpoint below.

## 2026-10-24 — Verified containment release checkpoint

CODEX_ACTIVE under standing owner commit and qualifying-merge authorization. GitHub PR #429 merged normally at main `fa385c25ab97ea6dabd64b9a124eee33ecadf6fe`. Exact candidate `48f55d79d1a12a0f05f6759d79a7570aa450df42` passed full CI `40091754703`, isolated worker-image run `40091754704`, and ready-state promotion `40097640245`. Fresh local native Node suite: 16 passed, zero failed.

Railway worker deployment `33ad2fc9-23ca-4238-9678-ba586f368d9c` is SUCCESS for this main SHA. Independently inspected live worker configuration: source root `/ops/notification-cron`, Dockerfile builder, `node --check run.mjs`, annual `0 0 1 1 *`, restart NEVER, staged changes null. No delivery invocation or infrastructure mutation performed. This verifies safe containment, not recipient delivery; issue #264 remains open. Preserve #374, all privacy/legal/factual/payment locks and historical 149-item counts.

Earlier instructions to reconcile or release #421/#422 are superseded: both are merged; main subsequently includes #425–#428. Last independently observed public website SHA `5c1a55ae070d156528a9640174337e97a0dbd198`, readiness ready; do not infer a newer website deployment from worker SUCCESS. Continue from current GitHub main and inspect open candidates before source edits.

## 2026-10-24 — #421 reconciliation with released #422 (ChatGPT chat continuation)

Existing PR #421 reconciled against main d9b77cce (#422 Zod security fix) under standing owner authorization. Carousel source/tests remain independent of #422. Both engineering history logs retain their complete prior records. PR remains DRAFT pending fresh exact-head complete hosted acceptance and protected promotion. Railway confirms amaana-platform deployment c61688d7 SUCCESS for d9b77cce, but public exact SHA/ready response not independently verified. Separate notification-cron has a failed build and earlier crash; do not confuse this with the website. Preserve hard JS/CSS budgets, #374/#264, 149-item history, beneficiary/privacy/payment/legal constraints. No new main release claimed.

## 2026-10-24 — Integrated preview verified; fresh-press source checkpoint for #421

CODEX_ACTIVE sole writer under standing owner publication/merge authorization. Prepared source6b0ff666 extends remote42119c54a3f with same-owner fresh-press recovery, ordinary-click preservation and foreign-pointer safety. All28 focused units and27 local Chromium carousel cases pass, plus TypeScript/scoped lint. Keep #421 DRAFT until #422 release and normal reconciliation; its present old dependency graph is not certified by the following preview.

Read-only integration preview of this source plus frozen422cab0d8e: all2,094 unit tests pass/15skip; Next production build and client secret scan pass; JS803961/CSS325561 within unchanged819200/348160 limits. Application files merge cleanly; only both continuity logs require union/history-preserving resolution. This preview is not a main merge, hosted exact-head acceptance or deployment. Additional generated-validator QA:355 Chromium/Node normalized result/error comparisons pass with unsafe-eval disabled. #422 hosted40025105884 remains fast/database/production successful, browser in progress. Release422 through full/promotion gates and verify Railway/public SHA/ready first, then reconcile421 and obtain its own fresh complete hosted acceptance. Last live d753be6;374/264, factual/legal/privacy/payment locks and149-register counts unchanged.

## 2026-10-24 — Same-owner fresh-press recovery completed locally for #421

CODEX_ACTIVE sole writer. New #421 follow-up from remote19c54a3f handles a fresh primary mouse press from the existing owner before any hover/released-button signal arrives. Old state ignored that press, so the next drag did not move and the next ordinary click could be suppressed. Two regression tests fail with the prior guard; the source now releases only the same owner through existing releaseDrag, then arms the new press. A different pointer's press remains ignored and is explicitly tested. No global event listener, dependency, CSS or policy changes.

Local verification: all28 carousel interaction/rotation unit tests pass; all27 body-carousel Chromium cases pass on pinned Playwright1.55/Turbopack, including the new no-hover fresh-press browser case; TypeScript, scoped ESLint, JS parse and diff checks pass. Both fresh drag/click tests were verified RED by removing same-owner recovery and GREEN after restoring it. Current remote #421 remains19c54a3f until this checkpoint is published/reconciled; no merge/live claim. #422cab0d8e remains unchanged under hosted CI40025105884: fast/database/production pass (803741JS/325561CSS), browser still running. Release422 through protected gates and verify live before normal421 reconciliation/full acceptance. Last live main d753be6; preserve374/264, content/privacy/payment locks and149-counts.

## 2026-10-24 — Validated carousel follow-up checkpoint for existing draft #421

CODEX_ACTIVE sole writer. Publish the prepared carousel source and corrected harness on existing #421, parent e73ba1ad, for durable continuity; this supersedes earlier instructions to hold all source locally. Release order is unchanged: #422cab0d8e full acceptance/promotion/main merge/live verification first, then normal #421 reconciliation and fresh exact-head full CI. Until dependency remediation lands, #421's old dependency graph remains audit-blocked; do not promote it. No competing branch, no gate bypass.

Completed local proof: all26 carousel interaction/rotation unit tests, all26 body-carousel Chromium cases at375–1920px, TypeScript, scoped lint and diff checks pass. Removing both frame-ref resets makes both lifecycle browser cases fail; restored source passes. Missed-pointerup recovery is a4-line handler change using existing owner-scoped releaseDrag, with2 fail-first regressions plus a foreign-pointer guard and a passing browser case. RAF test harness now resumes only still-live callbacks and never invokes cancelled callbacks. This is local source/carousel acceptance, not live release or full-site/physical-device certification. #422 hosted fast/database/production passed including803741JS/325561CSS; browser remains running at checkpoint. Last verified production main d753be6. Preserve #374/#264, legal/media/payment locks and149-register counts.

## 2026-10-24 — Local carousel browser recovery and fail-first proof completed

CODEX_ACTIVE sole writer, prepared #421 source on local06a915c1. Installed the same Playwright1.55.0 runtime pinned in CI; headless Chromium1187 download succeeded via its available mirror. Local Turbopack test server used after webpack rejected existing global CSS-module selectors (no styling/runtime changes made for that environment issue). All26 body-carousel Chromium cases pass, covering375–1920px, reorder/shrink/empty restoration, drag/click, keyboard, autoplay, and all3 newly prepared cases. This is isolated local carousel acceptance, not complete site/physical-device/live acceptance; unrelated actual about-route navigation lacks local database data. Frame-regression browser tests were verified RED by removing both frame-ref resets (exactly2 failures), then restored; corrected harness resumes only live non-cancelled callbacks when restoring RAF, rather than cancelling a newly rearmed frame itself. All26 carousel unit/rotation tests pass. Keep #422cab0d8e frozen while hosted browser acceptance runs; its fast/database/production gates and exact803741JS/325561CSS budgets have passed. Hold local #421 additions until #422 normal protected release/live verification, then reconcile and run fresh exact-head acceptance.

## 2026-10-24 — #421 prepared missed-pointerup recovery while #422 acceptance is frozen

CODEX_ACTIVE sole writer. #422 exact head cab0d8e remains frozen under full CI40025105884; fast/database/production pass, hosted JS803741/CSS325561, browser pending. Working from existing #421 head e73ba1ad, not reconciling #422 before release. New deterministic carousel bug: owner pointermove with buttons0 returned without clearing drag/snap when pointerup was missed; subsequent pointerdown was ignored. Two fail-first tests reproduce threshold and pre-threshold stale ownership; one foreign-pointer guard stays green. Narrow fix invokes existing releaseDrag only for the owning pointer after the primary button is released. All26 carousel interaction/rotation tests pass; synthetic browser recovery case prepared, not executed. No native physical-device claim. Hold these local source changes for #421; after #422 passes full gates, ready-state merge and live verification, reconcile normally and publish the combined #421 candidate for fresh full acceptance. No provider/payment/privacy/content or budget changes, no historical count changes.

## 2026-10-24 — Carousel pending-frame lifecycle recovery (draft, not deployed)

Owner CHATGPT_ACTIVE sole writer. #419 exact head `5b9daf3548c0020b272144738db693e16227d033` passed full + ready-state and merged normally to `main` `9c70cfd302f6c2b4e5e25c4519c359fe709bb3fb`. Railway deployment `17e4c86c-37eb-46c4-8bb8-35ac631cc708` SUCCESS, public version and readiness match main/ready. PR #420 merged its prepared source normally into the #419 main ancestry at candidate `463d0738ba29790f010e49e2d2578a676494f0a7`, full protected workflow `40015115209` ongoing (fast success, browser/database/production queued on first read). No merge of #420 claimed.

New next fix `fix/carousel-frame-rearm-on-slide-change-20261024` descends from #420; corrects a verified-by-source lifecycle bug introduced by frame coalescing: cancelling a pending requestAnimationFrame in either slide-change or ResizeObserver effect cleanup did not reset `frameRef.current`. Because coalescing now ignores new updates while ID is nonnull, a cancelled frame (whose callback never fires) could indefinitely block subsequent progress updates. Fail-first unit regressions added to `src/components/scroll-carousel-interaction.test.tsx` for slide list change and observer cleanup while scroll RAF is pending. Narrow production fix: clear `frameRef.current` immediately after cancellation at both sites. No new dependencies/CSS/assets, no header/content/figures/security/payment/provider work. Tests are committed but **not hosted accepted yet**; do not claim real browser proof or deploy. After #420 protected full CI + ready-state/merge/live proof, reconcile this follow-up branch by normal, non-force ancestry, run fresh exact-head full CI and enforce unchanged hard JS/CSS budgets. Historical 149 entries unchanged, preserve #374/#264.

## 2026-10-24 — Patched dependency payload solution prepared for #422

CODEX_ACTIVE sole writer. Owner supplied additional reference repositories; inventory in ENGINEERING_REFERENCE_REPOSITORIES.md. Applied Superpowers/Agent Skills and Ponytail principles after reading the relevant installed skills and upstream README sources through GitHub.

Resolved local payload regression without dropping validation: generate one self-contained browser ESM module from the unchanged canonical curated-gallery schema using pinned Rolldown1.2.15 (already installed through Vite). Zod remains4.6.7 in both source and generated artifact. Client importer changes its import path only. Source-inferred declarations preserve types. Full original contract tests now execute against both source and generated schemas, with deterministic regeneration and oversized-record resource tests. Build checks committed artifact freshness; no server/API, permissions, media policy, secret/provider or protected workflow changes. Zod MIT notice retained in generated artifact; generated JS alone is excluded from style lint and verified by regeneration plus behavioral tests.

Local measurements under identical Next build conditions: baseline Zod4.1.5 JS819026; patched4.6.7 before preprocessing838219; generated-schema browser import803741. CSS325561 unchanged. Fixed caps819200/348160 both pass, headroom15459JS/22599CSS. 2,087 unit tests pass/15skip; focused58 pass, TypeScript, secret boundary and deterministic generation pass. Full lint/audit verification and fresh hosted exact-head CI remain release requirements. Prepared follow-up belongs to existing #422; do not create a competing PR. #421 e73ba1ad remains separate and unreleased; reconcile normally after #422 verified release. Last live main d753be6. Preserve #374/#264 and149-item counts.

## 2026-10-24 — Security patch published; hard JavaScript budget remains blocking

CODEX_ACTIVE sole writer. Remote security PR #422 head d2c2585ba9cf9dc169e94524dfe4f1ad4f0a3a12 is DRAFT; local equivalent source checkpoint ca3eb3bf. Patched Zod 4.6.7 clears audit (zero vulnerabilities), 2,058 unit tests pass/15 skip, TypeScript and focused ESLint pass. Clean local Next build and secret scan pass. Matching baseline build with 4.1.5: JS819026/CSS325561; patched 4.6.7: JS838219/CSS325561. This is a +19193-byte dependency regression and 19019 bytes over the immutable JS819200 cap. CSS348160 cap passes. A measured optimizePackageImports zod/mini experiment produced identical838219 bytes and was fully reverted; do not introduce that ineffective config or relax limits. Source trace: client curated-gallery importer performs full manifest validation via Zod mini; preserve that validation and all server checks. Remaining work is a reviewed bounded payload solution plus exact-head protected CI; no merge/deployment of #422 or #421. Hosted #421 e73ba1ad failed dependency audit in40023100020 before browser checks. New #421 real-update browser tests remain unverified. Production remains independently verified #420 main d753be6. Preserve #374/#264 and149-register counts. This checkpoint is local; #422 PR description records the public budget blocker.

## 2026-10-24 — Codex owns implementation; Zod advisory remediation preempts carousel release

CODEX_ACTIVE sole writer under owner assignment and renewed commit/publication/merge authorization. Production main d753be6 is LIVE_VERIFIED (#420). Carousel PR #421 published e73ba1ad; fresh CI 40023100020 failed at production dependency audit before browser/DB/build tests. Verified GHSA-mrhx-c7xc-m3w5 affects pinned Zod 4.1.5 (<4.6.6), independently reproduced locally. No gate bypass or #421 release claim.

Current atomic branch fix/zod-resource-exhaustion-20261024 is based on released main. Pin Zod 4.6.7 plus exact lockfile integrity; no other dependency changes. Three regression tests assert oversized constrained collections stop before element validation/issue amplification in standard and mini APIs, while valid collections and in-bound error paths remain correct. Old dependency: two security tests fail; patched dependency: 3 tests pass, full suite 2,058 passed/15 skipped; npm audit --omit=dev reports zero vulnerabilities. No production-data test, schema, financial/auth logic, provider settings or budget changes. Full protected exact-head checks/build/browser/budgets and promotion gate required before authorized merge. Rollback: revert package manifest/lock/test change. After release, reconcile #421 normally, rerun full acceptance, preserve #374/#264 and 149-item counts.

## 2026-10-24 — #419 merged, #420 carousel optimization reconciliation

CHATGPT_ACTIVE remains sole writer. PR #419 exact head `5b9daf3548c0020b272144738db693e16227d033` full `40008820718` SUCCESS: 2,053 unit tests, 1,335 Chromium and 24 Firefox/WebKit passed; fast/database/production/final verification and ready-state `40014760496` succeeded. Normal GitHub merge to main `9c70cfd302f6c2b4e5e25c4519c359fe709bb3fb` succeeded. Railway deployment `17e4c86c-37eb-46c4-8bb8-35ac631cc708` BUILDING on initial read; **public exact SHA/ready confirmation pending, do not claim live**.

#420 `perf/carousel-capture-once-20261024` source descends from #419. It implements once-per-drag pointer capture and snap-style write after 6px threshold, and coalesces pending scroll animation-frame requests; tests in `src/components/scroll-carousel-interaction.test.tsx` assert one capture, one style write and one RAF across repeated events. Old head `9f766cc89ca85321075e5c9f681c0ccfff6d5d59` fast 2,055 units, database, production budgets SUCCESS; browser full run `40011118244` still running as of reconciliation. Its original exact-head production build JS 819,026 / CSS 325,561 under hard 819,200 / 348,160. **Previous head success is not acceptance for combined main.** Reconcile by normal non-force two-parent merge preserving #419 main and #420 source; a fresh full exact-head protected run (fast, DB, production, Chromium, Firefox/WebKit, final) and ready-state is mandatory before #420 merges. Preserve #374 draft locales, #264 staged worker, registered figures/legal/privacy/finance policies, unchanged 149-register counts, and merge-on-main deployment.

## 2026-10-24 — #418 protected merged; #419 combined clock optimization candidate

Owner: CHATGPT_ACTIVE sole writer. PR #418 full protected workflow `40004240532`: fast 2,051 unit passed / 15 skipped, Chromium 1,335 passed, Firefox/WebKit 24 passed, database and production budgets passed, final verify SUCCESS. Ready-state `40008381073` passed; normal merge to `main` `acba777e3eb4c9cf47941fbc36ad679012a80c36` succeeded. Railway deployment `eae4f141-5490-441b-971f-c7bb6957e7e6` BUILDING at initial integration read; **verify Railway SUCCESS and public exact SHA/ready before calling release live**.

PR #419 `perf/companion-clock-single-format-20261023` is the sole next source candidate, descended from original PR #418 head `2e8e3f2`, with new backwards-compatible clock snapshot reuse across root reminder/date and the lazy panel's reading/next Salah consumers. New regressions added in existing Node and Vitest files. Original pre-reconciliation head `8288bf53b8089b1fb9f869b9044d80a2bb434635` fast passed 2,053 unit tests / 15 skipped and database and production succeeded; production aggregate 819,044 JS / 325,561 CSS against fixed hard limits 819,200 / 348,160. This is prior-SHA proof only. Reconcile #419 by normal two-parent merge retaining #418 main and all #419 additions. Require fresh full exact-reconciled-SHA CI (unit/Node, TS, database, production/budgets, Chromium, Firefox/WebKit, verify), ready-state and normal SHA-leased merge before any new deployment; no bypass or direct main writes. No religious copy, external facts, privacy, beneficiary media, payment, provider, pipeline or budget changes. 149 historical defect totals unchanged. Leave draft locale #374 and staged notification worker #264 untouched.

## 2026-10-23 — Prepared single-snapshot Hyderabad clock optimization, after PR #418

Owner CHATGPT_ACTIVE, sole active implementation writer. PR #418 frozen exact head `2e8e3f214a19c05c4f18d365941859c10306c0d1`, full run `40004240532` fast (2,051 tests), database and production SUCCESS; browser currently running and no merge claimed. New follow-up task branch `perf/companion-clock-single-format-20261023` descends directly from the #418 tested candidate to avoid source conflicts. The public Companion previously called `hyderabadClock(now)` twice per 30-second render (date + reminders); the lazy panel called it again in `dailyReading` and `nextSalah`. Source now passes one civil clock snapshot to all dependent readers via backwards-compatible optional parameters; tests added to site-wide render, panel render and Node domain suite. Changes are source-only and not independently hosted-tested, merged or deployed; no measured LCP/INP or bundle claims. Clock equality and strict Hyderabad time windows are tested in the domain suite. Require #418 exact-head browser/final and ready-state, normal merge and independently verified live SHA before reconciling this branch with merged main. After reconciliation require fresh exact-head full CI, JS ≤ 819200, CSS ≤ 348160, protected ready-state, normal merge and Railway verification. No payment, legal claims, beneficiary photos/data, religious text, backend, CI caps, #374 draft or #264 staged worker changes. Preserve 149 historical register counts.


## 2026-10-24 — Carousel #417 merged; Companion #418 revalidated head

CHATGPT_ACTIVE sole writer. Protected PR #417 full run 39999238486 passed (2,050 units, 1,335 Chromium, 24 Firefox/WebKit) and ready-state 40003970427 passed. PR #417 merged normally at `1a9b3caada419d7730712527b4c2f2f6a30e24d1`; Railway deployment `87a3255b-64ef-45a1-9c3d-eccac75fa82e` was BUILDING at merge read, so do not claim LIVE_VERIFIED until independent public SHA/ready endpoints match. PR #418 adds a safe day-level Islamic-civil fallback cache and visibility-aware Companion clock with tests. This two-parent reconciliation preserves both histories and carries all four PR #418 source/test files onto latest main. **Fresh full exact-head acceptance and ready-state verify are required; previous branch tests do not certify combined tree.** No protected budget exceptions, FCRA/80G, donor, media, payment, or external settings changes. Historical 149-entry counts unchanged.

## 2026-10-23 — Companion cache + background-clock source completion

CHATGPT_ACTIVE owns repository writing; PR #418 draft branch `perf/companion-daily-calendar-cache-20261023` advances earlier day-level calendar cache to include hidden-tab clock suspension and visibility recovery in `src/components/islamic-companion.tsx` plus dedicated Vitest lifecycle tests. Source candidate `2cce0e106529714db789a4c098d98cdd0fc2c7f1` before this metadata checkpoint; **no hosted acceptance or production verification yet**. Release gates on exact final head required and future main movement from #417 must be reconciled normally. No public religious text/factual/legal/media/payment changes; 149-register count unchanged.

## 2026-10-23 — Site-wide Companion daily-cache optimization

Owner CHATGPT_ACTIVE (sole writer). Task branch `perf/companion-daily-calendar-cache-20261023` is based on last live-verified `main` `463bbeecad48b527bec5d73a32083269987077ab`. PR #417 head `69447d7a7e8a47d8cac35499ea5e4d84c29b1ed9` remains separate and under exact-head full browser acceptance `39999238486`; DO NOT attribute earlier #417 checks to a future merged tree. Fasting reminder fallback previously rebuilt an Intl Islamic-civil formatter and parsed three dates on every 30-second global Companion update. Added regression showing repeat calls should reuse the unchanged Hyderabad civil day's three-date window (Node source-equivalent RED 6 rather than 3 conversions; GREEN 3); code memoizes only the estimated day-level safety result, preserves confirmed Hijri override and time windows. No public texts, religious facts, FCRA/80G, payment, beneficiaries, images, DB or CI changes. Target source `src/lib/daily-companion.ts` and `scripts/test-daily-companion.mjs`. Exact-head repository Node tests, full CI and JS/CSS budgets not yet checked; no merge/deployment/defect closure claim. Historical 149-entry counts unchanged. Next: run protected tests, measure aggregate JS ≤819,200, then reconcile against main after PR #417 is released.

## 2026-10-23 — PR #417 integration tree prepared after live #416

Owner CHATGPT_ACTIVE, sole implementation writer. Main `463bbeecad48b527bec5d73a32083269987077ab` is independently LIVE VERIFIED on Railway deployment `238a08a5-1dba-442e-b7d4-ade914ddb51e` with public production version/ready. PR #416 full `39992918369` passed 2,047 unit / 1,334 Chromium / 24 Firefox-WebKit and ready-state `39997896940` passed. PR #417 (`fix/carousel-pointer-lifecycle-20261023`) was based on #415; its old exact head `999aa84944360ad1fa078860f4724cbae8868e6e` had fast/database/production success, browser failed one stale parent-section aria-current expectation; correction/fresh full acceptance required. Prepare normal non-force merge of #416 main and #417 source (no source-file overlaps) and run a NEW full protected acceptance against the combined SHA before PR promotion/merge. Modified scope: carousel pointer-ID ownership, lost-capture drag-click suppression, unit and browser regressions only; no changes to payment, auth, donor facts, images, CI gates, or budgets. No completion or production claim for #417. Historical 149 entries unchanged; #374 draft and #264 staged worker untouched.

## 2026-10-23 — Carousel lost-capture click safety; independent draft candidate

Owner CHATGPT_ACTIVE, sole repository implementation writer. Branch `fix/carousel-pointer-lifecycle-20261023` derives from main `4006b9b8e12e3b0887de9450fa597ab3f0755f9d` (PR #415 verified live). PR #416 is independent and frozen at exact head `2bad2521e7b0bdc0628eeffae95ec529e49affab`: fast 2,047 units/15 skipped, database, production SUCCESS, browser run `39992918369` in progress at last read; no merge/deployment until full verify/ready gate.

## 2026-10-23 — #415 protected release merged; next motion input hardening candidate

Owner CHATGPT_ACTIVE, sole writer. PR #415 head `a7240c3f3f375f8c24ec989f01b70d39d980905e` full run `39987524639` SUCCESS: 2,032 unit tests passed/15 skipped, 1,332 Chromium passed, 24 Firefox/WebKit passed, database, production audits/budgets and final verify. Ready-state run `39992210391` verified successfully, application jobs intentionally skipped. PR #415 merged to main as `4006b9b8e12e3b0887de9450fa597ab3f0755f9d`; Railway deployment `359fc666-be04-4f41-80f2-21ac945abcce` was BUILDING at checkpoint, **do not claim production live until Railway SUCCESS and public version/ready confirm**.

Prepared next branch `fix/touch-press-ownership-20261023` descends from the #415 head and holds only additional motion input recovery and regression tests since that ancestor. Treat it as a distinct draft release candidate, never source-validated by #415's earlier full checks. New scope: document hidden-tab cleanup; owner-aware keyboard Enter/Space, IME/composition and modifiers; mixed touch/keyboard held interactions; pointer/focus exit ownership; zero-array-allocation held-owner lookup; synthetic Playwright regression. New full protected tests/production budget must pass on exact follow-up PR head before any next merge. No cross-PR claim, provider/payment/public facts/security changes. Historical 149 entry counts unchanged, #374 draft translations and #264 Railway notification worker untouched.

## 2026-10-23 — Prepared next motion lifecycle/keyboard ownership batch

Owner: CHATGPT_ACTIVE (sole writer). Next batch is on existing `fix/touch-press-ownership-20261023`, latest prepared source/tests `5c315d170f6a6bd4afd4508b3b88229bd956ecfd`; shared ancestor `a7240c3` is PR #415's immutable exact-head acceptance candidate. Do not move #415 while its hosted browser run `39987524639` executes. At latest read, #415 fast (2,032 unit passes/15 skips), database, production-build/budgets (818,088 JS / 325,561 CSS) are SUCCESS; browser/verify not yet concluded. The next-batch source and tests are NOT part of PR #415 and have no hosted acceptance claim.

New fail-first regression coverage and narrow handler corrections beyond #415: document visibilitychange clears active press/animation state even without window blur; IME-composing, Ctrl/Alt/Meta and previously handled keydown do not start artificial press feedback; matched keyup releases a prior owned press even when its modifier, composition or default-prevented state changed; unowned keyup after composition does not animate. Keyboard/touch simultaneous ownership and unrelated hover/focus exit preserve the pressed state until the last owner releases. Existing pointer-owning reset logic is maintained. One additional browser synthetic visibility and one keyboard key lifecycle test committed; these do not certify physical touch or IME devices. Removed transient array allocation in hover/release hot path with an owner scan. No backend/security/data/financial/provider/media or style redesign changes; no CI relaxation.

Next, finish PR #415 exact-head browser/verify, promote ready-state and normal SHA-leased merge only on SUCCESS; verify Railway and live public version/readiness exact merge SHA. Only after that rebase/reconcile this branch against updated main using non-force ancestry; open one substantive follow-up PR with fresh unit/TS/build/browser/production budget acceptance. Do not mark a whole historical defect closed or deploy minor chunks. Preserve #374 locales draft and #264 staged worker. Historical 149-entry counts unchanged.

## 2026-10-23 — Next motion lifecycle checkpoint, isolated from #415 acceptance

Owner: CHATGPT_ACTIVE (sole writer). Prepared follow-up branch `fix/touch-press-ownership-20261023`, now beyond PR #415's immutable combined acceptance head `a7240c3f3f375f8c24ec989f01b70d39d980905e`. Do NOT force-push or move PR #415 while its exact-head run `39987524639` remains in browser acceptance; fast (2,032/15), database and production audits/budgets PASS at that head. The #415 candidate already contains initial pointer ownership plus date integrity; follow-up source in THIS branch is separate, not certified, not an alternate release head.

Further actual-handler defect cases prepared with tests first: a window may become hidden without `blur`, leaving a pressed animation; document `visibilitychange` now clears owned animations/pointer state. Delegated keyboard feedback previously handled composing, Ctrl/Alt/Meta and already-prevented Enter/Space as ordinary presses; narrow input-ownership guards now skip these while preserving native Enter/Space. An unrelated mouse pointerout/focusout previously reset a held touch press on the same control; feedback now checks active pointer ownership before resetting. Replaced repeated spread-array pointer-owner checks with a single allocation-free scan. Dedicated Vitest regressions and one synthetic real-page visibility browser regression were committed; **none of this follow-up has hosted unit, type, browser or budget certification yet**. No production or config changes, no new PR. Human/physical touch and actual IME not claimed.

When #415 final hosted run completes: if full SUCCESS, ready-state promotion/verify then normal SHA-leased merge and exact Railway/public version/ready verification. Then reconcile follow-up branch against new main by ancestry and batch its source into one separately tested PR, no immediate tiny deployment or combined source misattribution. If #415 browser fails, diagnose exact logs before changes; never treat another head's test outcome as release evidence. The 149-entry register counts remain unchanged. Preserve #374 draft locales and #264 staged notification worker.

## 2026-10-23 — Prepared touch-pointer recovery, awaiting #415 first acceptance result

Owner: CHATGPT_ACTIVE, sole writer. Combined development checkpoint on `fix/touch-press-ownership-20261023`, descended normally from PR #415 source `58dfa2881225652c25ba56e92a7d02b354e5c55a`; do not merge/release before exact-head hosted acceptance. Current #415 run `39982714271`: plan/readiness/fast/database/production SUCCESS, browser executing at latest read. Keep existing #415 source unchanged until that browser run completes; then prefer fast-forward integration of this prepared source into the same substantive release candidate (rather than deploying an extra tiny change), retaining ancestry and fresh full acceptance for the final combined head. No force push or bypass.

Bounded source finding: delegated touch `pointerdown` feedback in `src/components/site-motion.tsx` previously used the terminal event's target for `pointerup`/`pointercancel`. When a touch release arrives outside an interactive control, there is no targeted action to reset pressed feedback. A non-primary/foreign pointer must not release another touch, and concurrent touching pointers must retain feedback until final release. Implemented pointer-identity ownership with cancellation/blur cleanup and touch-safe end handling; kept ordinary mouse/keyboard/reduced-motion recovery. Unit cases prepared for outside-target release, foreign IDs and concurrent IDs; actual-page synthetic touch regression prepared in `e2e/site-motion-scroll.spec.mjs`. Do not misrepresent synthetic events as physical-device acceptance. Change is IMPLEMENTED_SOURCE / CI NOT YET RUN; no runtime/source closure count change.

AF-R076: independent live-browser inspection of Privacy, Contact and donation-support mailto anchors confirms final decoded hrefs and clickable behavior after Cloudflare edge transform, so no app/provider change warranted; other affected URLs not completely surveyed, no item closure. #414 is exact-SHA live and ready `3478208bcd8a96cdd504e40b8026c38f547578da`. Keep translations #374 draft and staged Railway notification worker #264 untouched. No payments, auth, sensitive data or media changes. Preserve historical 149-entry totals.

## 2026-10-23 — ChatGPT takeover, #414 live, JSON-LD calendar correctness

Owner: CHATGPT_ACTIVE, sole repository implementation writer after the owner's explicit transfer from the exhausted Work/Codex session. Current branch `fix/jsonld-calendar-integrity-20261023` is based on exact main `3478208bcd8a96cdd504e40b8026c38f547578da`. The outgoing writer must remain stopped; its local metadata-only checkpoint `fc964ad` was never published and is not a remote source of application code. This branch holds the new work and coordination; no commits directly to main.

Release #414: full application run `39976079427` SUCCESS (1,330 Chromium passed, one flaky assistance-step visibility case on retry, 24 Firefox/WebKit smoke passed). Ready-state run `39980712345` SUCCESS (application jobs intentionally skipped, not substituted for full acceptance). Exact source `95b6e3e1ba636ddeb99737475cfc437c2e8e1694` merged normally to `3478208bcd8a96cdd504e40b8026c38f547578da`. Railway deployment `419cb48d-5b7b-4da0-b6e4-f9d1935dcb15` SUCCESS; independent fresh public version/ready responses confirm exact SHA/main/production, status ready, paymentMode live (no transaction test). #414 production aggregate JS 817,759 / CSS 325,561 bytes versus hard budgets 819,200 / 348,160; no per-route CWV claim. Historical 149-entry master counts unchanged.

Next bounded source task: `src/lib/structured-data.ts` feeds `datePublished` and `dateModified` through permissive JavaScript Date parsing; independently reproduced `new Date("2026-02-30")` normalizes to March 2. Guard impossible ISO calendar days and inconsistent modification chronology without inventing timestamps, with fail-first regression cases in `src/lib/structured-data.test.ts`; preserve all existing canonical/public, payment, privacy and media boundaries. This source is not merged or deployed. Source-authoritative review of test/CI state is required before another release. AF-R076 live Cloudflare email obfuscation remains unproven as a broken link: no provider setting changes. The 1920px assistance step visibility retry in #414 is a known flaky test to diagnose, not a full-feature closure or inferred runtime failure.

## 2026-10-23 — Native-input and interrupted-motion recovery batch

Owner: CODEX_ACTIVE, sole writer on existing `fix/native-keyboard-shortcuts-20261023`, continuing from reconciled remote `8fa64cc`. Verified remote main remains `4e8db34`, independently live/ready; only open PR is blocked locales draft #374. Prepare one new MEDIUM-risk runtime PR from the existing branch, combining the saved zoom/composition guards with two related proven motion recovery defects; no new branch or tiny separate deployment.

Fail-first motion evidence: both focusout and mouse pointerout were ignored after a pressed action became disabled, leaving pressed feedback active when release went elsewhere. Leave events now include disabled targets while starts remain excluded. Window blur previously retained the owned press animation; one lifecycle test reproduced missing cancellation and now proves cleanup plus a later press. Reuse one clearAll helper for blur, reduced-motion reset and unmount, with listener removal on cleanup. Existing pointercancel/disabled release guards remain covered. Saved scroll tests separately proved Ctrl+wheel cancellation under two overlay locks and unwanted composing Home/End handoff. Combined scope is four bounded input/recovery outcomes, not new interaction features.

Current validation: full 2,026 passed / 15 skipped; 24 scrolling/motion cases included; TypeScript/full ESLint/spec syntax/diff pass. Five actual-page browser cases prepared for zoom cancellation, composing navigation, disabled focus/pointer exits and window-blur recovery; hosted execution pending. Synthetic lifecycle checks do not certify physical pinch, complete IME UI, OS window switching, screen readers or all devices. No CSS, public facts/assets, dependencies, auth/payment/data/provider/settings changes. IMPLEMENTED_SOURCE / locally TESTED only. Publish one exact-source draft, require protected selected application/browser/build/budget/database gates, then ready-state promotion/verify before authorized merge and exact deployment checks. Historical 149-entry counts unchanged.

## 2026-10-23 — #413 accepted and merged; follow-up reconciled

Railway `b8264a9c-d551-4e67-b38e-f326ea8de9d2` is SUCCESS. Fresh public verification confirms exact main `4e8db34ece2acce771565d56e0f8b2ba4a6d5d53`, production, with readiness ready. This supersedes pending deployment/public-identity statements below. Identity/readiness only; no live-payment or exhaustive device acceptance is inferred.

Owner: CODEX_ACTIVE. #413 full exact-head run `39967751762` passed all actual application/build/budget/database/browser/verify gates at `9886400`. Browser results: 1,326 Chromium and 24 Firefox/WebKit smoke checks passed. Ready-state run `39974364680` passed promotion/verify; application skips were intentional on that metadata-only event. Standing owner-authorized merge succeeded at `4e8db34ece2acce771565d56e0f8b2ba4a6d5d53`. Railway deployment `b8264a9c-d551-4e67-b38e-f326ea8de9d2` is BUILDING; exact public release verification remains pending. Earlier #413-pending/failure statements below are historical and superseded by this accepted source.

Normal main reconciliation preserves prepared zoom/composition checkpoint `2da3f6e` separately; those two scroll-handler guards and browser cases are NOT in #413 and still need fresh hosted acceptance in a substantive follow-up batch. No new PR/deployment for them. Compiled #413 aggregate uncompressed JS 817,607 / CSS 325,561 bytes, both unchanged caps pass; transfer/per-route attribution/CWV unmeasured. No complete accessibility/device or historical 149-entry closure inferred.

## 2026-10-23 — Browser-owned zoom and composition checkpoint

Owner: CODEX_ACTIVE, sole writer continuing on `fix/native-keyboard-shortcuts-20261023`. Keep #413 PR branch frozen at `9886400` while full run `39967751762` executes. Actual fast/production/database gates passed; browser pending. This independent checkpoint stays on the existing saved branch and has no new PR/deployment. Production remains last independently verified `03bb739`.

Two fail-first lock-state tests reproduced Ctrl+wheel cancellation by the global overlay scroll lock, blocking the browser-owned zoom gesture. The window wheel handler now returns for Ctrl+wheel before applying menu/navigation scroll containment, consistent with existing Lenis/initialization exclusions. Ordinary wheel remains canceled while locked and the optional enhancement does not initialize. Source semantics confirmed against MDN https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event and installed Lenis's own Ctrl guard. Two further fail-first Home/End assertions reproduced global processing of composing key events; early composition exclusion preserves input-method ownership without changing ordinary native-key handoff.

Verification: 16 focused scrolling tests, full suite 2,023 passed / 15 skipped, TypeScript/scoped ESLint/spec syntax/diff pass. Two actual-page synthetic-event browser cases prepared for open-menu wheel cancellation policy and composing Home/End ownership with active Lenis; execution pending. They do not prove actual browser zoom, physical pinch or complete IME UI acceptance. Runtime change is two narrow early-return guards; no visual, content, financial, provider, data, media, settings or dependency changes. IMPLEMENTED_SOURCE / locally TESTED only; hold for next coherent batch after #413 release/reconciliation, requiring fresh hosted acceptance. No full accessibility/master-item closure inferred.

## 2026-10-23 — Consolidated keyboard candidate and deterministic drag fixture

Published combined draft #413 at `9886400511a54c3e9897be7d29aab4458396dcdf`; tree `b4a0bc47511e6aa501c2585b7b910e4ccbcf0c71` equals local validated `9bb2b53`. Both checkpoint and PR branches fast-forwarded normally, no force. Fresh full run `39967751762` is in progress. Keep this published source stable; do not infer browser acceptance from the local fixture correction. Fresh local full suite 2,021 passed / 15 skipped, TypeScript/full ESLint/spec/diff pass. This local coordination-only note need not restart hosted acceptance.

Owner: CODEX_ACTIVE, sole writer on `fix/native-keyboard-shortcuts-20261023`; reuse existing draft #413 for the completed combined keyboard/tooling batch after its first browser result. This supersedes the earlier instruction to freeze #413 while that run was pending. Remote prepared checkpoint `90b3028e7e3615d356cc9be5544435e0b59adee0`, exact tree `da9d76f96557c73bd6ab1f9aefa3d7e6258824ec`, matches local `9c77113`. No new PR or runtime branch; normal fast-forward ancestry preserves published #413 and prepared follow-up histories.

Actual #413 run `39962079564`: fast/production/database passed, browser failed with one deterministic test failure, one flaky-on-retry and 1,319 passes. Blocking drag-recovery case assumed its blank mouse target would focus the carousel; Resume never appeared on both attempts. Establish viewport focus and assert Resume before the drag, then retain the original outside-release and autoplay-restart assertions. No timeout increase, retry-only bypass or runtime change for this fixture failure. Compact fine-pointer Home test passed on retry; keep its flake recorded and observe fresh acceptance before assigning a runtime cause. Local browser remains unavailable under the existing socket restriction.

Combine the finished four-widget shortcut/composition guards, layered Escape handling and reviewed Vitest/Vite patch pins with the existing persistent-pause/live-announcement/unused-dependency/fallback #413 changes. Require fresh full exact-head hosted application, browser, production/budget, database and final promotion/verify; the original partial pass certifies none of the added source. Standing owner commit/merge authorization remains valid after required gates pass. Production remains independently verified `03bb739`, no new release yet. No historical 149-entry closure-count change.

## 2026-10-23 — Native keyboard shortcut boundaries checkpoint

Extended the same checkpoint with nine fail-first mobile-menu cases: modified Tab must not be focus-trapped, and composing/handled/modified Escape must not close the menu. Ordinary Tab/Shift+Tab containment and Escape remain intact; one browser case added (five prepared cases total across this follow-up). Local source commit `26989f9`; existing #413 source remains unchanged. Full unit baseline on Vitest 5.0.0 passed 2,021 / 15 skipped before toolchain changes.

Development-tool remediation: primary GitHub advisories confirm @vitest/mocker fixes in 5.0.3+ and Vite fixes in 8.2.4. Package-manager update pins Vitest and matching coverage provider 5.0.5 and explicitly pins the already-transitive development-only Vite at 8.2.4. Related test/coverage/Vite records updated; production direct dependencies unchanged. One shared production lock record, nanoid 3.3.18→3.3.20, was updated to satisfy Vite's PostCSS requirement. Reviewed upstream full compare: pool-error recovery/size cap and async type fix; Next/PostCSS uses nanoid(6), no direct application imports. Do not claim the production lock graph is byte-identical. No npm force fix, framework downgrade, advisory suppression or guard relaxation.

Installed patched packages pass full coverage run: 2,021 tests / 15 skipped, tracked four-file coverage 87.43% statements / 85.08% branches / 100% functions / 96.77% lines, thresholds unchanged. TypeScript/full ESLint, manifest/lock parity, production graph validation and diff pass. Fresh production audit reports zero. Full audit now reports five high package-chain entries, all rooted in GHSA-vfj7-8cjw-p6xm; GitHub withdrew that advisory on 23 October as not practically exploitable. Registry still reports it, so retain the finding with withdrawal evidence rather than downgrade Next/eslint or claim a zero full audit. Four reported package findings (Vitest/Vite chain) removed. Primary sources: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm, https://github.com/advisories/GHSA-qxg6-89mg-rqv8, https://github.com/advisories/GHSA-xp26-3454-mjgp, https://github.com/advisories/GHSA-rq7h-c2jc-7f22, https://github.com/vitest-dev/vitest/releases/tag/v5.0.5, https://github.com/ai/nanoid/compare/3.3.18...3.3.20. Fresh hosted install/build/browser acceptance is required for this checkpoint; not merged/deployed.

Follow-up overlap regression reproduced Companion closing beneath an open gallery because its document Escape listener runs before the gallery window listener. Companion now defers Escape to an open modal/native dialog. New handler test failed before the correction; four browser cases now cover shortcut/composition ownership and layered Escape. Full current suite: 2,012 passed / 15 skipped; 39 focused keyboard cases, TypeScript/scoped ESLint/spec/diff pass. Earlier 2,011/38 figures below describe the preceding checkpoint. Saved initial remote checkpoint `a25e340`, exact tree `be53e9d8d4bb025b6646e5c54f1fc8931763b287`, matched local `bc94a62`; this follow-up remains unreleased.

#413 production job `120443191911` measured 816,972 aggregate uncompressed JS bytes and 325,561 CSS bytes, 55 assets / 61 pages; existing budgets passed. Relative to #412: +518 JS bytes, unchanged CSS. Per-route transfer/CWV remain unmeasured. Fast job `120442395969` confirms production audit and pruned production audit both found zero vulnerabilities. Full development install reports nine advisories (three moderate/six high); development-tool advisory triage remains outstanding, not a production-audit failure or a whole-supply-chain clearance. Browser `120443191846` is executing its acceptance step; no failure reported at checkpoint. Preserve its source.

Owner: CODEX_ACTIVE, sole writer on `fix/native-keyboard-shortcuts-20261023`, based on published #413 source plus its local coordination checkpoint. Separate checkpoint branch protects the unchanged #413 acceptance head `a13e1d6`; do not update that PR with this work while its browser job runs. #413 full run `39962079564`: fast, production and database SUCCESS; browser pending. Hosted production npm ci/build passes, superseding the earlier local offline-cache install limitation for #413. Production remains verified `03bb739`.

Source-grounded defects: carousel viewport and Companion tabs prevented modified navigation keys; gallery window handler also took modified arrows, handled events and composition Escape. Companion document Escape dismissed the panel during composition or after a child had already handled it. Added 24 fail-first regressions covering modifiers, composition and prior handling, plus ordinary navigation/close coverage. Runtime correction is bounded early returns and shifted-arrow exclusions; gallery Shift+Tab containment and plain arrows/Escape remain intact. No prayer calculation, factual, visual, media, auth, payment, data or provider changes.

Validation: full suite 2,011 passed / 15 skipped; 38 focused tests across carousel/gallery/Companion keyboard suites pass; TypeScript, scoped ESLint, three browser-spec syntax checks and diff pass. Three actual-page synthetic-key browser cases added to existing suites; local browser execution remains infrastructure-blocked and hosted acceptance is pending. IMPLEMENTED_SOURCE / locally TESTED only. No new PR or deployment for this prepared checkpoint, no full accessibility/device or historical closure-count claim. Next: finish #413 acceptance/release, normally reconcile accepted main, then include this checkpoint in the next coherent batch with fresh hosted acceptance.

Applied references: installed Superpowers verification-before-completion and Addy Osmani Agent Skills code-review-and-quality skills, alongside existing Karpathy guidance. Inspected the referenced agent-skills repository directly through GitHub. Use other owner-listed repositories only when their capability fits a verified task; no runtime dependencies or external automation installed for this checkpoint.

## 2026-10-23 — Persistent keyboard rotation pause batch

Publication: draft PR #413, https://github.com/immazhark/amaana-platform/pull/413, exact head `a13e1d608e59adbce8d8c366e0e07d75846e8a3b`, tree `66e6ec31f5676ab95ecf6de6a166c67d06387429` matches local validated source `ab1950a`. Full hosted run `39962079564` is in progress. Preserve this published source until actual results; this local coordination checkpoint does not require restarting acceptance. No merge/deployment yet; production remains verified `03bb739`.

Owner: CODEX_ACTIVE, sole writer, continuing on `chore/remove-unused-motion-runtime-20261023` from saved remote `e10b6a9`. Verified remote main remains deployed `03bb739`; only open PR is reviewed-locales draft #374, which remains blocked on approved translations. This batch includes the unreleased dependency removal and neutral live fallback already saved on this branch; no duplicate branch or runtime PR.

Source evidence: live rail focus state and carousel focus-within only suppress rotation during focus, then restart without an explicit request. Both widgets now persist pause when focus enters. Pointerdown retains the action shown before focus changes Pause to Resume; keyboard/assistive activation follows the current label, cancellation clears the pointer intent. Live updates no longer request polite announcements while auto-rotating, and their live-region node retains identity across item updates. Guidance: https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ (focus/restart and live-region sections). No visual redesign, facts, prayer calculation, provider, authorization or financial changes.

Fail-first handler/component regressions exposed absent persistent focus pause and automatic live announcements. Focused 15 tests and full suite 1,984 passed / 15 skipped. TypeScript, scoped ESLint, browser-spec syntax and diff checks pass. Existing browser cases now cover persistent focus pause, explicit keyboard restart, pointer Pause intent and announcement attributes at 320/1440; drag-cleanup cases explicitly restart after their focus pause. Local Chromium remains unavailable under the established socket restriction; browser execution and fresh hosted install/build acceptance are pending. IMPLEMENTED_SOURCE / locally TESTED, not merged/deployed. Keep historical 149-entry totals unchanged.

Next: publish this combined source once, run full protected hosted acceptance (including fresh npm ci for the dependency checkpoint), then ready-state promotion/verify and owner-authorized merge only after all required gates pass. Verify exact Railway/public version and readiness afterward. Production remains independently verified `03bb739`; paused worker configuration remains untouched.

## 2026-10-23 — Accessibility release merged; cleanup reconciled

Railway `797cd5bc-b2b6-4338-942d-32bd8d6c9731` is SUCCESS. Fresh public verification now returns exact main `03bb73910ed531c92621d920ff84109b42d27c53`, production, and readiness ready. This supersedes pending deployment/public verification below. Identity/readiness only; no live transaction or complete device acceptance inferred.

Owner: CODEX_ACTIVE. PR #412 passed full hosted acceptance `39946900452` and ready-state promotion/verify `39959384678`, then merged under standing owner authorization at `03bb73910ed531c92621d920ff84109b42d27c53`. Railway deployment `797cd5bc-b2b6-4338-942d-32bd8d6c9731` is DEPLOYING; exact public identity/readiness is pending. Last independently verified production remains `9c48065`. Earlier pending #412 notes below are historical and superseded.

Normally reconcile accepted main into `chore/remove-unused-motion-runtime-20261023`, preserving both histories. The unused dependency and neutral fallback checkpoint remains unreleased and needs fresh hosted install/build/runtime/browser acceptance when included in the next substantive release. No new PR/deployment for this checkpoint; no historical closure totals change.

## 2026-10-23 — Truthful live fallback and install validation

Owner: CODEX_ACTIVE, same checkpoint branch `chore/remove-unused-motion-runtime-20261023`. Corrected the live strip fallback from an assertion that no appeal is open to a neutral invitation to explore public work. The fallback is rendered before the first fetch and after the public endpoint's error-to-empty response, so it cannot establish appeal absence. This is a one-line copy correction; links, eligibility, data access and rotation logic are unchanged. Scoped ESLint/diff checks pass. No extra unit tests for this reversible copy change.

Isolated offline production npm ci was attempted under a fresh temporary prefix and could not complete: ENOTCACHED for unchanged zod@4.1.5. Classify as INFRASTRUCTURE/cache availability, not a dependency regression or install pass. The repository installation was not modified. Existing manifest/lock parity, 503 retained-entry equality, production-graph and TypeScript checks remain valid. Fresh hosted npm ci/build/runtime/browser acceptance is still required for the checkpoint. Preserve #412 head `1cf68f7` while run `39946900452` completes; no new PR or deployment. Production last independently verified `9c48065`.

## 2026-10-23 — Unused motion dependency checkpoint

Owner: CODEX_ACTIVE, sole writer on `chore/remove-unused-motion-runtime-20261023`, based on locally tested combined #412 source plus its coordination checkpoint. Import inventory across src/scripts/e2e/config finds no framer-motion consumer: site motion uses native animations and scroll enhancement imports Lenis on demand. Removed framer-motion from manifest/lock with an offline package-lock-only npm operation; its orphan motion-dom and motion-utils entries also disappear. All 503 remaining lockfile package entries compare identically to the parent. Manifest/lock direct dependencies match; npm validates the production dependency graph. TypeScript and diff checks pass. No unit tests added/rerun for an unused-dependency removal; fresh npm ci/build/runtime/browser acceptance remains required before release. Existing installed node_modules and deployed runtime are not claimed pruned by this lockfile-only operation.

Keep #412 head `1cf68f7` stable while full run `39946900452` completes (fast/production/database passed; browser running). Save this source checkpoint without a new PR or separate deployment; add it to the next substantive release after source reconciliation. Production last independently verified at `9c48065`. No application behavior, content, public assets, data, permissions, payment or provider changes. Rollback: restore the manifest and lock from the parent. No historical closure counts changed.

## 2026-10-23 — Accepted CSS release and follow-up reconciliation

Published combined #412: remote head `1cf68f76e80a0cc4ca6d8bb9bf7384230a94ec01`, exact tree `e2f9e12d401870ec676199e26cad5b000a834502` equals local validated source checkpoint `b6e7c2f`. Fresh full run `39946900452` is running. Keep this source stable until results. PR targets current main `9c48065` through normal ancestry, no extra PR. This local coordination-only checkpoint need not restart acceptance. Next: inspect actual selected jobs; repair any task-introduced failure, otherwise pass ready-state promotion/verify before owner-authorized merge and exact-sha deployment verification.

Deployment verification: Railway `ab26d603-1cb5-43e0-a2e9-2e901623f4df` reports SUCCESS. Independent fresh public `/api/health/version` returns exact `9c48065020d37a82a24597d92081bf2c6a6ad350`, main, production; readiness returns ready. #411 is DEPLOYED with identity/readiness verified. No live payment or complete real-device acceptance is inferred. Earlier BUILDING statements below are superseded.

Combined-candidate update: original #412 source `2362d03` completed full hosted acceptance `39924862372` successfully, including browser/production/database/fast/verify. Consolidate the already tested live-rail pause and unimported-file cleanup into the existing #412 via normal ancestry, based on main `9c48065`. Local merge `b2aeac6` preserves all histories; no new PR. Runtime TypeScript remains identical to the 1,977-passing-test source; merge additions are accepted #411 CSS plus documentation. A fresh full hosted run on the combined head is mandatory; the original #412 pass does not certify the added pause control or combined release. Do not merge until new full application and ready-state promotion gates pass. Source main/production reconciliation is complete locally; verify the current Railway deployment separately.

Owner: CODEX_ACTIVE, sole writer on `fix/live-rail-pause-20261023`. PR #411 exact-head full acceptance `39924005291` and ready-state promotion/verify `39928057248` passed; merged under standing owner authorization at `9c48065020d37a82a24597d92081bf2c6a6ad350`. Railway deployment `ab26d603-1cb5-43e0-a2e9-2e901623f4df` is BUILDING; last independently verified production remains `abacce7`. Main is reconciled locally by normal merge, preserving both coordination histories. Follow-up checkpoint `79262bf` contains tested persistent live-update pause, unimported-file cleanup and #412 ancestry; it has no PR and needs fresh hosted acceptance before release. #412 source `2362d03` remains unchanged while browser run `39924862372` completes. Next: verify #411 deployment, inspect #412 browser result, consolidate the prepared follow-up into one main-reconciled candidate with fresh acceptance. Earlier pending #411 statements below are historical and superseded.

## 2026-10-23 — Persistent visitor pause for live updates

Owner: CODEX_ACTIVE, sole writer on `fix/live-rail-pause-20261023`, continuing from the saved unimported-CSS checkpoint (remote `3a05b42`, local `e4ac670`) and #412 source ancestry. The live rail rotates every 12 seconds; hover/focus pauses cease when the visitor leaves. Two fail-first actual-component tests exposed no explicit control and no persistent visitor pause. The existing AMAANA LIVE badge is now a native Pause/Resume button when multiple updates can rotate, preserving its visible label and providing a 44px target; its accessible name includes the visible label. Single-item and reduced-motion rails remain static. Manual pause survives focus/hover leaving; existing panel/hover/focus/hidden-document guards remain.

Three rotation tests and full unit suite (1,977 passed / 15 skipped), TypeScript/scoped ESLint, spec syntax, CSS architecture and diff checks pass. Two browser cases at 320/1440px check keyboard pause/resume away from the rail, reduced motion, target bounds and horizontal overflow; execution is pending. Source checkpoint only, no new PR or deployment; leave #411 `9e06cef` and #412 `2362d03` unchanged while browser acceptance runs. Root CSS now has 17 layers / 131,542 source bytes (+262 for the control). No religious/prayer, content, payment, data, permissions, public-media or provider-policy changes. Rollback: revert scoped pause-control change. Next: finish both current protected gates, consolidate this follow-up plus unimported-file cleanup into the next accepted-source batch, require fresh hosted acceptance before release. No master totals changed.

## 2026-10-23 — Unimported stylesheet cleanup checkpoint

Owner: CODEX_ACTIVE, sole writer on `chore/unused-stylesheet-cleanup-20261023`, continuing from local #412 source plus its coordination checkpoint. Removed three unimported stylesheets: home-wow.css (4,536 bytes), campaign-home.css (681), governance.css (5,040). Source/import/config/spec inventory finds no consumers; global CSS audit confirms the same 17 root layers and 131,280 root CSS source bytes. Total repository source removal: 10,257 bytes. This is repository hygiene, not a measured delivered-payload reduction. Diff checks pass; no unit suite rerun for deletion-only unimported files. Save as a branch checkpoint without a new PR or deployment while #411/#412 source heads remain frozen. No content, public media, behavior, permission, data or provider changes. Rollback: restore the three files from the parent commit. Next: finish protected acceptance for both existing PRs, reconcile their accepted source with main, include this bounded cleanup in the next combined source release. No additional owner decision is required.

## 2026-10-23 — Motion press cancellation recovery

Publication checkpoint: draft PR #412, https://github.com/immazhark/amaana-platform/pull/412, remote source `2362d0327e7ba0934d9d6a6337426c8c28f344f8`, tree `2a901c70d593088d9c016f63573f21247edae027` exactly equals local validated source `268af95`. Fresh full hosted run `39924862372` is running. Keep its source stable. This local documentation checkpoint need not restart acceptance. #411 run `39924005291` still awaits browser; fast/production/database passed. Neither pending batch is merged/deployed. Main remains independently verified at `abacce7`.

Owner: CODEX_ACTIVE, sole writer on `fix/motion-press-recovery-20261023`, based on verified main `abacce7`. Existing CSS PR #411 expanded source `9e06cef` is frozen for fresh acceptance; fast/production/database pass, browser running. Two actual-handler regressions failed before correction: cancellation with a non-primary button code and release after a control becomes disabled. Release feedback now bypasses press-initiation exclusions; disabled actions return to neutral instead of a raised hover state. Primary-only/available-control initiation, hover, reduced-motion and cleanup remain intact. Five handler tests and full suite (1,974 passed / 15 skipped), TypeScript/scoped ESLint, browser spec syntax and diff checks pass. Two actual-page synthetic-event browser cases await hosted execution. IMPLEMENTED_SOURCE / TESTED locally, not merged/deployed. No payment/data/auth/schema changes. Rollback: revert scoped PR. Next: publish scoped draft, require fresh protected acceptance; finish #411 gate and reconcile main before release. No historical closure count changed.

## 2026-10-23 — Current release and local cleanup checkpoint

Owner: CODEX_ACTIVE, sole writer on `perf/retired-detail-hero-css-20261023`. PR #410 passed complete application acceptance `39919526610` and ready-state promotion/verify `39923017520`; merged under standing owner authorization at `abacce7bc4afbc4b5463fa94e93d1b60c9e321ce`. Railway deployment `1609a8ee-688c-4e14-9e8b-1d6e58676770` is SUCCESS. Fresh public version/readiness reads independently confirm the same main/production SHA and status ready. This verifies deployment identity/readiness, not live payment acceptance.

PR #411 is being consolidated with the prepared Story/trust/initiative cleanup and main `abacce7` through normal merge ancestry; both sets of coordination notes are preserved. Five imported stylesheets remove 5,507 source bytes in total. All 357 retained selector/declaration/context records (21 Faith plus 336 follow-up) remain identical to main; architecture audit passes. No third PR. Earlier Faith-only run `39922217210` passed fast/production/database but browser was still running when deliberately superseded by the expanded batch. Those results do not certify this new source. Require fresh full hosted acceptance before ready/merge. Next: complete expanded #411 acceptance, merge after all protected checks, verify exact deployed SHA/readiness. No owner decision is required for routine commits/merges after checks.

## 2026-10-23 — Retired Faith hero CSS cleanup

Owner: CODEX_ACTIVE, sole writer on `perf/remove-unused-faith-hero-css-20261023`, based on production main `ff3324a`. #410 remains frozen at `9f02a1c` while hosted browser acceptance runs. Faith detail now uses PageHero; no source or browser-spec consumer remains for v2-faith-detail-hero/back selectors, yet the imported stylesheet still ships those legacy rules. Remove only those selectors, preserving the live topics/body/review/library styles and the body-grid selector from a shared media rule. Parse CSS and compare surviving selector/declaration/context records against the baseline; require affected browser acceptance before release. No asset/media publication, content, permissions, data, schema/provider or payment changes.

## 2026-10-23 — Standalone recovery mobile viewport

Continue the same #410 recovery surface. Its isolated browser checks previously resized a desktop context, which could not catch the standalone document missing its mobile viewport declaration. Add explicit device-width viewport metadata to the root-error document and use mobile emulation for both compact/mobile cases, asserting actual document width before geometry/text-resize checks. No user zoom restriction is added. Preserve desktop coverage, 200% text sizing, reachable retry and axe checks. Existing source head `9a6ee96` passed fast/production/database; its browser run is still active. Updated source requires fresh hosted acceptance; do not cite older-head checks as its certification. Production remains independently verified at `ff3324a`.

## 2026-10-23 — Self-contained root error typography

Owner: CODEX_ACTIVE, sole writer on `fix/root-error-typography-20261023`, based on merged main `ff3324a` with preserved release notes. Bounded AF-R024/AF-R025 recovery-surface work: global-error replaces root layout yet its inline font declarations referenced layout variables without CSS var fallbacks; label was .72rem and heading line-height .85. Provide self-contained font fallbacks, .75rem label, 1.1 heading line-height and inherited text wrapping. Existing isolated root-error browser coverage now includes 320px and 200% text resizing with computed fallback-font, no-overflow and reachable-retry assertions. Keep recovery callback, copy, brand backgrounds and source isolation. No payment, data, schema/provider/auth changes. Browser acceptance required before release; do not claim full typography or real-device closure.

Release #409 is DEPLOYED at `ff3324a88a49bdf7faaac3577e3a8e783493d1cb`: Railway deployment `39ab20b5-3619-4f9a-9d38-a1e2e69533a2` reports SUCCESS. Fresh public version independently confirms that commit/main/production and readiness returns ready. Earlier BUILDING statements below are superseded.

## 2026-10-23 — Combined navigation/admin release merged

Owner: CODEX_ACTIVE, sole writer. PR #409 merged into main at `ff3324a88a49bdf7faaac3577e3a8e783493d1cb` under standing owner authorization. Exact source `e3a0fe1962be255b5177c86bbccb1a51214223c5` passed full run `39910315425`: fast, production/budgets, database, browser, production readiness and verify all SUCCESS. Local suite: 1,969 passed / 15 skipped; 24 focused admin regressions, TypeScript/scoped ESLint. PR #408 is also merged/closed through preserved ancestry, confirmed by GitHub; do not merge it separately.

Railway deployment `39ab20b5-3619-4f9a-9d38-a1e2e69533a2` is BUILDING for exact main `ff3324a`. Last independently verified live version is `00dce4d`. Next: confirm deployment success and fresh public version/readiness, then choose the next source task from the reconciled backlog. This checkpoint branch changes documentation only. No new runtime work, extra deployment, worker setting or historical defect closure is claimed.

## 2026-10-23 — Clear-action audit link correction

Owner: CODEX_ACTIVE, same combined PR #409 source branch. Actual rendered audit link reused entityHref, which intentionally retains the active action; therefore Clear action filter reapplied the action. Two rendered-link regressions failed with and without an entity. The link now omits action/page while preserving a selected entity. Facet/pagination links still retain their intended filters. Twenty-four focused admin tests, TypeScript and scoped ESLint pass; full suite completed successfully. Include this bounded correction in the existing combined release, require fresh hosted acceptance on the new head, and do not treat earlier source checks as certification of it. No private-data, permission, schema/provider/payment changes. #408 source remains frozen for independent browser acceptance; production stays verified at `00dce4d`.

## 2026-10-23 — Combined main release acceptance

Owner: CODEX_ACTIVE. PR #409 is now the combined main-target release candidate at `3e43233f4da866df9de702e8d41cfc29f3bc3da0`, preserving #408 head `a0c40ce` and #409's original ancestry. Full local validation completed: 1,967 tests passed / 15 skipped, 22 focused admin tests, TypeScript/scoped ESLint. Published tree `525e991fba27438f9340be65112e3b3284797df7` equals the locally tested tree.

The temporary stacked base was outside CI's declared pull-request targets, so #409 had no hosted application run. Retargeted it to main without changing source. Ready transition `39909826148` passed readiness/verify but intentionally skipped application jobs; it does NOT certify the source. Reopened the ready PR to trigger full application acceptance `39909872027` on the same head. Require actual fast/production/database/browser successes before merge, never infer them from the ready-transition result. #408 remains independently checking; if it merges first, #409 reduces naturally, otherwise accepted #409 integrates #408 by ancestry. No source force-push, CI edits, branch deletions or provider changes. Production remains verified at `00dce4d`. Process correction: inspect workflow base-target triggers before using stacked PRs for hosted acceptance.

## 2026-10-23 — Admin query arrays and parent reconciliation

Owner: CODEX_ACTIVE, sole writer on `fix/admin-pagination-input-20261023`. Extend PR #409's input-normalization scope: repeated audit action/entityType query parameters arrive as arrays and crashed `.trim()`. Two actual-page regressions reproduced those exceptions; scalar trimming, 120-character bounds, permission check, facets and 50-row paging remain covered. Shared page parsing now explicitly rejects arrays instead of coercing a one-element array to a page. Three additional assertions failed before this extension; all 22 focused tests now pass, with TypeScript/scoped ESLint. Full suite running. Include the accepted test-only #408 parent correction `a0c40ce` as normal merge ancestry when publishing the updated draft; never force-push or merge #409 into #408. No permission, data-selection/sorting policy, schema or provider change. #408 is still awaiting fresh browser acceptance; production remains verified at `00dce4d`.

## 2026-10-23 — Pagination draft and final menu locator scope

PR #409 published as a stacked DRAFT at `40a38904b6c3a49bdc3a39e3f445ee11edc7a9a0`, base #408 branch. Full suite completed: 1,962 passed / 15 skipped; 17 pagination tests, TypeScript/scoped ESLint pass. Do not merge into its parent; reconcile/retarget to main after #408 integrates.

#408 browser run `39904869469` finished with 1,315 passed / one failed. Backward external-focus recovery, Escape restoration and body unlock passed. The forward case reached its focus assertion, which matched both toggle and backdrop close buttons. Final test-only head `a0c40cef5e2154e9bd97f4b5a6dbf60434a3d038` scopes every toggle/home reference to Primary navigation. All assertions remain; runtime unchanged. Fresh hosted acceptance required before merge. The same spec correction is committed locally on the pagination branch but is not yet in published #409; incorporate the new parent during reconciliation. Production remains independently verified at `00dce4d`.

## 2026-10-23 — Shared admin pagination input correction

Owner: CODEX_ACTIVE, sole writer. Branch `fix/admin-pagination-input-20261023` is stacked on the reviewed #408 source and its continuity checkpoint while #408 browser acceptance runs. Scope: canonical positive integer query parsing and finite integer offset inputs in the existing shared helper, used by seven admin lists. Ten new assertions fail on the original source: malformed strings are truncated to another page; invalid numeric calls yield NaN/fractional offsets or an unintended last page. Preserve valid page clamping, row size, queries, sorting and all existing permissions/data rules. No schema/provider/payment-state/auth change. Next: focused tests, full unit/type/lint verification, then a scoped publication after base reconciliation. #408 remains frozen at `a9117d1` until its protected checks pass.

## 2026-10-23 — PR #408 browser locator correction

Hosted run `39901420201` passed fast, production/budgets, database and draft readiness. Browser result: two failures, both TASK_INTRODUCED test locator ambiguity before the new focus assertions. The home link exists in header and footer; the test used a page-global accessible name. Scope the background target to the existing Primary navigation landmark. No runtime changes are needed for this failure; application behavior remains unverified by these browser cases until fresh acceptance. Preserve all assertions; do not skip tests or weaken strictness. Node syntax and diff checks pass. Existing runtime verification remains 1,947 unit tests, TypeScript/scoped ESLint. Fresh hosted checks are required for the corrected head before merge. #407 remains independently verified deployed at `00dce4d`.

## 2026-10-23 — PR #407 deployed and readiness verified

Railway deployment `fb415208-d19a-4770-b10c-830fe1bc562c` reports SUCCESS for main `00dce4d85e980fc0e49e201b3e80b750c8215001`. Independent fresh public endpoint reads confirm `/api/health/version` returns the same production/main commit with paymentMode live and `/api/health/ready` returns status ready. This is version/readiness evidence, not exhaustive live journey or live payment acceptance. Earlier BUILDING notes are superseded.

Next active source: PR #408, branch `fix/mobile-menu-focus-recovery-20261023`, published head `9719f7418786dece9c9e50637c2d1823d3af6bc6`, exact locally tested tree `305904e131d7bacaed79897a917ea5fc7b6a57fd`. 1,947 unit tests plus TypeScript/scoped ESLint pass. Hosted acceptance pending; do not claim #408 merged or deployed. This local evidence checkpoint changes documentation only and need not restart source acceptance.

## 2026-10-23 — Mobile navigation focus recovery validation

Owner: CODEX_ACTIVE, branch `fix/mobile-menu-focus-recovery-20261023`, base main `00dce4d`. Two fail-first handler tests reproduced Tab/Shift+Tab escape when focus is outside the open mobile menu. Four handler tests now pass, preserving initial link focus, native traversal and boundary wrapping. The handler recovers focus to the toggle forward or last menu link backward. Two durable browser cases cover externally moved focus, Escape restoration and removal of the body lock. Full suite: 1,947 passed / 15 skipped; TypeScript, scoped ESLint, browser spec syntax and diff checks pass. Hosted browser/production acceptance and merge remain pending. No layout, payment, permissions, schema, media or provider changes. Rollback: revert scoped PR. #407 is merged at `00dce4d`; Railway deployment `fb415208-d19a-4770-b10c-830fe1bc562c` remains BUILDING. Last independently confirmed live version: `75cd3e1`.

## 2026-10-23 — Mobile navigation focus recovery

Owner: CODEX_ACTIVE, sole writer. Branch `fix/mobile-menu-focus-recovery-20261023` based on main `00dce4d` after #407 merged under owner authorization. #407 exact-head CI `39834639246` passed fast/browser/production/database/verify; ready-transition `39901117944` passed promotion readiness/verify. Railway deployment `fb415208-d19a-4770-b10c-830fe1bc562c` is BUILDING for `00dce4d`; last independently verified live SHA is `75cd3e1`. New task: reproduce and correct mobile-menu Tab escape when focus moves outside its toggle/menu. Preserve initial link focus, first/last wrap, Escape, breakpoint behavior, body lock and links. No layout/auth/payment/schema changes. Require focused and browser regressions before release.

## 2026-10-23 — Durable browser regressions for PR #407

Added three browser cases: keyboard activation following pointerup without a generated pointer click, forward Tab recovery from a background thumbnail, and backward Tab recovery. Gallery cases also require Escape and thumbnail focus restoration. Both spec files pass Node syntax validation. Local Chromium download succeeded, but browser launch failed before tests with socket() Operation not permitted under the workspace policy. This is an INFRASTRUCTURE limitation, not application pass/fail evidence. Hosted exact-head browser acceptance is required. Runtime remains identical to `3def31e`, already verified by 1,943 unit tests, TypeScript and scoped ESLint. Local generated acceptance fixtures and dev-generated tracked files were restored/removed; no generated files are included. Next: publish final regression head, require fresh protected checks, then ready/merge under standing owner authorization and verify deployment. Production remains verified at `75cd3e1`.

## 2026-10-23 — Gallery focus recovery and deployed release verification

Owner: CODEX_ACTIVE. PR #407 remains the sole interaction batch. Two new gallery tests failed before correction: Tab/Shift+Tab did not recover focus moved outside an open photo dialog. The existing key handler now prevents background navigation and returns focus to the first/last modal control according to direction. Existing boundary wrap and close restoration stay intact. Eleven focused interaction tests pass; full suite 1,943 passed / 15 skipped; TypeScript and scoped ESLint pass. New head needs fresh hosted acceptance before merge. No layout, data, payment, schema or authorization changes.

Release #405 is DEPLOYED at `75cd3e1533536d1c12bd0b852c9f6549c0ef57a6`: Railway deployment `24345d60-4bfa-41ae-a94f-730c3b86ae21` reports SUCCESS. Fresh Context.dev fetch of public `/api/health/version` independently returns the same commit, branch main, environment production, paymentMode live. This verifies deployed version only, not every user journey or a live payment. Paused notification worker remains untouched. Earlier QUEUED notes are superseded.

## 2026-10-23 — Carousel keyboard activation after dragging

Owner: CODEX_ACTIVE, sole writer. Branch `fix/carousel-keyboard-after-drag-20261023` starts from verified main `75cd3e1`; preserved release handover notes. Handler-level regressions reproduced cancellation of keyboard/assistive click (detail=0) after a drag and missing native-control drag exclusions. Four regressions failed on unchanged source, while the pointer-click suppression control passed. Implementation consumes drag suppression only for pointer clicks and excludes textarea/select/contenteditable descendants from drag initiation. Five focused tests pass; TypeScript and scoped ESLint pass. Full unit suite running; hosted/browser acceptance and merge/deployment remain pending. No payment, schema, auth, media or provider changes. Rollback: revert scoped carousel fix. Railway release #405 remains QUEUED; no live release claimed and paused worker untouched.

## 2026-10-22 — Codex release continuation

Owner: CODEX_ACTIVE, sole repository writer under the owner's renewed commit/merge authorization. Preserved inherited uncommitted handover notes. PR #405 head `96abe0cfe8acde3e92ceed30945f91cff4d24950` passed complete CI run `39827603730` (fast, production/budgets, database, browser including Firefox/WebKit, verify). Ready transition run `39831737134` passed production promotion readiness and verify; application jobs were intentionally skipped on this metadata-only event. Local production readiness: 20/20 gates resolved. Owner-authorized merge succeeded at `75cd3e1533536d1c12bd0b852c9f6549c0ef57a6`. Six-change archive/carousel/framework batch is MERGED, not yet LIVE_VERIFIED.

Railway automatically queued deployment `24345d60-4bfa-41ae-a94f-730c3b86ae21` for exact main `75cd3e1`. Previous successful production remains `fab6143` until promotion succeeds. Production web service has no staged changes; inherited environment patch belongs to paused worker and remains untouched. Next: verify deployment and public version/health, then reconcile remaining source queue before a new atomic implementation. No new runtime change was required to release this accepted batch.

## 2026-10-22 — Release review and rejected cache false alarm

Owner: CHATGPT_ACTIVE (ChatGPT Work), sole writer. Release PR #405 source remains `96abe0c`, frozen while browser/final acceptance completes. A cache-freshness follow-up was investigated locally on `fix/carousel-editor-read-after-save-20261022`, then rejected: a simplified test double modeled only `revalidateTag(...,'max')` and omitted the existing homepage/editor `revalidatePath` calls. Installed Next.js source confirms path revalidation expires implicit tags, and `unstable_cache` includes those tags when reading entries. The test did not prove a production defect. All proposed runtime/test changes were removed before commit or publication. Keep the current behavior; no defect closure or additional fix is claimed. Process lesson: model all cache-invalidation layers before treating a failing mock as source evidence.

Railway access is restored through the newer linked account. Both Railway deployment metadata and the public `/api/health/version` endpoint report production `fab6143f1ba9c81c47f433139e4b6ad672165003` (PR #394), so later source merges are not yet live. Web service `b40482be-5e5d-48cc-b36b-39beabfd5d5c` has no staged changes. The six-change environment patch belongs only to the intentionally paused notification worker and must remain unapplied.

## 2026-10-22 — Combined public archive and carousel release batch

Upload authorization is resolved by the owner's explicit instruction to upload local `914bc24` source/documentation to this repository and branch, followed by sole-writer control and approval for required commits/PRs. Shell GitHub authentication is unavailable; the connected immazhark account published commit `8b3a169ca2ea1f708a3f04843ff51f5dc8bfa330`, whose tree `336a62a529c05e28a48467184f0b8eef0e8c030a` exactly matches local `914bc24`. Existing main and original #406 ancestry are preserved. The local recovery tag retains the original local history.

Protected CI run `39826566823` failed at the production dependency audit, before source tests: existing pinned Next.js 16.3.8 is covered by upstream GHSA-2464-fhr4-w9xw and GHSA-p3m5-59mp-jv5r. This is a pre-existing dependency issue, not a carousel test failure. The official Next.js October 14 advisory and npm metadata confirm the patched 16.4 release line; planned correction is exact pins for `next` and `eslint-config-next` 16.4.2 plus regenerated lockfile. Keep existing configuration, application contracts and bundle caps. Use isolated local dependencies, then audit, units, types/lint and protected production/database/browser checks before merging. No audit suppression or forced dependency-wide upgrade. Deployment remains unverified.

Dependency correction implemented: exact Next.js/eslint-config-next 16.4.2 pins and lockfile; only Next.js package versions changed. Fresh isolated install confirms Next.js 16.4.2 / sharp 0.35.5, production audit zero vulnerabilities, 1,936 unit tests passed / 15 skipped, TypeScript and full ESLint passed, 27 data-boundary/secret/worker/predeploy checks passed. Publish this correction to PR #405 and require fresh protected checks; the failed earlier head is not release evidence. Official remediation: https://nextjs.org/blog/nextjs-security-update-october-14-2026 . Reverting the dependency correction would restore the audited vulnerable version.

Owner: CHATGPT_ACTIVE (ChatGPT Work), sole implementation writer. PR #404 passed full exact-head acceptance and ready-transition verify, then merged under standing owner authorization at `d4b1afe341d944a61dbb0cd72c20826b557d8a51`. Active branch remains `perf/public-media-archive-first-page-count-20261022`, PR #405. Normal merges preserve latest main and the original PR #406 head `2a1766dda3496beb4799e76b567e1fa4fad264c6`, including all source/tests and both sets of handoff notes. Release these together after fresh protected checks; do not separately merge the older #406 without the compatibility correction.

Source-proven regression discovered during deeper caller review: stricter CTA validation made previously accepted stored private destinations throw during public/editor reads and before an editor could repair them. Added failing regressions first. Stored configuration now keeps destinations as bounded editable text, while public composition withholds every unsafe primary/secondary destination. Edited/new slides retain strict validation, authorization and revision checks; unchanged withheld slides remain available for sequential repair. The permanent fallback must have safe links. The editor labels withheld slides with correction instructions. Also fixed duplicate custom/automatic promotions per appeal after schedule ordering, lowercase-Z/compact-offset normalization, and invalid 24:00 schedule feedback. Media first-page count optimization and previous CTA restrictions remain intact.

Validation: 1,936 unit tests passed, 15 database-dependent tests skipped; focused carousel suite 182 passed before adding the rendered-editor case. TypeScript and scoped ESLint passed before that final test, final exact-head checks follow. No payment/auth policy/schema/assets/provider/worker changes. Railway connection requires reauthentication; deployment and live acceptance remain UNVERIFIED. Next: push the combined head, satisfy protected acceptance, merge PR #405 under standing authorization, confirm #406's ancestry is integrated, then verify production when Railway access is restored. Rollback: revert the combined release merge.

## 2026-10-22 — ChatGPT Work sole-writer takeover

Owner: CHATGPT_ACTIVE (ChatGPT Work), sole implementation writer under the owner's explicit October 22 handover. Claimed 2026-10-22T15:40:55+00:00. The outgoing chat writer is superseded. Current branch: `perf/public-media-archive-first-page-count-20261022`, PR #405, inherited head `ec52a881907e07a226c53d8ebbfd1327a1827889`. Verified main: `94b339f6b4280e816b63dd1179f60bf1472dbb93`. PR #404 head `9263af5c990cd946f24ccc73e3d45051936f9674` and #406 head `2a1766dda3496beb4799e76b567e1fa4fad264c6` await final browser/verify; #405 inherited CI passed but main reconciliation is required. PR #374 remains translation-gated. Next: preserve all three implementations, resolve overlapping coordination notes, review and merge only accepted heads under the owner's standing authorization. This latest authorization supersedes older per-PR permission wording; protected checks remain mandatory. Old local workspaces and their uncommitted changes are preserved. No Railway deployment is verified and paused worker settings remain untouched.

## 2026-10-22 — First-page media archive query optimization

Owner: CHATGPT_ACTIVE, sole writer. Base main c9b03946b9c5b3921e4a6975ad9c3eef1cc7da1f. Source-proven: getPublicMediaArchive requested a full eligible MediaAsset count on page one despite the existing 25-row lookahead already determining hasNext. New tests first in src/lib/public-media-archive.test.ts demand no _count for page one, preserved parent publication and image approval gates, a 25-row lookahead, later-page filtered _count and fail-closed behavior when a count is absent. The source now selects only parent id, slug and title on page one; later pages request the same eligible-media count before offset reads. No change to media privacy, storage, public response, URLs, page order, page sizes, client JavaScript, payment, schemas, admin, or Railway worker. Exact-head acceptance pending; PRs #403/#404 remain separate. Rollback: revert scoped PR.

## 2026-10-22 — Minimal public initiative related-record projection

Owner: CHATGPT_ACTIVE, sole writer. Base `main` `c9b03946b9c5b3921e4a6975ad9c3eef1cc7da1f` after the fully checked and owner-authorized PR #402 merge. Test-first source review: `getPublishedInitiativeBySlug` retrieves all database columns of every related Story, Appeal and FaithContent row (including irrelevant or potentially sensitive fields) even though initiative detail renders only story `id/slug/title/summary`, faith `id/slug/title/excerpt`, and appeal `id/slug/title/status/goalAmount/amountRaised/closesAt` for existing payable checks and links. New `src/lib/initiative-detail-relations.test.ts` proves three related SQL selection contracts, strict published privacy gates, image projection bound and DB error propagation. `src/lib/public-content.ts` now selects only those public detail fields while retaining all existing publication, privacy and chronological sorting predicates, root initiative shape, cause/media projections, and authoring model. Keeps canonical initiative page and admin curated-gallery media-status use intact. Additional scoped public detail query regression: story and faith/reflection detail pages also loaded entire linked Cause and Initiative records despite using only public `title/status/slug` for context, publication checks and canonical links. Test-first assertions in `initiative-detail-relations.test.ts` now cover both record families. `getPublishedStoryBySlug` and `getPublishedFaithContentBySlug` read only `cause.title/status` and `initiative.slug/title/status` plus nested `cause.status`, preserving the original story/faith root, approved media, topics, published filters, and URLs. This avoids fetching unused linked initiative story/case content in public read paths. The updated branch head requires fresh exact-head checks. Verified consumer scan also confirmed the initiative detail, programme detail, metadata and curated-gallery call sites need only `cause.title`; the same new test now asserts `cause: { select: { title: true } }`, and the implementation omits unnecessary cause metadata without changing publication gating. No beneficiary/contact/internal notes read through related public records, no schema/payment/permissions/URL/UI/bundle/CSS/media-status changes, and no Railway worker changes. PR #403 is separate (new schema private-route fix), remains subject to checks; release only after exact-head native/fast, production budget, database/browser and verify checks and proper owner authorization. No deployment claimed. Rollback: revert this scoped PR.

## 2026-10-22 — Public homepage CTA private-destination boundary

Owner: CHATGPT_ACTIVE. Base main `94b339f6b4280e816b63dd1179f60bf1472dbb93` after protected and owner-authorized PR #403 merge. Source-proven: homepage slide editor `safeHomeHref` only excluded `/admin` and `/api`, leaving private case-status and donation receipt destinations valid for public CTAs. TDD regression now rejects `/donations` and its subpaths, `/request-assistance/status` and `/received`, including normalized dot segments, encoded aliases, and query variants; preserves `/request-assistance`, `/donate`, `/donate/<reviewed-appeal>` and ordinary public URLs. Regression also covers URL-encoded query (`%3F`) and fragment (`%23`) delimiter aliases which could disguise private routes after proxy decoding. The URL validator rejects these ambiguous encodings on all CTAs while leaving normal literal query and fragment links functional. Implementation expands the existing server/shared path regex rather than importing another module (no added CSS or dependencies); no Razorpay/payment flow modifications, sensitive record access, schema, media, CI or Railway changes. PRs #404/#405 independent, requiring exact-head checks. No merge/deployment yet. Rollback: revert scoped PR.

## 2026-10-22 — Public JSON-LD path and breadcrumb disclosure boundary (integrated with merged #402)

Owner: CHATGPT_ACTIVE, sole active writer. Branch `fix/public-schema-path-boundary-20261022`, baseline main `d4f20174516c7110cc44cfdae05f9b16a7b12d32` following owner-authorized PR #401 merge. Source-proven: `normalizeStructuredDataPath` accepted internal admin, donation checkout and case-status routes (including encoded aliases) as public schema paths, while `BreadcrumbStructuredData` built destination URLs by string concatenation without any canonical/private-route validation. Test-first additions in `src/lib/structured-data.test.ts` and `src/components/structured-data-rendering.test.tsx` assert private and encoded-private paths fail closed, malformed/external breadcrumbs emit no JSON-LD, and legitimate public/relative breadcrumbs retain canonical origin and ordering. Implementation reuses the established `isPrivateAppMediaUrl` guard in the shared JSON-LD path normalizer and validates every breadcrumb path through it. Privacy-safe page copy/URLs/Schema.org structure and serializer remain unchanged on valid public routes. A second source-proven schema gap is closed in the same batch: `normalizeStructuredDataImage` formerly admitted public JSON-LD image URLs pointing into private app routes, including encoded aliases. A failing regression case was added first (relative, production apex/www absolute, nested encoded aliases, retained approved `/media/` and external HTTPS). Implementation now reuses `isPrivateAppMediaUrl` for same-origin/production image URLs while leaving unrelated approved external CDN URLs intact. New exact-head checks are required after this change; do not rely on CI for the previous head. This is isolated server-generated structured-data source code: no private data, payment/Razorpay, permissions, DB schema, content facts, media approval, CSS, client JS, CI or Railway worker changes. PR #402 remains pending browser acceptance and final protected verify. New PR may be merged only after exact-head checks and owner authorization; current owner message gives broad approval to release-ready merges but not bypassing failures. No deployment claimed. Revert this scoped PR to roll back.

## 2026-10-22 — PR #401 merged, PR #402 integrated for new acceptance

PR #401 protected exact-head check suite passed and owner-authorized merge into `main` at `d4f20174516c7110cc44cfdae05f9b16a7b12d32`. PR #402 now merges this main with its own homepage/query/media changes; preserve both sets of code/tests and all prior audit notes. New merge head requires repeat protected checks; neither PR #402 merge nor Railway deployment is implied by this note. Draft i18n PR #374 remains excluded.

## 2026-10-22 — Homepage media review batch consolidation (PR #402)

Source-proven third performance concern: `src/app/page.tsx` independently invoked `getHomeCarouselImages` (which itself invoked `getAppealCoverMediaBatch`) and `getAppealCoverMediaBatch(liveAppeals)`. Each group independently read reviewed media and audit history even when configured slide images and appeal covers overlapped. New test-first `src/lib/home-carousel-data.test.ts` covers a deduplicated shared review batch, no elevation of unreviewed assets and no media reads when no images exist. `getHomeCarouselImages` now accepts both configured slide image identifiers and live-appeal cover URLs; it fetches the union once through the **unchanged** `getAppealCoverMediaBatch` privacy/audit boundary, returning `images` keyed by asset ID and `coverByUrl` keyed by reviewed URL. Homepage calls it once, retains existing `appealImages`/asset merging/rendering. No disclosure gates, payment/donor code, private image copies, admin publication, CSS, provider, schema or content changed. This is source-implemented, not yet exact-head accepted, merged, deployed or live-verified. PR #401 remains ready with protected checks, awaiting **specific** user merge approval. Latest tested PR #402 head from before this change must not be used as evidence for this head. Rollback: revert scoped PR.

## 2026-10-22 — Homepage public appeal SQL projection, queued draft

Owner: CHATGPT_ACTIVE, sole writer. Base `main` `eff58e9f756341fbbe2b5f7645d6be81784f5533` (approved PR #400 merged). Primary release PR #401 remains draft/open with its browser acceptance running; this separate branch `perf/home-appeal-payability-projection-20261022` is **queued** and does not supersede PR #401. Source-proven: `getHomepageAppealsCached` fetched every PUBLISHED appeal, even already fully funded/closed and synthetic fixtures, before finally filtering display candidates in Node. Test-first `src/lib/homepage-appeal-query.test.ts` covers SQL payability, deadline, synthetic prefixes, projection/order/no cap, stale-result safeguards and output limit. SQL now excludes those candidates with Prisma field-ref comparisons before storing the 300s reviewed-record cache; `getHomepageAppeals` continues to recheck time-sensitive payability on every server render. Existing `src/lib/homepage-appeal-expiry.test.ts` has an updated Prisma ref mock to keep the expiry-recheck regression valid. It never limits an earlier SQL query to fewer candidates than downstream users request. Additional homepage-only optimization: the published outcome-strip source was selecting unused initiative image relations, cause copy, summary and year fields. A new query-contract test was written first; `homepageInitiativeSelect` now returns only `slug`, `title`, `primaryMetric` and `primaryMetricLabel`. The separate approved cause-media query and media eligibility predicates are not changed, so hero/work artwork selection is preserved. Targeted and protected exact-head verification must be repeated for this added scope. No payment/Razorpay logic, private donor data, RBAC, DB schema, stored facts, UI styles, client JS, language drafts, or Railway provider/worker configuration changed. Exact-head native + protected browser/build/database/budget checks are still required before a PR merge, and owner-specific PR approval is mandatory. No deployment is claimed; Railway app connector returned an access error earlier. Rollback: revert the future scoped PR.

## 2026-10-22 — PR #400 expanded: fundraising HTML freshness

Owner: CHATGPT_ACTIVE, sole writer, working only in `fix/homepage-appeal-expiry-cache-20261021` (PR #400). Baseline main `4eae874e1e0d21c5aae0d780117041cc306d81b0`. Previous PR #400 already test-fixed the 300s SQL-cache eligibility check, dynamic live-rail no-store, and four-item selection. Current source additionally revealed that `src/app/page.tsx` and `src/app/appeals/page.tsx` used `export const revalidate = 300`, permitting five-minute HTML snapshots of time-bound fundraising links even after fresh-server eligibility checks. New test-first `src/app/fundraising-freshness.test.ts` asserts both route policies; both pages now use `export const dynamic = "force-dynamic"` in place of route-level ISR. This does not alter the 300s reviewed SQL data cache, checkout/payment/provider config, public figures, consent or media. Note: SQL results may still lag independent publication changes until tag invalidation/TTL; the targeted invariant is fresh eligibility evaluation on each render and no stale ISR HTML. Exact-head tests/build/browser acceptance must rerun before scoped owner permission to merge PR #400. PR #374 remains translation-gated, worker staged changes remain untouched. Railway site deployment is not verified to this head. Rollback: revert the PR; verify time-dependent homepage and appeals index in browser.

## 2026-10-22 — Public appeals index SQL eligibility projection

Owner: CHATGPT_ACTIVE, sole writer. Current main baseline `eff58e9f756341fbbe2b5f7645d6be81784f5533` after exact-head checked PR #400 owner-approved merge. New task branch `perf/appeals-active-index-query-20261022` has a source-backed public-read inefficiency: `getAppealsIndexData` retrieved every PUBLISHED appeal and left fully funded / expired filtering to the rendered `/appeals` page. Added query-contract test first in `src/lib/public-page-data.test.ts`. Then added Prisma `amountRaised < goalAmount` field reference and `closesAt IS NULL OR closesAt > now` predicates in `src/lib/public-page-data.ts` to pre-filter records while retaining the final `isAppealOpenForDonations` and synthetic-content presentation gates. The same batch now also removes synthetic staging-test rows in production SQL via the existing canonical staging environment guard, while preserving synthetic test records in staging; two environment-specific test regressions were added before this change. No cap that hides a later valid case, no change to selected private fields, display order, Razorpay, donor records, RBAC, schema, or stored values. No runtime client-bundle growth. Acceptance: focused/fast native checks, TypeScript, production/budgets, database and browser before merge. Current work is source-implemented, **not yet tested/merged/deployed**. A new PR requires PR-specific user merge approval. Draft localization #374 and Railway staged notification service are excluded. Rollback: revert scoped PR.

## 2026-10-22 — PR #400 expanded: fundraising HTML freshness

Owner: CHATGPT_ACTIVE, sole writer, working only in `fix/homepage-appeal-expiry-cache-20261021` (PR #400). Baseline main `4eae874e1e0d21c5aae0d780117041cc306d81b0`. Previous PR #400 already test-fixed the 300s SQL-cache eligibility check, dynamic live-rail no-store, and four-item selection. Current source additionally revealed that `src/app/page.tsx` and `src/app/appeals/page.tsx` used `export const revalidate = 300`, permitting five-minute HTML snapshots of time-bound fundraising links even after fresh-server eligibility checks. New test-first `src/app/fundraising-freshness.test.ts` asserts both route policies; both pages now use `export const dynamic = "force-dynamic"` in place of route-level ISR. This does not alter the 300s reviewed SQL data cache, checkout/payment/provider config, public figures, consent or media. Note: SQL results may still lag independent publication changes until tag invalidation/TTL; the targeted invariant is fresh eligibility evaluation on each render and no stale ISR HTML. Exact-head tests/build/browser acceptance must rerun before scoped owner permission to merge PR #400. PR #374 remains translation-gated, worker staged changes remain untouched. Railway site deployment is not verified to this head. Rollback: revert the PR; verify time-dependent homepage and appeals index in browser.

## 2026-10-21 — Approved release and privacy integration

Owner: CHATGPT_ACTIVE, sole writer by owner direction. Owner authorized pending merges on 21 October 2026. PR #397 has passed exact-head protected checks and merged to `main` at `ec170fe71844f5f2a98ded4c18d98804b92e88db`. This branch (`fix/sensitive-appeal-breadcrumb-privacy-20261021`) now integrates that exact main without discarding prior sharing recovery. PR #398's public metadata and visitor-sharing privacy mask is source-implemented; require fresh exact-head fast, production/budget, database and browser checks after integration before approval-based merge. Draft translations #374 remain gated on professional translations and legal/RTL acceptance, not merely authorization to merge. No live Railway deployment is certified.

## 2026-10-21 — ChatGPT chat sole-writer takeover: appeal sharing recovery

Owner: CHATGPT_ACTIVE (this chat), sole repository implementation writer, explicitly designated by the user. Previous ChatGPT Work writer is superseded for this active session. The latest confirmed `main` SHA at takeover was `b295d95dcc0f97c585cbdaaf7e1373e42cde5c49`; PRs #395/#396 are merged and only draft PR #374 remained open. A new task branch `fix/appeal-sharing-recovery-20261021` is based on that exact SHA.

Source-proven next batch: native share rejection did not fall back to copying, clipboard denial provided no selectable URL, asynchronous feedback could race, and popup-driven WhatsApp action claimed a successful launch without evidence. Tests are created first in `src/components/appeal-share.test.tsx`; implementation and protected CI verification follow. Scope is only public sharing, no payment/auth/privacy/provider/service changes. Owner's 95% coding / 5% process allocation governs. A fresh PR needs scoped owner merge authorization ("merge it") and required checks per 2026-10-20 directive; no new production deployment is claimed.

## 2026-10-21 — ChatGPT Work portfolio batch and approved carousel release

Owner: CODEX_ACTIVE (ChatGPT Work), sole repository writer. The owner authorized all pending permissions, including publishing these coordination updates and merging PR #395 after required checks. The earlier documentation-publication block is resolved by that explicit authorization.

PR #395 head `84bde5b68a7ff68018512d4eeef5ee6ef75ba79c` implements four carousel interaction fixes. Production build, budget, fast and database checks passed. Its browser job was cancelled when the PR became ready and has been rerun; do not merge until that browser acceptance passes. Current verified main remains `fab6143` (PR #394). No claim of a new production deployment or live acceptance.

Active branch: `fix/portfolio-year-selection-20261021`. Server-rendered portfolio corrections retain annual-edition year options, replace duplicate umbrella results with the matching published edition, preserve the overview counts/artwork across filters, and keep a published child discoverable if its parent is unavailable. Query validation and database publication gates remain intact. Ten new regression cases include rendered-page acceptance; 21 focused tests and four native filter checks pass. TypeScript and scoped ESLint pass. Full suite: 1,859 passed, 15 skipped. Clean production compilation passed with unchanged aggregate JS 819145/819200 bytes and CSS 347813/348160 bytes. Protected acceptance remains a release gate.

Next actions: finish PR #395 browser acceptance and approved merge; publish this portfolio batch for review; then address the next source-proven public UX defect. The portfolio batch is newly proposed and has no separate merge approval yet. Draft translations #374 and staged Railway notification worker changes remain outside this task. No legal, religious, payment, privacy or provider policy c…36958 tokens truncated…t route requires assistance.view before lookup/signing; all nineteen exported operational server actions in seven protected action modules require their scoped permission at entry. Login/logout are separate credential/session paths. Existing anonymous-browser spec covers twelve protected surfaces and four APIs. This is source/coverage inspection only, not live acceptance or complete independent authenticated-role testing; R-012 remains partial pending current browser/live verification. No auth bypass was established.

Production remains main 2a8c35ad5e553ac0cc78b8027a35b592d1876826. No production promotion, Railway mutation, real donation/refund, email or beneficiary submission performed. Worker rollout remains pending, temporary annual cron containment intact. Preserve all release, factual, privacy, media and payment gates.

Next atomic actions: validate/integrate #271/#272/#274; complete combined integration CI; check PR #215 release gates and production authorization; recover worker only after its source is on main; perform safe live acceptance and update the master finding register. Documentation checkpoint remains separate to avoid cancelling active source-candidate validation.

---

# 2026-10-12 — ChatGPT Work remediation continuation

Ownership: `CODEX_ACTIVE` under the owner's explicit master handoff and cx continuation. This current entry supersedes historical ownership entries below. One repository writer; no parallel implementation agent.

Integration: `fix/p0-security-remediation-20261010` at `2a20844ee540deaa774817e4b0f919f99dc89d58`. Production release PR #215 remains open against main. Documentation task: `docs/remediation-work-checkpoint-20261012`.

Completed this session:
- R-033, PR #265: rejected giving-intent radio focus. Merge dd7bdcfe8040ce28b2f7f03f368dee2d495cc12b. Full CI 38238484810 passed fast/database/production/browser/verify; the separate ready-for-review run skipped validation and was not used as evidence. PR #215's corresponding review thread is now resolved by the reviewer.
- N-03, PR #268: bind provider payment identity to signed callback. Merge 8c71ce25004b1ff6972ed15550f02ff544f6ecdc. CI 38240338711 passed fast/database/production/browser/verify.
- N-09, PR #266: generic curated-gallery HTTP500 response with safe diagnostics. Merge bc9271dbe491eb87030f51e3d3bc4b04cb53de1d. CI 38239767561 passed fast/database/production/browser/verify.
- N-08, PR #267: compare UTF-8 byte lengths before timingSafeEqual. Merge 2a20844ee540deaa774817e4b0f919f99dc89d58. CI 38240152946 passed fast/database/production/browser/verify.

In progress:
- PRs #269, #270, #272: patches reviewed; no open review threads observed. Fast/database/production passed; browser completion still pending at this checkpoint.
- PR #271: found that reconstructed patch omitted real PostgreSQL regression coverage from #258. Restored all three existing cases (older failure/replay preserves newer authorization; matching CREATED and AUTHORIZED failures) in commit 8a3ffec148f3b8757a0b7b45909c17c9de00afc8. Fresh CI 38243416320 pending; previous-head validation cannot certify this commit. Tests use isolated loopback PostgreSQL only. No runtime source changes in this follow-up.
- Combined integration CI must pass for the final selected commit before production promotion. Individual PR passes do not establish combined acceptance.

Production verified from Railway deployment metadata: main 2a8c35ad5e553ac0cc78b8027a35b592d1876826, deployment bb65fc78-088e-4df2-b7b6-80c59fd62da8 SUCCESS. None of this session's fixes is live. Website service has both renamed MEDIA_S3 credential keys and legacy keys; only names inspected, values not exposed. Do not remove legacy keys until deployed-code compatibility and rollback are addressed.

Notification worker: latest deployment 473c17d9-ca74-45b6-908c-c9c0fb3507b6 FAILED; temporary cron 0 0 1 1 * remains active; only CRON_SECRET and NOTIFICATION_JOB_URL defined. Dedicated /ops/notification-cron rollout and successful authenticated invocation are still pending; restore five-minute scheduling only after recovery. No Railway mutation this session.

Next actions: finish remaining PR validation and integration; validate combined candidate; preserve main review/promotion gates; deploy only with required authorization and successful gates; recover worker; verify production; reconcile the recovered 95-row master register plus N findings. No real donations/refunds or user notifications initiated. Preserve factual locks, provisional tax-registration language, domestic-only fundraising, private records, approved imagery and bottom-right Islamic Companion.

---

# 2026-10-12 — Private record access regression coverage

Ownership `REVIEW_PENDING`; bounded test work completed by Codex under owner continuation deliberately supersedes prior implementation wait only for bounded private acknowledgement/assistance tracking regression coverage. Branch `test/private-record-access-boundaries-20261012` from security integration `f5578c31829aeb76ac4e30060cc658342942d762`. Preserve all independent review/integration/main/production gates.

Verified coverage gap: existing acknowledgement and assistance-status route tests replace origin checks, token hashing and bounded body handling with mocks; they do not establish that the actual privacy boundaries compose correctly. Add tests using real origin/token/body helpers, with only persistence mocked. Cover valid minimal responses, rejected origins, wrong or absent record credentials, corrupt persisted hashes, malformed JSON and actual streamed body limits. No runtime vulnerability claim or application change is implied.

Implemented:18 actual-helper privacy cases across acknowledgement and assistance tracking. Only database lookups are mocked; real origin validation, token hashing, constant-time comparison, schema parsing and streamed byte limits execute. Valid replies expose the expected minimal fields; wrong tokens/missing records/corrupt persisted hashes reveal no private data; foreign/null/missing origins, malformed JSON and actual oversized bodies retain private headers and reject before lookup where required.

Controlled mutation proof in a detached scratch checkout: disabling only origin rejection caused six test failures; bypassing only token equality caused four failures. Each runtime route was restored byte-for-byte in finally; primary runtime routes never changed. All18 focused checks and471 full unit tests pass, six database-dependent skips locally; full lint, TypeScript and whitespace checks pass. No user data, payment, email, real persistence, dependencies, runtime application code or secret configuration changes. Draft pending hosted validation and independent review.

PR254 exact-head CI38173157008 passed1094 Chromium and24 Firefox/WebKit plus fast/database/production/final verify; Ready and unmerged without independent approval. PR255 8b8d9841a49f4269133d78a32cf4487c163fbe8d has successful fast/database/production; browser remains running in CI38174787641. Local composition of #241/#247–#255:527 unit tests passed, six database skips; lint/typecheck passed. PR215 review map records the unresolved development-only braces advisory (no patched release), runtime-prune proof and no confirmed public-input path. No independent reviewer identity established; never invent one or self-approve.

# ChatGPT release-hardening checkpoint — 2026-10-07

Ownership `CHATGPT_ACTIVE`. Frozen integration candidate: `9bd04887cb57c28a73f201f8a5c7002657f2b427`, tree `7c42f5b8b452b16f2aea698a8068baf57a969009`. PR #197 patched source-map-js CVE-2026-93749; PR #198 patched current brace-expansion/Sharp production advisories and added fail-closed `npm audit --omit=dev --audit-level=high`; PR #199 moved GitHub first-party actions to Node-24 releases, promoted Prisma CLI to the legitimate runtime dependency set and pruned dev tooling from the Docker runtime. Exact PR #199 CI #2382 passed fast/database/browser/verify; final merge push CI #2383 passed fast/database/production/verify with JavaScript 806040/819200 bytes and CSS 346301/348160 bytes. The PR #199 tested head and final integration merge have an identical Git tree.

Exact Railway preview deployment `c2b5327d-94ee-49f6-b10c-d7f70673a1fa` is SUCCESS on `9bd04887...`, 1/1 online with zero warning/critical notifications. Pre-deploy ran `node prisma/railway-predeploy.mjs`, found 15 migrations and none pending, completed release preparation and passed `/api/health/ready`. Production remains untouched on main `29c7627ed3bffd0b581935c5b934ad903aeca2cd`. PR #104 remains Draft. PR #195 route-level loading boundaries was closed as a regression branch after 41 browser failures including CLS ~0.814.

Final readiness normalization is on branch `docs/final-release-evidence-20261007`. Release-scoped non-applicable gates: no new unreviewed programme media, no legitimate live appeal, no legitimate live refund target. Genuine unresolved gates: Resend/email acceptance, human rendered accessibility review, final human editorial/social judgement, real Railway Rollback rehearsal, main branch protection and formal production promotion. Resend domain changed from failed to pending on 7 Oct and a fresh verification was triggered; all four records remain pending at last check. Main remains unprotected with no ruleset.

Railway environment contains one non-destructive staged no-op patch `45c0bc6c-46db-4ed8-82cb-3a8f02dfb483`: production preDeployCommand current→identical current and timeout 60→60. It has no live effect. The connected Railway API exposes no discard operation, so remove it in the dashboard before cutover; do not Accept & Deploy merely to clear metadata.

Protected behavior: main/production not to be changed before readiness gates and explicit production authorization; no dummy appeal, real-money payment/refund, beneficiary submission or unreviewed public media; no JS/CSS budget increase; provisional 12A/12AB and 80G wording; no FCRA claim; Islamic Companion remains bottom-right.

---

# ChatGPT emergency takeover — 2026-10-05 16:32 IST

Ownership `CHATGPT_ACTIVE` by explicit owner handover after Codex/Work interruption. Continue existing PR #167 on `fix/all-route-audit-20261005`; do not start a competing branch. Verified remote head before takeover: `bd4feedb9fb41a60ad2b6b9f40b06c8c11cf59db`, base `phase-public-site-rebuild` at `2caccb9fb83424f75a4c78ffa4c9339ae2e15ad7`. PR is open, mergeable and unmerged. Main/production PR #104, production indexing, Live Razorpay/payment/refund actions and factual/media locks remain protected.

Latest remote CI run 37290562293: plan, fast and isolated database jobs passed; browser acceptance completed 1076/1078 with exactly two failures, both complete-page audit containment for `/admin/notifications` at mobile and desktop. The last remote containment patch is `bd4feed…`; this failure remains unresolved remotely and must be reverified/fixed, not waived.

The immediately following owner screenshot batch was partially implemented in the interrupted local workspace but was not pushed after `bd4feed…`. Reconstruct on this same branch from repository truth and the owner's latest directives: narrow all slant separators to ~2px; remove text truncation across widths; elevate Areas of Service styling; remove specified left gold separators; add polished glossy hover/focus treatment with reduced-motion safety; restore individual gallery images into the relevant carousels; correct dropdown padding; ensure WhatsApp opens a new tab; apply these patterns consistently site-wide. Preserve the fixed bottom-right Islamic Companion, approved background/media architecture, canonical facts/content, accessibility, performance caps and responsive containment.

Next atomic actions: inspect exact current source for the screenshot surfaces and shared primitives; implement reconstructed fixes plus the remaining notification containment defect; add/adjust focused regressions; then run/trigger scoped checks before the full PR gate. Do not claim complete AAA or defect-free status from automation alone.

---

# Complete route/state UI audit — 2026-10-05 IST

Ownership `CODEX_ACTIVE`. Owner requests every site page receive the same audit, including dynamic children and protected operational states. Atomic branch `fix/all-route-audit-20261005`, verified integration base2caccb9fb83424f75a4c78ffa4c9339ae2e15ad7. Only draft PR104 is open; main/release promotion protected. Build an explicit source route/state inventory, inspect actual desktop/mobile public renders and isolated admin/private journeys, fix confirmed defects, preserve factual copy/approved media/design and unchanged performance caps. Shared polish alone never counts as page-specific review. New complete inventory must distinguish source review, visual review, browser interaction and isolated-state evidence; unknown/unavailable states remain explicit. No subagents, real payments, beneficiary submissions or live staff mutations.

PR167 diagnostic head3c3de5786f20c44454247d9828958fb44af10469 / CI37230459929 completed237 passing and38 failing checks. All60 source page templates have matching desktop/mobile capture;87 routed views plus root interruption per device. Contrast and admin scroll focus findings now fixed locally, homepage editor banner standardized, private acknowledgement429/503 retry and receipt wrapping fixed. Twelve local receipt/recovery/interruption checks pass;440 unit and31 planner checks pass. Final complete acceptance/deployment remains pending; no claim of all-page pass or AAA certification. See ALL_PAGE_UI_AUDIT_2026-10-05.md.

---
# Sitewide experience polish — three batches delivered, 2026-10-05 IST

Ownership `IDLE` for this delivered batch. PR163 shared Motion/Lenis, contrast, navigation crash and compact menu containment fixes; PR164 programme closing alignment; PR165 continuous umbrella lattice are merged to `phase-public-site-rebuild`, deployed and live verified. Main and draft PR104 remain protected; live environment remains staging with test payments. Prior entries below are historical checkpoints.

PR163: CI37225113277 passed 888 Chromium and24 Firefox/WebKit checks without retries; integration37226470652 and exact-source Railway08ff3623-78b7-439a-ac13-5a087ab9a5ea succeeded. Six live contrast/navigation checks passed. PR164: CI37226550562 passed479 focused Chromium checks without retries; integration37227379178 and Railway58157547-5387-467a-85e7-a43de73b48f0 succeeded on merge2ec02ceb4505b3853f324f338a73a38e145af9f6/tree1240ae48ff8bd98517051f488606e84459f47734.

PR165: tested head f223b69b5b05fc9608b475ce9c37c5f90a644f28; merge2405a8f10ac57737ff88071fa155b5739bdda9da; local/remote/tested/merged tree9be0b0249a87a47885563d4eb4e140737e1a5ca5 identical. CI37227916057 passed74 focused checks without retries in2.0minutes; integration37228293890 and Railway5388b090-53b9-4e81-a0e5-e0d6a5a2ec51 succeeded. Live version confirms exact merge. Four final live Eid/auto-rickshaw checks at390/1440px pass: single continuous parent lattice, transparent child sections, correct left title/right desktop actions and20px mobile gap,56px desktop heading cap, no overflow or page errors. Final static JS818952/819200 and CSS346731/348160 bytes, caps unchanged.

Bounded review:78 capture metrics clean and overview/form/programme/footer families inspected. Live background failures on the initial umbrella review were genuine, documented and fixed in PR165; the final rerun passed. Legacy quick-link hover padding warning was an overridden selector, with no measured layout shift. No complete AAA certification or whole-site defect-free claim; human screen-reader/zoom review and separately tracked route/private-state review remain in the inventory. No pending code change or active writer in these batches. New confirmed defects use an atomic branch. See SITE_EXPERIENCE_POLISH_2026-10-04.md.

---
# Sitewide experience polish — programme pattern follow-up, 2026-10-05 IST

Ownership `CODEX_ACTIVE`. Shared batch PR163 and programme alignment PR164 are merged, deployed and exact-version verified. PR163:888 Chromium +24 Firefox/WebKit checks passed; integration37226470652 and Railway08ff3623-78b7-439a-ac13-5a087ab9a5ea green; six live contrast/navigation checks passed. PR164:479 focused Chromium checks passed without retries; integration37227379178 and Railway58157547-5387-467a-85e7-a43de73b48f0 green on merge2ec02ceb4505b3853f324f338a73a38e145af9f6/tree1240ae48ff8bd98517051f488606e84459f47734. Live individual detail alignment passes at390/1440px; umbrella closing geometry passes, but live background checks exposed the legacy alternating paper surface restarting the lattice on umbrella pathways.

Active atomic branch `fix/programme-continuous-pattern-20261005`: make the canonical parent background rule outrank the legacy alternating surface, with Eid/Taleem umbrella regressions. Finish scoped CI and exact-source deployment before closure. Approved media/copy/colors, main and draft PR104 remain protected. This is no AAA certification or whole-site defect-free claim.

---
# Programme closing alignment — published 2026-10-04 UTC

Ownership `CODEX_ACTIVE`. PR164 on `fix/programme-closing-alignment-20261004` validates the remaining programme closing alignment using the existing body heading grid. Initial head `2e2d6c130651e427b2188e8b15e0cf81f2396841`, tree `0ce66f6ef162ec1455beb07ec486359220ba0e6f`; seven local responsive/axe fixture checks and30 planner checks pass. Next action: finish seeded focused CI, merge once green and verify exact-source Railway deployment. Main and draft PR104 protected.

PR163 merged as `cb3cf8b90f2e76044669e500410a2f0c7d3de68d`. Exact tested head `8ff82a0757d72526a57b9aadf1498bef09c7df16`; tested/local/remote/merged tree `04797598d2dd5743717193bd1686e7f2a2e896ae`. CI37225113277 SUCCESS:888 Chromium checks without retries in16.5minutes,24 Firefox/WebKit checks in34.2seconds, fast and isolated database jobs green. Mobile hidden-link Motion crash, five contrast families and compact fine-pointer menu background scroll resolved. Shared Motion/Lenis delivery awaits integration build/Railway/live verification.

---
# Sitewide experience polish — 2026-10-04 IST

Ownership `CODEX_ACTIVE`. Branch `feat/site-experience-polish-20261004`, base `ad1a9941f087297235492795f9ac42c82e2cd557`. Owner delegates page-by-page/batched implementation of motion, micro-interactions, smooth scrolling, responsive/accessibility and performance polish. First inspect all routes and shared foundations, preserve approved brand/content/media and protected main/draft PR104. Motion respects reduced-motion and content remains available before hydration; keyboard/touch/nested scrolling stays native. Keep existing bundle ceilings, verify dependency lifecycle and full shared-system acceptance. Do not claim AAA certification from automated tests. No delegation.


PR163 remains open and undeployed. Resumed from head96733dfeedd20bc7edd66da90a532d39928d0051. Initial seeded CI37215501401 exposed five contrast failures and a mobile route crash: Motion committed styles after a menu link became hidden. Replaced stop with cancellation; strengthened regression against page errors/global interruption fallback; moved legacy text colors to approved contrast tokens. Corrected CI and delivery pending; main and draft PR104 protected.

---
# Initiative photo banners and detail polish — delivered 2026-10-04 IST

Ownership `IDLE`. PR161 merged into `phase-public-site-rebuild`. Tested head `f13ab2a8b3b67192242b8b8f4688d97a980fcba6`; merge `3f7d5e88b16a6c981b2ef59b3e2c0cef65e0a41e`; tested/local/remote/merged tree `df9068cf20bb2266114e5ecd6762f0c9d0a1f532` identical. CI37205921770 SUCCESS:571 focused Chromium checks passed in8.6minutes without retries. Local417 unit checks and29 planner checks pass. Integration37206621914 SUCCESS: production build, JS813541/819200 and CSS345943/348160 budgets and server smoke; duplicate browser/database work skipped.

Railway `74bfba5c-e91d-4f43-9646-63a9d3fd8e55` SUCCESS on exact merge. All30 published initiative pages verified live on desktop:22 single-photo headers, four umbrella collages and four no-media fallbacks; every selected image loaded, one H1, display-serif story heading, narrative reaching shell right edge and no horizontal overflow. Auto-rickshaw page uses its existing landscape vehicle photograph with blended edges; all three gallery originals remain. Pale gold/blue cards retain continuous lattice. Six-width responsiveness/mobile axe verified through isolated CI geometry fixtures; live review does not claim all mobile photo crops were inspected. Final live banner proof inspected and saved.

Selection uses existing published/privacy-approved assets, excludes collage derivatives on individual pages, and leaves other discovery identity selection unchanged. No generated beneficiary imagery, new dependency, schema/payment/email/factual edit or bundle ceiling increase. Main/draft PR104 remain protected. Current task complete; new confirmed defects require a new atomic branch. See INITIATIVE_BANNERS_2026-10-04.md. Documentation closure branch `docs/initiative-banners-delivery-20261004`.

---

# Site regression audit — delivered 2026-10-04 IST

Ownership `IDLE`. PR159 merged to `phase-public-site-rebuild` after full acceptance. Tested head `8ddb7cb4ae640e8d728ec1e95f0d43f71672e43e`; merge `c4bddf7db9e579d14c7ff4a72b6daee9b8a0cd63`; tested/local/remote/merged tree `f8c1d1097f41533d9e49db1aa93f13f89deb0024` identical. CI37202065296 SUCCESS:842 Chromium checks in10.8minutes and24 Firefox/WebKit checks in22.2seconds, no retries; fast and isolated PostgreSQL checks pass. Integration37203377607 SUCCESS: production build, JS813541/819200 and CSS344253/348160 budgets, server smoke and database checks; duplicate browsers skipped. Local414 unit checks and28 planner checks pass.

Eight confirmed defects resolved: tracking hydration; failure/retry states preventing duplicate requests; false confirmation without credentials; client-navigation credential timing; automatic carousel announcements; legacy contact markers; mobile Highlights keyboard access; seasonal image/title overlap. Final mobile home and seasonal native-size captures inspected; all78 named-route capture metrics clean. Earlier89 overview captures inspected; additional17 nested annual/education programme routes reviewed live on desktop for substantive copy, single H1,56px body H2 ceiling, containment and no clinical section. That additional review does not claim all17 were manually reviewed on mobile.

Railway `e8c2440c-54bd-4b7e-a33f-1143a705edf8` SUCCESS on exact merge. Live seasonal image/title gap54.515625px and no overflow; six contact SVGs; correctly hydrated missing-link status/confirmation and no new first-party hydration error; Highlights named focusable region with3px visible outline. Live desktop proof saved. Full submit/retry, protected operational and payment/security journeys use isolated tests; no real donation/refund, beneficiary submission, email or staff mutation performed. Main/draft PR104, canonical facts/media, approved brand patterns/typography, Companion and bundle ceilings preserved. No pending code change in this batch and no whole-site defect-free claim. See SITE_REGRESSION_AUDIT_2026-10-04.md. New confirmed defects use a separate task branch.

---

# Premium carousel controls and programme artwork — delivered 2026-10-04 IST

Ownership `IDLE`. PR157 delivered to `phase-public-site-rebuild`: tested head `6320b7d082b15164942831711d0a8bd9e2cccf85`, merge `d7ee5c64a9c317674d55df6a673b0701481cc0f0`; local/tested/remote/merged tree `90a2d98ff7cb1b0e00272bf1a68e5e1444cecf8c` identical. Final CI37161334707 SUCCESS:173 focused Chromium checks passed without retries in2.8minutes,414 units pass (six isolated-database fast skips),28 planner checks pass. Integration37161688907 SUCCESS: production build, unchanged JS811105/819200 and CSS344018/348160 budgets and server smoke; duplicate browser/database acceptance skipped.

Railway `8d91d45f-1674-47d7-8dc7-a0e811e06f36` SUCCESS on exact merge. Live desktop verification confirms hero slides2/4/5 new derivatives loaded,3 SVG hero controls48px, all5 umbrella card images loaded, emergency shared carousel full1184px width with27.26px display headings and44px SVG controls, relevant flood derivative/privacy blur and COVID branded fallback; seasonal full-width feature/winter imagery retained. Original gradient/pattern/fade, admin overrides, canonical links and Companion preserved. No desktop overflow on verified routes. Mobile/responsive proof is six-width local and seeded CI, not live cloud emulation. Two final live screenshots captured and inspected.

Initial acceptance171/173 passed; two legacy glyph-label selectors corrected to exact semantic labels and aria-hidden SVG checks. All3 gallery checks pass locally. Gallery test path initially selected unknown/full; explicit mapping and regression added, superseded run37161156585 automatically cancelled. Final planner confirms focused union and database skipped; unknown/core/auth/security and main-release paths still fail closed to full. Six authentic source-derived sibling WebP collages have source/output hashes and provenance; gallery originals unchanged. No separately identified COVID source exists, so its branded fallback remains. No database/schema/dependency/payment/email/indexing change. Main/draft PR104 protected. No whole-site defect-free claim. New confirmed defects use a separate task branch.

---

# Nine owner screenshot surfaces — 2026-10-04 IST

State: `IDLE` (delivered PR156; see final ledger). Historical branch `fix/owner-nine-surfaces-20261004`, base `67b3fc256f1f05c29ebde694ba830559f2e91444`. All nine supplied screenshots inspected. Scope Stories ethic pattern; Faith library width/editorial typography; Contact privacy pattern/closing contact icons; sponsorship closing placement; Partner areas; Compliance status/pending patterns and presentation. Preserve factual copy, approved assets, fixed Companion, original headers, unchanged budgets and protected main/draft PR104. Focused responsive/a11y and CI delivery.

---

# Homepage image edge blend and controls — 2026-10-04 IST

Ownership `IDLE`. Homepage edge blend and control refinements delivered through PR154. Tested head `a56bbbf0a4e05ea72be7e93dad4e5b92ea795bae`, merge `a9b84271bd0023106fb06a9faa5b3be67ab6bbf1`; tested and merged tree `0fed7715aa1e36241e309151feb2e13da38b2db8` identical. PR CI37149189924 SUCCESS:110 focused browser checks passed first attempt in1.6minutes. Integration CI37152618989 SUCCESS; duplicate browser/database work skipped. Production JavaScript810705/819200 and CSS348141/348160 bytes, unchanged limits.

Railway deployment `c33bffa1-0db0-4a00-8026-b4dff894b267` SUCCESS on exact merge. Live https://amaanafoundation.org/ verified all five image elements have intersecting side/bottom masks, all three cinematic controls have48px circular translucent surfaces and8px backdrop blur, original gradient/lattice remains, and no desktop horizontal overflow. Final live screenshot inspected and saved. Responsive/mobile proof remains the local14-check six-width validation and focused CI; live cloud proof is desktop. Programme content, crop, backend, fallback and carousel behavior preserved. No pending implementation in this atomic task. Main and draft PR104 remain protected. New confirmed defects use a separate atomic branch; no whole-site defect-free claim.

---

# Dynamic homepage carousel — 2026-10-03 IST

Ownership `IDLE`. Delivered PR152, tested head `9ef0f45ed0bd2bc1ca9fecc92f62640899effdf9`, merge `4d87df7c57eaaab070697fd1244193f9b7c63797`; tested/local/remote/merged tree `5a6493c8e80556bb46969f754f894fd88dab92c2` identical. Final PR CI37145322111 SUCCESS:745 Chromium checks in10.5minutes and24 Firefox/WebKit smoke checks in26.2seconds;414 units and isolated PostgreSQL migration/persistence/revision/rollback checks pass. First core run had736 passes/nine superseded banner expectations; updated assertions preserve gradient/image/edge/fade/grid/overflow/height requirements, final run no retries/flaky failures. Integration CI37146239534 SUCCESS, duplicate browsers correctly skipped; production JavaScript810705/819200 and CSS348088/348160 bytes, unchanged limits.

Railway review deployment `a86daec7-eb42-4992-9e30-ab6d94a16c49` SUCCESS on exact merge. Startup applied20261003180000_home_carousel successfully. Live https://amaanafoundation.org/ confirms five programme slides in requested order, loaded collage images, working dots/pause, original gradient/lattice, right media edge equals shell edge1266px at1363px viewport,60.8px header title, centered controls and no horizontal overflow. `/admin/home-carousel` redirects unauthenticated visitors to `/admin/login`; no signed-in live editor mutation is claimed. Admin action permission/revision/audit guards and persistence validated through unit/isolated database checks. Live has no open public appeal; automatic insertion/removal is verified through tests, not a fabricated live appeal. Responsive/mobile proof is local/seeded CI; cloud live proof desktop only. Final deployed screenshot saved. Five AI-assisted collage derivatives remain separate from original programme photographs, with provenance and meaningful alt text.

Main remains `1a69dd179181390a488623accf1314a1ff09e319`; PR104 remains open/draft (its integration head naturally follows the new merge). No production launch/payment/email/indexing promotion. Next: owner reviews deployed carousel; admin staff use Home carousel to manage slides. New confirmed defects use a separate atomic branch. Documentation closure branch `docs/home-carousel-delivery-20261003`. No whole-site defect-free claim.

---

# Homepage banner composition — 2026-10-03 IST

State: `IDLE`. Delivered PR150, tested head3ecc6b492350bc2cc0053e569917fd88967bb3de, merge7a471eb141b248b000ea73cfff5702cb0c2c43cd; identical local/remote/tested/merged treee5994a3f18163b3b864daf5076f99678352057fb. CI37137587817 SUCCESS:112 first-attempt Chromium checks in2.3minutes and392 units pass (six database-dependent fast skips). Integration37137964849 SUCCESS, duplicate browser/database skipped. Railway2a7bbb9a-f7ba-4a95-9122-a27c7626bc58 SUCCESS on exact merge. Live three-slide carousel, next/previous/pause, full subtitles,64px header title versus56px body cap,480px logo, continuous geometry, no desktop overflow and fixed Companion verified. Right-side approved identity-image fade implemented; current two featured slides have no approved identity header photos and use brand fallback. Six-width fit plus mobile/desktop axe passed. Shared React server-rendered banner composition; no new client library/database call. Production JS819181/819200,CSS344401/348160, caps unchanged. Updated stale legacy-button acceptance to canonical button foreground and selectors. Protected main/PR104 untouched. Policy separator PR149 also deployed/live verified on all four policy routes. See HOME_BANNER_COMPOSITION_AUDIT_2026-10-03.md. Next: owner reviews deployed homepage; only new confirmed defects require a new task branch.

---

# Policy trailing separator — 2026-10-03 IST

State: `IDLE`. Completed PR149. Historical task: branch `fix/policy-trailing-separator-20261003`, base ddbd4d9181c33d806d51746a6f46f7a5c9ace27e. Three owner screenshots show the trailing vertical rule after the third policy principle on Terms/Privacy/Refund. Donation Policy already suppresses it; generalize that existing shared rule to every policy page. Preserve internal dividers/content/backgrounds/responsive layout. Focused existing CI plus desktop/mobile border inspection; main/PR104 protected.

---

# Participation and Appeals pattern correction — 2026-10-03 IST

State: `IDLE`. Four owner screenshot corrections complete through PR146 and corrective PR147. Final head946d82652b52a0d68f5179f886b6bbc8a0d179ba, mergec4309f3f9b664f800e76046a0838d2364e4d9b08; local/tested/remote/merged tree48ab227d530fb03fa7531369550e35664525449b identical. Final CI37128498341 SUCCESS:134 Chromium first-attempt checks in1.8minutes;392 units pass with six database-dependent fast skips. Integration37128803878 SUCCESS; duplicate browser/database skipped. Railway reviewd2a78709-6a93-44cb-8888-4ea23d2deea8 SUCCESS on exact merge. Live two-route desktop checks confirm Get Involved, completed Appeals, dark review and privacy lattice; topmost dark pattern/normal blending, obsolete square absent,12px privacy label/56px title/20px action separation/no divider/no overflow. Dark review and privacy screenshots inspected. Six-width seeded CI and local Get Involved responsive/axe checks pass. Clean build JS819177/819200,CSS348149/348160, caps unchanged; no client JS added. Initial presence-only regression missed global opaque layering; corrected with topmost-layer assertion before final delivery. See PARTICIPATION_APPEALS_PATTERN_AUDIT_2026-10-03.md. Docs closure branchdocs/appeals-pattern-final-delivery-20261003. Main/PR104/artwork/factual copy/media/carousel/payment/Companion preserved. Next: owner reviews deployed changes; new confirmed defects use separate task branch. No whole-site defect-free claim.

---

# Owner surface polish — 2026-10-03 IST

State: `IDLE`. All 19 owner screenshot corrections delivered through PR144, merge `5c0e61c2390c5ca339a754af4550925d525df830`. Local/tested/remote/merged tree `12277a804c87e4b3253969aca22d801fac08531c` identical. Sponsorship process/closing/cards, assistance follow-up, canonical institutional grids/headings, partnership actions, compliance guardrails, policy principles/prose/security notice and approved lattice visibility corrected. PR CI37124521399 SUCCESS:586 Chromium checks passed first attempt in9.6minutes. Integration CI37125268532 SUCCESS; exact-tree acceptance reused, duplicate browser/database skipped. Local15 responsive/navigation checks,24 planner regressions, build/types/lint and design detector pass. JS819181/819200,CSS347615/348160; caps unchanged, CSS smaller than baseline.

Railway review deployment `c4b2596f-9d41-47f9-9dc4-3ec54525096d` SUCCESS on exact merge. Live desktop checks cover all11 affected routes: sponsorship number absent/title38.164px/equal CTA baseline/restored pattern/right closing; four policy prose columns734.234px full width, lighter summaries and shield notice; governance/reporting rows1184px full shell; recognition heading1184px; partnership separator gap32px; assistance rows84.1875px/no shadows; compliance572px+572px with lattice; no horizontal overflow. Responsive proof is local/seeded CI, not cloud viewport resizing. Source/legal/factual/payment/form/media/artwork/Companion contracts preserved; protected main/PR104 untouched. See OWNER_SURFACE_POLISH_AUDIT_2026-10-03.md. Documentation closure branch `docs/owner-surface-delivery-20261003`. Next: owner reviews the deployed fixes; subsequent confirmed defects use a separate atomic branch. No whole-site defect-free claim.

---

# Donate and sponsorship screenshot correction — 2026-10-03 IST

State: `IDLE`. Task completed through PR142, merge `e20149276b6bb864c082f5a15b718eeeec85bc4a`. Donate section1 now matches section2's canonical grid/font; Sponsor Education supporting copy uses body typography/top alignment. PR CI37117208040 SUCCESS:103 first-attempt Chromium checks in1.9minutes, including six widths320/390/768/1024/1440/1920. Integration CI37117505771 SUCCESS; duplicate browsers skipped by exact-tree acceptance. Local typecheck/build/lint (one existing importer warning), detector and23 planner checks pass. JS819181/819200,CSS347746/348160; caps unchanged.

Railway review deployment `f58aa5cc-5729-4f35-ba59-35bed9156977` SUCCESS on exact merge. Live desktop Donate confirms both headings40.89px,left82px; both copy columns643.11px. Sponsor lead changed from40px Georgia/70px line-height to18.88px Arial/33.04px, equal column tops1657.75px and no overflow. Responsive proof is seeded CI; live browser is desktop. See DONATE_SPONSORSHIP_LAYOUT_AUDIT_2026-10-03.md. Source/query/payment/copy/artwork/Companion unchanged. Only protected production PR104 remains; no main promotion. Next: owner continues observations; new confirmed issues use a separate task branch. Documentation closure branch `docs/donate-sponsorship-delivery-20261003`.

---

# Latest delivery — section hierarchy and alignment — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration: `phase-public-site-rebuild`. Implementation/CI/review deployment complete. Documentation closure branch `docs/section-hierarchy-delivery-20261003`.

Completed: body display H2 cap3.5rem across shared and legacy route rules; homepage banner titles exceed body display headings, max4rem; shared homepage title-left/description-right introduction; full-shell closings with right-column supporting copy and aligned actions, mobile stacking; block evidence headings above their labels; wider heading measures. Corrected short Contact closing copy specificity and pre-existing390x844 menu backdrop reachability with a3rem dismiss strip. Approved artwork/content and fixed Companion preserved.

Validation: final24 local responsive/keyboard/scroll/WCAG/Contact/backdrop regressions pass.392 units pass with six database-dependent skips,22 planner and editorial checks pass; lint one existing importer warning. Exact-head PR CI37107270067 SUCCESS:706 Chromium first-attempt checks in10.0minutes and24 Firefox/WebKit smoke checks in51.3seconds. Initial PR CI37106160672 had698pass/3fail; two task-introduced Contact alignment failures and one pre-existing backdrop failure fixed without disabling assertions. Production build/types/coverage/database/server smoke and unchanged budgets green:JavaScript819181/819200,CSS347689/348160. Integration CI37108057516 SUCCESS; exact-tree PR browser acceptance reused, browser job skipped.

Delivery: application PR [#140](https://github.com/immazhark/amaana-platform/pull/140), final head `69f93b5e3ace613a4e5ec16daab598354e7efc52`, merge `3d83e2df7ba5a80687d95d04903c3ed731b7aa7d`; local/tested/remote/merged tree `45cbb6609900ab6c3c72ae66bb98582f1af4cdba` identical. Railway review deployment `e78d725e-3399-410f-aee9-ef12739c2514` SUCCESS on exact application merge. Main/production PR104 remains protected.

Verification limit and next action: desktop/mobile local captures inspected and seeded real-route CI passes. Live /our-work was reachable before deployment, but post-deployment reload failed because the execution environment disconnected (409 environment_offline). No post-deployment live visual confirmation is claimed. Workspace/local checkout refresh also became unavailable. Restore the workspace connection, fetch latest rebuild integration/documentation before any writes, then verify deployed Home/Our Work/Stories/Impact/Contact geometry. No application change or full-suite rerun is needed solely to resume live verification. See SECTION_HIERARCHY_AUDIT_2026-10-03.md. No whole-site defect-free claim; canonical factual/privacy/payment/media/indexing locks preserved.

---

# Latest delivery — Companion panel accessibility — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration: `phase-public-site-rebuild`. Expanded Companion task complete; documentation closure branch `docs/companion-panel-delivery-20261003`.

Completed: labelled tab IDs/shared content panel, roving Tab order, ArrowLeft/Right wrapping and Home/End activation;44px tabs/source controls; scoped panel bounds below sticky chrome and above the existing fixed dock. Normal-height panels flex the scrolling content, short windows scroll the whole panel. Removed unused immutable reminder state, unused refs and delayed focus scheduling; reused static line icon. Fixed dock location, approved visuals/source text and prayer/date/API behavior unchanged.

Verification:25 local responsive/keyboard/header-navigation/WCAG/retry/reachability checks pass in39.9seconds across seven widths and short/tall windows.392 units pass (six database-dependent skips),22 planner regressions pass; fresh build/types/lint green (one existing import warning; two dead-ref warnings removed). Detector emitted no findings before final static-icon optimization. Initial failures classified as stale generated output, alert-locator ambiguity and real subpixel tablet dock overlap; source/test fixes completed without suppressing failing requirements. JavaScript819181/819200 and CSS347670/348160 bytes, unchanged caps.

Delivery: PR [#138](https://github.com/immazhark/amaana-platform/pull/138), tested head `b94d81bec44b368ff584b8a1dab3f0bb2d679c75`, merge `7d2e3ffe62bf284eee5b18e25459e9a6b5dc46ce`; local/tested/merged tree `770db4f9d7496143e6e0c971a87c4cdb20063692` identical. PR CI37101750482 SUCCESS:65 Chromium first-attempt checks pass in1.5minutes. Integration CI37102025429 SUCCESS: exact-tree browser acceptance reused, duplicate browser/database skipped, build/budgets/coverage/server smoke green. Railway review `32edc17f-2650-4358-9954-53549444a074` SUCCESS on exact application merge SHA.

Live desktop /about screenshot/accessibility/DOM confirms44px tabs, actual IDs, selected-only Tab order, named content, real Right/Left activation/focus, panel top145.61px below81px header and bottom849.61px above865.20px dock, fixed Companion, no horizontal overflow. Escape removes the panel and restores dock focus/expanded=false. Mobile/tablet/short-screen proof is local/seeded CI; live cloud-browser viewport resizing not claimed. See `COMPANION_PANEL_AUDIT_2026-10-03.md`.

Next: owner continues UI observations; new confirmed defects use a separate atomic task after incoming checks. Main/production PR104 remains protected. Canonical factual/media/privacy/payment/indexing and fixed Companion locks preserved. No whole-site defect-free claim.

---

# Latest delivery — shared navigation resilience — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration: `phase-public-site-rebuild`. Atomic shared-navigation task complete; documentation closure branch `docs/navigation-audit-delivery-20261003`.

Completed: corrected 760/1020px backdrop breakpoint mismatch, locked background scrolling only while mobile navigation is open, cleared stale menu state on desktop resize with visible home-link focus, and used shared chrome-height/dynamic viewport tokens for short-screen reachability. Reused immutable links for keyboard wrapping; dismissal restores focus without unnecessary animation-frame scheduling. Approved design, banners and fixed Companion unchanged.

Validation: final 11 local responsive/keyboard/header-WCAG checks pass across five widths/two heights; 392 units pass (six database-dependent skips), 21 planner regressions pass. Production build/types/lint pass (three existing warnings). UI audit detector has no emitted findings. PR CI 37099076391 SUCCESS: 57 Chromium checks pass on first attempt in1.5minutes. Integration CI 37099358020 SUCCESS; exact-tree PR acceptance reused, duplicate browsers/database skipped, build/budgets/coverage/server smoke retained. JavaScript819175/819200 and CSS345824/348160 bytes, caps unchanged.

Delivery: PR [#136](https://github.com/immazhark/amaana-platform/pull/136), tested remote head `52fa5a362270cf2a52f9408cdbfa65b48e9d5dc4`, merge `838bf7d7519cf50996cf49c51f084eb78a39c31a`; both tested and merged tree `d2cdefbfba7bf12fec6607a64c845dcd38e3a88d` matches local tree. Railway review deployment `79349c3e-b715-4e54-8aef-3f5c28fc2621` SUCCESS on exact merge SHA. Live desktop /about screenshot/DOM confirms loaded header CSS Module, menu hidden/expanded=false, body overflow visible, no horizontal overflow, approved gradient/geometry/Arabic branding and fixed bottom-right Companion intact. Mobile/tablet and short-screen proof is local/seeded CI, not live cloud-browser resizing.

Next: owner continues UI observations; new confirmed defects use a separate atomic branch after incoming checks. No claim that the entire site is defect-free. Main/production PR104 remains protected. Canonical factual/media/privacy/payment/indexing locks preserved. See `UI_NAVIGATION_AUDIT_2026-10-03.md`.

---

# Latest delivery — assistance progress and actions — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`.

Completed: readable branded current/upcoming assistance progress at14px with44px controls; disabled semantics preserved. Corrected CSS Modules selector for global forward button, restoring desktop right alignment and explicit mobile full-width stacking. Removed duplicate local progress declarations. Form/validation/submission/permission logic unchanged.

Validation:19 local browser checks pass in47seconds, covering24 step/viewports at320/390/768/1024/1440/1920 with WCAG A/AA axe, action geometry, genuine keyboard traversal/focus and retained values; seven existing private assistance journeys pass. Build/types/lint (three unchanged warnings),20planner/content/editorial/global CSS/diff guards pass. Detector finding is only unchanged privacy-note emphasis. Initial default axe best-practice advisory and test focus timing corrected in coverage/method, not suppressed application failures. See ASSISTANCE_PROGRESS_AUDIT_2026-10-03.md.

PR [#134](https://github.com/immazhark/amaana-platform/pull/134) merged asf72eca09957a63e9f7b922563484977b7f8bbb1c. Exact tested remote head3d9ac4705d643f93d914d4337d6a8045b8050783 matches local treeed649737de03c5d1b2ecf55a4e03564daf38f342. PR CI37054686962 SUCCESS:68 Chromium first-attempt pass in2.2minutes,392 unit checks pass (six database-dependent fast skips). Integration push37055303488 SUCCESS; exact-tree browser acceptance reused, duplicate browser/database skipped; production build/budgets/coverage/server smoke green.

Railway review deploymentd43c96f0-3698-46fb-94e9-64994a923bb4 SUCCESS on exact application merge SHA. Live desktop /request-assistance#request-form screenshot/DOM verifies all four progress labels14px,44px targets, opacity1, muted upcoming surfaces with real disabled attributes, active blue surface, forward action right-gap0 and no horizontal overflow. Local/seeded tests cover six widths and all four steps; live verification is desktop. JavaScript819031/819200 and CSS345202/348160, caps unchanged.

Task complete, ownership IDLE. Next: owner continues UI observations; subsequent confirmed defects use a separate atomic branch. Protected PR104/main release, canonical facts/copy, approved artwork, media/privacy/payment/indexing and fixed Companion preserved. No claim of a defect-free whole website. Documentation closure branch docs/assistance-progress-delivery-20261003.

Older entries below are historical.

---

# Assistance progress and actions audit — 2026-10-03 IST

State: `CODEX_ACTIVE`. Branch `fix/public-controls-20261003`, verified integration base `b8d75553b254705baabd42f4a0f80f57a406ddcc`. Owner authorizes continued UI/UX checking and fixes. Only protected production PR104 is open. Confirmed live assistance progress labels12.16px and disabled opacity.48; CSS-module action selector does not match global v2-button, leaving desktop forward action left-aligned. Mobile global rules currently mask width mismatch. Scoped presentation fixed;19 local browser checks pass across24 step/viewports and seven private journeys. Build/types/lint/content/CSS guards and20planner checks pass, CSS345202/JavaScript819031 within unchanged caps. Publish/CI/merge/exact review delivery next. See ASSISTANCE_PROGRESS_AUDIT_2026-10-03.md. Preserve canonical content, artwork, payment/privacy/indexing and fixed Companion.

---

# Latest delivery — policy navigation and accessibility — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`. Application PR [#132](https://github.com/immazhark/amaana-platform/pull/132) merged as `5e505ce4758f7cf8ed6fd6d4a0a7538e1e509ab4`; exact tested task head `0bf13028804bdb67045c41ef660d66eb65329b08`, tree `77b4c8175cc11072c3d7108a098bbf99157d79ab`. Documentation closure branch `docs/policy-audit-delivery-20261003`.

Completed: native policy headings clear sticky chrome; full-width 44px contents targets, keyboard focus and responsive breakpoint parity restored; long desktop contents scroll within short viewports. Restored missing global sr-only utility for Privacy, navigation-loader and private notification labels without removing their accessibility names or changing legal content/action behavior.

Validation: nine local browser tests pass across 24 policy page/viewports at320/390/768/1024/1440/1920 with full axe, real keyboard jumps, direct fragments, short1440x600 sidebar reachability and delayed-loader states. Build/types/lint (three unchanged warnings),20 planner regressions, content/editorial/global CSS/detector/diff checks pass. PR CI37050971480 SUCCESS:657 Chromium checks passed on first attempt in10.4minutes;24 Firefox/WebKit smoke checks pass;392 unit checks pass with six database-dependent fast skips; isolated database verification passes. Shared accessibility CSS correctly retained full acceptance; policy-only paths now have focused coverage.

Integration push CI37052641854 SUCCESS: exact tested tree preserved and duplicate browser suite skipped; production build, coverage, database and smoke checks green. Unchanged caps: JavaScript819087/819200; CSS345331/348160.

Railway review deployment `4652b782-1492-4c60-8601-531c4e83f729` SUCCESS on exact application merge SHA. Live desktop Privacy #policy-03 screenshot/DOM confirms target heading152.33px below header bottom81px, full-width312px contents rows at least44px, viewport-bounded scrolling sidebar, clipped1px sr-only label still present in named accessibility region, and no horizontal overflow. Six-width/mobile/short-screen coverage is local/seeded; live proof is desktop.

Current task: complete. Next: owner continues UI observations; next agent inspects new confirmed defects in a separate atomic branch. Private authenticated staff-record states were not opened. Preserve canonical factual/media/privacy/payment/indexing gates, approved artwork and fixed Companion. Production PR104/main promotion remains protected. See POLICY_NAVIGATION_AUDIT_2026-10-03.md. Older entries below are historical.

---

# Policy navigation audit — 2026-10-03 IST

State: `CODEX_ACTIVE`. Branch `fix/policy-navigation-20261003`; verified integration base `e81ba99fef5455f8d065853993d5e2b8adc4e6d6`. Owner requests continued checking and correction. Only protected production PR104 is open; no competing writer. Confirmed deployed Privacy contents links are30px high and #policy-03 settles with its heading at47.56px beneath81px sticky header. Fix shared policy navigation and anchor offsets across Privacy/Terms/Donation/Refund without changing legal content. Inspect short-screen sidebar reachability and breakpoint parity. Policy anchor/link/sidebar/breakpoint corrections and missing shared sr-only utility implemented. Nine local browser tests pass across24 policy page/viewports, full axe, short-screen/fragment and delayed-loader scenarios. Build/types/lint/content/global CSS/detector and20planner checks pass; JS819087/CSS345331 within caps. Shared accessibility correction intentionally retains full exact-head acceptance. Publication/CI/integration review delivery next. See POLICY_NAVIGATION_AUDIT_2026-10-03.md. Preserve approved media/backgrounds/factual/privacy/payment/indexing and fixed Companion.

---

# Latest delivery — follow-up UI audit — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`. Application PR [#130](https://github.com/immazhark/amaana-platform/pull/130) merged as `2044bf97364674e89c9fe558ea6808999d49892b`; exact tested task head `93ee64399a30f834314c5cc56627e45231b7f38e`, tree `73b95c7c3cdf917871ac4e936bd247335e8a9563`.

Completed: corrected Request Assistance Before/After checkerboard bands caused by inherited tiling sizes applied to legacy gradients; restored approved lattice/body surfaces and shared Before heading. Retired corresponding route overrides. Previously blocked state, Contact/Faith and Impact/Our Work surface verification resumed. Canonical content/privacy/payment/media/indexing, approved SVG bytes and fixed Companion preserved.

Validation: build/types/lint (three unchanged warnings),18 planner regressions, content/editorial/SVG/CSS guards and detector pass. All14 local browser checks pass: six widths with full-page axe plus eight private assistance journeys. Desktop/mobile captures inspected. Initial local full Chromium failure was workspace socket permissions; the installed pinned headless runtime resolved it. Final PR CI37047981721 SUCCESS:62 Chromium checks passed on first attempt in2minutes;392 units pass, six database-dependent fast skips. Integration CI37048619969 SUCCESS; exact-tree PR browser acceptance reused, duplicate browsers/database skipped. JS819087/819200 and CSS344667/348160; caps unchanged.

Railway review deployment `7ee3334c-dbf2-45a1-81d3-83217b0c4cb7` SUCCESS on exact application merge SHA. Live /request-assistance DOM and screenshot confirm approved dark lattice with repeat/no-repeat104px/100% layering, shared split heading, approved After body background and no horizontal overflow. Local/seeded tests cover320/390/768/1024/1440/1920; live verification is desktop. See UI_FOLLOWUP_AUDIT_2026-10-02.md.

Current task: complete. Next: owner continues UI observations; no failing required task checks remain. Authenticated private staff-record states were outside this public audit. Production PR104/main promotion and separate release gates remain protected. Older entries below are historical.

---

# Follow-up UI verification — 2026-10-02 IST

State: `CODEX_ACTIVE`. Branch `fix/ui-followup-audit-20261002`; verified integration base `f5458a98188fb8deed78b07a6fad0191453c1d9c`. Owner requests continued inspection and correction of existing issues. Browser/workspace access restored. No competing task PR; production PR104 remains protected. First inspect previously blocked deployed states and evidence closings, then forms/navigation and confirmed legacy conflicts. Preserve approved design, canonical facts/media/privacy/payment/indexing and fixed Companion. Confirmed assistance Before/After repeating-gradient defect and bypassed heading fixed. Build/types/lint, 18 planner tests, content/SVG/global CSS guards pass; JS819087/CSS344667 within unchanged caps. Local browser launch infrastructure-blocked, no responsive success claim. Focused seeded CI, merge and exact-source review deployment pending. See UI_FOLLOWUP_AUDIT_2026-10-02.md.

---

# Latest delivery — UI consistency and legacy-rule audit — 2026-10-02 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`. Application PR [#128](https://github.com/immazhark/amaana-platform/pull/128) merged as `c670a94239aeeed83a72c74b6ce5338a630aeb20`; tested task head `b60aa42e8e8002095c9bdbdf6ed800207a6710c8`. Documentation closure branch `docs/ui-audit-delivery-20261002`.

Completed: fixed state/receipt legacy white text and oversized typography on light L1 banners; readable Home secondary hover/focus; shared Contact social heading; approved Contact/Faith body backgrounds; explicit responsive Impact/Our Work evidence closing layouts and Impact section gap; visible dark closing geometry; removed retired intent-card rules/animations. Canonical narratives/figures, media, privacy, payment behavior, approved SVG bytes, indexing gates and fixed bottom-right Companion preserved.

Validation: all30 canonical live initiatives and four category overviews opened; static public desktop/mobile and six-width local regressions inspected. Build/types/lint/editorial/CSS guards and17planner regressions pass. Final PR CI37036140425 SUCCESS:153 Chromium cases pass on first attempt in3.9minutes;392 unit checks pass (six DB-dependent checks skipped in fast, browser environment seeded). Specific mappings avoid the unrelated398-case whole-site shell matrix:153 selected instead of554. Shared global/unknown/core paths and releases retain broad/full acceptance. Carousel and keyboard-focus checks await actual geometry/focus without relaxing requirements.

Integration push CI37037096503 SUCCESS: production build and unchanged budgets, JS819087/819200 and CSS344368/348160. Exact tested tree retained; duplicate task browsers skipped. Railway review deployment `2d1e38aa-b97f-4694-9920-5243d2e5f310` SUCCESS on exact application merge SHA `c670a94239aeeed83a72c74b6ce5338a630aeb20`.

Current implementation task: complete. Next action: owner continues UI review; when browser/workspace reconnects, inspect deployed confirmation, Contact/Faith body patterns and Impact/Our Work evidence closings. Final live screenshot was blocked by409 environment_offline after merge; no post-deployment screenshot/rendered verification claim is made. Private staff-record states remain outside this public audit. Production PR104 stays protected and automatically runs its separate full release acceptance when the integration head changes; that suite is not a blocker for completed review delivery. See UI_CONSISTENCY_AUDIT_2026-10-02.md. Older entries below are historical.

---

# UI consistency and legacy-rule audit — 2026-10-02 IST

State: `CODEX_ACTIVE`. Branch `fix/ui-consistency-audit-20261002`; verified integration base `8fcc88b935eed87f740dba2159d67f0d3eb8e231`. Owner authorizes reviewing all screens and fixing confirmed UI/UX inconsistencies and conflicting legacy rules while away. Only protected production PR104 is open. Confirmed state/receipt foreground/type conflict, Home hover contrast, Contact social heading and retired intent CSS fixed. Approved body backgrounds restored on Contact/Faith; Impact/Our Work closing grids explicitly restored and Impact evidence-to-heading spacing corrected. Local six-width UI/a11y regression and ten carousel cases pass; build/types/lint/editorial/CSS guards and 17 CI planner regressions pass. JS819087/819200; CSS344368/348160. See UI_CONSISTENCY_AUDIT_2026-10-02.md. Seeded focused CI, merge and exact-source review deployment pending. Preserve approved banners/background SVGs, canonical content/media/privacy/payment/indexing gates and fixed bottom-right Companion.

---

# Latest delivery — site-wide approved L1 banners — 2026-10-02 IST

State: `IDLE`. Outgoing agent: Codex; incoming agent: next available implementation agent. Integration: `phase-public-site-rebuild`. Completed task branch: `fix/sitewide-l1-banners-20261002`. PR [#126](https://github.com/immazhark/amaana-platform/pull/126) merged at `a6cea782514fdf49837af7a41e7d4aa178a4821e`; tested task head `494421b4e727ff65314b7ac82f9f91d273926b37`. Documentation closure branch: `docs/sitewide-banner-delivery-20261002`.

Completed: all shared PageHero purposes use the approved L1 gradient, geometric lattice and right-side Arabic Amaana motif. Home, assistance success/tracking, donation acknowledgement, error/loading and admin headings share the same surface. Page purposes remain semantic. Mobile Home copy stays on the light field; global error uses an independent equivalent; acknowledgement print stays readable. Retired variant styles removed. Canonical content, media, actions, auth and fixed Companion preserved.

Validation: production build/types, lint (three existing warnings), 392 units (six DB-dependent local skips), 15 planner regressions, content/factual/CSS/SVG guards, sixty local production page/viewport checks and eighteen axe audits passed. All six seeded banner tests passed at320/390/768/1024/1440/1920. PR CI37004033430 green:631 Chromium cases passed first attempt, one body-carousel1024px animation timing assertion passed on built-in retry;24 Firefox/WebKit smoke cases passed. The earlier631pass/1fail run exposed a stale About prose selector from prior PR124; corrected to the actual prose column and verified locally, with no layout change. No current failing required checks. JS819087/819200 and CSS346628/348160; caps unchanged.

Integration CI37005131492 passed production build, budgets, database/fast guards and server smoke; exact-tree PR acceptance reused, duplicate browsers skipped. Railway review deployment `503b31d2-e2ff-4fbd-a76b-95a4a81eab50` SUCCESS on exact application SHA `a6cea782514fdf49837af7a41e7d4aa178a4821e`. Live Home, Contact and neonatal initiative DOM confirms identical surface, visible approved Arabic motif and no horizontal overflow. Deployed Contact screenshot inspected and saved. Live neonatal page retains full case narrative and ₹107,520; gallery remains supporting media.

Current implementation task: complete. Exact next action: owner continues UI review on the deployed review website. Future page-specific banner exceptions are deferred until requested. One existing carousel geometry test has a timing-sensitive700ms wait and0.09375px first-attempt overshoot; retry passes, recorded for future test stabilization rather than broadening this banner change. Main/production promotion PR104 remains a separate protected checkpoint. Preserve all canonical factual/compliance/privacy/media/payment/indexing gates, approved SVG bytes and fixed Companion. Older active/pending entries below are historical and superseded.

---

# Site-wide approved L1 banners — 2026-10-02 IST

State: `CODEX_ACTIVE`. Integration base `4f8459967845b2a7bc988adaaf62b073a624faf6`; task branch `fix/sitewide-l1-banners-20261002`. Owner explicitly requests the approved L1 gradient/geometric/Arabic-right artwork on every website header banner, with future per-page exceptions deferred. No other implementation writer or task PR is active; only protected production PR #104 is open. Current task: audit shared PageHero and custom/transactional banners, standardize surfaces without changing canonical content or interactions, then focused validation, integration PR/CI/merge and exact-source preview verification. Prior live browser transport failure is historical; retry verification for this delivery. Preserve factual/media/privacy/payment gates, approved SVG bytes and fixed Companion. Older entries below are historical.

Local validation complete: production build/typecheck, lint (three existing warnings), 392 unit tests (six DB-dependent local skips), 15 CI planner regressions, content/factual/CSS guards and all six approved SVG hashes pass. Sixty production page/viewport combinations and eighteen axe audits pass at 320/390/768/1024/1440/1920; local Home uses the production hero fixture and DB-backed initiative is reserved for seeded CI. Desktop/mobile rendered inspection passed. Final JS 819087/819200 and CSS 346628/348160; fixed budgets unchanged. Implementation complete; publication, seeded full shared-surface CI, green merge and exact-source review deployment remain pending.

Delivery checkpoint: PR #126, head 481d009eb1e19ced645dbd1f41dd4f4a26077812. CI 37002628565 fast/database green; Chromium 631 passed, one pre-existing stale About prose selector failed. The heading wrap introduced in prior PR124 caused the test to measure the left heading as prose. Selector corrected to the actual last direct prose div; unchanged production layout passes locally at 1920/1440/390. All six actual seeded banner tests passed. Corrected acceptance run and deployment remain pending.

---

# Latest delivery — body section headings and footer spacing — 2026-10-02 UTC

State: `IDLE`. Outgoing agent: Codex; incoming agent: next available implementation agent. Integration: `phase-public-site-rebuild`. Completed task branch: `fix/section-headings-footer-spacing-20261002`. PR [#124](https://github.com/immazhark/amaana-platform/pull/124) merged at `892aa722294b2ebb307e6934a444fad3ffee5361`; task head `d837253610ce26e07c5784c21d0edaae84d101ad`. Documentation closure branch: `docs/heading-footer-delivery-20261002`.

Completed: shared server-rendered body introductions use a 40px rule and eyebrow above the left title, subtitle on the right; mobile stacks. Additional right-side content retains its composition. Site-wide footer outer spacing shares one token: 80px desktop, 96px plus safe area on mobile. Canonical/legacy programme galleries and eligible public introductions use the shared component. Content, approved background foundations, factual locks and fixed Companion preserved.

Validation: local production build, lint/types/content/CSS guards, 392 unit tests (six database-dependent skipped locally), 15 CI planner regressions, and 30 local production page/viewport combinations passed. PR CI 36948217424 passed all 507 Chromium cases, including six widths. Integration CI 36949106614 passed build, budgets and server smoke, reusing exact-head PR acceptance and skipping duplicate browsers. JS 818873/819200 and CSS 347314/348160; caps unchanged. Optional-gallery fixture assertion and real keyboard-navigation setup corrected; no current failing application checks.

Railway preview deployment `b7ef3970-885d-4017-bdce-de9f4c6176ff` is SUCCESS on exact application SHA `892aa722294b2ebb307e6934a444fad3ffee5361`. Final public-site visual inspection could not finish because the browser/container transport disconnected with `409 environment_offline`; no post-deployment screenshot or live visual claim is made. Seeded browser acceptance and exact-source deployment are confirmed.

Current implementation task: complete. Exact next action: owner continues UI testing on the deployed review site; when browser access returns, inspect /impact shared introductions and footer, and /our-work/emergency-neonatal-medical-aid gallery. No additional code edits are required for this delivery. Main/production promotion PR #104 remains a separate protected release checkpoint. Do not casually change factual/content locks, private evidence boundaries, payments/indexing gates, approved geometric foundations or Companion positioning.

All older active/pending entries below are historical and superseded by this delivery record.

---

# Body section headings and footer spacing — 2026-10-02

State: `CODEX_ACTIVE`. Branch `fix/section-headings-footer-spacing-20261002`, verified integration `2235263272d0083fa280fc7a1ed0b34acdd6ba88`. Only open PR is protected production #104. Owner requests equal outer footer top/bottom breathing room and a consistent body heading: line + eyebrow, title left, subtitle right; retain compositions with extra content on the right, stack on mobile. Screenshots recovered and inspected. Prior PR122/123 merged with green CI and exact preview deployments; older pending notes below are historical. Shared server-rendered heading implemented across standard public introductions, closings and galleries; original content, hero layouts, content-panel exceptions, card headings and fixed Companion preserved. Thirty actual production page/viewport combinations pass at 320/390/768/1024/1440/1920. Local lint/types/content/CSS audit/build and 392 unit tests pass (six DB-dependent skipped locally); 14 planner regressions pass. Final JS 818873/819200 and CSS 347314/348160, caps unchanged. Footer outer top/bottom uses one token: 80px desktop, 96px mobile plus safe area. Focused seeded CI, green merge and exact-source preview deployment verification remain pending.

---

# Participation, Contact and completed Appeals — 2026-10-01

State: `CODEX_ACTIVE`. Branch `fix/participation-contact-appeals-20261001`; stacked PR #123, remote head 4e73601731f76d6a8fe5f3c2d65efb7b7494e9ab. All six screenshot groups are implemented: shared Contact/Get Involved cards with refined normal/hover/focus states; separated journey headings/copy without misaligned dots or rails; official social SVGs reused from the footer; completed Appeals use BodyCarousel/BodyCard; brand-gradient fallback uses the approved geometric lattice globally. Local production checks pass at 320/390/768/1024/1440/1920; Contact/Get Involved axe checks pass. Units: 392 passed, six database-dependent skipped locally. Build/types/lint/content/global CSS and 13 CI planner regressions pass. Production JS 818873 / 819200 and CSS 344906 / 348160; caps unchanged. Actual database-backed Appeals verification remains for remote CI and deployment.

PR #122 head 04a7b0f28138982bce8d5fa82e28e7d1983b0235, CI 36896947301: fast and database green; browser running. Previous complete Chromium run passed 614 cases; Firefox could not launch because the container HOME owner differed from its runner user. Current commit repairs existing HOME ownership without changing HOME or reinstalling browsers. PR #123 contains this fix as an ancestor. After PR #122 passes and merges, retarget PR #123 to `phase-public-site-rebuild`, trigger focused CI, merge only on green, verify exact-source integration build/Railway preview and actual pages. New presentation changes select ten focused suites without a full cross-browser matrix or refund database job. Main/production remains unchanged.

---

# Initiative detail delivery checkpoint — 2026-10-01

State: `CODEX_ACTIVE`. Owner requested continuation; current CI remains running. PR122 is open on fix/initiative-detail-narrative-20261001; remote head7e09e584e85febe87974d7b83c1e90d0d913e52b. Full canonical and legacy narratives retained; clinical glossary removed; continuous approved pattern, centered closing actions, equal footer padding implemented. All six new initiative browser checks passed at320/390/768/1024/1440/1920. Last full run36888890250:613 passed,1 failed due single-programme category test expecting medical relief to have one record after canonical seed expansion. Test now uses genuinely single-parent Taleem category. Current final CI36891312920 is running. Fast/database previously green; local types/lint/master/build and budgets pass. Not merged or deployed. Next: verify current CI, merge PR122 into phase-public-site-rebuild only after green, check integration build and exact-source Railway preview deployment, inspect rendered initiative pages. Existing browser detailTab id3 on amaanafoundation.org; runtime restored. Main/production protected. CI uses pinned Playwright1.55.0 preinstalled image, postgres service hostname, canonical seed and valid workspace/relative artifact paths; prior20-minute OS mirror install timeout eliminated. User frustrated by full-suite repetition; do not repeat broad runs beyond required failures.

---

# Initiative detail corrections — 2026-10-01

State: `HANDOFF_PENDING`. Local implementation complete. Branch fix/initiative-detail-narrative-20261001 from verified integration20b5c23. Six screenshots inspected. Scope: restore complete canonical narrative, remove clinical glossary, one continuous approved body surface, align closing CTA and footer spacing. Main and factual locks protected. Validation: eight narrative tests including all30 canonical records; full unit suite391 passed before final additional catalogue case; six-width representative production-CSS layout harness passes, SVG artwork visually inspected. Lint/types/master/global CSS audit/build pass; JS818873 and CSS340119 below unchanged budgets. Actual database-backed browser pages and remote CI/staging remain unverified. Publication next.

# CI separation extension — 2026-10-01

State: `HANDOFF_PENDING`. Extended policy verified locally: twelve planner tests, lint, workflow job dependencies, YAML/shell syntax and diff checks pass. Fast/database/production/browser separated with stable aggregate verify gate. Remote publication is pending direct authorization. Continue chore/change-aware-ci-20261001; user requests explicit light/heavy job separation and wider routine UI/content selection. Publication remains blocked by prior auto-review; do not retry export without direct authorization.

# Change-aware CI — 2026-10-01

State: `HANDOFF_PENDING`. Local mechanism implemented and verified: eight planner tests, lint, YAML/shell syntax and diff checks pass. Publication/remote workflow validation pending. User requests implementation of efficient verification criteria. Branch: chore/change-aware-ci-20261001; verified integration base 72fcfe3, PR120 merged. Scope: deterministic diff planner, workflow selection and regression tests; preserve production readiness and budgets.

# Publication authorized — 2026-10-01 IST

State: `CODEX_ACTIVE`. Owner explicitly approved GitHub publication, PR/CI and integration staging delivery. Continue fix/owner-screenshot-polish-20261001 from verified f6980fd3. All local checks pass as recorded below. Terminal push has no credentials; use the connected GitHub publisher to publish the same tested tree. Remote CI, merge and exact-source deployment verification are next.

---

# Publication blocked — 2026-10-01 IST

State: `REVIEW_PENDING`. Branch: `fix/owner-screenshot-polish-20261001`.
Implementation commit: `c911884` (based on verified integration f6980fd3).
All six owner screenshot groups are implemented and locally verified. Nine new production-browser tests pass across 1920/1440/1024/768/390/320, including keyboard disclosure/select, hover/focus, actual moving gradient, reduced motion, no hero-control overlap, no horizontal overflow and axe checks. Eleven existing chrome checks also pass. Lint/types/master/CSS audit/build and 389 unit tests pass; six database-dependent tests are locally skipped. Production JS 818873/819200; CSS 340731/348160. Desktop/mobile visual review confirms contained official logo artwork and aligned portfolio metrics/controls.

Automatic approval review rejected GitHub push: repository export destination requires explicit end-user authorization for this change set. No connector workaround was attempted. Read-only GitHub verification confirms the task branch does not exist remotely (404). No PR, remote CI, integration merge or staging deployment occurred. Staging remains the prior verified application 0227dc8.

Next exact action, after direct user publication authorization: push the task branch to https://github.com/immazhark/amaana-platform, create PR to phase-public-site-rebuild, require green full CI, merge and verify exact-source Railway staging deployment plus rendered Home/Our Work. Main/production promotion, indexing, live payments, factual locks, identity separation and fixed Companion remain protected.

---

# Owner screenshot corrections — 2026-10-01 IST

State: `CODEX_ACTIVE`. Branch: `fix/owner-screenshot-polish-20261001`.
Verified integration base: `f6980fd3a083392deaa375626f6289c70da66d5f`; only open PR is protected production promotion #104. User explicitly requests detailed implementation of six annotated screenshots. Scope: header hover, taller Home hero and official brand fallback, animated Highlights gradient, visible dark-section lattice, trust links/contrast/icons, wider smaller footer lead, portfolio filters/disclosure alignment, brief initiative summaries, consistent metadata and readable brand thumbnails. Preserve factual values, curated identity separation, fixed Companion and integration-only delivery. Local verification complete: nine production-browser checks across six widths, eleven existing chrome checks, axe on corrected surfaces, lint/types/master/CSS audit, 389 unit tests pass (six DB-dependent local skips). Final production JS 818873/819200 and CSS 340731/348160. Desktop/mobile screenshots inspected; full logo artwork contained and controls do not overlap CTAs. Full remote CI and staging verification pending.

---

# Completed delivery — 2026-10-01

State: `IDLE`. Unified body-carousel task is complete.

- PR #118 merged into phase-public-site-rebuild at 0227dc873fd596b71320d9fc2edaf4b43441483e.
- Final task-head CI 36843517333 and integration push CI 36844982063 are SUCCESS: 832 Chromium + 24 Firefox/WebKit checks, unit/refund database, lint/types/content checks.
- Integration production build and unchanged budgets pass. Local production totals: JS 818873/819200 bytes; CSS 344825/348160 bytes.
- Railway preview deployment 90272fe1-bbd5-42f7-a31f-f76f5e86e836 is SUCCESS on exact application SHA 0227dc8.
- Cloud-browser live verification confirms Home starts flush left with 18% preview, Qurbani two-card and Eid seven-card rows use equal row heights and 16:9 visuals, and wrap navigation aligns the last card at the same left edge. Companion remains fixed bottom-right.
- Six local responsive fixture widths and ten interaction checks pass. Terminal live-site DNS was unavailable; live checks used the cloud browser at its desktop viewport. Do not claim six-width live-deployment checks or a public version-endpoint check; the version endpoint was blocked to this browser, while Railway source SHA and deployed UI were verified.
- Shared BodyCarousel/BodyCard, heading controls, progress line, brand SVG fallbacks and site Framer Motion layer are delivered. Manual pause, focus/hover pause, native drag, direct links, keyboard navigation and reduced motion are verified.
- Design specification: docs/BODY_CAROUSEL_DESIGN_SPEC.md. Gallery photos remain separate from hero/identity media. Main, reserved production, indexing, live payments and factual locks remain protected.
- Next: owner visual review and the next explicitly requested UI defect block. Identity photographs remain an external content assignment. No unfinished implementation in this carousel block.

---

## Autoplay focus guard follow-up

Autoplay now checks actual hover/focus state and active drag before advancing, so pointer exit cannot resume while keyboard focus stays inside. Independent manual pause remains. Ten local Chromium checks pass (including focus/blur resume), lint/types/production build pass. Production JS 818873/819200, CSS 344825/348160. Publish focused follow-up to PR #118 and require its exact-head CI before merge.

# Recovery checkpoint — 2026-10-01

State: `CODEX_ACTIVE`; continuing PR #118 at verified remote HEAD b00f8398040606a6479e78a5b480d6f19d551f29. Integration remains 5908d16. Latest CI: 826 passed / 5 failed. Recovered exact published sources; removed retired Impact and programme card rules, fixed in-flight scroll destination tracking and hero offset context. Canonical programme-link assertions and approved 416px hero-height assertions replace obsolete expectations; left-edge wrap geometry is polled until settled. Local lint/type/build/master and 389 unit tests pass; eight existing browser checks pass. Production JS 819177/819200, CSS 344825/348160. Added rapid wrap regression; exact-head CI, integration and staging verification pending. Main and fixed Companion remain protected.

---

## Carousel validation checkpoint

Draft PR #118; initial CI lint issue corrected. Final local lint/type/build pass, 389 unit passes (6 DB skips), eight Chromium checks pass including six widths, exact peek, manual pause, reduced motion, drag and direct-link navigation. JS 818889/819200; CSS 347534/348160. Full exact-head CI and preview deployment pending.

# Current task — 2026-10-01 unified body carousels

State: `CODEX_ACTIVE`
Task branch: `feat/unified-body-carousels-20261001`
Verified integration base: `5908d16b6c31f5919033e68b49b33962068e5a71`.

Owner requests all body carousels start flush left; one design system for Home/L1/L2, fixed visual headers, brand-themed SVG fallbacks, equal card geometry, 15–20% next-card peek, heading-aligned controls and progress line. New explicit instruction requires Framer Motion site-wide where appropriate. Preserve native scroll snap/touch and motion preferences, factual locks, identity media separation and fixed Companion. Only open PR at claim is reserved production PR #104; no competing implementation writer. Prior #116/#117 delivery is complete: 823 Chromium + 24 Firefox/WebKit passed, final integration CI green, Railway success on 5908d16, JS 805951/CSS 346969 within unchanged budgets. Implement and verify this new coherent task before integration; no production promotion.

---

# Current delivery checkpoint — 2026-10-01 IST

State: `CODEX_ACTIVE`
Task branch: `fix/curated-import-validation-bundle`
Integration HEAD: `3107555782a4b9632300bcfb7ef65271e86592fb`.

- PR #116 merged after exact-head CI 36764531334 passed 823 Chromium and 24 Firefox/WebKit cases, lint/types, 389 unit tests and isolated refund database checks.
- Railway staging deployment `b4c52092-3072-4249-9566-be32d4e3fdc8` is SUCCESS on exact integration SHA `3107555`. Rendered homepage verified through cloud browser: header, separate reminder/live rail, five Highlights including ₹12,14,520, canonical footer and fixed Companion are present.
- Integration push CI 36766109793 exposed the existing JS excess: 973,135 / 819,200 bytes. CSS passes: 346,969 / 348,160 bytes. No budget increase allowed or performed.
- Root cause: shared curated-gallery schema imported the exported Zod namespace object, retaining unused validator exports/locales in the admin browser bundle. Changing to an ES module namespace import preserves exactly the same schemas, validation and inferred types while enabling unused exports to be removed.
- Clean local production build after this import-only correction: JS 805,951 / 819,200 bytes; CSS 346,969 / 348,160. TypeScript and all three curated-contract tests pass.
- Next: publish isolated correction PR into integration; require green CI, merge, verify production budgets and staging source SHA. Current application fixes are deployed, but delivery is not fully certified until integration CI is green.
- Main, reserved production service, indexing, Live Razorpay, gallery/identity assignments and fixed bottom-right Companion placement remain locked.

---

# Current checkpoint — 2026-09-30 site chrome + footer + homepage hero correction

State: `CODEX_ACTIVE`
Task branch: `fix/site-chrome-footer-hero-20260930`
Integration base / current phase HEAD at claim: `883d2c6c680bd4ac2796eb68defe16875a9b7bab`.

Incoming Codex ownership explicitly handed over by the owner continuation prompt. Verified task HEAD `464938377ee3b8cddc03b756aa6ab9668b8f655a`, integration HEAD `883d2c6c680bd4ac2796eb68defe16875a9b7bab`, Draft PR #116. CI 36748468904: 808 Chromium checks passed, seven failures under investigation. No concurrent implementation writer is active.

Owner-authorized Block #1 + Block #2 implementation:
- footer geometry/spacing/typography/site-wide parity, gold link states, official social icons, Threads support, future social extensibility;
- slightly taller global header with larger logo, restored thick animated gold nav underline, canonical Support a need CTA;
- split compact Reminder + independent Amaana Live rail below navigation;
- homepage hero breathing room, 45/55 copy/media composition, image fade boundary, removal of decorative 2020/Arabic story graphics;
- fifth homepage Highlights metric for the canonical medical/financial assistance aggregate.

Do not repurpose any of the 154 gallery photographs as hero/banner/thumbnail media. Do not touch main, DNS, indexing, reserved production service, Live Razorpay, or fixed bottom-right Islamic Companion placement.


Codex recovery checkpoint:
- Recovered Draft PR #116, inspected all 19 implementation commits and all seven exact-head browser failures.
- Established `site-chrome.css` after `experience-finish.css`; retired conflicting nav/footer/reminder generations rather than increasing specificity or bundle budgets.
- Fixed footer implicit grid tracks and inherited 48–80px lead margin; restored 44px mobile link targets, canonical active-route gold, safe bottom spacing, and consistent typography.
- Corrected the hero split relative to the public container and secondary CTA contrast; actual Home story and Highlights are shared with the isolated carousel fixture.
- Guarded assistance total against malformed measures, duplicated cases, missing cases and future rollups. Canonical total remains ₹12,14,520; ten focused unit cases pass.
- Expanded rendered acceptance across 1440/1280/1024/768/390/320, including uncut metric values, footer shell parity and fixed Companion positioning. Obsolete tests now enforce the owner’s newer same-footer/two-lane requirements.
- Local lint/type/master and unit checks pass (389 tests, 6 database-dependent skips; three unchanged lint warnings). Full exact-head CI and staging verification remain pending; no completion/deployment claim yet.


Publication recovery — 2026-10-01 IST:
- Owner directly authorized continuation after the explicit publication approval request. Terminal push then failed for missing GitHub credentials.
- Connected GitHub publication succeeded: `12cd093d4024bcb2775ab83c07f0b77fcd5b472a`, whose tree exactly equals local tested tree `50cd32acd66c24f97778d173842b954aa7b02596`.
- PR CI 36762269001 passed lint/types/unit/database/factual checks and 822 Chromium cases. One mobile footer-collapse failure exposed a later generic display rule overriding the existing disclosure state.
- Removed only the redundant generic display declaration; kept the existing disclosure behavior and compact-height assertion. Local failing mobile disclosure test now passes, as do all eleven focused chrome checks. Two broader local checks need unavailable database routes; those same routes passed in CI.
- Clean acceptance CSS was 346,982 / 348,160 bytes before this one-line reduction; budgets remain unchanged. The local JS baseline discrepancy still requires integration production-build verification.
- Publishing this correction and rerunning exact-head CI is next. PR #116 remains Draft until green; no integration merge or Railway deployment has occurred yet.


---

# Historical checkpoint — 2026-09-28 background composition correction

State: `CODEX_ACTIVE`
Task branch: `fix/background-composition-scale`
Base integration SHA: `671e3ba219f01248a0154dfe81525d7518e2efdf`
User explicitly requests uncropped header/footer emblems and uniformly small, lighter body pattern. Prior cover-based acceptance was insufficient. Preserve original six source SVGs; derive independent ornament/tile assets and test actual viewport geometry. Scope is backgrounds and their readable layout only; content, payments, main and draft promotion PR #104 remain untouched. No other implementation writer is active. Verification pending.

---

# Amaana Platform — Active Implementation State

## State
**CODEX_ACTIVE**

## Integration branch
- `phase-public-site-rebuild`
- Family feedback/review is complete as of 21 September 2026.
- Quiet-mode restrictions are lifted. Audited implementation may be pushed phase-by-phase to staging on this branch.
- Current exact integration HEAD: `cdfc8ad2cefb61c992537a3d4cae48e58cfe6aab`; push CI `36330311977` and PR CI `36330314494` are SUCCESS. Exact-head Chromium acceptance: 352 passed in 5.2 minutes.
- Current successful Railway staging deployment: `a7625ecc-5d8b-41d7-a8ac-7cb341e71bfc` from source SHA `b5d5373402e275e3993448914cff75e1bbb23bcb` (`fix: make master copy source reproducible`). Startup encountered one transient Neon P1001, recovered through the existing retry path, and Railway `/api/health/ready` succeeded before deployment reached SUCCESS. The later `cdfc8ad2...` assertion-only commit was correctly SKIPPED by Railway.
- Exact-head repository state is certified by GitHub CI; Railway deploys only application-affecting changes and correctly skips test/documentation-only follow-ups.
- Prior runtime baseline `bce6b1d85bedc9da6e0fb38484e867db71cb4182` / deployment `d0e7608a-df34-425b-9d30-79d1434b1064` remains historical evidence, but that deployment is now `REMOVED` and is not the currently served staging deployment.
- Reserved production service `amaana-platform` now has non-secret hardened deployment parity: `/api/health/ready`, 300-second timeout, restart retry limit 3 and staging-aligned application watch patterns. No deployment was triggered.
- Safe production defaults were staged with deploys skipped: `APP_ENVIRONMENT=production`, `EMAIL_DELIVERY_MODE=disabled`, `NEXT_PUBLIC_ALLOW_INDEXING=false`, and all acceptance/browser flags false. Indexing decision, production public-media bucket, Live payments and live email remain deliberately unresolved.
- Resend production sending-domain resource for `amaanafoundation.org` was created on 27 September 2026 with sending enabled, receiving disabled and tracking disabled. Provider verification has been triggered and remains `pending`; DKIM, SPF MX, SPF TXT and the `rsend` CNAME now all report `pending`, with none yet verified. No transactional email was sent and no new API key was created.
- Live Neon media audit on 27 September 2026: 3 MediaAsset rows total, all unpublished/unapproved initiative-linked legacy VIDEO metadata matching the three removed static MP4s; zero public assets, zero privacy approvals, zero public-without-approval, zero orphaned assets and zero identity assets. No destructive DB cleanup was performed.
- Reserved production service now also has `PUBLIC_MEDIA_BASE_URL=https://amaanafoundation.org/media` configured with deploys skipped. `PUBLIC_MEDIA_S3_BUCKET` and `PRODUCTION_INDEXING_DECISION` remain deliberately unset.
- `main` remains untouched until explicit production-promotion approval.

## Current task stream
- Continue the consolidated audit/enhancement roadmap on the integration branch.
- Curated programme photography is intentionally deferred until the owner finishes selecting images drive-by-drive.
- The media system must remain plug-and-play while that curation happens; do not request replacement media as a blocker for unrelated engineering work.
- Priority UX direction: materially reduce vertical scrolling with deliberate banner, gallery and repeated-card carousels while keeping reading-heavy trust/policy/story content linear.

## Working protocol
1. Keep `main` untouched and indexing disabled.
2. Push coherent, reviewable implementation slices to `phase-public-site-rebuild`; staging auto-deploys browser-affecting changes.
3. Do not initiate real Razorpay payments/refunds or production cutover actions.
4. Do not publish real beneficiary/programme media without the existing human privacy/consent/provenance gate.
5. Do not reintroduce the deleted legacy programme-image pool or heuristic/random hero selection.
6. Use one explicit curated identity/hero image per programme/drive and ordered supporting images.
7. Prefer compact carousels only for media/repeated-card surfaces where they reduce scroll; do not hide long-form accountability or policy reading inside sliders.
8. At each implementation checkpoint, validate build/type safety and retain browser/E2E regression coverage.

## 21 September 2026 media + carousel baseline
- All 191 legacy programme/drive/cause image files were removed from the current staging branch.
- All 175 staging `MediaAsset` IMAGE records were removed. The three legacy static MP4 files were subsequently removed from `public/media`; three matching DB VIDEO metadata rows remain private/unapproved and hosted video remains fail-closed publicly.
- `prisma/integration-media.json` is empty so deleted images cannot silently re-seed.
- Identity image contract is deterministic: `IDENTITY_MEDIA_SORT_ORDER = -1000`; assigning a new identity image demotes the prior identity image for the same target.
- Identity publication requires explicit hero-use approval in addition to the normal privacy/provenance publication gate.
- Shared manual/swipe/keyboard `ScrollCarousel` is implemented without autoplay or a heavy slider dependency.
- Programme galleries use the carousel while retaining the accessible lightbox.
- Long programme-year histories switch to compact carousel presentation when they exceed three entries.
- Impact witness media uses a compact carousel.
- Homepage programme discovery is a horizontal five-area strip.
- A full-width homepage banner carousel is wired but activates only once at least three approved featured identity images exist; until then the existing static PageHero fallback remains.
- Curated image insertion therefore requires data/media work, not another layout redesign. See `docs/CURATED_MEDIA_CAROUSEL_CONTRACT_2026-09-21.md`.

## Completed before this quiet batch
- Secure gated private-bucket public-media proxy and real synthetic upload/publish/unpublish acceptance.
- Database snapshot/restore recovery drill with matching content digests and clean post-restore application startup.
- Fail-closed staging launch acceptance (32 checks) on exact candidate SHA before public-port activation.
- SEO/social metadata hardening and Docker build-time NEXT_PUBLIC_* injection.
- Bounded Prisma advisory-lock retry for transient P1002 migration contention.
- Separate public-media storage from private assistance storage.

## Quiet-batch work completed/in progress

### Release / editorial quality
- Unified read-only launch preflight commands:
  - `npm run launch:preflight`
  - `npm run launch:preflight:rehearsal`
  - `npm run launch:preflight:production`
- Public editorial/compliance guard with tests for:
  - newborn amount ₹107,520;
  - Winter 234 kits / 234 beneficiaries;
  - Aliza amount ₹482,700;
  - provisional 12A/12AB and 80G wording;
  - domestic-only / non-FCRA boundary.
- Exact Aliza public metric changed from rounded `₹4.82L` to `₹482,700`.
- SEO browser coverage now covers all 26 declared static public routes, all four programme-category schemas, generated social images and canonical redirects; exact-head Chromium acceptance completed 352/352.
- Document-title regression coverage prevents duplicate Amaana branding.
- Master-copy generation is now reproducible from tracked `src/content/master-copy.json`; `npm run master:check` is enforced in CI and the confirmed provisional 12A/12AB status is locked against stale source text.
- Privacy, Terms and Refund Policy still explicitly disclose outstanding professional legal/accounting wording review; this remains part of the human `final-editorial-seo-social-review` gate and is not auto-closed by green automation.
- Public/private data-boundary guard prevents public publishing surfaces from reading internal beneficiary/verification/token/storage fields.
- Final human launch QA checklist consolidated into one canonical document.

### Accessibility
- Skip-link target is programmatically focusable.
- Browser acceptance verifies skip-link focus transfer, one H1, document language and main landmark.
- Existing axe, responsive, reduced-motion, keyboard, mobile-focus and 200%-reflow-equivalent coverage retained.
- Branded 404 behavior is browser-tested for 404 status, navigation, noindex and mobile containment.

### Security / privacy / operations
- Private-document signed URL ownership binding and private-cache hardening.
- Admin login timing/identity hardening, bounded credential inputs, expired-session pruning and audited logout.
- Trusted proxy/client-address normalization for rate-limit identity.
- Ephemeral login/donation security-ledger retention/pruning.
- Transactional email worker idempotency/retry/stale-processing recovery plus operational runbook.
- Notification operations page and audited manual requeue path using new `notification.manage` permission.
- Destructive media/private-document deletion intent audit records.
- Public-media route MIME mismatch fails closed; managed PDF delivery acceptance added.
- Staging email delivery remains fail-closed/disabled.
- Browser security-header acceptance now covers CSP, HSTS, framing, referrer, permissions, COOP/CORP and no-store sensitive surfaces.

### Data / query integrity
- Additive operational indexes for audit history, notification lists, security-ledger cleanup and media review ordering.
- No destructive schema migration introduced.

## Additional hardening completed in the quiet batch

### Payment / refund correctness
- Refund processing requires INR and bounded paise values.
- Out-of-order refund webhooks reconcile payment → order and reuse the idempotent capture path before refund accounting.
- Refunds can reopen a FUNDED appeal to PUBLISHED only while the fundraising window is still open; otherwise the under-target funded appeal becomes CLOSED.
- Private donation acknowledgement responses are no-store, no-referrer and noindex.
- Critical unmatched payment/refund events are surfaced in admin donation operations.
- Stored webhook evidence is privacy-minimized.
- Exactly one donor refund notification is queued transactionally for each effective unique refund event.
- `docs/PAYMENT_REFUND_OPERATIONS_RUNBOOK.md` documents the controlled live acceptance.
- Webhook route tests now cover invalid signatures, duplicate event idempotency and end-to-end refund reconciliation into donation/appeal/event/notification records.

### Production indexing boundaries
- Indexing now requires explicit opt-in, official HTTPS Amaana host and `APP_ENVIRONMENT=production`.
- Docker builder defaults `APP_ENVIRONMENT=staging`, making preview builds fail closed.
- `/donate` is a public SEO route while `/donate/<appeal>` remains private.
- All admin surfaces have explicit noindex/nofollow/no-referrer metadata.

### Rollback preparation
- `npm run rehearsal:verify-target` validates exact deployed SHA, health/readiness, representative public routes and private no-cache/noindex boundaries.
- Pinned previous-known-good branch remains `rehearsal/rollback-baseline-2026-09-18`.

### Production RBAC correctness
- New notification view/manage permissions are not seed-only.
- Migration `20260918111500_notification_operations_rbac` idempotently creates/grants them to PRIMARY/BACKUP approvers in production.
- Manual email recovery uses an atomic FAILED-only claim and cannot race an active worker into a duplicate send.
- Notification worker tests cover atomic claim, stable provider idempotency, SENT transition, transient retry scheduling and concurrent claim loss.

## Current background correction
- Six corrected approved SVG source files were supplied and landed byte-for-byte in `public/backgrounds/`.
- `scripts/verify-approved-backgrounds.mjs` locks their SHA-256 hashes and launch preflight fails closed if repo assets differ.
- The family-review deployment still serves the previous backgrounds; responsive rendered QA remains pending until the next controlled staging deployment.

## Operational note
- The preview service remains healthy on the family-review SHA.
- The notification cron's historical failed build was caused by the superseded admin-login TypeScript error, not by the worker. The active cron deployment is healthy and was observed on 19 September 2026 firing every five minutes and receiving HTTP 200 with `status:"disabled"`, which is the intended staging posture.
- No separate cron deployment is required merely to repair that historical failure.

## Additional implementation completed on 19 September 2026

- Donation checkout remount regression fixed with Next Script `onReady` plus an already-loaded `window.Razorpay` fallback; browser acceptance now reproduces unmount/remount behavior so the form cannot remain stuck on “Preparing secure checkout…” after revisiting the page.
- Explicit `payment.failed` webhook state-guard tests added; failed payments cannot increase appeal accounting.
- Transactional-email operations gained a controlled self-recipient acceptance action for authorised staff only, duplicate-active-acceptance protection, audit logging and Resend provider-message-id persistence/visibility.
- Production environment contract now fails closed on staging/Live Razorpay mix-ups, wrong production canonical origin, shared assistance/public-media buckets, insecure public-media origin and launch-only acceptance flags.
- Version health now exposes only non-secret deployment posture (`environment` and Razorpay `paymentMode`); staging/rollback acceptance requires `staging + test`.
- Assistance browser acceptance now covers a synthetic private PDF in the multipart submission. Route tests lock private-document persistence and compensation cleanup when the later database write fails.
- Additive migration `20260919142000_notification_provider_message_id` stores the external email provider message id for delivery reconciliation. It has not been applied to staging/production yet.
- These new quiet-branch changes still require consolidated lint/typecheck/unit/build/browser validation before integration.

## Remaining genuine launch gates
- `rollback-rehearsal` — real staging rollback to a previous known-good deployment and restoration still required.
- `transactional-email-delivery` — controlled live production sender acceptance required.
- `manual-rendered-accessibility-review` — final human rendered review required.
- `final-editorial-seo-social-review` — final human copy/social preview review required.
- `public-media-human-review` — individual media privacy/consent/provenance review required.
- Razorpay account/KYC and website approval are VERIFIED. Provider-backed Test Mode capture, webhook delivery, acknowledgement/accounting and a full refund with `refund.processed` reconciliation are verified. Separate Live API credentials and a separate Live webhook now exist and remain outside staging. Remaining payment gates are provider-backed `payment.failed` evidence (or documented Test Checkout limitation), production-only Live credential installation, controlled real donation acceptance and production receipt/email/refund operations.
- explicit production indexing decision.
- explicit `main` promotion/production approval.

## Recovery anchors
- Database recovery snapshot evidence is recorded in `docs/DATABASE_RECOVERY_DRILL_2026-09-18.md`.
- Preserved Neon branch: `pre-recovery-original-2026-09-18`.
- Pinned rollback baseline branch: `rehearsal/rollback-baseline-2026-09-18` at healthy SHA `4f7cbafb87e8c7d75fd7191d7bcc7a83c9320a3d`.

## Locked facts
- Newborn medical aid: **₹107,520**.
- Winter Drive 2025–26: **234 Winter Kits distributed to 234 beneficiaries**.
- Aliza critical-care appeal: **₹482,700**.
- Taleem Nazira + Hifdh: **25 students combined as of September 2026**.
- Amaana is **not FCRA-registered**; fundraising remains domestic-only.
- 12A/12AB and known 80G status are **provisional** and must be described that way.


## 21 September 2026 implementation checkpoint — carousels, donor intent and guided assistance

### Scroll reduction and curated-media architecture
- Shared manual/swipe/keyboard `ScrollCarousel` now powers programme galleries, long programme-year histories, Homepage field work/programme discovery, Impact witness media and supporting Story media.
- The Homepage full-width curated banner is structurally complete and intentionally activates only once at least three approved featured identity images are available; it supports up to five curated slides and never autoplays.
- Story metadata, Story heroes and Story discovery cards now use the explicit identity-image contract instead of first-file heuristics.
- Mobile Home proof metrics and Impact metrics become horizontal snap strips instead of long stacked blocks.
- Curated image insertion remains data/media work. Do not redesign these surfaces when the selected photographs arrive.

### Donation intent
- Added a donor `givingIntent` record with values `GENERAL`, `SADAQAH` and `ZAKAT`.
- Donor giving intention remains separate from appeal designation and separate from the internal beneficiary Zakat-eligibility review.
- Zakat is offered only when the appeal's private verification record is explicitly `ELIGIBLE`; the order API re-checks this server-side and rejects forged Zakat intent otherwise.
- Giving intent is persisted on the Donation, included in Razorpay order notes, private acknowledgement, donor acknowledgement email payload and admin donation/reconciliation views.
- Additive migration: `20260921103000_donation_giving_intent`.
- The same additive enum/column/index were applied to the staging Neon branch before code rollout; existing records default to `GENERAL`.
- The complete donation-intent stack built successfully on Railway at `430329957477bf513b79577bbeae47f6602d3b3c`.

### Mobile appeal conversion
- Open verified appeal pages now have a mobile-only persistent “Support this appeal” action.
- It is deliberately absent on closed appeals and is not globally injected across Stories/programmes.
- Safe-area spacing prevents the bar from obscuring content and shifts Back-to-top/Companion overlays upward on affected pages.
- Isolated browser acceptance fixture and regression spec cover open/closed state, horizontal containment and floating-control overlap.

### Request Assistance
- The request form is now a genuine four-step guided flow: Contact → Need → Supporting Evidence → Confirm.
- Current-step validation prevents invalid forward progression.
- Input/file state is preserved between steps; the final request remains one secure multipart submission.
- Server validation errors reopen the exact step containing the rejected field and focus that control.
- Browser regression coverage follows the real progressive flow and preserves the private PDF upload test.
- Production compile/TypeScript succeeded and Railway deployment `32b31a06-8577-49d6-b283-e9c3183940ca` reached SUCCESS.

### Performance / regression guards
- Dynamic Homepage data loading is narrowed to dedicated appeal + discovery projections instead of loading unused story/faith/archive data.
- Public media retains intrinsic layout reservation.
- Browser performance coverage records CLS for Home, About, Our Work, Donate and Request Assistance with a <= 0.10 launch budget.
- Hosted GitHub browser workflow execution is not currently being reported for the newest test-only commits. Do not describe those Playwright specs as executed until a runner result is available.

### Current validation note
- Story curated-media deployment `cef325f99e55548596a4e452e549e0c4804b675d` reached SUCCESS before being superseded.
- Guided Assistance deployment `22e252dedd7cc988c9da96f4e72384ef6ecf6e61` reached SUCCESS.
- Latest mobile metric-strip head `71ea4b429e9cfaa6b1fcb3369b453d7cdb64cfef` is in Railway deployment validation at the time of this checkpoint.

## Codex continuation — 2026-09-23

- Ownership: CODEX_ACTIVE (explicit user handover).
- Task branch: fix/webhook-retry-scope; integration: phase-public-site-rebuild.
- Verified baseline HEAD: e76744a28e3da94ce239e45af96f01510fc5524e; no open integration PRs.
- PRE_EXISTING failure: CI run 35772257463/job 106897043629 and staging deployment b85e2a7a-c63f-4ae6-a404-489e3148bf9e fail TypeScript at razorpay/route.ts:254 (payload outside try scope).
- Immediate task: restore retry-handler compilation with event-type collision regression coverage; then durable refund-entity idempotency and private credential lifecycle.
- Main, production controls, live payments/refunds, private media publication remain protected. Impact redesign on hold.

## Codex phase A — 2026-09-23

Ownership CODEX_ACTIVE. Branch fix/refund-entity-idempotency. Recovery PR #102 merged at 30f157521776a1fadf70d326d1cff44d88e69e1f after PR CI passed. Implement additive refund identity ledger with legacy backfill, atomic accounting and real PostgreSQL concurrency tests. Integration build/deploy certification pending. No production actions.

## 24 September 2026 — final launch/cutover certification checkpoint

### Certified application candidate
- Application SHA: `bce6b1d85bedc9da6e0fb38484e867db71cb4182`.
- GitHub Actions run `36012879631`: **SUCCESS** on the exact candidate.
- The run passed the full integration gate, including lint, TypeScript, isolated PostgreSQL refund-ledger verification, coverage, production build, bundle budgets, post-build smoke checks, isolated browser fixture/workspace, Chromium installation, and responsive/accessibility/journey Playwright acceptance.
- Railway staging deployment `d0e7608a-df34-425b-9d30-79d1434b1064`: **SUCCESS** on the same exact application SHA.
- Railway's strict `/api/health/ready` check passed only after the database became reachable; the system correctly remained fail-closed during the prolonged Neon P1001/P1002 incident.
- Real startup recovery evidence from that deployment:
  - reviewed-campaign import recovered after transient database failures;
  - RBAC seed recovered after a transient database failure;
  - staging-acceptance seed recovered after transient database failures;
  - Next.js reached Ready;
  - Railway promoted the candidate only after DB-backed readiness returned healthy.

### Canonical routing/discovery closure
- Legacy `/our-work/*` aliases are centralized and deterministic.
- Legacy `/programmes/*` compatibility routes are also deterministic and no longer depend on database availability before redirecting.
- The static shadow route `/our-work/medical-financial-assistance` now redirects deterministically to the canonical medical/financial programme category.
- Sitemap/public discovery excludes legacy aliases and preserves published/canonical routes.
- Programme-category JSON-LD and canonical metadata are covered by regression tests.
- Homepage/Story/Faith related work links use canonical destination helpers.

### Launch-readiness register
- Rehearsal: **5/6** required gates resolved.
- Production: **9/19** required gates resolved.
- The only unresolved rehearsal gate is `rollback-rehearsal`.
- Rollback rehearsal remains pending because the connected Railway action surface exposes redeploy-latest but not deployment of an arbitrary historical deployment/snapshot. Do not fake this gate through Git rewrites.
- Current candidate and previous known-good deployment identities are recorded in `docs/launch-readiness.json`.

### Remaining production gates
The following remain intentionally PENDING until actual evidence exists:
- approved background artwork human rendered QA;
- transactional live email delivery acceptance;
- final human rendered accessibility review;
- final editorial/SEO/social-preview review;
- public-media privacy/consent/provenance review;
- controlled Live donation acceptance;
- refund/receipt operational production acceptance;
- real staging rollback rehearsal;
- explicit production indexing decision;
- explicit `main` promotion and production authorization.

### Protected actions
- Do not merge/promote to `main` without explicit user approval.
- Do not enable production indexing without the explicit production indexing decision.
- Do not install/use Live Razorpay credentials on staging.
- Do not initiate a real donation/refund merely to make a readiness gate green.
- Do not mark human privacy/accessibility/editorial gates VERIFIED from automated evidence alone.
- Impact-page visual redesign remains deferred until the owner supplies the separate redesign prompt.


## 28 September 2026 — approved background integration

User explicitly requested integration of all six revision-4 SVGs after design review. Codex owns this scoped implementation on `feat/approved-svg-backgrounds`, based on verified integration HEAD `6bb0666c45aa274e5e44a0a7d0339198802164e5`. Only open PR is draft production promotion #104; do not merge it. Replace approved assets byte-for-byte, refresh hash lock, adapt responsive placement and verify readability without changing content or footer height. Baseline push CI 36341349733 fails browser acceptance (classification in progress); PR checks pass. Production remains protected.


## 2026-09-28 — Approved vector background integration
- Current task PR: #105, `feat/approved-svg-backgrounds`, based on `6bb0666c45aa274e5e44a0a7d0339198802164e5`.
- All six revision-4 assets copied byte-for-byte; SHA-256 guard and XML/native-vector checks pass locally (51,146 bytes combined).
- Shared responsive token paths retained. Light body whitening gradients removed; dark-section contrast layers retained. Homepage carousel frame now consumes the header token. Footer height is still content-driven.
- PR CI and staging/browser verification pending at this checkpoint. Do not infer production approval.
- Pre-existing integration CI 36341349733 fails typography-hierarchy at 1440/390 (Arial vs serif expectation); unrelated to this asset change and not suppressed.

## 2026-10-18 — Durable rapid-submit browser regression

Owner: CHATGPT_ACTIVE, PR323. Add sixth mocked browser case dispatching two immediate native requestSubmit events and requiring exactly one intercepted request plus locked follow-up state. This makes the locally reproduced rapid-duplicate regression durable in actual-page acceptance. Runtime files unchanged; hosted checks required on the new head. No actual submission or provider call.

## 2026-10-18 — Assistance submission uncertainty and runtime feedback repair

Owner: CHATGPT_ACTIVE. New isolated task fix/assistance-submit-recovery-20261018 from verified production506647a. Read-only reconciliation of historical PR292 confirms its large branch is not wholly deployed; do not merge or close it wholesale, and do not equate missing paths with95 unresolved defects. Current production assistance-form handler reproducibly unlocks after generic503/lost response, accepts malformed truthy tracking credentials, trusts object-valued errors and issues duplicate rapid submissions. Offline extraction of the actual current submit handler fails five recovery scenarios. Surgical current-component repair plus bounded pure response classifier: synchronous lock; accept only201 with validated private credentials; release lock only on validated400/403/413/429 pre-write rejection; keep uncertain outcomes locked with generic follow-up and separate-tab contact; sanitize known field strings and preserve values. Fixed extracted handler passes all six scenarios, and23 pure classifier assertions pass via Node's strict assertions; browser spec syntax passes. Six new mocked actual-route browser cases await hosted execution. No real applicant record, provider, email, schema or API mutation. Full hosted type/lint/unit/browser/database/production and unchanged bundle budgets required. Combined visitor batch PR320 d07edf97 continues independently; no source change to that branch. Reconcile final production main before this fix releases.
## 2026-10-23 — Retired detail hero cleanup batch checkpoint

Owner: CODEX_ACTIVE, sole writer on `perf/retired-detail-hero-css-20261023`, based on local Faith cleanup commit `7c1d4cc` (published #411 tree). Removed unused Story, verification/transparency and initiative hero selectors from four imported stylesheets. Exact class inventory finds no source/spec consumers; current pages use PageHero. Preserved shared selectors. Parsed comparison confirms all 336 retained selector/declaration/at-rule-context records unchanged. Additional source reduction: 3,883 bytes; 5,507 including Faith. Global CSS architecture audit and diff checks pass. No unit suite rerun for deletion-only CSS; hosted browser/build acceptance is required before release. This follow-up is IMPLEMENTED_SOURCE, prepared for branch checkpoint publication without a third PR; not merged or deployed. Keep #411 head frozen while its acceptance runs.

PR #410 head `9f02a1c` passed complete application acceptance `39919526610`, including browser/Firefox/WebKit, production/budgets, database, fast and verify. Ready-state promotion run `39923017520` passed; merged at `abacce7`. PR #411 head `908b2e7` run `39922217210` passed fast/production/database; browser remains running. Production last independently verified at `ff3324a`. Next: verify deployment, finish #411 acceptance, then reconcile this local batch without losing either PR's evidence. No historical closure counts changed.
## 2026-10-24 — ChatGPT Work takeover and verified carousel continuation

CHATGPT_ACTIVE: incoming ChatGPT Work session is the sole implementation writer under the owner's explicit handover and standing commit/push/qualifying-merge authorization. Verified remote main `9c70cfd302f6c2b4e5e25c4519c359fe709bb3fb`, #420 head `463d0738ba29790f010e49e2d2578a676494f0a7`, and #421 head `e6fc37947d8b90f1f7c148b955b5178c57459da0`. Both complete hosted runs `40015115209` and `40015853907` passed all seven jobs. Contrary to the handover's earlier snapshot, #421 already exists; continue it without a competing branch. Current task branch: `fix/carousel-frame-rearm-on-slide-change-20261024`. Complete #420 ready-state and protected merge, independently verify deployment, then reconcile and validate #421 with any reproduced related carousel lifecycle defects. Preserve protected gates, hard budgets, existing histories, and #374/#264. No historical closure-count change or live-payment acceptance claim.


## 2026-10-24 — Codex authorized continuation

CODEX_ACTIVE sole writer under current owner continuation and explicit commit/merge authorization. PR #420 exact head 463d073 passed full run 40015115209 and promotion run 40020464487, normally merged to main d753be6a9671f25f9707a0491bc9e4f12b08fd58. Production verification remains pending (local public health request returned HTTP 403). Continue existing #421 branch e6fc379; 23 carousel interaction/rotation unit tests pass locally. Adding browser regressions for pending scroll frame interrupted by actual keyed reordering and count reduction; these tests are not yet executed. No new source defect closure claim. Preserve #374/#264, budgets and all factual/privacy/payment locks.

PR #420 is LIVE_VERIFIED at main d753be6: Railway 3492490c-aa05-41b0-b503-a8947e7dad0a SUCCESS; independent uncached public version matches exact SHA and readiness HTTP 200 ready. #421 regression proof repeated locally: removing both frame-ref resets produces exactly two failures (observer cleanup and slide change), restoring source passes all 23 interaction/rotation tests. Two new browser scenarios parse/list successfully but cannot run locally: Chromium is absent and browser download returns invalid/truncated ZIP. They require hosted exact-head browser acceptance. No production-source changes added in this test-coverage continuation.

## 2026-10-24 — Local checkpoint; publication blocked by automatic approval review

Local coverage commit 6fdca6e0 and normal main reconciliation bd8855b55eeba810a9a1e6578f0b6d4356e2501b are NOT PUSHED. Automatic approval review rejected git push origin HEAD: it requires explicit approval for publishing this payload to https://github.com/immazhark/amaana-platform.git. Do not bypass via connector or alternate transport. Ask owner to authorize pushing the carousel source/regressions/continuity updates to existing fix/carousel-frame-rearm-on-slide-change-20261024 branch (PR #421). Last local verification after reconciliation: 23 carousel unit tests passed. New browser scenarios NOT EXECUTED (missing Chromium, invalid download archive); full exact-head CI needed after authorized publication. #420 remains live-verified d753be6. No #421 merge/release claimed.

## 2026-10-24 — Owner renewed repository control and publication approval

CODEX_ACTIVE sole implementation writer. Owner explicitly assigned repository ownership to this session and renewed commit/merge approval in direct response to the pending publication request. Command-line push then failed due to absent Git credentials; publishing the identical scoped source/test tree through the connected immazhark GitHub account, with non-force ancestry retaining #421 e6fc379 and released main d753be6. Prior automatic-review publication block is resolved by that owner response; no bypass of protected checks. New browser cases still require fresh hosted acceptance before promotion. Local 23 carousel unit tests passed; #420 independently LIVE_VERIFIED. Historical counts unchanged.
