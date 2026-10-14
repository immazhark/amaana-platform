## 2026-10-14 — B08 private donor-purpose snapshots, without enabling fund checkout

Used the canonical `docs/AMAANA_MASTER_RECONCILED_EXECUTION_PLAN.md` sections D/F, current PR #292 source and the installed Karpathy coding guidelines. Prisma PostgreSQL relation/migration guidance was checked with Context7. Work remains on the existing `fix/direct-transfer-feedback-20261013` branch; no duplicate PR.

- Added `Donation.designationSnapshot Json?` and migration `20261014160000_donation_designation_snapshot`; existing rows and older binaries can keep NULL. Non-null snapshot requires APPEAL kind, matching appeal ID and giving intention, version 1 and a string label. PostgreSQL trigger rejects updates to any already populated snapshot.
- Both provider order and direct transfer creation persist the original selected appeal ID/title/giving intention. Private acknowledgment, appeal total, capture, reconciliation, refund, and public checkout behavior are deliberately unchanged; existing `fundId` submissions still fail closed until a complete fund-only accounting contract exists.
- Authored a pure helper unit test, actual order/transfer route persistence assertions and optional isolated PostgreSQL-WASM compatibility/negative/immutability tests in `scripts/test-donation-designation-migration.mjs`. Two route Vitest mocks were corrected to retain the actual shared helper. The migration test source was syntax-checked in a local Node 22 copy, and GitHub source readback confirmed committed files. Exact-head Vitest/Prisma generation/migration execution/Next build/browser acceptance remain **NOT RUN** in this chat environment; Chromium, package dependencies and PGLite are not available locally.
- New implementation commits span `3a8804c` through `37b1ccf`; master-plan update `9a7059b`. The previous duplicate-multipart-field correction remains in the same PR and is not counted as an additional historical R-ID.

**Still required for B08:** exactly-one appeal-versus-approved-fund schema/relation; validated APPROVED-state fund selection at payment and verification; immutable fund definition/revision snapshot; fund net accounting/settlement and refunds; private admin/acknowledgment projections; zero public checkout until explicit reviewed-purpose and domestic-only gates. SQL snapshot constraint is appeal-only for now and must be atomically extended before fund-only writes become possible.

No migration on any hosted database, production/private data read or write, payment or refund, credential change, notification delivery, public fund activation, release merge or deployment.

## 2026-10-14 — duplicate multipart financial fields rejected before submission

Ownership: ChatGPT engineering continuation, existing PR #292 / `fix/direct-transfer-feedback-20261013`. A direct-transfer multipart body could previously submit repeated payment/destination/evidence keys while `FormData.get` silently chose the first. The endpoint now rejects repeated values for all single-valued donor, destination, payment, transfer and evidence fields with a private HTTP 400, before schema parsing, appeal lookup, donation persistence or evidence storage.

Runtime commit `52055b8903c92b197b24cee0c66a462aff386153`; seven parameterized actual-route regression cases in test commit `0534d8d1fd479589938d319295b0341cc29ec0f9`. GitHub source readback confirmed both exact changed blobs at PR #292 head. These cases are AUTHORED, NOT EXECUTED in repository Vitest; source readback is not proof of an exact-head build/browser/hosted test. Existing nonduplicated forms and donation limits remain unchanged. No original R-ID or extra defect counted; this contributes to B08 exactly-one designation safety but does not implement fund checkout.

No `main` merge, controlled migration, Railway mutation, payment, refund, bank transfer, private evidence write, email delivery or production deployment. Next: inspect and implement the full backward-compatible appeal-or-approved-fund destination contract, immutable donor-purpose snapshot, accounting and private acknowledgements before activating any public fund donations.

> Historical evidence ledger. Current canonical programme status: [AMAANA_MASTER_RECONCILED_EXECUTION_PLAN.md](AMAANA_MASTER_RECONCILED_EXECUTION_PLAN.md). Older integration/deployment classifications may be stale; preserve them as dated provenance.

## 2026-10-14 — R-056 stored preview projection corrected

