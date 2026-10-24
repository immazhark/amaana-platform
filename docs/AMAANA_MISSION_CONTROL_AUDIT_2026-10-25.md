# Amaana Mission Control — comprehensive status audit

## Verified engineering checkpoint — 25 October 2026 (#433 runtime, #434 tooling)

The current live website is PR #433 merge SHA `b033e99982caaeb295726bf19df64ca1ffa7f7a3`: full CI `40129948886`, ready-state `40133153027`, Railway `a8d650de-9e24-4569-81d8-58d2b81e297b` SUCCESS, public version exact and readiness ready. Latest main commit `771cba2e0c0cfe364962bc8db0f43581f8d958e2` merges PR #434 (read-only route CSS measurement): full CI `40133473638`, ready-state `40136256260` passed. Railway `5d749e49-9b1a-4881-be8d-dd1a19f7e5b0` SKIPPED because only `scripts/**` and `.github/**` changed and neither matches runtime website watch patterns. Do not represent #434 as a runtime release. The authoritative measurement procedure is `docs/PUBLIC_ROUTE_CSS_MEASUREMENT.md`. AF-R057/AF-R068 route/state CSS coverage and AF-R042 physical accessibility evidence remain open; no actual LCP/INP/CLS measured by #434. Historic 149: 1 Completed, 59 Implemented, 61 Partial, 26 Not started, 1 Superseded, 1 Not applicable; unchanged. All historic sections below preserve their original evidence time and must not be mistaken for the latest release.


**Checkpoint:** 25 October 2026 IST. **Scope:** all 149 canonical ledger rows, current source inspection, Git first-parent release history, open issue/PR audit, focused executed tests, and read-only production identity checks. This is not a legal opinion, full penetration test, real-device certification, live financial transaction test, or line-by-line audit of all historical code.

## Release checkpoint — post-audit evidence (25 October 2026)

PR #431 is now MERGED and independently LIVE_VERIFIED for release identity/readiness: full exact-head CI `40125762941` all seven jobs SUCCESS, separate fail-closed ready-state `40129381980` promotion/verify SUCCESS, guarded merge to `f9e4ec378cca008916c3e10c6abdbb98662e8c2a`; Railway website deployment `97bbab40-ad88-4a45-9d5e-5ee75233c802` SUCCESS; fresh public version HTTP200 identified exact main/production commit, and fresh readiness HTTP200 returned ready. The earlier PR #431 draft/browser-failure and runtime #430 rows below are historical pre-release observations. PR #433 remains UNMERGED; it prepares AF-R010/R011 audit-harness improvements and Companion response validation, pending its own hosted/live acceptance. These facts do not imply real-device accessibility, Core Web Vitals, private workflow certification, live payments, or any extra item closure. The 149-row audit classes remain 1 Completed, 59 Implemented, 61 Partial, 26 Not started, 1 Superseded, 1 Not applicable.

## Executive diagnosis

The frozen labels **26 not started / 59 implemented / 61 partial** are historical classifications, not a deploy queue. The remaining three rows are AF-N10 completed, AF-ZAKAT-LOCK superseded and AF-CRYPTO not applicable. This report accounts for every ID once in those groups; no denominator inflation.

- Some “not started” scopes already have source: AF-R080 metadata work, AF-LOCALES draft #374 and AF-R018 HSTS configuration. Their acceptance is incomplete or classification stale.
- Many “implemented” fixes are already in production. Redeploying identical code would not prove missing acceptance. Several labels also overstate completion: homepage remains force-dynamic; a test fixture still uses constant innerHTML; an audit loader still uses new Function.
- Of 61 partial scopes, this source audit classifies **17 as unfinished implementation**, **27 as measured source/acceptance reconciliation**, and **17 as external/manual acceptance plus reconciliation**. These are prioritization buckets, not completion percentages.
- The repository does not record a reliable historical reason or elapsed research effort for every row. “Not documented” is the exact answer where provenance is missing. Missing photographs cannot explain all delays; research cannot manufacture reviewed translations, provider verification, bank records, legal/religious rulings or physical-device results.
- Owner's latest authorization clears general commit/merge/deploy permission. It does not supply missing facts or justify skipping tests, exposing private records, replaying old migrations, charging/refunding donors or activating disabled delivery.

## Current release and issue audit

| Evidence | Observed result |
|---|---|
| Main | d6d6fe07b86c4f2c69a278ee9050342851a34928, PR #432 documentation only |
| Public runtime | 91b3631b0323b9b0ac97d8298024f16deadce406, PR #430 |
| Railway runtime | a3faf244-9e39-461a-a3e0-ffdae0a4d32a; successful release; sleep state wakes normally |
| Public verification | Fresh HTTP200 version matched91b3631b and readiness=ready; scrape01a16f57-81c1-728b-93df-d45e3401b114 and01a16f57-81a0-7529-86cb-fd25b5231b28 |
| Main-to-runtime difference | Only docs/FEATURE_DELIVERY_TRACKER.md; docs deployment53607323 was skipped |
| PR #431 | a420414321709bcf0fa256a7f3a116405c952f0f; draft; fast/DB/production passed; browser failed one stale parent-section aria-current expectation (1348 passes/1 flaky); correction and fresh full acceptance required; no merge/live claim |
| #431 budgets | JS804357/819200, CSS328563/348160 uncompressed aggregate bytes; route attribution unavailable; not CWV/compressed route measurements |
| Open issue #361 | Historical #292 source recovery is still incomplete. Preserve archive and reconcile feature-by-feature; never wholesale merge it |
| Open issue #264 | Build isolation is delivered, recipient delivery is not restored. Issue body contains old main/config assertions; inspect current records rather than replaying old instructions |
| Draft PR #374 | Existing localization foundation; retain branch and require reviewed translations/RTL acceptance |

Recent first-parent releases include #375–#432, with source batches for navigation, media, assistance, payment-input handling, carousel interaction, dependency remediation, query cost, FAQ and public discovery. Exact SHAs and row-specific source entry points below supersede generic old “unmerged” notes. Commit volume is not feature completion.

## Verification performed

- Root Companion candidate: three live-response regressions and one malformed-tomorrow prayer regression failed before correction; after correction **2,141 Vitest tests pass /15 skipped**, **13 native calendar/prayer tests pass**, TypeScript/scoped ESLint/spec syntax/diff checks pass. These counts are on the prepared main-based candidate, before reconciliation with #431. Full hosted/browser/build acceptance remains required.
- Independent implemented-row checks: **250 Vitest tests pass across19 files**, **13 native tests pass /4 PostgreSQL parity cases skipped**. Skips are not passes.
- Full dependency audit: zero reported advisories at this checkpoint. This is not a guarantee that no vulnerability exists.
- Architecture/product divisions verified exact coverage26/59/61 and cited current source paths. Row evidence is bounded; no claim that every listed browser or operational step was executed.

## Parallel execution already performed

| Division | Completed work | Active or next concrete action |
|---|---|---|
| Architecture/core | All26 unstarted classifications reconciled; two deterministic Companion response defects reproduced | Root implements/tests one coherent Companion response batch; prepare measured route/CSS work |
| Product/design | All61 partial rows itemized; missing full product scopes separated from acceptance gaps | Preserve approved design; prioritize actual donor/public journey gaps and reviewed data contracts |
| Quality/security | All59 implemented rows mapped to source/test entry points; focused tests executed; independent source review | Complete exact-head browser/promotion gates; investigate severe source findings read-only before scoped changes |
| Release/operations | Main/runtime distinction, Railway status, current CI budgets and issue state reconciled | Merge only passing candidates with expected-head guard; verify matching runtime SHA/readiness and affected journey |

One root writer mutates repository files; the divisions performed parallel read-only work. No competing writes, provider changes, live donations, refunds or migrations were performed.

## Block A — all26 historically “not started” items

**Diagnostic:** these rows comprise external fact/provider gates, measurements/reproduction, genuine new product design and stale labels. For each row, the current boundary and next executable steps follow. Generic research is not a reason to delay an already-ready source task.

### AF-R013 — Admin edge Access/WAF/allow-list requirement

- **Current evidence:** App has RBAC; no evidence here of a live Cloudflare Access/WAF policy.
- **Blocker/type:** External security configuration. Cloudflare policy/access inventory, real admin identities and recovery channel. Broad code approval supplies authorization, not missing identity facts.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Inventory current zone rules read-only; specify /admin and privileged-API boundaries, origin-bypass tests and emergency rollback; validate in preview before enforcement. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** next.config.ts; src/app/api/admin; e2e/admin-anonymous-boundaries.spec.mjs

### AF-R015 — Cloudflare analytics beacon CSP violation

- **Current evidence:** CSP only allows self and Razorpay scripts; Cloudflare beacon allowlist is absent. A current violation has not been reproduced.
- **Blocker/type:** Reproduction + policy decision. Live console/network evidence and choice to disable beacon or permit its exact origin.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Capture live response/CSP and injected beacon URL; reproduce violation; propose one policy-compatible option; test checkout/CSP before release. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** next.config.ts:36

### AF-R018 — HSTS preload/subdomain HTTPS review

- **Current evidence:** HSTS already advertises max-age=63072000; includeSubDomains; preload. It is not an unimplemented header.
- **Blocker/type:** External inventory / acceptance. All subdomains/TLS inventory and actual preload registration state are unknown.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Inventory DNS and certificate coverage; check preload state from authoritative source; assess recovery and unknown subdomain risks before changing policy. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** next.config.ts:44

### AF-R048 — Current throttled-mobile LCP/TBT/TTI acceptance

- **Current evidence:** Web-vitals endpoint and DailyWebVital model exist; tooling is not proof of representative current mobile results.
- **Blocker/type:** Measurement. Throttled route traces, Indian Android real-device evidence and a reproducible source bottleneck.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Measure Home/Our Work/Impact/Donate under fixed network/CPU; retain median runs; fix top measured LCP/CLS/interaction cause; compare same setup. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** src/app/api/analytics/web-vitals/route.ts; prisma/schema.prisma:DailyWebVital; scripts/report-route-bundles.mjs

### AF-R059 — Missing governed cascade layers

- **Current evidence:** Governed stylelint exists for one donation CSS module. Full cascade-layer migration is not established.
- **Blocker/type:** Architecture / visual validation. Selector precedence map and visual-state baseline; moving unlayered rules into layers can invert precedence.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Inventory layers/import order; choose one isolated component; build before/after visual states; migrate only with identical cascade outcome. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** package.json:stylelint:governed; src/app/globals.css

### AF-R062 — Excessive important declarations

- **Current evidence:** Historical CSS contains important overrides; no current measured unnecessary-rule inventory.
- **Blocker/type:** Measurement / code. Computed cascade evidence across hover/focus/disabled/mobile/reduced-motion states.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Use CSSOM/DevTools to identify redundant overrides; remove one bounded family; prove visual and keyboard parity then batch remaining verified rules. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** src/app/experience-finish.css; src/components/campaign-media-gallery.module.css

### AF-R068 — Unused CSS <10% on key routes unverified

- **Current evidence:** Some route CSS isolation and aggregate budgets exist; unused CSS <10% remains unproven.
- **Blocker/type:** Measurement. Route/state coverage traces; dynamic selectors cannot be deleted on a single page load.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Collect key routes at mobile/desktop plus interactions; classify shared/dynamic rules; prune only proven dead selectors; compare bundles and rendered states. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** scripts/report-route-bundles.mjs; src/app/experience-finish.css

### AF-R076 — Cloudflare email-protection broken link

- **Current evidence:** Source Contact, footer and participation cards use native mailto anchors. Parent session fresh Contact fetch showed correct hrefs.
- **Blocker/type:** Reproduction / stale register. Original affected URL and current Cloudflare transformation needed; no current bug reproduced.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Find original evidence; inspect raw/rendered hrefs on affected routes; if unreproduced retain bounded result rather than inventing code change. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** src/app/contact/page.tsx; src/components/site-footer.tsx; src/components/participation-card.tsx

### AF-R078 — Dated audit documents not archived

- **Current evidence:** Dated audit documents and extensive historical logs remain; that alone does not prove they are obsolete.
- **Blocker/type:** Research / retention decision. Inbound-reference inventory, historical evidence retention and target archive policy.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Generate inbound-link map; mark superseded docs with current successor; propose archive moves with redirects/reference updates; no blind deletion. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** docs/AI_HANDOFF_LEDGER.md; docs/REMEDIATION_REGISTER_2026-10-12.md

### AF-R079 — Excess remote branches / branch hygiene

- **Current evidence:** Repository contains historical branch references; no verified deletion inventory in this scope.
- **Blocker/type:** Research / destructive operations. Current remote branch heads, merged ancestry, open PR usage and rollback value.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Enumerate refs/last activity; classify merged/open/unmerged/rollback; prepare exact candidate list; preserve pinned rollback branches; delete only scoped approved targets. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** docs/AI_CONTINUITY_PROTOCOL.md; docs/AI_ACTIVE_WORK.md