Owner cx authorized continuation on existing PR #292 / fix/direct-transfer-feedback-20261013, parent eaeee2e1145bc09dacdfd6a535ba9796ae79adf0. Found an integration gap: the shared PUBLIC_IMAGE_SELECT used by lean discovery, Our Work, Impact, appeal cover and programme-child/completed-aid projections omitted the newly stored blurDataURL. Add the nullable field to that projection and the separate homepage hero projection. Existing publication/privacy filters, result limits and image validation remain unchanged. The typed WorkPortfolio synthetic media fixture now supplies null for legacy metadata.

Four integration cases run the real getters against selection-respecting Prisma mocks, generate a tiny synthetic JPEG preview using the actual bounded helper, and render the returned media through actual PublicMedia. Hero and shared completed-aid projections both preserve stored previews; null legacy data retains ordinary image rendering. The gallery contract checks preview selection while retaining approved-only filters and 12-image limit. Removing both selections causes five actual regressions to fail; restored source passes 17/17 focused query/render/thumbnail tests. TypeScript, focused zero-warning ESLint and diff checks pass. No full-suite/build/browser rerun claimed for this batch; preceding batch evidence remains separately scoped.

R-056 remains partial: query-to-render integration is now locally verified, but existing nullable migration is unapplied and hosted/deployed acceptance remains pending. Selecting this field requires the already-authored migration before application rollout. Original 95 classification totals unchanged. No database migration/write, media re-ingestion, private-record access, real payment/email, main merge or deployment occurred. Next: remaining actionable register defects and controlled schema/application acceptance.

## 2026-10-14 — immediate promotion expiry and executed handover tests

Recovered PR #292 at 0584c96911eb916dee4147c0630c339f565eb5b8 on fix/direct-transfer-feedback-20261013. Confirmed saveVerification rejects requests already converted to appeals, both before and within the transaction: confidentiality changes for existing appeals are not supported through that action. Do not invent an unlocked classification-change workflow.

Confirmed cache defect: transitionAppeal and updateFeaturing used revalidateTag("appeals", "max"), permitting stale promotional reads after a committed withdrawal. Use Server Action updateTag("appeals") for immediate expiry after successful transaction completion, retaining homepage/listing path invalidation and the shared 300-second data cache. Set live-rail success and fail-closed responses to no-store so downstream caches do not outlive withdrawals. No additional database query is introduced. Existing responses cached before rollout are not retroactively purged by this source change; deployed CDN behavior and already-open client views are not certified.

Four workflow regressions cover PAUSED/CLOSED/FUNDED success ordering after audit and failed-write non-invalidation; two actual route tests cover a withdrawn next response and uncached failure. Full runtime Vitest: 1181 passed, 9 database-dependent skipped. The prior privacy/payment helper and order-route tests were executed successfully, including restored Zakat coverage. Full lint initially found three unused private-relation destructuring bindings from the prior handover; consume the deliberately removed relation with void while preserving the public-only rest object and update the boundary guard. Post-correction affected suites: 21 passed; public-data boundary guards: 5 passed; TypeScript and full zero-warning ESLint/governed Stylelint passed.

Compile-only Next build passed before the lint-only projection correction. Client-secret and static-image guards passed. Generated JS 816683/819200 bytes and CSS 342406/348160 bytes; budgets unchanged. This is compile-only evidence, not full database prerender, browser, hosted or production acceptance. Full suite result precedes the behavior-neutral void correction; affected suites were rerun afterward.

Original 95 classifications remain 10 baseline addressed /33 source implemented /25 partial /16 open /11 unverified. No original-item closure inferred. No main merge, deployment, live payment, private-record mutation, email, migration or provider configuration. Continue remaining register work; staging/browser and hosted release verification remain outstanding.

# Amaana Foundation engineering continuation — 14 October 2026

## Continuation — prevent highly sensitive appeal promotion outside approved direct pages

Active PR #292, branch `fix/direct-transfer-feedback-20261013`; exact integration/test head before checkpoint: `caab2dbd511fa1b7fdd49dda678e28343b6f832f`.

**Confirmed privacy gap:** Previously `getAppealSearchPrivacy` and the appeal-detail metadata/share policy could treat a verified case as `HIGHLY_SENSITIVE`, while its unredacted title/summary still entered homepage cards, dynamically inserted home hero slides, public live rail JSON, /appeals directory, /donate discovery directory and initiative linked-appeal promotions. These surfaces offered no confidentiality check even though the model's policy said sensitive cases should not be promoted via metadata.

**Source remediation:** Add a centralized server-only-use `canPromoteAppeal` predicate rejecting explicitly `HIGHLY_SENSITIVE` verification. Extend the existing Prisma homepage and public-index selections only with `assistanceRequest.verification.confidentialityLevel`, filter before limiting/promoting, and **strip `assistanceRequest`** from each returned public record. The homepage result feeds home cards, home hero auto slides and `/api/public/live-rail` without new queries. The public index feeds /appeals and /donate directory. Apply the same projection/filter/strip at `getPublishedInitiativeBySlug` to prevent initiative cross-promotion. Valid standard and legacy reviewed appeals retain existing behavior, and an individually approved direct appeal page remains available. No donor or beneficiary content was edited, no media was generated or transmitted. Source commits: `7134b44`, `595f54f`, `ef18168`, `18b82ef`.

**Regression protection:** Add pure predicate tests (`05aa65e`), an index integration test (`d927050`), homepage/initiative mocked Prisma tests (`03191e4`), and a public-boundary source guard (`caab2db`). All **17/17 cross-file source invariants** re-fetched from GitHub matched the exact committed head; they verify the live rail/directory/initiative consumers use the guarded projections and no private verification relation escapes into the public payload. Exact `src/lib/appeal-promotion.ts` bytes were reconstituted in local Node 22 and checked against Git blob SHA `c9126b46a5cbbcc873086062e49cdcc955bc87a3`; **7/7 pure helper runtime assertions passed**. The authored Vitest integration cases, full Next build, browser regression, database/Prisma integration and live CDN cache behavior are **not yet executed**.

**Release-sensitive cache flag:** Homepage HTML, the cached home projection and the public live rail have previously configured time-based caching. This source correction prevents new sensitive cases from entering freshly generated promotional payloads, but does **not** prove instantaneous purge of previously cached sensitive data after a confidentiality change. Verify invalidation and stale-response behavior in staging before full acceptance; do not claim the privacy finding closed on production.

**Defect register accounting:** This is an additional specific privacy issue within existing public publication/privacy remediation scope. Do not invent a new original R-ID or change the historical 95-row totals (10 baseline addressed,33 implemented pending release verification,25 partial,16 open,11 unverified). PR remains unmerged. No payment, private record mutation, media write, provider change, deployment or CI-budget increase.


## Continuation — donor acknowledgement refund status correctness

Current PR #292 on `fix/direct-transfer-feedback-20261013`, implementation head before checkpoint: `94f096efa6bc2d8fd7efa9c1cd911bbddd47046e`.

Found false-refund UI classification in `getDonationAcknowledgementPresentation`: the old branch used `status === "REFUNDED" || refundedAmount >= amount`, which falsely marked e.g. a freshly `CREATED` donation with amount=0/refundedAmount=0 as "Refund processed", and could misclassify pending/failed donations with inconsistent totals. Implement explicit authority: `REFUNDED` status remains sufficient, while inference from full refunded accounting now requires **CAPTURED**, a positive finite donation amount and finite nonnegative refund amount. Partial-refund labels also require valid accounting. This changes acknowledgement presentation only, not payment reconciliation, storage, financial values or provider state. Code `fb083f6`.

New regression tests cover five non-captured statuses under zero and stale/full refund totals, captured bad/zero/NaN/Infinity accounting and legitimate full capture refund. Tests `94f096e`. All **14/14 source and regression-wiring invariants** passed after re-fetching the exact committed GitHub blobs of the order route tests and donation helper/tests. The actual Vitest suite, TS build, E2E and production validations have **not** been run on this head; no new defect classification or release claim.

Work done earlier in this continuation: restored unreachable Zakat guard test in `src/app/api/donations/order/route.test.ts`, added four negative and one valid-positive case, and rejected NaN/Infinity in `isDonationAmountAllowedForRemaining`. Source commits `36bfc19`, `4cca310`, `b09a6db`, `9254e72`, `d34dadd`. Do not count full closure until gate verification.