### AF-R080 — Rich-results and entity-schema live acceptance

- **Current evidence:** The row itself records merged PR385 metadata corrections; structured-data/privacy helpers and tests also exist. Not untouched.
- **Blocker/type:** Stale register / external acceptance. Current live rendered entity/schema validation and provider Rich Results result; old outage note is historical.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Map current main ancestry for metadata commits; fetch live schema on key pages; validate canonical IDs/URLs and visible-copy parity; run external rich-result validator. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** master register AF-R080; src/lib/structured-data.ts; src/components/structured-data-rendering.test.tsx

### AF-R090 — Qurbani live sponsorship tiers/counter

- **Current evidence:** Qurbani historical programme pages exist; no reviewed live sponsorship inventory/counter model established by source scan.
- **Blocker/type:** Policy + data + architecture. Approved current unit costs/capacity, campaign dates, fund policy and religious review.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Write capacity/reservation/expiry/idempotency contract; approve units and costs; test oversell/concurrency/refunds on isolated data; enable only reviewed campaign. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** src/app/our-work/qurbani-meat-distribution/page.tsx; prisma/schema.prisma

### AF-N13 — Development-tool braces stack-exhaustion advisory

- **Current evidence:** braces3.0.3 is dev-only; Docker asserts absent after production prune. Official advisory was withdrawn23Oct as not practically exploitable; parent fresh audit reports zero.
- **Blocker/type:** Reconciliation candidate. Need current advisory/lock/runtime evidence recorded; no patch exists or is required for withdrawn advisory.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Record authoritative withdrawal, dev dependency chain, fresh audit and runtime exclusion; propose CLOSED_AS_WITHDRAWN or NOT_APPLICABLE rather than claim source fix. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** package-lock.json:3263; Dockerfile:30; https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

### AF-N14 — Destination stream closed early errors

- **Current evidence:** Historical record says cancellation can reproduce a mechanism but actual CI error cause unconfirmed. Navigation recovery tests are not proof this server error is fixed.
- **Blocker/type:** Reproduction. Exact error stack, route, request termination timing and affected Next/runtime version.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Collect bounded logs without PII; reproduce abort/early-close on isolated route; identify framework/application owner; add cancellation regression before source change. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** docs/REMEDIATION_REGISTER_2026-10-12.md:N-14; e2e/navigation-resilience.spec.mjs

### AF-TAX — Separate reviewed finance export and statutory 10BD/10BE workflow

- **Current evidence:** Ordinary acknowledgements explicitly distinguish Form10BE; no reviewed statutory export workflow established.
- **Blocker/type:** Legal / finance evidence. Signed certificate/current CA position, legal issuance authority, export fields and finance RBAC.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Resolve 80G conflict; define reviewed export schema and approval lock; implement isolated RBAC/export tests; retain issuance disabled until signed authorization. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** src/lib/verification-faq.ts:25; prisma/schema.prisma

### AF-REFERRAL — Verified partner referrals and scope-limited private attestations

- **Current evidence:** Public copy mentions referrals; no scoped partner-referral/attestation model established in schema scan.
- **Blocker/type:** Product / privacy architecture. Partner vetting, data minimization, permitted referrals and revocation semantics.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Specify limited referral envelope/no case browsing; threat-model token scope/revocation; approve retention/access; implement private tests before UI. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** src/content/master-copy.json; prisma/schema.prisma

### AF-ATTESTATION — Private donor verification and aggregate tamper-evident report attestation

- **Current evidence:** Publication privacy attestations exist for appeal updates, but not donor verification plus aggregate tamper-evident report attestation.
- **Blocker/type:** Product / privacy architecture. Approved aggregates, report identity/versioning, retention, donor verification access design.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Define canonical aggregate document/hash/version; separate public hash from private lookup; test tampering/version replacement/access; publish only approved aggregate. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** src/lib/appeal-update-publication.test.ts; prisma/schema.prisma

### AF-BATCH-TRACK — Donor receipt-to-approved distribution batch status reporting

- **Current evidence:** Private donation records exist; no approved distribution-batch relationship/report workflow established.
- **Blocker/type:** Data / product architecture. Allocation authority, donor consent, batch model and privacy-safe reporting rules.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Map donation to reviewed batch without beneficiaries; define allocation/audit/reversal states; approve data model; test scoped lookup and redacted reports. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** prisma/schema.prisma:Donation; src/lib/public-page-data.donation-batch.test.ts

### AF-DRIVE-SPONSOR — Sponsor approved locality drive with private post-event report

- **Current evidence:** Education sponsorship enquiry exists; locality-drive sponsorship/report is a separate undefined workflow.
- **Blocker/type:** Policy / inventory data. Reviewed service zones, unit amount, inventory, fund allocation and post-event evidence.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Define approved drive catalogue and enquiry/pledge boundary; approve inventory/fund policy; test reservations and private report scopes; then activate. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** src/components/sponsorship-enquiry.tsx; prisma/schema.prisma

### AF-FAMILY-JAR — Family pooled Sadaqah participation and group report

- **Current evidence:** No pooled family contribution/membership/consent model established in schema scan.
- **Blocker/type:** Financial / privacy architecture. Payment design, member consent, cross-user access and fund allocation policy.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Specify pledge-only prototype first; review collection/ledger/reversal model; test per-member privacy/idempotency; do not enable pooled collection before approved policy. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** prisma/schema.prisma

### AF-LOCALES — Reviewed Urdu/Telugu critical journeys; optional Hindi; RTL/hreflang parity

- **Current evidence:** Master row records active draftPR374 at35%; main source scan has no deployed ur/te routes. Not untouched.
- **Blocker/type:** Reviewed content / active draft. Approved Urdu/Telugu critical/legal/error copy; RTL and canonical/hreflang acceptance.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Continue existingPR374; map translation keys to critical journeys; obtain reviewed copy; build routes/RTL/forms; test source-locale parity before release. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** master register AF-LOCALES; PR374

### AF-WHATSAPP — WABA template notifications, signed webhooks and opted-in channels

- **Current evidence:** NotificationChannel.WHATSAPP enum and public wa.me link exist; neither is WABA template delivery.
- **Blocker/type:** Provider / consent / integration. Verified WABA account/templates/provider, explicit channel opt-in, inbound verification and suppression.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Define signed webhook and idempotency contract; provision reviewed templates/provider test mode; test consent/unsubscribe/signature/retry; keep delivery disabled until acceptance. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** prisma/schema.prisma:NotificationChannel; src/app/contact/page.tsx

### AF-LISTINGS — GuideStar/Candid, IndiaZakat, Give.do, Ketto/Milaap reviewed eligibility

- **Current evidence:** Public organization/trust content exists; no evidence of approval on named directories supplied.
- **Blocker/type:** External platform review. Current platform eligibility and documentation plus external review decision.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Build evidence pack from approved registration/privacy media; verify each platform current eligibility via primary docs; submit only accurate material; track approval per provider. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** src/app/compliance/page.tsx; docs/canonical-factual-locks-2026-09-15.md

### AF-NONPROFITS — Google for Nonprofits/Ad Grants eligibility and validator verification

- **Current evidence:** Foundation documentation exists; no current Google nonprofit/validator approval evidence here.
- **Blocker/type:** External platform review. Current eligibility, validator verification and account authority.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Verify current Google eligibility/validator requirements from official docs; prepare documents; request verification; record external decision before grants claims. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** src/app/compliance/page.tsx; docs/canonical-factual-locks-2026-09-15.md

### AF-PRESS — Approved institutional/press outreach and national expansion evidence

- **Current evidence:** Reviewed programme figures and public pages exist; no approved press pack or expansion evidence established.
- **Blocker/type:** Editorial / privacy evidence. Trustee-approved claims, redacted publication derivatives and actual institutional/expansion evidence.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Draft fact-checked media kit; map every claim/photo to evidence and privacy review; approve final pack; outreach requires separately explicit send instruction. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** src/content/master-copy.json; docs/canonical-factual-locks-2026-09-15.md

### AF-FIDYA — Reviewed Fidya/Kaffarah/Aqiqah/Waqf giving policies and destinations

- **Current evidence:** Current giving-intent enum is GENERAL/SADAQAH/ZAKAT; no reviewed new category contract established.
- **Blocker/type:** Religious / financial policy. Religious rulings, approved current unit costs, fulfilment obligations and fund destinations.
- **Why untouched/stalled:** Historical cause not recorded; current gate identified above. Research can clarify a plan but cannot supply absent approval, provider verification, legal facts or real-device evidence.
- **Atomic completion path:** Specify disabled category contracts; obtain qualified review; define price/version/fulfilment/refund boundaries; test isolated server/UI parity; enable only approved categories. Then execute scope-relevant negative/positive tests, protected PR acceptance, guarded merge and matched deployment/live acceptance where runtime changes exist.
- **Source:** prisma/schema.prisma; src/lib/verification-faq.ts

### AF-N13 specific research resolution

The official GitHub advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) was withdrawn on23October2026 because it was not practically exploitable. Current braces3.0.3 is a development dependency through ESLint, and the production Docker image excludes development dependencies. The fresh full audit reports zero advisories. Do not invent a patched release or change dependencies just to show activity. **Proposed reconciliation:** change the current execution lane to WITHDRAWN_ADVISORY; retain its historical classification for provenance until the canonical status amendment is merged. No new runtime deployment is needed for a withdrawn advisory.

## Block B — all59 historically implemented items

**Diagnostic:** the principal bottleneck is incomplete mapping of accepted source → executed test → merge → deployed ancestry → scope-specific production acceptance. Some scopes also need correction or clarification. Most are not a queue of59 undeployed features.

**Deployment rule:** current deployed ancestry already contains many fixes, including #425 FAQ, #360 in-page donation, #363 assistance validation, #349/#354 bounded storage and uncertain donation/assistance handling. For unchanged shipped code, capture evidence instead of issuing a duplicate release. For a reproduced remaining defect, implement a fail-first correction, run required checks, release and verify the precise changed behavior. Payment/private-data/device/provider acceptance cannot be replaced with health endpoint checks.

### AF-R001 — Next.js vulnerable release

- **Current source/test entry points:** package.json; package-lock.json.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Pinned Next16.4.2 is present; parent fresh dependency audit reports zero advisories. Capture advisory identity/range, exact lockfile integrity and matching release; live HTTP alone cannot certify dependency safety.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** cab0d8e86b501e0580feca7ceacf26592600e4e1 perf(validation): tree shake patched gallery contract before client bundling

### AF-R002 — Sharp/librsvg vulnerable release

- **Current source/test entry points:** package.json; package-lock.json.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Sharp0.35.5 pinned. Record transitive librsvg version/platform and advisory range; rerun audit plus image transformation/build on deployed platform.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** cab0d8e86b501e0580feca7ceacf26592600e4e1 perf(validation): tree shake patched gallery contract before client bundling

### AF-R003 — source-map-js vulnerable release

- **Current source/test entry points:** package-lock.json.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Lockfile resolves source-map-js1.2.2. Record original advisory identity/range, rerun full development and production audit and map exact lockfile to deployed build; zero audit is not a universal vulnerability guarantee.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** cab0d8e86b501e0580feca7ceacf26592600e4e1 perf(validation): tree shake patched gallery contract before client bundling

### AF-R004 — Storage module lacks explicit server-only boundary