No live payments, provider calls, donor DB writes, deployment, migrations, main merge or new PR. Original 95-row working register remains at 10 baseline addressed, 33 implemented pending verification, 25 partial, 16 open, 11 unverified.


## Continuation — Zakat test reachability and invalid remaining-balance guard

Active consolidated PR #292 (`fix/direct-transfer-feedback-20261013`), implementation head before checkpoint `b09a6dbcab8fabfcef6fb9f2dbffe6f106bee52d`.

**Defect: unreachable donation-order regression test.** The existing `src/app/api/donations/order/route.test.ts` accidentally defined the Zakat negative test *inside* the `vi.mock("@/lib/bounded-request-body", ...)` factory after its `return` statement. Therefore the test body never registered with Vitest and provided no coverage of the important Zakat-only-after-review gate. The test is relocated into the real `describe` suite, parametrized for `UNREVIEWED`, `NOT_ELIGIBLE`, `NOT_APPLICABLE`, and absent verification, and asserts 409 responses with **zero Razorpay/provider or donation-database creation calls**. An additional positive case verifies `ELIGIBLE` permits a valid order, confirms the provider receives INR paise/appeal intent/receipt, and confirms the persisted donor email normalization and provider identity. The mocks now use a plausible `₹900` remaining balance and bounded amount-authorization predicate instead of the prior zero balance / unconditional true. Commits `36bfc19`, `4cca310`, `b09a6db`. Do not count the previously unreachable test as pre-existing executed coverage.

**Defect: non-finite remaining-amount acceptance.** `isDonationAmountAllowedForRemaining` in `src/lib/donations.ts` previously authorized normal amounts against `NaN` or `Infinity` remaining balances because the greater-than comparison is false for `NaN`. Add a finite, strictly-positive remaining-need guard, preserve minimum ₹10 rule, exact smaller final amount and fractional-remaining behavior. The public order and direct-transfer routes also apply appeal eligibility checks; this adjustment is defense-in-depth for the shared predicate. Six new parameterized/control cases in `src/lib/donations.test.ts`. Commits `9254e72` and `d34dadd`.

**Readback evidence:** Re-fetched the three changed sources by GitHub blob SHA, checked **12/12 explicit source, test-placement, negative/positive Zakat and amount-validation invariants**; all matched the committed PR head. The local runtime lacks the repository clone and installed Vitest/Next dependencies, so the authored route/component tests, full TypeScript, build, browser suite, database/provider integration and bundle budgets remain **unexecuted on this exact head**. No live checkout, donor data access, DB/storage changes, deployment or main merge. This batch primarily improves payment safety and restores missing coverage; original 95 register classifications are not reduced without complete acceptance.


## Continuation — precise appeal progress, sensitive sharing, and stable WhatsApp links

Active consolidated PR #292, branch `fix/direct-transfer-feedback-20261013`. Reviewed exact-source head before this checkpoint: `d6048e4c3cb5b34b0638531caa0c3633220fce77`. Previous baseline checkpoint remained `597ef1d3`.

**Public fundraising meter accuracy:** `getAppealProgressPercent` previously rounded amounts just below the goal to 100% even though `isAppealOpenForDonations` correctly treated the appeal as open. Reserve 100% exclusively for `raised >= goal`, cap still-open rounded displays at 99%, preserve zero/invalid/overfunded safeguards. Four near-goal unit cases committed: `c445174`, `b6926dc`. This does not alter accounting, ledger values or Razorpay capture.

**Highly sensitive appeal outbound disclosure:** `generateMetadata` and primary appeal JSON-LD already used generic data for `HIGHLY_SENSITIVE`, but breadcrumb JSON-LD and outbound native/WhatsApp share still received raw appeal title/summary. Centralize safe copy in `src/lib/appeal-public-copy.ts`, and feed metadata, JSON-LD, breadcrumb label and `AppealShare` consistently. Existing on-page disclosure continues to respect the prior public-page behavior, not a re-publication decision. Add three pure unit cases and guard public data wiring. Commits `b97bf83`, `163d157`, `107c079`, `48b84bf`, `133063a`.