- **Current source/test entry points:** src/lib/storage.ts; src/lib/storage-boundaries.test.ts.
- **Fresh row-specific tests:** src/lib/storage-boundaries.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Explicit server-only import found at storage.ts:1; focused boundary tests pass. Link current source to release and retain build/client import rejection evidence.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 4faacca358ff1f0a29d8e415112d6c6d71a79755 fix(media): bound S3 GetObject acquisition before streaming (#354)

### AF-R006 — Incomplete dedicated media credentials silently fall back

- **Current source/test entry points:** src/lib/storage.ts; src/lib/storage-readiness.test.ts.
- **Fresh row-specific tests:** src/lib/storage-readiness.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Partial dedicated media credential pair throws rather than silently falling back (storage.ts:48); focused tests pass. Verify configuration presence privately without printing secrets; never infer values from tests.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 4faacca358ff1f0a29d8e415112d6c6d71a79755 fix(media): bound S3 GetObject acquisition before streaming (#354)

### AF-R007 — Client-bundle secret scanner misses names or literal values

- **Current source/test entry points:** scripts/check-client-secret-boundary.mjs; scripts/test-client-secret-boundary.mjs.
- **Fresh row-specific tests:** scripts/test-client-secret-boundary.mjs
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh scanner regressions pass. Run scanner against exact production output with representative sentinel names/values; this does not prove history free of secrets or constitute provider rotation.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** f5578c31829aeb76ac4e30060cc658342942d762 security: check S3 key IDs and legacy media secrets in client bundles (#244)

### AF-R008 — JSON-LD input lacks runtime shape validation

- **Current source/test entry points:** src/lib/structured-data.ts; src/lib/structured-data.test.ts; src/components/structured-data-rendering.test.tsx.
- **Fresh row-specific tests:** src/lib/structured-data.test.ts; src/components/structured-data-rendering.test.tsx
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Strict runtime Zod schema present for public structured inputs; focused tests pass. Verify malformed shapes rejected across every publishing caller and public rendered JSON-LD.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 58dfa2881225652c25ba56e92a7d02b354e5c55a fix(schema): narrow possible undefined lookup under strict indexed access

### AF-R009 — JSON-LD serializer lacks full sensitive-character escaping

- **Current source/test entry points:** src/lib/structured-data.ts; src/lib/structured-data.test.ts.
- **Fresh row-specific tests:** src/lib/structured-data.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Serializer escapes < > & U+2028 U+2029 at lines145–151; focused tests pass. Crawl current script payloads and verify parsed JSON remains identical while script termination injection is inert.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 58dfa2881225652c25ba56e92a7d02b354e5c55a fix(schema): narrow possible undefined lookup under strict indexed access

### AF-R010 — Raw innerHTML assignments in test fixtures

- **Current source/test entry points:** e2e/visual-system.spec.mjs; e2e/all-page-audit.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Residual fixture.innerHTML assignment remains at visual-system.spec.mjs:229 (constant synthetic markup). all-page-audit also uses setContent assembled from fixtures. Define exact prohibited scope, replace assignment with DOM APIs if rule applies, and rerun visual tests before closure.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** c66b9e6855ba4843393b9a520ec16c482ebb9c48 test: align ultra-wide carousel preview contract

### AF-R011 — Dynamic new Function execution in audit harness

- **Current source/test entry points:** scripts/verify-master-content.cjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Residual new Function remains at line8 in TypeScript audit loader. Scope/source safety is not established by old implemented label. Replace with supported module loading or explicitly reviewed trusted harness exception; preserve master-content validation semantics with regression tests.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 69c3b0636cfaebabc311475b5a0dc83386a8680a Fix pre-existing CI lint and bundle gate

### AF-R016 — Overbroad CSP img-src https allowance

- **Current source/test entry points:** next.config.ts; e2e/security-headers.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** img-src now uses self/blob/data and validated configured HTTPS origins, not blanket https:. Verify live CSP and every approved image origin, including checkout compatibility, without making provider/config changes.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** f0227ffef4bf9f89ef94c9aa4375376b7b0e6530 fix: preserve no-referrer policy on private responses

### AF-R027 — Assistance step errors lack linked inline messages

- **Current source/test entry points:** src/components/assistance-form.tsx; e2e/assistance-surface.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Retest each step required-field failure: durable inline message, aria-describedby/error linkage, live error summary and keyboard route; synthetic test data only.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** ca5454baf016bc68d9cb33f44c4f3268da9f3285 fix(assistance): reject invalid evidence locally before upload (#363)

### AF-R028 — Assistance focus precedes error DOM commit

- **Current source/test entry points:** src/components/assistance-form.tsx; e2e/assistance-surface.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Verify error DOM exists before focus, including step transition, rerender and removed controls; record browser accessibility tree, not only helper tests.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** ca5454baf016bc68d9cb33f44c4f3268da9f3285 fix(assistance): reject invalid evidence locally before upload (#363)

### AF-R029 — Donation native validation lacks durable inline errors

- **Current source/test entry points:** src/components/donation-form.tsx; e2e/donation-assistance-journeys.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Verify native invalid submit retains stable inline field messages and user input after correction; mock/test provider only, no live donation.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 851cea60e805199805e4abcf8e9a3f784f605ee3 feat(AF-R083): in-page reviewed appeal checkout and safe INR presets (#360)

### AF-R030 — Donation server-rejected fields do not receive focus

- **Current source/test entry points:** src/components/donation-form.tsx; e2e/donation-assistance-journeys.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Inject each bounded server field error through isolated response fixture; confirm current active field receives focus once after commit.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 851cea60e805199805e4abcf8e9a3f784f605ee3 feat(AF-R083): in-page reviewed appeal checkout and safe INR presets (#360)

### AF-R031 — Donation error handling steals focus during correction

- **Current source/test entry points:** src/components/donation-form.tsx; scripts/test-donation-error-focus-race.mjs.
- **Fresh row-specific tests:** scripts/test-donation-error-focus-race.mjs
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh focus-race Node tests pass. Retest correction typing while stale server error/RAF settles; do not steal focus from visitor edits.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 851cea60e805199805e4abcf8e9a3f784f605ee3 feat(AF-R083): in-page reviewed appeal checkout and safe INR presets (#360)

### AF-R032 — Cancelled RAF suppresses donation error focus

- **Current source/test entry points:** src/components/donation-form.tsx; scripts/test-donation-error-focus-race.mjs.
- **Fresh row-specific tests:** scripts/test-donation-error-focus-race.mjs
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh focus-race tests pass. Browser test cancel/rearm pending RAF on rerender/unmount and verify final invalid control receives focus.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 851cea60e805199805e4abcf8e9a3f784f605ee3 feat(AF-R083): in-page reviewed appeal checkout and safe INR presets (#360)

### AF-R033 — Invalid giving-intent radio group is not focused

- **Current source/test entry points:** src/components/donation-form.tsx; e2e/donation-assistance-journeys.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Test invalid giving-intent group with server rejection and keyboard; check first valid radio focus, group label and one linked inline message.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 851cea60e805199805e4abcf8e9a3f784f605ee3 feat(AF-R083): in-page reviewed appeal checkout and safe INR presets (#360)

### AF-R034 — Contact social links fail visible-label-in-name matching; Public-media link accessible name mismatch; Gallery Enlarge accessible name mismatch; Appeal/reflection card accessible action mismatch; Impact tile accessible action mismatch; Participation-card accessible action mismatch; Story archive accessible action mismatch

- **Current source/test entry points:** src/components/participation-card.tsx; src/components/campaign-media-gallery.tsx; src/components/public-media.tsx; scripts/test-public-media-link-name.mjs.
- **Fresh row-specific tests:** scripts/test-public-media-link-name.mjs
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh public-media link label test passes. Multi-surface item still needs accessible-name/visible-label check across Contact/social, gallery, appeal/reflection, impact, participation and Story archive, desktop/mobile.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 7d318ddd82210b257e48b692bebb5c2259f484bf fix(contact): native protocol action links and browser regression (#378)

### AF-R041 — Amount fields use number controls instead of decimal input UX

- **Current source/test entry points:** src/lib/donation-amount-input.ts; src/lib/donation-amount-input.test.ts; src/components/donation-form.tsx.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Verify type=text/inputMode=decimal preserves INR precision, paste, locale, empty/invalid/large values and server amount boundary. Device keyboard evidence remains separate.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 851cea60e805199805e4abcf8e9a3f784f605ee3 feat(AF-R083): in-page reviewed appeal checkout and safe INR presets (#360)

### AF-R043 — Homepage always-dynamic rendering / avoidable TTFB

- **Current source/test entry points:** src/app/page.tsx; src/lib/public-page-data.ts.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Current page.tsx:28 still force-dynamic. Source may reduce query payload but does NOT remove dynamic rendering. Define acceptable cache/freshness contract for live appeals and profile TTFB before declaring resolved; no speculative caching.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 43472be4055c10214e5d30d079b610c3dc143a08 perf(home): reuse single approved cover media batch for configured and live appeal slides

### AF-R044 — Footer cumulative layout shift

- **Current source/test entry points:** src/components/site-footer.tsx; e2e/site-chrome-footer.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Measure footer CLS under real font/image loading at narrow/desktop widths and reduced motion. Geometry tests alone do not prove field CLS.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 42883ad758204005822723aaf30dc904bb463d06 feat(team): public directory and RBAC-managed Team page (#370)

### AF-R045 — Appeal-cover runtime N+1 media queries

- **Current source/test entry points:** src/lib/appeal-cover-media.ts; src/lib/appeal-cover-media.test.ts; src/lib/public-page-data.ts.
- **Fresh row-specific tests:** src/lib/appeal-cover-media.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh cover selection tests pass. Assert fixed query count for0/1/N appeals against isolated PostgreSQL and compare rendering/media projection; map measured query reduction to release.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** b63ba3a5e7ad6614d882fbca4a547df13b65c070 fix(media): reject ambiguous approval and deletion; bind reviewed versions (#369)

### AF-R046 — Seed/master-content/category import N+1 operations

- **Current source/test entry points:** prisma/apply-master-content.mjs; prisma/curated-gallery-import.mjs; scripts/test-master-content-assets.mjs.
- **Fresh row-specific tests:** scripts/test-master-content-assets.mjs
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh Node asset suite passed with4 PostgreSQL cases skipped. Execute omitted timestamp/import parity and batch query-count tests against isolated DB; never rerun import on production as a test.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 49b7e7ba44ec445afb406c0ac4de3241e60e3139 fix(import): preserve UTC timestamps during bulk category reconciliation

### AF-R050 — Lenis activates after native keyboard handoff

- **Current source/test entry points:** src/components/site-scroll.tsx; src/components/site-scroll.test.ts; e2e/site-motion-scroll.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Current site-scroll.tsx invalidates in-flight Lenis imports with generation counter and destroys smoothing before native keyboard/anchor/focus/history handoff. Run the retained controller tests and browser test keyboard-before-import race, Home/End, reduced motion, editable focus and later wheel reinitialization; record current production release ancestry.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** aefa61fd6ed5f2cf6083540e751ed76c9c11e324 fix(carousel): rearm a fresh press from an interrupted drag owner

### AF-R051 — Outdated browser/polyfill target

- **Current source/test entry points:** package.json; next.config.ts.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Current browserslist explicitly targets recent Chromium/Firefox/Safari/Edge. Compare generated polyfills and supported browser matrix; measure exact build payload without raising caps.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** cab0d8e86b501e0580feca7ceacf26592600e4e1 perf(validation): tree shake patched gallery contract before client bundling

### AF-R055 — Missing image formats/responsive caching pipeline

- **Current source/test entry points:** src/lib/storage.ts; src/components/public-media.tsx; e2e/image-cache-policy.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Validate real AVIF/WebP derivatives, intrinsic dimensions, sizes and Cache-Control across local/public origins. Source presence is not proof every asset was reprocessed or privacy approved.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 4faacca358ff1f0a29d8e415112d6c6d71a79755 fix(media): bound S3 GetObject acquisition before streaming (#354)

### AF-R070 — Gallery branch apparently absent from main

- **Current source/test entry points:** src/components/campaign-media-gallery.tsx; src/lib/gallery-selection.ts; e2e/campaign-gallery.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Gallery is present in current main ancestry. Focus/selection focused tests pass. Map former missing branch commit into current main and verify representative public programme gallery; do not require publishing unapproved assets.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** a25e3406e699239b771afd8b779328818f1ea9b6 fix(a11y): preserve browser shortcuts and composition keys

### AF-R072 — Homepage description exceeds target length

- **Current source/test entry points:** src/app/page.tsx; src/app/layout-metadata.test.ts.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Current homepage description is present. Measure rendered meta description character count against agreed target and validate canonical/OG parity; do not silently rewrite approved narrative to chase arbitrary SEO length.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 43472be4055c10214e5d30d079b610c3dc143a08 perf(home): reuse single approved cover media batch for configured and live appeal slides

### AF-R073 — Missing NGO/WebSite/alternateName/social/appeal action schema

- **Current source/test entry points:** src/components/public-content-structured-data.tsx; src/components/appeal-structured-data.tsx; src/components/breadcrumb-structured-data.tsx.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Parse current public NGO/WebSite/alternateName/sameAs/appeal action schema, cross-check approved identities and domestic-only actionable URLs. Validator success does not guarantee search enhancement.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** f9f5a02bfcb5ccfa3c10664ba90e380c4cb6da80 feat: add content structured data

### AF-R075 — Missing llms.txt

- **Current source/test entry points:** public/llms.txt.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Verify file exists, live HTTP200/content-type, no private/admin/token routes, and canonical links stay valid. This narrow item is a likely closure candidate once matched live evidence is recorded.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 893dac776564dd07055afeabcca0c80223537ce7 docs: add canonical public source index for R-075

### AF-R083 — Donate landing page in-page flow and amount presets

- **Current source/test entry points:** src/app/donate/page.tsx; src/components/donation-form-presets.test.tsx; e2e/reviewed-donation-landing.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Verify live Donate in-page entry and presets at mobile/desktop without submitting payment. Check invalid preset/query states, focus, hash destinations and closed appeal behavior.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 851cea60e805199805e4abcf8e9a3f784f605ee3 feat(AF-R083): in-page reviewed appeal checkout and safe INR presets (#360)

### AF-R086 — Persistent Donate CTA across all pages

- **Current source/test entry points:** src/components/site-header.tsx; e2e/site-chrome-footer.spec.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Donate links are implemented in shared header/mobile chrome. Verify visibility,44px touch targets, keyboard reachability, safe-area/zoom coverage across representative layouts and no overlap with modal/menu.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 90b3028e7e3615d356cc9be5544435e0b59adee0 fix: complete keyboard shortcut guards and patch test tooling

### AF-N01 — Duplicate asset entries within one import batch

- **Current source/test entry points:** prisma/curated-gallery-import.mjs; src/lib/curated-gallery-reconciliation.ts; src/lib/curated-gallery-reconciliation.test.ts.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Exercise same-batch duplicate URL/object/id records and import idempotency against isolated DB; verify single persisted asset/result without losing reviewed provenance.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 2767c72855b20e1aea073a355424418d5622659d feat: prepare approved owner-curated gallery integration

### AF-N02 — Bulk category updates omit updatedAt

- **Current source/test entry points:** prisma/apply-master-content.mjs; scripts/test-master-content-assets.mjs.
- **Fresh row-specific tests:** scripts/test-master-content-assets.mjs
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** PostgreSQL timestamp parity cases were skipped in fresh Node suite. Run real isolated bulk category update and verify updatedAt plus repeat import semantics.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 49b7e7ba44ec445afb406c0ac4de3241e60e3139 fix(import): preserve UTC timestamps during bulk category reconciliation

### AF-N03 — Confirmation accepts a different returned payment identity

- **Current source/test entry points:** src/app/api/donations/confirm/route.ts; src/app/api/donations/confirm/route.test.ts.
- **Fresh row-specific tests:** src/app/api/donations/confirm/route.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh tests reject different returned provider payment ID for authorized/captured paths. Run isolated provider fixtures and DB transition assertions; no live transaction needed for this narrow identity defect.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** b2f12e6154656ae0e3437b4806805482b8a10df1 fix: bound donation confirmation request ingress without changing capture semantics

### AF-N04 — Malformed provider payment reaches reconciliation

- **Current source/test entry points:** src/app/api/donations/confirm/route.ts; src/lib/donation-payment-details.ts; src/lib/donation-payment-details.test.ts.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh confirm tests pass. Expand malformed amount/currency/status/capture/order identity matrix and assert no reconciliation/persistence occurs for rejected records.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** b2f12e6154656ae0e3437b4806805482b8a10df1 fix: bound donation confirmation request ingress without changing capture semantics

### AF-N05 — Invalid provider order ID reaches donation persistence

- **Current source/test entry points:** src/app/api/donations/order/route.ts; src/app/api/donations/order/route.test.ts.
- **Fresh row-specific tests:** src/app/api/donations/order/route.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh order tests reject unusable provider identity and preserve uncertainty. Prove invalid order ID cannot create donation rows and valid identity still persists once in isolated DB.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 502ddb4662bc97a2b642d0baa94cb95d586ef929 fix: never invite duplicate Razorpay orders after provider call started

### AF-N06 — Malformed failed-payment identity reaches persistence

- **Current source/test entry points:** src/app/api/webhooks/razorpay/payment-failed.test.ts; src/app/api/webhooks/razorpay/route.ts.
- **Fresh row-specific tests:** src/app/api/webhooks/razorpay/payment-failed.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh failed-payment tests pass. Verify malformed payment/order identity is rejected before persistence; signed callback fixtures only.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 8e0dc71a13a02b723a7b5ccd94829f1ef827d70b fix: validate financial webhook states before replay acknowledgement

### AF-N07 — Older failure overwrites newer authorization

- **Current source/test entry points:** src/app/api/webhooks/razorpay/payment-attempt-order.test.ts; src/app/api/webhooks/razorpay/route.ts.
- **Fresh row-specific tests:** src/app/api/webhooks/razorpay/payment-attempt-order.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh ordering tests pass. Execute real PostgreSQL concurrency/out-of-order event tests and confirm late failure cannot overwrite newer authorized/captured state.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** f6df66e39a7722fcb4de0f189dfe9307be18fb7f test(webhooks): protect newer authorized and captured payment attempts

### AF-N08 — Multibyte job credential crashes timing-safe comparison

- **Current source/test entry points:** src/app/api/jobs/notifications/route.ts; src/app/api/jobs/notifications/route.test.ts.
- **Fresh row-specific tests:** src/app/api/jobs/notifications/route.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh notification route tests pass including credential handling. Verify equal byte lengths before timingSafeEqual on Unicode/empty/wrong credentials and no secret logging; do not activate worker delivery.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 1f7bfef6615b68afe67becef0df5c71bad253d24 fix(ops): isolate authenticated security ledger retention

### AF-N09 — Gallery publish HTTP500 exposes raw exception text

- **Current source/test entry points:** src/app/api/admin/media/curated-gallery/publish/route.ts; src/app/api/admin/media/curated-gallery/publish/error-boundary.test.ts.
- **Fresh row-specific tests:** src/app/api/admin/media/curated-gallery/publish/error-boundary.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh publish error-boundary tests pass. Inject provider/DB exceptions and check generic client response plus bounded private logging, while preserving authorization.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 61e160857b12a04aa31a2c98b2c679bc8849f3f9 fix(gallery): bound authenticated publication ingress and retry interrupted streams safely

### AF-N11 — Scrypt work-factor tests exercise malformed fixtures

- **Current source/test entry points:** src/lib/password.ts; src/lib/password-work-factors.test.ts.
- **Fresh row-specific tests:** src/lib/password-work-factors.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh real work-factor tests pass. Document malformed fixture correction, verify intended valid scrypt path/work limits and maximum runtime; no production password dump.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** bb2a1bef5988effc387b53fc2231d6be1b0bff71 fix(auth): enforce bounded modern and legacy scrypt credentials (#345)

### AF-N12 — Private-record tests mock critical security helpers

- **Current source/test entry points:** src/lib/private-record-response.ts; src/lib/private-record-response.test.ts.
- **Fresh row-specific tests:** src/lib/private-record-response.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh private-record parsing tests pass. Identify originally mocked critical helpers and rerun route integration with real authorization/security primitives and synthetic records; helper-only test cannot certify routes.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 5a5bdd3dd7ef399cf947890376ce9245f1ccb721 fix(donation): validate private acknowledgements before rendering (#365)

### AF-N15 — Public helpers bypassed readiness-only public/private bucket separation

- **Current source/test entry points:** src/lib/storage.ts; src/lib/storage-boundaries.test.ts; src/lib/public-media-storage.test.ts.
- **Fresh row-specific tests:** src/lib/storage-boundaries.test.ts; src/lib/public-media-storage.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Runtime public storage rejects same public/private bucket at lines61–62; focused tests pass. Exercise every upload/read/delete path and privately verify deployed distinct buckets; no public data publication.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 4faacca358ff1f0a29d8e415112d6c6d71a79755 fix(media): bound S3 GetObject acquisition before streaming (#354)

### AF-N16 — Invalid public delivery URL could be rejected after S3 upload; credentials/query/fragments accepted

- **Current source/test entry points:** src/lib/storage.ts; src/lib/public-media-storage.test.ts.
- **Fresh row-specific tests:** src/lib/public-media-storage.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** HTTPS delivery URL rejects credentials/query/fragments before upload; focused tests pass. Assert zero S3 call on invalid base URL and proper encoding for valid object keys.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 4faacca358ff1f0a29d8e415112d6c6d71a79755 fix(media): bound S3 GetObject acquisition before streaming (#354)

### AF-N17 — Public media publication database lookup escaped the route error handler

- **Current source/test entry points:** src/app/api/admin/media/curated-gallery/publish/error-boundary.test.ts; src/app/api/admin/media/curated-gallery/publish/route.ts.
- **Fresh row-specific tests:** src/app/api/admin/media/curated-gallery/publish/error-boundary.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh error-boundary tests pass. Force publication lookup failure inside route and verify sanitized response/status with no uncaught rejection or private details.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** a285d72cf83bc00252044f7039b5261b52b38aec test(security): cover malformed JSON and cross-origin curated publication

### AF-N18 — Public object reads were unbounded and did not reject truncated bodies

- **Current source/test entry points:** src/lib/storage.ts; src/lib/public-media-storage.test.ts.
- **Fresh row-specific tests:** src/lib/public-media-storage.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Bounded public reads, content-length validation, timeout and oversized streamed chunk guards found; focused tests pass. Verify truncated declared bodies, async stream cancellation and upstream cleanup with deterministic fixtures.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 4faacca358ff1f0a29d8e415112d6c6d71a79755 fix(media): bound S3 GetObject acquisition before streaming (#354)

### AF-N21 — Generated artwork bypassed the prebuild-only image weight check

- **Current source/test entry points:** package.json; scripts/check-public-image-weight.mjs; scripts/test-public-image-weight.mjs.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** postbuild runs public image weight check after generated artwork. Rerun clean build plus deliberate overweight generated-output test and unchanged approved asset exceptions.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** cab0d8e86b501e0580feca7ceacf26592600e4e1 perf(validation): tree shake patched gallery contract before client bundling

### AF-N23 — Malformed private record JSON and prototype-derived labels reach client rendering

- **Current source/test entry points:** src/lib/private-record-response.ts; src/lib/private-record-response.test.ts.
- **Fresh row-specific tests:** src/lib/private-record-response.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh parse tests pass. Exercise malformed JSON, arrays/null, prototype-derived keys and untrusted labels through actual private route/client boundary with synthetic records and zero PII logging.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 5a5bdd3dd7ef399cf947890376ce9245f1ccb721 fix(donation): validate private acknowledgements before rendering (#365)

### AF-N24 — Late acknowledgement JSON completion updates disposed effect state

- **Current source/test entry points:** src/components/donation-acknowledgement-client.tsx; src/lib/private-donation-ack.test.ts.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Verify deferred response.json completion after unmount/abort cannot update disposed state; test successful, malformed and failed late responses using controlled promises.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 5a5bdd3dd7ef399cf947890376ce9245f1ccb721 fix(donation): validate private acknowledgements before rendering (#365)

### AF-N19 — Origin guard trusts unconfigured Host or malformed origin

- **Current source/test entry points:** src/lib/request-security.ts; src/lib/request-security.test.ts.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Origin/Host contract exists. Retest malformed Origin, null, multiple origins, attacker Host, forwarded headers and configured canonical aliases against actual API guards; settings remain unchanged.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 5270fa3ae2b8395378fbed4c897cf76ef10a6938 merge: preserve receipt and tracking quotas on current main

### AF-N20 — Gallery selection follows array index and loses modal cleanup on collection change

- **Current source/test entry points:** src/components/campaign-media-gallery.tsx; src/lib/gallery-selection.ts; src/lib/gallery-selection.test.ts; src/components/campaign-gallery-focus.test.tsx; e2e/campaign-gallery.spec.mjs.
- **Fresh row-specific tests:** src/lib/gallery-selection.test.ts; src/components/campaign-gallery-focus.test.tsx
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Focused selection/focus tests pass; source keys selection by stable ID. Browser verify reorder/remove/reinsert/empty/open/reopen cleanup, scroll unlock and focus restoration before narrow closure.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** a25e3406e699239b771afd8b779328818f1ea9b6 fix(a11y): preserve browser shortcuts and composition keys

### AF-FAQ — Accurate FAQ structured data for real verification questions

- **Current source/test entry points:** src/lib/verification-faq.ts; src/components/verification-faq.tsx; src/components/verification-faq.test.tsx.
- **Fresh row-specific tests:** src/components/verification-faq.test.tsx
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh5 FAQ tests pass; PR425 merged96aeeae0. Need current live five disclosure/schema parity and editorial evidence. Provisional tax wording conflicts with pending audit instruction: obtain owner/CA reconciliation before claiming every answer factually closed.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** cf9ba61132eae2ffd7b8eb96d004086fdaee7d95 feat(verification): publish archived reviewed FAQ with accessible native disclosures

### AF-ACK-TYPES — Uncertain/malformed donation order/confirm response and disposed callback duplicate-risk

- **Current source/test entry points:** src/components/donation-form.tsx; src/app/api/donations/order/route.test.ts; src/app/api/donations/confirm/route.test.ts; e2e/donation-order-recovery.spec.mjs.
- **Fresh row-specific tests:** src/app/api/donations/order/route.test.ts; src/app/api/donations/confirm/route.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh API tests pass. Prove malformed/unknown responses never falsely confirm or invite duplicate payment; include disposed callback/remount races in isolated browser and DB idempotency acceptance.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 851cea60e805199805e4abcf8e9a3f784f605ee3 feat(AF-R083): in-page reviewed appeal checkout and safe INR presets (#360)

### AF-INTAKE-UNCERTAIN — Uncertain assistance save/cleanup can encourage duplicate request retry

- **Current source/test entry points:** src/components/assistance-form.tsx; src/lib/assistance.ts; src/lib/assistance.test.ts; e2e/assistance-submit-recovery.spec.mjs.
- **Fresh row-specific tests:** src/lib/assistance.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh assistance library tests pass. Simulate saved-but-response-lost request, cleanup failure, abort/retry/remount; preserve safe uncertain state and tracking reference without duplicate case or private document leak.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** ca5454baf016bc68d9cb33f44c4f3268da9f3285 fix(assistance): reject invalid evidence locally before upload (#363)

### AF-FUNDING-MATH — Malformed/expired/near-goal fundraising states mislead eligibility/progress/refund reopening

- **Current source/test entry points:** src/lib/donation-checkout-balance.ts; src/lib/donation-checkout-balance.test.ts; src/lib/donations.ts; src/lib/donations.test.ts.
- **Fresh row-specific tests:** src/lib/donation-checkout-balance.test.ts
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Fresh checkout-balance tests pass. Validate malformed/expired/near-goal/refund cases and real DB concurrency; ensure public progress and server eligibility agree without reopening expired appeals.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 6b20df4a29119efd0d7bfe9e8aa78b4e0859cef5 fix(donations): format checkout remaining value without rounding payable paise

### AF-PROMOTION — Highly sensitive identities enter public promotion or stale withdrawal caches

- **Current source/test entry points:** src/lib/media-governance.ts; src/lib/media-governance.test.ts; src/lib/public-gallery-projection.ts.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Audit all public promotion projections, sensitive identity exclusions and withdrawal/cache invalidation paths using synthetic records. Image redaction and named-case publication decisions remain distinct owner-led privacy gates.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** b63ba3a5e7ad6614d882fbca4a547df13b65c070 fix(media): reject ambiguous approval and deletion; bind reviewed versions (#369)

### AF-FIXTURE — Browser acceptance portfolio fixture omits required nullable preview projection

- **Current source/test entry points:** e2e/fixtures/browser-acceptance/portfolio/page.tsx.fixture.
- **Fresh row-specific tests:** No fresh row-specific test executed by this audit division; required checks below remain outstanding.
- **Completion bottleneck:** Unreconciled historical evidence: register does not map the original fix to current main, relevant executed acceptance, deployed identity and scoped live evidence.
- **Exact remaining verification:** Verify fixture nullable preview projection matches production select shape and exact-head full browser build succeeds. Narrow regression can close with fixture diff, failing-before evidence and current hosted browser acceptance; no production data mutation needed.
- **Deployment path:** Do not redeploy unchanged code for this row. Map source ancestry to production release; if a defect is reproduced, root prepares atomic test-first patch and protected release, then records matching Railway/public SHA.
- **History/stall evidence:** No row-specific explanation established. Old status text is evidence debt, not proof development was untouched or blocked by missing photos.
- **Latest mapped source commit:** 388f78082e62d1efed97f85651d3cbc410750fa7 Exclude browser acceptance fixtures from production source tree

## Block C — comprehensive61 partial-item breakdown

**Progress precision:** the old percentages are estimates, not measured fractions. Each item below states what current inspected source contains versus what remains. “No documented stall reason” is a provenance finding, not an excuse or a claim that research was completed. The completion steps are executable work packages; source tests alone cannot substitute for the listed manual/external gates.

### AF-R005 — Public-prefixed media credential names

- **Done/current source:** Server-only PUBLIC_MEDIA_* storage names and explicit client secret scanner exist; PUBLIC_ is not Next.js automatic exposure (NEXT_PUBLIC_ is).
- **Pending:** Map every credential consumer, scan built client with canary/real-value redacted matching, inspect historical exposure/rotation evidence without printing secrets.
- **Specific blockers:** Security/provider evidence, not missing photographs; rotation only if exposure established.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Map every credential consumer, scan built client with canary/real-value redacted matching, inspect historical exposure/rotation evidence without printing secrets. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/lib/storage.ts; src/lib/env.ts; scripts/check-client-secret-boundary.mjs.

### AF-R012 — Complete anonymous admin/API access audit

- **Done/current source:** Protected admin layout/actions, auth/session/rate-limit helpers and private API tests exist.
- **Pending:** Enumerate every admin page/action/API and negative-test anonymous, expired, wrong-role and cross-record access; verify live unauthenticated denial without donor access.
- **Specific blockers:** Complete route matrix and fresh isolated/runtime evidence absent from master ledger.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Enumerate every admin page/action/API and negative-test anonymous, expired, wrong-role and cross-record access; verify live unauthenticated denial without donor access. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/app/admin/(protected)/layout.tsx; src/lib/auth.ts; src/app/api/private-record-access.test.ts; src/app/api/admin/media/curated-gallery/authorization.test.ts.

### AF-R014 — CSP unsafe-inline script allowance

- **Done/current source:** Current enforced CSP explicitly retains script-src unsafe-inline and Razorpay checkout origin.
- **Pending:** Design nonce/hash policy compatible with Next.js and checkout, report-only evaluation, isolated browser validation, approved rollout and live headers.
- **Specific blockers:** High-risk CSP/checkout compatibility; owner approval does not replace provider acceptance.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Design nonce/hash policy compatible with Next.js and checkout, report-only evaluation, isolated browser validation, approved rollout and live headers. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** next.config.ts; e2e/security-headers.spec.mjs.

### AF-R017 — CSP report-only rollout and enforced-payment acceptance

- **Done/current source:** Enforced CSP/security headers and browser checks exist; no completed report-only-to-enforcement operational evidence established.
- **Pending:** Inventory violations, add bounded reporting plan, test normal/error/3DS checkout routes without real charges, enforce only after compatibility acceptance.
- **Specific blockers:** Provider/security rollout and real operational evidence.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Inventory violations, add bounded reporting plan, test normal/error/3DS checkout routes without real charges, enforce only after compatibility acceptance. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** next.config.ts; e2e/security-headers.spec.mjs.

### AF-R019 — Governance/muted/gold text contrast outside corrected surfaces; Policy labels/aside contrast tokens; Captions and appeal text contrast; Impact/Contact/initiative supporting-text contrast; Dark admin-sidebar eyebrow contrast; Remaining gold-on-light text contrast

- **Done/current source:** Canonical gold-ink/muted tokens and targeted contrast regression scripts are present across corrected surfaces.
- **Pending:** Compute rendered foreground/background contrast across remaining routes/states, correct actual failures, verify 4.5:1 text and 3:1 controls on mobile/desktop.
- **Specific blockers:** Full rendered contrast matrix missing; existing source tests are narrower than whole-item scope.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Compute rendered foreground/background contrast across remaining routes/states, correct actual failures, verify 4.5:1 text and 3:1 controls on mobile/desktop. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** scripts/test-audited-muted-contrast.mjs; scripts/test-admin-eyebrow-contrast.mjs; src/app/accessibility.css; src/app/canonical-content.css.

### AF-R024 — Sub-12px text declarations

- **Done/current source:** Typography contracts and audited component styles exist; no full minimum-font certification established.
- **Pending:** Inventory computed text sizes by route/viewport, assess zoom and text reflow, correct genuine readability defects; do not blindly turn every small label into body text.
- **Specific blockers:** Measured rendered inventory and design acceptance.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Inventory computed text sizes by route/viewport, assess zoom and text reflow, correct genuine readability defects; do not blindly turn every small label into body text. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/lib/typography-contract.test.ts; src/app/accessibility.css.

### AF-R025 — Overly tight multiline heading line heights

- **Done/current source:** Shared heading styles and typography contracts exist.
- **Pending:** Inspect multiline headings at narrow widths/200–400% zoom, identify clipping/overlap, adjust only offending line-height rules and add geometry regression.
- **Specific blockers:** Actual affected routes and rendered evidence must be established.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Inspect multiline headings at narrow widths/200–400% zoom, identify clipping/overlap, adjust only offending line-height rules and add geometry regression. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/lib/typography-contract.test.ts; src/app/page-hero.css; src/app/experience-finish.css.

### AF-R042 — Real screen-reader/keyboard/200%-zoom acceptance

- **Done/current source:** Released keyboard/focus/carousel lifecycle subscopes are documented; #431 adds rendered current-page semantics regression and browser candidate.
- **Pending:** Run real TalkBack/VoiceOver/NVDA critical journeys and 200/400% zoom; include forms, dialogs, menu, carousels and payment handoff; repair failures and retain manual evidence.
- **Specific blockers:** Physical/assistive-device evidence cannot be supplied by scraping; synthetic tests do not close it.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Run real TalkBack/VoiceOver/NVDA critical journeys and 200/400% zoom; include forms, dialogs, menu, carousels and payment handoff; repair failures and retain manual evidence. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** e2e/site-chrome-footer.spec.mjs; src/components/site-header-focus.test.tsx; src/components/campaign-gallery-focus.test.tsx; src/components/scroll-carousel-interaction.test.tsx.

### AF-R047 — Missing per-route bundle analysis

- **Done/current source:** Route-bundle reporter and Node contract tests exist; explicit fallback correctly refuses per-route attribution when Next manifest is unavailable.
- **Pending:** Obtain actual route resources from manifest or browser network traces, record compressed per-route JS/CSS, identify worst contributors, verify changes against unchanged caps.
- **Specific blockers:** Next16 build attribution gap plus actual transferred-byte measurements.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Obtain actual route resources from manifest or browser network traces, record compressed per-route JS/CSS, identify worst contributors, verify changes against unchanged caps. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** scripts/report-route-bundles.mjs; scripts/test-route-bundle-report.mjs.

### AF-R049 — Unproven Companion/motion hydration bottleneck

- **Done/current source:** SiteMotion, Lenis and Islamic Companion remain in root layout; a bottleneck is explicitly unproven.
- **Pending:** Profile hydration/long tasks on representative throttled mobile, compare isolated motion/Companion contribution without redesign, fix only measured causes.
- **Specific blockers:** Performance traces absent; no established code defect.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Profile hydration/long tasks on representative throttled mobile, compare isolated motion/Companion contribution without redesign, fix only measured causes. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/app/layout.tsx; src/components/site-motion.tsx; src/components/islamic-companion.tsx.

### AF-R052 — Remaining raw image elements

- **Done/current source:** PR373 shipped an image sub-scope; CampaignMediaGallery optimizes local /media/ and /brand/ while retaining native external-image fallback.
- **Pending:** Inventory remaining img elements with route/media provenance, verify optimizer eligibility, dimensions and alt, test real affected routes and privacy approval.
- **Specific blockers:** Some raw elements are deliberate fallbacks; blanket replacement and photo republication are not justified.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Inventory remaining img elements with route/media provenance, verify optimizer eligibility, dimensions and alt, test real affected routes and privacy approval. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/components/campaign-media-gallery.tsx; src/components/campaign-media-gallery-optimization.test.tsx; src/lib/public-image-dimensions.ts.

### AF-R053 — Oversized WebP assets/mobile variants

- **Done/current source:** Public-image weight build check and responsive sizes/deviceSizes configuration exist.
- **Pending:** List current image weights by rendered viewport, generate reviewed derivatives only for proven oversized assets, preserve originals/redaction decisions, verify visual/LCP results.
- **Specific blockers:** Approved derivatives/provenance plus mobile network measurements.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** List current image weights by rendered viewport, generate reviewed derivatives only for proven oversized assets, preserve originals/redaction decisions, verify visual/LCP results. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** scripts/check-public-image-weight.mjs; next.config.ts; src/lib/public-image-dimensions.ts.

### AF-R054 — Hero preload/priority/sizes consistency

- **Done/current source:** Next Image usage, dimensions and priority props exist in heroes/media components.
- **Pending:** Audit actual LCP element per representative route, eliminate duplicate/preloading wrong image, verify sizes/network priority at mobile/desktop.
- **Specific blockers:** Route-specific waterfall/LCP measurement, not architecture ambiguity.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Audit actual LCP element per representative route, eliminate duplicate/preloading wrong image, verify sizes/network priority at mobile/desktop. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/components/public-media.tsx; src/components/page-hero.tsx; src/components/scroll-carousel.tsx.

### AF-R056 — Missing ingestion blur/LQIP placeholders

- **Done/current source:** Intrinsic dimensions and source media governance exist; no general approved ingestion LQIP contract found in inspected inventory.
- **Pending:** Define non-sensitive derivative metadata, produce placeholder for eligible photos, test ingestion/read projection and ensure placeholder never bypasses consent.
- **Specific blockers:** Media derivative contract and privacy review; do not invent imagery.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define non-sensitive derivative metadata, produce placeholder for eligible photos, test ingestion/read projection and ensure placeholder never bypasses consent. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/lib/public-image-dimensions.ts; src/lib/media-governance.ts; src/app/api/admin/media/curated-gallery/publish/route.ts.

### AF-R057 — Too many stylesheets loaded globally; Route styles are not fully isolated

- **Done/current source:** Root imports many global layers; #411 reduced compiled CSS330396→325344 and later release preserved budget.
- **Pending:** Measure route CSS coverage, isolate only verified unnecessary layers, preserve cascade and compare affected routes/zoom/reduced-motion snapshots.
- **Specific blockers:** No route-level coverage evidence; aggregate savings do not establish isolation.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Measure route CSS coverage, isolate only verified unnecessary layers, preserve cascade and compare affected routes/zoom/reduced-motion snapshots. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/app/layout.tsx; src/app/experience-finish.css; src/app/accessibility.css.

### AF-R060 — Stacked duplicate donation stylesheet revisions; Appended reconciliation/override stylesheets

- **Done/current source:** Donation route has scoped audited CSS plus historical global reconciliation layers.
- **Pending:** Build selector/cascade inventory of donation styles, remove measured dead/duplicate rules as a coherent batch, test normal/error/focus/payment states and payload.
- **Specific blockers:** Cascade dependency mapping and rendered parity, not permission to redesign checkout.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Build selector/cascade inventory of donation styles, remove measured dead/duplicate rules as a coherent batch, test normal/error/focus/payment states and payload. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/app/donate/donate-audit.module.css; src/components/donation-form.module.css; src/app/layout.tsx.

### AF-R061 — Hard-coded colors outside canonical tokens

- **Done/current source:** Brand tokens exist, while hard-coded colors remain in route/component CSS and intentional inline static legacy page styles.
- **Pending:** Classify semantic vs artwork exceptions, replace only equivalent repeated UI values, verify contrast/visual parity and prevent regression in governed scope.
- **Specific blockers:** Token semantics and visual proof; global search-replace would change appearance.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Classify semantic vs artwork exceptions, replace only equivalent repeated UI values, verify contrast/visual parity and prevent regression in governed scope. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/app/brand.css; src/components/participation-card.module.css; src/app/get-involved/legacy-giving/page.tsx.

### AF-R063 — Competing button/card/section/media systems

- **Done/current source:** Shared PageHero, SectionHeading, participation cards/carousel modules exist alongside older v2/global systems.
- **Pending:** Inventory route families and competing selectors, consolidate one verified component family at a time with dimensions/accessibility/visual parity and measured payload.
- **Specific blockers:** Cross-route cascade/behavior risk; needs bounded component scope.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Inventory route families and competing selectors, consolidate one verified component family at a time with dimensions/accessibility/visual parity and measured payload. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/components/page-hero.tsx; src/components/section-heading.tsx; src/components/participation-card.tsx; src/app/experience-finish.css.

### AF-R065 — Missing Prettier formatting and check gate

- **Done/current source:** ESLint/TypeScript gates exist; no Prettier dependency/script in current package manifest inspected.
- **Pending:** Decide minimal formatting scope, pin formatter if warranted, baseline check only selected maintained files, avoid repository-wide churn and revalidate.
- **Specific blockers:** Tooling scope decision; formatting alone is not substantive feature closure.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Decide minimal formatting scope, pin formatter if warranted, baseline check only selected maintained files, avoid repository-wide churn and revalidate. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** package.json; eslint.config.mjs.

### AF-R066 — Incomplete Stylelint design-token/duplicate-selector governance

- **Done/current source:** Stylelint config checks color-no-hex and duplicate selectors; package lint applies it only to donate-audit.module.css.
- **Pending:** Expand one reviewed component family after fixing existing violations, enforce token/duplicate policy with exceptions for approved art, demonstrate useful fail-first fixture.
- **Specific blockers:** Governance coverage limited; broad activation would produce churn without behavior benefit.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Expand one reviewed component family after fixing existing violations, enforce token/duplicate policy with exceptions for approved art, demonstrate useful fail-first fixture. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** stylelint.config.mjs; package.json; src/app/donate/donate-audit.module.css.

### AF-R067 — Global CSS <=60KB target not achieved

- **Done/current source:** Hard aggregate CSS cap348160 bytes exists; recorded recent compiled CSS325561 exceeds historical60KB goal.
- **Pending:** Clarify raw/compressed/global/per-route denominator, measure baseline and route delivery, reduce dead globals without weakening approved cap or cascade.
- **Specific blockers:** 60KB target is not achieved; denominator and measured route scope needed.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Clarify raw/compressed/global/per-route denominator, measure baseline and route delivery, reduce dead globals without weakening approved cap or cascade. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** .github/workflows/ci.yml; src/app/layout.tsx; scripts/report-route-bundles.mjs.

### AF-R069 — Strict accessibility/import-cycle lint coverage gaps

- **Done/current source:** Next core-web-vitals/TypeScript ESLint presets and targeted no-console rules are configured.
- **Pending:** Inventory effective accessibility rules and import cycles; add minimal explicit rules with known-positive/negative fixtures and resolve actual violations.
- **Specific blockers:** Coverage proof missing; package presence alone does not certify complete lint policy.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Inventory effective accessibility rules and import cycles; add minimal explicit rules with known-positive/negative fixtures and resolve actual violations. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** eslint.config.mjs; package.json.

### AF-R071 — Missing route skeletons

- **Done/current source:** Client navigation indicator with Escape/pagehide/15s recovery exists; #430 non-Element guard is released. Historical ledger incorrectly still names #375 open.
- **Pending:** Update stale ledger from actual Git history; verify expected loading/status behavior and focus/scroll recovery live on representative routes. Do not revive rejected streaming loaders.
- **Specific blockers:** Documentation staleness and remaining field UX evidence, not missing source implementation.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Update stale ledger from actual Git history; verify expected loading/status behavior and focus/scroll recovery live on representative routes. Do not revive rejected streaming loaders. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/components/navigation-progress.tsx; src/components/navigation-progress.test.tsx; src/app/loading-experience.css.

### AF-R074 — Missing verified registry link/entity enrichment

- **Done/current source:** Organization/NGO structured data contains local identity, canonical contact and owned social links.
- **Pending:** Verify exact current registry URLs/IDs from authoritative registry, enrich only confirmed entity data, validate rendered structured-data parity.
- **Specific blockers:** External registry evidence and current entity review.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Verify exact current registry URLs/IDs from authoritative registry, enrich only confirmed entity data, validate rendered structured-data parity. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** src/components/structured-data.tsx; src/lib/structured-data.ts; src/app/compliance/page.tsx.

### AF-R077 — Missing real-user Web Vitals attribution

- **Done/current source:** Opt-in 10% sampled LCP/INP/CLS reporter, route privacy normalization, bounded ingestion and daily aggregation exist.
- **Pending:** Verify production opt-in without disclosing variables, test receipt/rate bounds and route attribution, collect sufficient real traffic, report p75 using available data honestly.
- **Specific blockers:** Production flag/data coverage unknown; bots/CI measurements are excluded by design.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Verify production opt-in without disclosing variables, test receipt/rate bounds and route attribution, collect sufficient real traffic, report p75 using available data honestly. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** src/components/web-vitals.tsx; src/lib/web-vitals-ingestion.ts; src/app/api/analytics/web-vitals/route.ts; prisma/schema.prisma.

### AF-R081 — Complete truthful build/type/performance release gates

- **Done/current source:** CI contains lint/type/unit/database/build/browser/secret-boundary/payload gates and guarded promotion.
- **Pending:** Map current head to required checks, ensure failures remain fail-closed, match release SHA and live identity; close only explicit gate scope and keep performance targets distinct.
- **Specific blockers:** Register lacks evidence mapping; some real-device/performance objectives are outside automated CI.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Map current head to required checks, ensure failures remain fail-closed, match release SHA and live identity; close only explicit gate scope and keep performance targets distinct. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** .github/workflows/ci.yml; scripts/check-client-secret-boundary.mjs; scripts/check-launch-readiness.mjs.

### AF-R082 — Preview noindex/redirect and current search-index acceptance

- **Done/current source:** Indexing helper, robots, canonical metadata and sitemap privacy controls exist; production was indexed by prior owner direction.
- **Pending:** Verify current production/preview robots and X-Robots headers, redirects/canonicals, inspect current GSC index status with account evidence and submitted URLs.
- **Specific blockers:** Search-console/provider access and latest live crawl evidence.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Verify current production/preview robots and X-Robots headers, redirects/canonicals, inspect current GSC index status with account evidence and submitted URLs. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** src/app/robots.ts; src/lib/site-indexing.ts; src/app/sitemap.ts; src/lib/sitemap-privacy.ts.

### AF-R084 — Expanded donation intentions beyond current supported set

- **Done/current source:** Server-supported intent set is GENERAL/SADAQAH/ZAKAT; Zakat requires explicit reviewed eligibility.
- **Pending:** Define each additional intention, fund accounting/religious rules and eligibility; test server/client parity; publish only approved categories.
- **Specific blockers:** Reviewed financial/religious policy and allocation authority; research cannot approve rulings.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define each additional intention, fund accounting/religious rules and eligibility; test server/client parity; publish only approved categories. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** src/lib/donation-intent.ts; src/app/api/donations/order/route.ts; src/app/api/donations/direct-transfer/route.ts.

### AF-R085 — Monthly recurring donations

- **Done/current source:** Monthly-giving page implements manual calendar reminders and explicitly no active subscription/automatic charge.
- **Pending:** For true recurring payments: provider mandate design, consent/cancellation/retry/reconciliation plan and isolated testing before any activation.
- **Specific blockers:** Provider mandate/legal/finance scope; reminder implementation is not recurring billing.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** For true recurring payments: provider mandate design, consent/cancellation/retry/reconciliation plan and isolated testing before any activation. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** src/app/get-involved/monthly-giving/page.tsx; src/components/monthly-giving-reminder.tsx; src/app/api/giving-reminder/route.ts.

### AF-R087 — Persistent verified-impact trust bar

- **Done/current source:** Current public chrome contains reminder/live rail and documented impact surfaces.
- **Pending:** Define approved persistent trust-bar claims and exact placement, derive facts from canonical source, test mobile safe areas/focus/CLS and avoid duplicate overlays.
- **Specific blockers:** Reviewed content and layout acceptance; live appeal rail is not proof of full trust-bar scope.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define approved persistent trust-bar claims and exact placement, derive facts from canonical source, test mobile safe areas/focus/CLS and avoid duplicate overlays. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/components/islamic-companion.tsx; src/app/layout.tsx; src/app/impact/page.tsx.

### AF-R088 — Zakat calculator with reviewed rules/data

- **Done/current source:** Reviewed Zakat intention/eligibility boundary exists; no dedicated calculator route/model found in reviewed source inventory.
- **Pending:** Obtain reviewed rules/rates/date/currency policy; implement pure calculations with vectors and explicit disclaimers, then accessible UI; keep money collection separate.
- **Specific blockers:** Religious/rate data review cannot be completed by arbitrary scraping.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Obtain reviewed rules/rates/date/currency policy; implement pure calculations with vectors and explicit disclaimers, then accessible UI; keep money collection separate. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/lib/donation-intent.ts; src/app/donation-policy/page.tsx; src/lib/assistance.ts.

### AF-R089 — Hijri/event countdown expansion

- **Done/current source:** Islamic Companion and daily content helpers exist; manual dated/Friday calendar reminders shipped.
- **Pending:** Specify reviewed event/date source and Hyderabad convention, handle Hijri uncertainty/timezones, test boundaries and accessible countdown refresh.
- **Specific blockers:** Calendar/religious-data policy plus actual expanded UI scope.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Specify reviewed event/date source and Hyderabad convention, handle Hijri uncertainty/timezones, test boundaries and accessible countdown refresh. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** src/components/islamic-companion.tsx; src/lib/daily-companion.ts; src/lib/monthly-giving-reminder.ts.

### AF-R091 — Consent-based Shukr donor wall

- **Done/current source:** Donation anonymity preference exists; no dedicated public donor-wall model/route found in reviewed inventory.
- **Pending:** Design explicit opt-in/revocation and aggregation; verify donor ownership and public cache withdrawal before display; no donor identities from production for tests.
- **Specific blockers:** Purpose-specific consent/data privacy authority and approved public text.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Design explicit opt-in/revocation and aggregation; verify donor ownership and public cache withdrawal before display; no donor identities from production for tests. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** prisma/schema.prisma; src/app/donation-policy/page.tsx; src/lib/donations.ts.

### AF-R092 — Seasonal campaign goal/progress features

- **Done/current source:** Published appeals have verified goals, progress and expiry/refund math; annual programme metrics intentionally are not donation goals.
- **Pending:** Define seasonal campaign linkage/validity and canonical goal inputs, distinguish distribution units from money, test concurrent capture/refund/expiry states.
- **Specific blockers:** Approved campaign goals and payment/accounting scope.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define seasonal campaign linkage/validity and canonical goal inputs, distinguish distribution units from money, test concurrent capture/refund/expiry states. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/lib/appeals.ts; src/lib/donation-checkout-balance.ts; src/lib/payment-processing.ts; src/components/published-edition-index.tsx.

### AF-R093 — Wasiyyah/legacy-giving page

- **Done/current source:** Static legacy-giving enquiry page exists, noindex, no commitment/payment/legal document collection, with safe boundary tests.
- **Pending:** Review editorial/legal/religious content, confirm governance contact process and live route/metadata; broader bequest acceptance remains separate.
- **Specific blockers:** Professional/policy acceptance; informational page does not implement a bequest product.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Review editorial/legal/religious content, confirm governance contact process and live route/metadata; broader bequest acceptance remains separate. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** src/app/get-involved/legacy-giving/page.tsx; src/app/get-involved/legacy-giving/page.test.tsx.

### AF-R094 — Islamic charity education content pipeline

- **Done/current source:** FaithContent data model, publication guards and public faith pages exist.
- **Pending:** Define reviewed author/reviewer/provenance pipeline, verify actual approved corpus and public/private status, test publication/withdrawal/cache behavior.
- **Specific blockers:** Reviewed religious content/provenance; AI or scraper output is not approval.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define reviewed author/reviewer/provenance pipeline, verify actual approved corpus and public/private status, test publication/withdrawal/cache behavior. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** prisma/schema.prisma; src/lib/faith-publication.ts; src/app/faith-and-reflections/page.tsx.

### AF-R095 — Live transparency/financial breakdown dashboard

- **Done/current source:** Transparency page and private payment/admin records exist; no dedicated complete live financial breakdown model/report found in reviewed inventory.
- **Pending:** Define approved aggregates/reconciliation periods and exclusions, test privacy/accuracy and stale states, publish only reconciled figures.
- **Specific blockers:** Audited financial dataset and governance approval; no invented totals.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define approved aggregates/reconciliation periods and exclusions, test privacy/accuracy and stale states, publish only reconciled figures. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/app/transparency/page.tsx; src/app/admin/(protected)/donations/page.tsx; prisma/schema.prisma.

### AF-N22 — One-year optimizer floor overrides managed media short source-cache policy

- **Done/current source:** Next image minimumCacheTTL is60, managed media owns short upstream headers, branded static assets retain long-cache policy.
- **Pending:** Current e2e/image-cache-policy.spec.mjs covers real short managed-source freshness and long-lived static-source caching; managed route test asserts max-age60/s-maxage300. Map current exact-head CI/ancestry, then verify live managed-media/optimizer headers, stale/error revalidation, existing-cache purge and consent withdrawal on reviewed synthetic data.
- **Specific blockers:** Nominal config correction is implemented. Historical ledger explicitly retains PARTIAL pending existing caches, stale/error revalidation, CDN purge and real consent-withdrawal acceptance; closure must not silently narrow that accepted scope.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Current e2e/image-cache-policy.spec.mjs covers real short managed-source freshness and long-lived static-source caching; managed route test asserts max-age60/s-maxage300. Map current exact-head CI/ancestry, then verify live managed-media/optimizer headers, stale/error revalidation, existing-cache purge and consent withdrawal on reviewed synthetic data. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** next.config.ts; src/lib/image-optimizer-config.test.ts; src/app/media/[year]/[filename]/route.ts; src/app/media/[year]/[filename]/route.test.ts; e2e/image-cache-policy.spec.mjs.

### AF-FUNDS — Approved fund registry and exactly-one donation designation

- **Done/current source:** Donation designation attaches to appeal and intent enum; no separate approved fund-registry model found in reviewed schema.
- **Pending:** Define fund registry and exactly-one designation invariant, approve additive schema/rollback, test every order/direct-transfer/admin/report path and migration rehearsal.
- **Specific blockers:** Finance/data model decisions and approved migration scope.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define fund registry and exactly-one designation invariant, approve additive schema/rollback, test every order/direct-transfer/admin/report path and migration rehearsal. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** prisma/schema.prisma; src/lib/donation-intent.ts; src/app/api/donations/order/route.ts.

### AF-ALLOCATION — Purpose-restricted disbursement/allocation ledger and maker-checker approval

- **Done/current source:** Appeal/donation/refund accounting exists; no dedicated disbursement/allocation ledger or maker-checker model found in reviewed schema.
- **Pending:** Approve restricted-fund schema/roles, implement append-only allocation transitions and maker≠checker invariants, test concurrency/audit/export in isolated DB.
- **Specific blockers:** Finance policy, role design, migration/rollback approval.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Approve restricted-fund schema/roles, implement append-only allocation transitions and maker≠checker invariants, test concurrency/audit/export in isolated DB. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** prisma/schema.prisma; src/lib/refund-accounting.ts; src/lib/payment-processing.ts.

### AF-DONOR — Donor identity, history, preferences, expiring receipts and data-rights requests

- **Done/current source:** Private expiring acknowledgement/tracking credentials exist; no full donor-profile/history/preferences portal model found.
- **Pending:** Define account vs passwordless ownership, scoped history/consent/retention rights; test cross-donor denial and revocation; migrate only approved minimum data.
- **Specific blockers:** Donor identity/data-rights architecture and reviewed purpose/retention.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define account vs passwordless ownership, scoped history/consent/retention rights; test cross-donor denial and revocation; migrate only approved minimum data. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/lib/private-donation-ack.ts; src/lib/private-tracking.ts; src/app/api/donations/acknowledgement/route.ts; prisma/schema.prisma.

### AF-RECEIPTS — PDF/download and secure recovery for normal donation acknowledgements

- **Done/current source:** Private ordinary acknowledgement route/API, expiry/token protections and recovery tests exist; no distinct PDF download implementation established.
- **Pending:** Inventory HTML/download capability, add PDF only within ordinary acknowledgement scope, test expiry/recovery/ownership/cache; explicitly avoid Form10BE implications.
- **Specific blockers:** Secure recovery and actual PDF scope plus operational email acceptance.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Inventory HTML/download capability, add PDF only within ordinary acknowledgement scope, test expiry/recovery/ownership/cache; explicitly avoid Form10BE implications. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/app/donations/[reference]/acknowledgement/page.tsx; src/app/api/donations/acknowledgement/route.ts; src/lib/private-donation-ack.ts.

### AF-SETTLEMENT — Provider-bank settlement and direct-transfer exception reconciliation

- **Done/current source:** Direct-transfer exact credited-amount/reference reconciliation and admin action tests exist; no complete provider-bank settlement ledger found.
- **Pending:** Define settlement IDs/fees/refunds/exception states, reconcile synthetic provider-bank fixtures, test idempotency/concurrency and authorized operator workflow.
- **Specific blockers:** Bank/provider evidence, finance policy and reviewed ledger design.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define settlement IDs/fees/refunds/exception states, reconcile synthetic provider-bank fixtures, test idempotency/concurrency and authorized operator workflow. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/lib/direct-donation-reconciliation.ts; src/app/admin/(protected)/donations/actions.ts; prisma/schema.prisma.

### AF-QR — Reviewed offline campaign/masjid QR attribution network

- **Done/current source:** Donation QR/config and campaign query-handling groundwork exist; no dedicated approved offline campaign/masjid network registry found.
- **Pending:** Define campaign attribution IDs, allowed QR destinations, expiry and review process; generate reviewed assets; test redirects and no private token reflection.
- **Specific blockers:** Actual approved network/locations/campaign assets and provider-safe attribution.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define campaign attribution IDs, allowed QR destinations, expiry and review process; generate reviewed assets; test redirects and no private token reflection. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/lib/env.ts; src/lib/public-navigation-query.mjs; src/app/donate/page.tsx.

### AF-SPONSOR — Anonymous Taleem and aid-unit inventory/reservation sponsorship

- **Done/current source:** Taleem sponsorship path/private enquiry builder exists and rejects malformed query input; no persisted anonymous inventory/reservation model found.
- **Pending:** Approve unit inventory/expiry/fund policy and anonymity scope; implement atomic reservation/release in isolated DB, then reviewed UI and race tests.
- **Specific blockers:** Approved costs/inventory and finance/privacy migration scope.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Approve unit inventory/expiry/fund policy and anonymity scope; implement atomic reservation/release in isolated DB, then reviewed UI and race tests. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/app/get-involved/sponsor-education/page.tsx; src/lib/sponsorship-enquiry.ts; src/components/sponsorship-enquiry.tsx; prisma/schema.prisma.

### AF-LOCAL — Service-zone assignment, urgency and reviewer SLA metrics

- **Done/current source:** AssistanceRequest review/status and private evidence workflow exist; dedicated zone/SLA assignment models not found in reviewed schema.
- **Pending:** Define permitted zones, urgency taxonomy/ownership and SLA events; implement scoped queue filters and metrics with RBAC and clock-boundary tests.
- **Specific blockers:** Operational policy/zone data and privacy-safe metrics scope.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define permitted zones, urgency taxonomy/ownership and SLA events; implement scoped queue filters and metrics with RBAC and clock-boundary tests. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** prisma/schema.prisma; src/app/admin/(protected)/page.tsx; src/app/admin/(protected)/requests/[id]/actions.ts.

### AF-VOLUNTEER — Consented volunteer/partner application and operations

- **Done/current source:** Private reviewed email-enquiry builder with skill/availability choices and browser regressions exists; no persisted volunteer operations model found.
- **Pending:** Define purpose-specific consent/retention, vetted roles, onboarding and withdrawal; implement only approved persisted operations and no sensitive public details.
- **Specific blockers:** Volunteer governance/data consent and operational ownership.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define purpose-specific consent/retention, vetted roles, onboarding and withdrawal; implement only approved persisted operations and no sensitive public details. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/app/get-involved/volunteer/page.tsx; src/lib/volunteer-enquiry.ts; src/components/volunteer-interest-builder.tsx; e2e/volunteer-enquiry.spec.mjs.

### AF-MILESTONES — Separate private/public reviewed and revocable case milestones

- **Done/current source:** AppealUpdate publication/withdrawal guards and public/private appeal evidence boundaries exist.
- **Pending:** Map full private/public milestone fields, role approvals and revocation; test stale cache/search/sitemap removal and API projections.
- **Specific blockers:** Current full-scope acceptance map and reviewed milestone content, not a need for invented stories.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Map full private/public milestone fields, role approvals and revocation; test stale cache/search/sitemap removal and API projections. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** prisma/schema.prisma; src/lib/appeal-update-publication.ts; src/app/admin/(protected)/appeals/actions.ts.

### AF-UNIT-COST — Cost-per-kit trend reporting from approved year/unit costs

- **Done/current source:** Approved annual programme metrics/index and impact comparison exist; no verified complete per-year cost ledger found.
- **Pending:** Obtain approved total costs and comparable unit definitions, calculate pure ratios without mixing years/units, test missing/zero/unknown cases and publish reviewed trends.
- **Specific blockers:** Audited cost inputs and units; scraping cannot invent historical costs.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Obtain approved total costs and comparable unit definitions, calculate pure ratios without mixing years/units, test missing/zero/unknown cases and publish reviewed trends. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/components/published-edition-index.tsx; src/lib/impact-comparison.ts; src/content/master-copy.json.

### AF-GIVING-PLANNER — Separate Ramadan/Friday/Dhul-Hijjah reminders from provider mandates

- **Done/current source:** Private monthly/Friday/one-date/up-to-ten-daily ICS reminder capability exists, no payment mandate or stored donor profile.
- **Pending:** Verify calendar timezone/month-end behavior and reviewed religious event presets separately, preserve reminder/mandate separation, test injection/download headers/live route.
- **Specific blockers:** Religious preset/date review plus real calendar-client acceptance.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Verify calendar timezone/month-end behavior and reviewed religious event presets separately, preserve reminder/mandate separation, test injection/download headers/live route. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** MEASURED_SOURCE_AND_ACCEPTANCE_RECONCILIATION
- **Inspected source:** src/lib/monthly-giving-reminder.ts; src/app/api/giving-reminder/route.ts; e2e/giving-planner-month-end.spec.mjs.

### AF-FUNNEL — Privacy-safe server-confirmed donation funnel and acquisition reporting

- **Done/current source:** Privacy-safe daily page-view and web-vitals ingestion exist; payment records server-confirm capture; no complete acquisition-to-capture funnel attribution model found.
- **Pending:** Define non-identifying event stages/retention, tie confirmed outcome safely, test spoof/retry/dedup/private-route exclusion and aggregate reporting.
- **Specific blockers:** Privacy consent/data minimization and truthful attribution requirements.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define non-identifying event stages/retention, tie confirmed outcome safely, test spoof/retry/dedup/private-route exclusion and aggregate reporting. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/lib/analytics-ingestion.ts; src/lib/public-analytics.ts; src/lib/payment-processing.ts; prisma/schema.prisma.

### AF-CONSENT — Purpose/channel consent, subject requests, retention and incident governance

- **Done/current source:** Assistance disclosure consent fields, publication guards, media consent and retention safety helpers exist.
- **Pending:** Inventory each purpose/channel and subject-rights process, incident response/retention schedules, test withdrawal propagation and access; preserve stricter face-redaction rule.
- **Specific blockers:** Reviewed data governance/legal policy and cross-system operational evidence.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Inventory each purpose/channel and subject-rights process, incident response/retention schedules, test withdrawal propagation and access; preserve stricter face-redaction rule. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** prisma/schema.prisma; src/lib/assistance.ts; src/lib/media-governance.ts; src/lib/retention-safety.ts.

### AF-CRM — Optional email stewardship, suppression and reviewed content workflow

- **Done/current source:** Notification queue/templates, admin delivery views and safe-disabled worker exist; no full stewardship campaign/suppression registry found.
- **Pending:** Define optional channel consent, suppression/unsubscribe/review state, idempotent sender and provider auth; test disabled-mode first, activate only separately authorized delivery.
- **Specific blockers:** Provider/email operational readiness, consent policy; #264 delivery remains unresolved.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define optional channel consent, suppression/unsubscribe/review state, idempotent sender and provider auth; test disabled-mode first, activate only separately authorized delivery. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/lib/notifications.ts; src/lib/notification-templates.ts; src/app/admin/(protected)/notifications/page.tsx; ops/notification-cron/run.mjs.

### AF-CSR — Reviewed corporate partnership/pledge page and proposal PDF

- **Done/current source:** Partner page presents approved partnership areas and mailto contact; no complete proposal PDF or pledge ledger found.
- **Pending:** Obtain trustee-reviewed CSR claims/evidence; create proposal PDF and scoped enquiry contract; verify accessibility, domestic funding/legal boundaries and contact handoff.
- **Specific blockers:** Approved institutional documents and governance claims, not a backend technical block alone.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Obtain trustee-reviewed CSR claims/evidence; create proposal PDF and scoped enquiry contract; verify accessibility, domestic funding/legal boundaries and contact handoff. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/app/partner/page.tsx; src/lib/master-copy.ts.

### AF-FEEDBACK — Voluntary testimonials/reviews and separate complaint handling

- **Done/current source:** Separate complaint/review intents and private mailto preparation exist with malformed-input/privacy tests.
- **Pending:** Define consent/review/publication/withdrawal workflow for testimonials and private complaint handling; test no accidental public disclosure or false submission claim.
- **Specific blockers:** Reviewed publication consent, operational complaint ownership and private retention.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define consent/review/publication/withdrawal workflow for testimonials and private complaint handling; test no accidental public disclosure or false submission claim. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/app/contact/feedback/page.tsx; src/lib/feedback-enquiry.ts; src/components/feedback-enquiry-builder.tsx; e2e/private-feedback-enquiry.spec.mjs.

### AF-SOCIAL — Owned social profiles, canonical safe cards and content approval

- **Done/current source:** Site footer and JSON-LD contain explicit social URLs; safe OG/social media helpers exist.
- **Pending:** Verify account ownership/current URLs and approvals; align JSON-LD/footer set where appropriate, validate real social previews and image provenance.
- **Specific blockers:** Owned-account evidence and content approval; link presence is not ownership proof.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Verify account ownership/current URLs and approvals; align JSON-LD/footer set where appropriate, validate real social previews and image provenance. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** src/components/site-footer.tsx; src/components/structured-data.tsx; src/lib/social-share-media.ts.

### AF-GBP — Eligible Google Business Profile with private home/address safeguards

- **Done/current source:** Public schema intentionally lists Hyderabad locality rather than private full home address; no external eligibility verification established here.
- **Pending:** Review service-area/home-business eligibility and owner verification evidence, inspect live profile visibility/contact parity; never fabricate a walk-in office.
- **Specific blockers:** External Google verification/eligibility and private address safeguards.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Review service-area/home-business eligibility and owner verification evidence, inspect live profile visibility/contact parity; never fabricate a walk-in office. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** src/components/structured-data.tsx; src/app/contact/page.tsx.

### AF-DARPAN — Current NGO Darpan record/entity/registry link consistency

- **Done/current source:** Directive records TS/2024/0403215; compliance/entity source exists.
- **Pending:** Verify exact current government registry record and official URL with owner documents, reconcile entity spelling/address/status, update safe public structured data only from evidence.
- **Specific blockers:** Authoritative registry access/current documentary parity.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Verify exact current government registry record and official URL with owner documents, reconcile entity spelling/address/status, update safe public structured data only from evidence. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** docs/AMAANA_ENGINEERING_DIRECTIVES_2026-10-20.md; src/app/compliance/page.tsx; src/components/structured-data.tsx.

### AF-BING — Bing/IndexNow ownership and publish/update/removal discovery

- **Done/current source:** Robots/sitemap/indexing controls exist; no dedicated IndexNow client/key route found in inspected inventory.
- **Pending:** Verify Bing ownership and approved key location, design bounded publish/update/removal queue, test canonical-only URLs and private exclusions before enabling.
- **Specific blockers:** External account ownership/IndexNow key and secure integration scope.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Verify Bing ownership and approved key location, design bounded publish/update/removal queue, test canonical-only URLs and private exclusions before enabling. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** UNFINISHED_IMPLEMENTATION_PLUS_APPROVED_SCOPE
- **Inspected source:** src/app/robots.ts; src/app/sitemap.ts; src/lib/site-indexing.ts.

### AF-EDITORIAL — Source-reviewed local SEO pillars and partner/internal link strategy

- **Done/current source:** Canonical master copy, editorial consistency scripts, stories/faith routes and public discovery helpers exist.
- **Pending:** Define approved local topic/source map and editorial review owner, verify internal canonical links and no beneficiary leakage, publish only reviewed articles and measure search outcomes.
- **Specific blockers:** Editorial/source approval and real search evidence; no proof that prior research was finished.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Define approved local topic/source map and editorial review owner, verify internal canonical links and no beneficiary leakage, publish only reviewed articles and measure search outcomes. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** src/lib/master-copy.ts; src/content/master-copy.json; scripts/check-public-editorial-consistency.mjs; src/lib/public-discovery-data.ts.

### AF-FACTS — Conflicting Eid2025 totals and Qurbani2025/2026 year/quantity claims

- **Done/current source:** Canonical factual locks/reviewed campaigns/master copy and editorial tests exist; owner-locked710/772/234 etc are controlling.
- **Pending:** Compare current DB projections/public render to locks for each disputed initiative/year, repair only evidenced mismatches and verify source→seed→DB→page parity.
- **Specific blockers:** Authoritative year/quantity evidence and database/public parity; tax-status conflict is separate and unresolved.
- **Why research/scraping/brainstorming stalled:** No per-item elapsed/stall cause recorded in reviewed register. Do not infer inactivity or blame; missing evidence and/or policy/provider gates are explicit above.
- **Step-by-step completion/test/release:** Compare current DB projections/public render to locks for each disputed initiative/year, repair only evidenced mismatches and verify source→seed→DB→page parity. → Reproduce/define precise acceptance in isolated synthetic fixtures; preserve approved scope and facts. → Implement only remaining approved delta with fail-first regressions; run targeted unit/integration/browser checks, TypeScript/lint and fixed payload budgets as relevant. → Publish an atomic PR on current ancestry; require exact-head full CI and separate ready-state promotion; merge under owner authorization. → Match Railway deployment and public SHA/readiness; perform item-specific live/manual/provider acceptance; attach evidence before changing full-item closure.
- **Gap category:** EXTERNAL_OR_MANUAL_ACCEPTANCE_PLUS_SOURCE_RECONCILIATION
- **Inspected source:** docs/canonical-factual-locks-2026-09-15.md; prisma/canonical-factual-locks.json; src/content/master-copy.json; scripts/check-public-editorial-consistency.mjs.

## Consolidated execution checkpoint

The initial #431 browser run finished1348 passed/1 flaky/1 failed. Its failing assertion still expected page on a parent-section link; the corrected test now verifies location+active on the detail route and page on exact Our Work. Companion response corrections, this audit and navigation work are consolidated into the existing #431 candidate by normal ancestry. Fresh combined2145 unit tests pass/15skip and13 native calendar/prayer tests pass; TypeScript/scoped ESLint/spec syntax/diff pass. A new full exact-head hosted run is required; no competing runtime PR or automatic merge of a failed head.

## Prepared AF-R010 / AF-R011 follow-up

The residual findings below are a historical audit snapshot. Subsequent source correction replaces the constant visual-fixture innerHTML with equivalent DOM construction and the hand-transpiled new Function loader with ordinary TypeScript contract tests launched through the pinned existing runner. Full2148 local units pass/15skip; TypeScript/scoped lint/spec parse/diff pass. Standalone verifier succeeds with string code generation disabled in its launcher; intentional invalid umbrella-count and locked-debt-figure mutations still reject and are restored. Full hosted/visual acceptance and merge remain pending; no whole-item closure or production vulnerability incident is claimed. The follow-up is stacked behind frozen4318dc4c0b7.

## Complete prayer-response boundary follow-up

Existing stacked433 also validates required current-day timings and labels before state updates, and treats invalid optional tomorrow/moon data as unavailable. Three request-integration regressions failed before correction; full2156 local unit tests pass/15skip, TypeScript/scoped lint/spec syntax/diff pass. Two isolated Chromium malformed-response cases pass on pinned1.55. Independent review confirms actual API compatibility and valid-current-day preservation. Hosted acceptance/release remains pending; no prayer/religious policy, calculation, public factual copy or provider change.

## Next iterations and closure rules

1. **Finish current public navigation release (#431).** Preserve exact source head while full hosted acceptance runs. Then run separate ready-state promotion, merge under expected-head guard and verify Railway/public identity plus nested navigation semantics. This closes the source defect, not all AF-R042 assistive-device acceptance.
2. **Companion response reliability.** Include prepared malformed-live-rail and unavailable-tomorrow-timing fixes with the failing/passing tests in existing #431; run full exact-head hosted/build/budget/browser gates; merge and verify shared chrome remains usable. No religious text, calculation policy, payment or auth changes.
3. **Measured quality and evidence closures.** Capture current live schema/link/image-cache behavior and route-level measurements where tooling supports them. Complete narrow evidence-ready rows first; do not claim route budgets where attribution is unavailable. Record physical-screen-reader/Android/400%-zoom gaps explicitly.
4. **Real missing feature packages.** Specify funds/allocation/settlement data contracts, donor privacy scopes, reservations and operational workflows before coding their missing pieces. Retain existing working manual enquiry journeys. Each product needs approved facts, migrations/rollback where applicable, authorization tests and operational acceptance.
5. **External prerequisites in parallel.** Prepare translation review pack, legal-status evidence checklist, provider eligibility matrices, domain inventory and religious/unit-cost decision sheets. Research produces options and evidence requests; it cannot certify absent signed facts.

For every row: reproduce/agree acceptance → implement missing source if any → relevant tests and negative cases → protected exact-head CI → guarded merge → matching Railway/public SHA when runtime changed → scope-specific acceptance → evidence-backed status transition. An unchanged already-shipped row may close by evidence reconciliation; a legal/provider/manual gap remains explicit. AF-N10 is completed only for build isolation. AF-ZAKAT-LOCK remains superseded and AF-CRYPTO remains not applicable.

## Report provenance and limitations

- Canonical source: docs/AMAANA_MASTER_RECONCILED_EXECUTION_PLAN.md Section7,149 rows.
- Source baseline inspected by divisions: d6d6fe07 (documentation-only descendant of deployed91b3631b).
- Open tracker audit: #264, #361, draft #374 and #431.
- Architecture26, quality59 and product61 artifacts were checked for unique IDs and exact equality with canonical classification sets before report generation.
- No invented reasons for prior delay, exact completion percentages, provider sign-offs, staged/live financial tests or whole-platform security/a11y claims.
- Latest owner instruction authorizes commits/merges/deployments. Existing safeguards and factual evidence requirements remain in force; no additional general merge approval request is needed.