**WhatsApp sharing flow:** Previously `window.open` could be blocked while the UI unconditionally reported success. Replace it with a real HTTPS link (`target="_blank" rel="noopener noreferrer"`) containing encoded generic share content. Render a deterministic canonical URL for server/client and fall back to the foundation origin when the configured preview URL is invalid; no popup success is invented. Extend opt-in synthetic appeal route and three responsive Playwright acceptance cases to assert URL/target/rel and absence of raw fixture titles. Two React SSR/UTF-8 component tests also authored. Commits `1c4a03b`, `86d9f55`, `c56e180`, `3c75c37`, `d6048e4`.

**Validation evidence:** GitHub source re-fetch confirms **11/11 expected cross-file ownership/behavior invariants** on head `d6048e4c3cb5b34b0638531caa0c3633220fce77`. For pure helpers, exact copies of committed `src/lib/appeals.ts` and `src/lib/appeal-public-copy.ts` were validated by `git hash-object` against GitHub blobs `9bf9e6c7f822c647bfc092760ea9319d9cb305d5` and `852d8b9f09d72e9f286868d6d417df0b021f41a5`; native Node22 TypeScript stripping then executed 80 targeted helper test cases, **80 passed, 0 failed**. This independently executed focused harness is not repository Vitest. The new component SSR tests, Playwright, full ESLint/TypeScript, full Next compile and performance/security budgets are **not yet executed on this head**. Local container has no React/Vitest/Playwright dependency installation and cannot resolve github.com to clone.

Original 95-item classifications remain unchanged (10 addressed baseline; 33 implemented pending release verification; 25 partial; 16 open; 11 unverified). Do not claim these incremental fixes close whole original findings. No main merge, deployment, live payment, DB/storage, mail, migration or provider-configuration action. CSP rollout remains off; preview migration remains unapplied.


## Continuation — additional ledger safeguards and executed helper validation

Existing PR #292 / `fix/direct-transfer-feedback-20261013`. Work committed after `d743648` checkpoint through `32f90b17724d0c2668435d675c8c7ed76044bb06`.

**Mark-funded transition:** `shouldMarkAppealFunded` is used in both Razorpay captured-payment and reconciled direct-transfer paths. A previously invalid `PUBLISHED` zero-goal appeal (0 raised / 0 goal) could satisfy the old `raised >= goal` comparison. The helper now requires finite nonnegative raised balance, finite strictly positive goal and the original met-target condition. Eight new funded-state Vitest cases cover zero/negative/NaN/infinite/string values, preserving legitimate positive-goal behavior. Commits `73b50fe` and `742c2f5`.

**Remaining need calculation:** `getRemainingAppealAmount` previously returned NaN/infinite for invalid inputs, potentially leaking malformed financial amounts to donation UI and validation messages in future call paths. It now reports zero donation-eligible remainder when balances are nonfinite, negative or the goal is non-positive, while preserving correct normal and overfunded calculations. Seven unit regressions. Commits `dcbcd3b`, `32f90b1`.

**Actually executed narrow runtime verification:** The current `src/lib/appeals.ts` was reconstructed in isolated Node 22 runtime and verified byte-for-byte using the exact Git blob hash **`990e34155ee88f65ff87592b98215270b8441b53`**. Node `--experimental-strip-types --test` ran **60 focused assertions, 60 passed, 0 failed** for eligible/invalid fundraising, refunds, funded transitions, percentage bars, and remaining need. This is not the repository's full Vitest run, Next compile, browser acceptance or hosted DB verification.

The original95 row classifications remain10 addressed baseline,33 source-implemented awaiting release acceptance,25 partial,16 open,11 unverified. No production release/merge, migration, payment, mail, provider or private-record action. The next executor should verify exact-head tests, apply remaining source defects, and close classifications only after corresponding acceptance.


## Continuation — fail-closed fundraising states and exact-source runtime checks

Same PR #292 / `fix/direct-transfer-feedback-20261013`; no concurrent writer found at head `cefa59570b1dde9c27dc291c308b541ca9db30d0`.

**Donation visibility:** `isAppealOpenForDonations` previously accepted malformed monetary data (zero, negative, non-finite or invalid numeric text) or an invalid `closesAt` because `NaN <= now` is false. Keep existing `PUBLISHED`, below-goal, no-close-date and valid future deadline behavior. Require finite nonnegative raised amount, positive finite goal and valid current/deadline times; reject malformed cases before offering a donation route. `getDonationPageData` and published-appeals surfaces already share this gate. Unit additions: 11 malformed cases, 1 invalid current-clock case, 1 valid numeric-string/future-Date control. Source/tests: `7b64973`, `660201e`.

**Time-sensitive cached homepage visibility:** `getHomepageAppealsCached` caches filtered results for 300 seconds. Public `getHomepageAppeals` now reapplies `isAppealOpenForDonations` to each cached result on every render, so an appeal expiring within the cache TTL is not advertised as open. It does not add a database query or change publication/consent filters. The existing public-boundaries Node test file now asserts that post-cache verification remains present. Source/guard: `2382bfb`, `847273e`.

**Refund status transition:** `appealStatusAfterRefund` previously reopened `FUNDED` appeals to `PUBLISHED` with invalid retained/goal values or malformed close times. Fail safely to `CLOSED` when a refund cannot establish valid financial/deadline state. Preserve manually controlled non-`FUNDED` states; valid below-goal refunds can reopen within their window; fully funded amounts remain `FUNDED` regardless of malformed reference clock. Source corrections: `a1e8773`, `2906f53`; nine refund unit regressions: `cefa595`.

**Runtime validation actually executed:** Cloning the repository remains unavailable because local DNS cannot resolve github.com. The committed `src/lib/appeals.ts` was independently retrieved, copied into the local Node 22 environment and validated by exact Git blob SHA **`9f3b2bd1ff40304bc7e71877362fc56dfbc584db`**, confirming byte-for-byte source identity. Native Node TypeScript stripping loaded that exact source. **23 focused assertions passed** for funding progress, donation eligibility, deadline boundaries, refund reopen/close logic and manually controlled state preservation. The repository's Vitest, entire Next/TypeScript build, browser E2E, hosted DB and production checks were **not** executed on this new head. The 13 donation and nine refund authored Vitest cases remain to be run as part of exact-head release verification.

The original 95-finding classification is unchanged: 10 baseline addressed, 33 source-implemented pending release verification, 25 partial, 16 open, 11 unverified. This work is incremental integrity remediation, not an audit-wide closure. No live payment, private data write, migration, deployment or main merge.


## Continuation — appeal detail DOM ownership and safe progress meters

Existing PR #292 / `fix/direct-transfer-feedback-20261013`. Source/test head before checkpoint: `3be530aff3b77bee3449fe70a3afe57103692605`.

**Confirmed appeal funding detail mismatch:** `src/app/appeals/[slug]/page.tsx` nests the visible funding `small`, `strong` and `p` inside the panel's first `div`, while `src/app/appeals.css` styled impossible direct children of `.v2-appeal-donation-panel`. Update the three selectors to match the actual nested structure and preserve the root typography/semantic color tokens. Amount heading now uses 1.12 leading with responsive font sizing, dark readable ink and tabular figures. A narrowed-screen route-owned media rule stacks the three panel columns at <=620px, avoiding cramped INR totals under the older root 2-column rule. No donation ledger/amount/payment logic changes. Style source commit `363e9cb`, mobile fix `38eccc0`.

Expand the existing opt-in browser-acceptance appeal fixture with the actual three-div funding summary, a synthetic INR 1,00,00,000 of 5,00,00,000 (20%) case and visible funding meter. Existing three widths320/390/1440 now assert nested label/amount/description computed styling, single-column mobile/three-column desktop, amount leading, INR containment and preserved card focus/progress. Fixture commits `2306a40`, `a6f1fb0`, test `2070078`. Extend global CSS audit to reject dead direct-child selectors, assert route-owned visual rules and check that the real appeal-detail JSX still matches fixture/selector ownership. Regex escape was inspected and corrected; commits `60f74d6`, `f1c0287`, `17c6faf`. Nine source-level ownership/fixture invariants re-fetched from GitHub and pass; **Playwright not yet run**.

**Related accessible progress correctness:** Both public `AppealCard` and the detail route independently calculated `Math.min(100, Math.round(raised/goal*100))` with no lower bound and no finite-number guard. Malformed/negative values could produce NaN or negative `aria-valuenow` despite its declared minimum0, with invalid CSS meter widths. Add pure `getAppealProgressPercent` to `src/lib/appeals.ts`, returning0 for non-finite/invalid targets and bounding valid percentages to[0,100]. Use it in both public components without mutating financial values or backend funded/open status. Add11 unit cases for decimal-like/string/zero/negative/malformed/overflow/overfunded inputs. Commits `c5f74c2`, `aafd2b3`, `c9bf08c`, `3be530a`. Nine additional exact-source integration/unit coverage invariants pass; **unit runner/TypeScript/build not yet executed on this head**.

No main merge, deployment, real money movement, provider calls, private assistance writes, migration, consent change or budget increase. Keep original95 accounting unchanged:10 addressed in recorded baseline,33 source implemented,25 partial,16 open,11 unverified. The current batch advances R-019/R-025/R-057/R-058/R-064 and additional independently detected issues, but does not establish complete closure of any original finding. Exact-head browser, lint, TypeScript and compile/budget gates must pass before release.


## 14 October midday — appeal small-text contrast correction

Ownership: same PR #292 and `fix/direct-transfer-feedback-20261013`; source/test head `8ee172ee9bc4d5568be5a331848291643357a76a`. Reviewed exact-color light-surface contrast for homepage and appeals card metadata. Former `#7a838e` resolved to3.78:1 on `#fffdf8`, `#7f8891` to3.54:1; both fail4.5:1 for small text. Existing semantic `--af-color-meta` (`#5f6b75`) resolves to5.37:1 on `#fffdf8` and4.67:1 even on `#f3eddd`. Replace only head-location small, progress amount-caption and progress foot ink in `appeal-card.css` and overlapping `appeals.css`, preserving layout/amounts/links and the darker route polish. Commits `afcc5db`, `be0b8ca`.

Add nine AA contrast comparisons in the pre-existing homepage synthetic AppealCard Playwright suite at320/390/1440 using the more conservative approved muted-paper background. Add six style ownership/semantic-ink assertions to the global CSS architecture audit; commit `185f02f`, `8ee172e`. Independently re-fetch source and evaluate six audited leading rules and six semantic metadata ink rules:12/12 source checks pass. New Playwright and full runtime/build gates remain **unexecuted on this head**. R-019/R-025/R-026/R-061 remain partial; no full original-95 closure claims or changed totals. No release, deployment, migration, provider configuration, real payments, private data or image writes.


## 12:49 IST continuation — R-025 remaining appeal and Stories leading

Ownership: existing PR #292 / branch `fix/direct-transfer-feedback-20261013`. Verified latest source/tests head before checkpoint: `7f241f72aa0215fa854a52535733fe5bb6989c78`.

The appeals route stylesheet (`src/app/appeals.css`) still declared `line-height:.95` for the shared AppealCard title, empty-state H3 and story detail H2, conflicting with the component and global corrections. Correct all three to `1.12`. Extend the existing synthetic appeals acceptance fixture with an empty state and story detail heading, then assert all three heading ratios at320/390/1440. Commits `b7456ea`, `f7fbc11`, `605db8e`.

The Stories route had three remaining tightly leading multiline display texts: feature-image fallback (`.95`), detail context (`1.05`) and detail no-media fallback (`.98`). Preserve fonts/layout and change only leading to `1.12`. Extend the pre-existing Stories accessibility fixture to check those values at390/1440 and100%/200% text scaling. Commits `d492dc2`, `a914292`.

The current global CSS architecture audit now guards these six route-level heading rules, preventing future route CSS from defeating a component-only accessibility fix; an initially over-escaped audit regex was caught and corrected in `7f241f7`. Independent source-level evaluation confirms six of six heading rule checks and correct regex literal. Audit commits `300cb5a`, `7f241f7`. E2E, TypeScript, lint and the production build have **not been executed** on this head in this continuation. R-025 remains partial; no 95-entry closure count changed. No payment/intake/data/provider operation, main merge, budget increase, deployment or migration.


## Completed source remediation in PR #292

Repository: `immazhark/amaana-platform`. Existing PR: https://github.com/immazhark/amaana-platform/pull/292. Working branch: `fix/direct-transfer-feedback-20261013`. Exact implementation/test head before this checkpoint: `814f23a5a607a46f4b537791c3ae38b00779144d`.

**Homepage live-appeal stylesheet regression:** Earlier CSS ownership isolation put `appeal-card.css` exclusively in `src/app/appeals/layout.tsx`. `src/app/page.tsx` also renders `AppealCard` for active appeals. Root layers do not supply its essential flex/progress declarations. The homepage now independently imports `./appeal-card.css`; the /appeals ownership/import sequence is preserved. `scripts/audit-global-css.mjs` rejects future omission from the homepage. This is a source-level correction, not yet an executed browser certification.

**R-025 incremental accessibility remediation:** `src/app/appeal-card.css` now uses `line-height:1.12` instead of `.95` for the multiline card heading. The heading ratio is asserted in the new responsive browser cases. This advances the partial typography finding but is not evidence of full R-025 closure.

**Isolated test coverage:** New synthetic `e2e/fixtures/browser-acceptance/home-appeals/page.tsx.fixture` with no live database or donor interaction, materialized only under `AMAANA_BROWSER_ACCEPTANCE=true`. New `e2e/home-appeal-style-ownership.spec.mjs` has three Playwright cases (320, 390, 1440px) for flex layout, progress bar, title line-height, link focus and horizontal overflow.

Implementation commits: `80f8900`, `9f959cb`, `32723fd`, `af1e1e7`, `c8d556b`, `2e2490d`, `814f23a`. All seven affected sources/fixtures were re-fetched from GitHub and expected source invariants were verified. **The new Playwright cases, TypeScript, CSS audit, full lint, production build and budgets have not yet run on this exact head**; the local environment cannot resolve github.com to clone the repository. No claim of green CI or production verification is made.

## Additional transaction error-boundary regression

The donation and assistance `error.tsx` screens both use `.v2-error-page`, but unlike the root error and 404 boundaries, they did not import `error-experience.css`; their normal transaction layouts also do not load it. Root polish had partial generic rules, not the required flex/min-height/content layout. Each transactional error boundary now imports `../error-experience.css` directly. The existing CSS architecture audit explicitly rejects either omission.

A second opt-in synthetic acceptance route mounts the **actual** `DonateError` and `AssistanceError` client components, with nonfunctional local reset callbacks and no backend or provider calls. Two new `e2e/transaction-error-style-ownership.spec.mjs` cases assert essential layout at390px/1440px, enabled recovery buttons and no horizontal overflow. The materializer removes this fixture whenever test mode is disabled. Commits: `0d22022`, `406f9c0`, `3469234`, `62d3110`, `d68986d`, `fddf383`, `a367373`.

Additional R-025 correction after the boundary import: the shared error/404 heading declaration and the later root polish authority now both resolve to 1.12 line-height for multiline error and not-found headings. New browser cases check computed line-height ratio; state/receipt/loading headings retain their existing independent styling. Commits: `face42c`, `4a50b42`, `acef1ef`.

These are source corrections with browser cases **authored but not executed**. No security/payment/intake workflow change or false production test claim. The latest verified source/test head at this checkpoint is `acef1efed4b697e6ec90053622c9b03a3eae200f`. The files were re-fetched and twelve expected source/ownership invariants pass; runtime gates remain outstanding.

## Original 95-item register

Unchanged from latest reconciled snapshot: **10 addressed in recorded deployed baseline, 33 source implemented awaiting release verification, 25 partial, 16 open, 11 unverified**. The homepage regression identified here is additional to those 95. R-025 stays partial.

## Safety and continuation

No new PR, main merge, deployment, real payment, email, database mutation, media ingestion, migration, or production configuration change. Existing preview migration remains unapplied and CSP report-only remains off. No increase to JS/CSS budgets. On handover, review this checkpoint and the original register, then continue implementing actionable defects in the same PR. Run the exact-head browser/TypeScript/CSS guards before any release decision; do not substitute a prior green head. Preserve consent, FCRA, provisional tax-registration wording and donation idempotency safeguards.
