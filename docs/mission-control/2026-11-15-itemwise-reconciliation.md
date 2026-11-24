## 24 November 2026 IST — proposed AF-N13 advisory-only reconciliation

Current canonical register at `99ad35ea68aa4044f015a3e2df4ef3a6e3e21d38`: 59 Completed / 7 Implemented / 64 Partial / 17 Not started / 1 Superseded / 1 Not applicable = 149; 88 actionable. Derived active CSV was stale (24 Implemented, 71 Partial, 17 Not started = 112). Regenerate from canonical active rows and propose the one advisory-specific exclusion: 59 / 7 / 64 / 16 / 1 / 2 = 149; 87 actionable. No Completed credit added. Historical classifications and all other canonical rows unchanged.

Read-only queue guard: `node scripts/check-backlog-queue.mjs` validates exact derived active rows, order, counts and canonical structure; `node --test scripts/test-backlog-queue.mjs` checks the contract. Native Node 22.16.0: 3/3 tests passed, with two expected failures against a permissive baseline. Current main fails 88 expected versus 112 observed; proposed register and queue pass 149 total / 87 actionable. The unconditional CI `plan` job now executes both commands before calculating impact, including documentation-only and ready-state events. Native Node 22.16.0 rerun confirmed 3/3 against the exact committed Git blob hashes. Existing impact selection, test budgets and release gates remain unchanged. Hosted acceptance is outstanding.

Evidence: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) withdrawn 23 October 2026; [#759](https://github.com/immazhark/amaana-platform/pull/759) merged as `e25987dd2223bfa459e15a1f9f0b4d99760237a9`. Historical accepted note available at that merge SHA, not the current path. Current lockfile resolves braces 3.0.3 solely through dev-only lint dependencies; Dockerfile dev-prune and absence assertion unchanged. The current Railway Railpack runtime inventory is not independently established by that Dockerfile. No invented patched release, audit suppression, or blanket security clearance. AF-N14 unchanged. Reopen on new/reinstated actionable advisory, exposed untrusted patterns, production dependency, or isolated failure. Proposed until protected acceptance.

## 15 November 2026 IST — AF-R078 started-scope credit after #946 release

**Updated proposed totals: 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A =149; 112 actionable.** Original AF-R078 archiving is not fully done, but tested read-only local Markdown retention inventory is now merged via #946 `922a390c6a9763f1e7def2a0b7d84516bcc5a952` (CI 43647179334 and distinct ready-state 43658051915 SUCCESS). Move Not started → Partial only. No documents archived or deleted. Draft #947 tests reference-definition detection and remains unaccepted until release. Public source/runtime SHAs remain separate; no forced rollout.

## Fourth pass — AF-R072 accepted on real production HTML (15 November 2026 IST)

**Latest proposed PR #944 totals are now 35 Completed / 24 Implemented / 70 Partial / 18 Not started / 1 Superseded / 1 N/A = 149; 112 active.** AF-R072 moved from Partial to Completed only after PR #945's RED/green, distinct ready-state, guarded merge `33cb6ff5906832047858b2570ff9c2c361bb19ef`, Railway website SUCCESS and independent live public SHA/readiness and original HTML: actual `<meta name="description">` is **155 characters**. Source completion, deployment and HTML were established separately. AF-R043 forced dynamic homepage/TTFB remains Partial. The earlier second/third pass counts below are retained as historical proposals, not the latest status.

## Third evidence pass — already implemented Not started groundwork

**Latest proposed #944 totals:** 34 Completed / 24 Implemented / 71 Partial / 18 Not started / 1 Superseded / 1 Not applicable = 149; active 113. AF-R018 and AF-ATTESTATION are no longer mislabeled Not started: HSTS preload headers and server-only aggregate-digest tests respectively are in deployed source. Neither is complete: subdomain/preload approval and a real signed/provenanced report attestation are unverified. This is a source-only reclassification, NOT a live domain change or a claim that SHA256 alone proves tamper evidence.

## Per-item open blockers — second pass, 15 November 2026 IST

The proposed latest status is **34 Completed / 24 Implemented / 69 Partial / 20 Not started / 1 Superseded / 1 N/A = 149** (113 active). The earlier 27/31/65/24 first-pass snapshot in this document is retained below as dated evidence; it is no longer the latest proposal.

Every open original item now has a named missing condition and next executable task: [24 Implemented](2026-11-15-implemented-acceptance.md), [69 Partial](2026-11-15-partial-blockers.md), [20 Not started](2026-11-15-not-started-action-plan.md). Source proof and limits for 11 second-pass status changes are immediately below. These are evidence-based proposed classifications, not a claim that all 149 production journeys were independently accepted.

## Second evidence pass — 15 November 2026 IST

**Pending PR #944 after both passes: 34 Completed / 24 Implemented / 69 Partial / 20 Not started / 1 Superseded / 1 N/A = 149. Active actionable rows: 113.** These numbers are proposed until protected merge. Existing source and test blobs were checked for equality with last independently verified website commit `b2166d9a0a35f67a8e930cbc7f33f431172bf8f6` and CI `43637455449` passed; closure is limited to the original bounded issue, not broad payment, legal, physical accessibility or field performance claims.

### Seven more scoped closures (Implemented → Completed)

| ID | Verified original defect correction |
|---|---|
| AF-R032 | donation-form.tsx moves focus marker inside scheduled RAF, cancels pending frame in cleanup; scripts/test-donation-error-focus-race.mjs is required in CI; component blob matches deployed b2166d9 |
| AF-R041 | donation-form.tsx and direct-transfer-form.tsx use type=text inputMode=numeric with strict whole-INR validation; private verified monetary fields use text/inputMode=decimal; source blobs match deployed b2166d9 and amount/browser tests passed |
| AF-R070 | Reviewed CampaignMediaGallery exists on main, rendered conditionally in our-work/[slug]/page.tsx; selection/focus tests passed; gallery component and route blobs match deployed b2166d9. Scope is mistaken branch absence, not media-publication approval |
| AF-R086 | Root app/layout.tsx mounts SiteHeader on public pages; site-header.tsx includes desktop and mobile /donate navigation links and responsive CTA; both source blobs match deployed b2166d9 |
| AF-N01 | prisma/apply-master-content.mjs deduplicates existing and incoming (initiativeId,publicUrl) via existingAssetKeys Set; scripts/test-master-content-assets.mjs tests same-batch duplicates, stable first record and repeated imports; green hosted CI; source and tests match deployed b2166d9 |
| AF-N02 | prisma/apply-master-content.mjs stamps four bulk/raw SQL updates with UTC clock_timestamp updatedAt; scripts/test-master-content-assets.mjs contains controlled timestamp-stripping mutation; CI green; source/tests match deployed b2166d9 |
| AF-N20 | campaign-media-gallery.tsx tracks activeId rather than index with modal cleanup; gallery-selection.test.ts and campaign-gallery-focus.test.tsx verify order changes, focus restoration and unmount; all blobs match deployed b2166d9 and CI green |

### Four already-started scopes (Not started → Partial)

| ID | Work already present; what keeps it Partial |
|---|---|
| AF-R048 | Synthetic CDP/Playwright mobile profile exists (scripts/profile-public-mobile.mjs), but actual throttled-route acceptance and real-device/field Core Web Vitals are absent; run reproducible trace per route before target closure |
| AF-R068 | e2e/css-rule-coverage.spec.mjs measures sampled rule ranges; prior 3 Nov evidence exists; full unused CSS <10% on key routes remains unproved and requires route-specific pruning/coverage |
| AF-R079 | scripts/branch-retention-report.mjs and native synthetic tests exist, with documented read-only inventory. Complete current remote ancestry/open-PR/retention review and separately approved deletion are outstanding |
| AF-R080 | NGO/Organization/WebSite and guarded DonateAction JSON-LD exist in published source, but independent live entity/rich-result acceptance and Search Console review are still open |

No live payment or certificate action, protected infra modification, unreviewed public image publication, or branch deletion was performed. Other remaining rows retain their current class until its specific acceptance gap is closed.

# Reconciled 149-item register — 15 November 2026 IST

**Source main inspected:** `e4076e9b8a9985b6a8fb937ef08891535234c5d1`. **Last independently verified website runtime:** `b2166d9a0a35f67a8e930cbc7f33f431172bf8f6`, main/production, readiness=ready; docs/tests-only later source merges do not require a forced rollout. Sixteen critical source/test blobs were compared between current main and deployed runtime and were identical.

| Classification | 12 Nov | 15 Nov | Change |
|---|---:|---:|---:|
| Completed | 12 | **27** | +15 |
| Implemented | 48 | **31** | -17 |
| Partial | 63 | **65** | +2 |
| Not started | 24 | **24** | 0 |
| Superseded | 1 | **1** | 0 |
| Not applicable | 1 | **1** | 0 |
| **Total** | **149** | **149** | **0** |

The original `149-item-status-2026-11-12.csv` is immutable dated evidence. The latest `149-item-status-2026-11-15.csv` retains all 149 IDs, source history, individual issue scope, evidence and next action, plus a transparent per-item verification field. The derived active queue has **120** rows. The 12 previous Completed records remain unchanged.

## Exact current-source and test evidence behind 15 new scoped completions

| ID | Result | Evidence |
|---|---|---|
| AF-R006 | Implemented → Completed | storage.ts getMediaCredentialPair rejects missing half of dedicated media credential pair; storage-readiness.test.ts negative tests; current blob equals deployed b2166d9 |
| AF-R008 | Implemented → Completed | breadcrumb-structured-data.tsx and appeal-structured-data.tsx strict Zod; structured-data-runtime-boundary.test.tsx invalid/null/extra-field cases; PR #788 merged; blobs at deployed b2166d9 |
| AF-R016 | Implemented → Completed | next.config.ts img-src permits only self/blob/data and configured HTTPS origins, not scheme-wide https:; e2e/security-headers.spec.mjs verifies; production source equals current blob |
| AF-R027 | Implemented → Completed | assistance-form.tsx links individual inline errors through aria-describedby; e2e/donation-assistance-journeys.spec.mjs name/phone assertions; browser CI 43637455449 |
| AF-R028 | Implemented → Completed | assistance-form.tsx moves invalid focus after React error DOM commit; e2e/donation-assistance-journeys.spec.mjs checks linked element exists at focus; browser CI 43637455449 |
| AF-R029 | Implemented → Completed | donation-form.tsx preserves per-field native validation errors and aria-describedby; e2e/donation-assistance-journeys.spec.mjs invalid amount test without order call; browser CI 43637455449 |
| AF-R030 | Implemented → Completed | donation-form.tsx server-rejected field focus from fieldErrors; e2e/donation-assistance-journeys.spec.mjs mocked donorEmail error tests; browser CI 43637455449 |
| AF-R031 | Implemented → Completed | donation-form.tsx focusedErrorRef prevents repeated focus theft while correcting; e2e/donation-assistance-journeys.spec.mjs checks corrected email retains focus; browser CI 43637455449 |
| AF-R033 | Implemented → Completed | donation-form.tsx RadioNodeList checked/first focus; e2e/donation-assistance-journeys.spec.mjs covers GENERAL, SADAQAH, ZAKAT, unchecked givingIntent; browser CI 43637455449 |
| AF-R045 | Implemented → Completed | home-carousel-data.ts deduplicates union of slide and appeal-cover URLs into one getAppealCoverMediaBatch call; public-page-data.ts batches media/review queries; home-carousel-data.test.ts asserts one batch |
| AF-R073 | Implemented → Completed | structured-data.tsx emits NGO, Organization, WebSite, alternateName and sameAs; appeal-structured-data.tsx emits guarded DonateAction; structured-data-rendering.test.tsx validates graph, canonical identity and sensitive redaction |
| AF-R075 | Implemented → Completed | public/llms.txt exists; public-llms-index.test.ts validates public destinations and private exclusion; https://amaanafoundation.org/llms.txt fetched live 15 Nov |
| AF-N15 | Implemented → Completed | storage.ts getPublicMediaStorage checks separate buckets on public upload/read/delete; storage-boundaries.test.ts verifies four operations fail before S3 client on shared bucket |
| AF-N16 | Implemented → Completed | storage.ts validates public delivery URL before S3 persistence; storage-boundaries.test.ts rejects credentials/query/fragment/http/malformed URLs with zero S3 requests |
| AF-N18 | Implemented → Completed | storage.ts getPublicMediaObject has bounded acquisition/stream deadlines, MAX_FILE_BYTES and content-length completeness; storage-boundaries.test.ts tests timeout, oversized and truncated data |

**Completed is a bounded issue-closure claim, not a platform-wide audit certificate.** It means the stated original defect has present and release-matched source, tested representative negative/positive cases and current deploy ancestry. It does not establish full PCI/financial settlement, physical WCAG, provider credential validity, tax status, donor/beneficiary face release, SEO rich results or field CWV.

## Two implementation labels corrected rather than blindly counted

- **AF-R043 Implemented → Partial:** src/app/page.tsx still exports dynamic=force-dynamic for eligibility safety; no measured TTFB target acceptance; preserve safety, investigate caching not unsafe static conversion
- **AF-R072 Implemented → Partial:** src/app/page.tsx metadata.description is 165 characters, above stated target; Open Graph description is separately shorter; require accepted shorter name=description and live verification

## Individual disposition of all 149 original items

The full original issue wording and next acceptance step are retained per ID in the latest CSV; the table below is an item-by-item audit index. **NOT_FULLY_REVERIFIED means proof is incomplete, not that implementation is missing.**

| Ordinal | ID | Scope | Current | Evidence disposition |
|---:|---|---|---|---|
| 1 | AF-R001 | Next.js vulnerable release | Completed | PRIOR_CLOSURE_PRESERVED |
| 2 | AF-R002 | Sharp/librsvg vulnerable release | Completed | PRIOR_CLOSURE_PRESERVED |
| 3 | AF-R003 | source-map-js vulnerable release | Completed | PRIOR_CLOSURE_PRESERVED |
| 4 | AF-R004 | Storage module lacks explicit server-only boundary | Completed | PRIOR_CLOSURE_PRESERVED |
| 5 | AF-R005 | Public-prefixed media credential names | Partial | NOT_FULLY_REVERIFIED |
| 6 | AF-R006 | Incomplete dedicated media credentials silently fall back | Completed | SCOPED_VERIFIED |
| 7 | AF-R007 | Client-bundle secret scanner misses names or literal values | Completed | PRIOR_CLOSURE_PRESERVED |
| 8 | AF-R008 | JSON-LD input lacks runtime shape validation | Completed | SCOPED_VERIFIED |
| 9 | AF-R009 | JSON-LD serializer lacks full sensitive-character escaping | Completed | PRIOR_CLOSURE_PRESERVED |
| 10 | AF-R010 | Raw innerHTML assignments in test fixtures | Completed | PRIOR_CLOSURE_PRESERVED |
| 11 | AF-R011 | Dynamic new Function execution in audit harness | Completed | PRIOR_CLOSURE_PRESERVED |
| 12 | AF-R012 | Complete anonymous admin/API access audit | Partial | NOT_FULLY_REVERIFIED |
| 13 | AF-R013 | Admin edge Access/WAF/allow-list requirement | Not started | NOT_FULLY_REVERIFIED |
| 14 | AF-R014 | CSP unsafe-inline script allowance | Partial | NOT_FULLY_REVERIFIED |
| 15 | AF-R015 | Cloudflare analytics beacon CSP violation | Not started | NOT_FULLY_REVERIFIED |
| 16 | AF-R016 | Overbroad CSP img-src https allowance | Completed | SCOPED_VERIFIED |
| 17 | AF-R017 | CSP report-only rollout and enforced-payment acceptance | Partial | NOT_FULLY_REVERIFIED |
| 18 | AF-R018 | HSTS preload/subdomain HTTPS review | Not started | NOT_FULLY_REVERIFIED |
| 19 | AF-R019 | Governance/muted/gold text contrast outside corrected surfaces; Policy labels/aside contrast tokens; Captions and appeal text contrast; Impact/Contact/init | Partial | NOT_FULLY_REVERIFIED |
| 20 | AF-R024 | Sub-12px text declarations | Partial | NOT_FULLY_REVERIFIED |
| 21 | AF-R025 | Overly tight multiline heading line heights | Partial | NOT_FULLY_REVERIFIED |
| 22 | AF-R027 | Assistance step errors lack linked inline messages | Completed | SCOPED_VERIFIED |
| 23 | AF-R028 | Assistance focus precedes error DOM commit | Completed | SCOPED_VERIFIED |
| 24 | AF-R029 | Donation native validation lacks durable inline errors | Completed | SCOPED_VERIFIED |
| 25 | AF-R030 | Donation server-rejected fields do not receive focus | Completed | SCOPED_VERIFIED |
| 26 | AF-R031 | Donation error handling steals focus during correction | Completed | SCOPED_VERIFIED |
| 27 | AF-R032 | Cancelled RAF suppresses donation error focus | Implemented | NOT_FULLY_REVERIFIED |
| 28 | AF-R033 | Invalid giving-intent radio group is not focused | Completed | SCOPED_VERIFIED |
| 29 | AF-R034 | Contact social links fail visible-label-in-name matching; Public-media link accessible name mismatch; Gallery Enlarge accessible name mismatch; Appeal/refl | Implemented | NOT_FULLY_REVERIFIED |
| 30 | AF-R041 | Amount fields use number controls instead of decimal input UX | Implemented | NOT_FULLY_REVERIFIED |
| 31 | AF-R042 | Real screen-reader/keyboard/200%-zoom acceptance | Partial | NOT_FULLY_REVERIFIED |
| 32 | AF-R043 | Homepage always-dynamic rendering / avoidable TTFB | Partial | SOURCE_END_STATE_OPEN |
| 33 | AF-R044 | Footer cumulative layout shift | Implemented | NOT_FULLY_REVERIFIED |
| 34 | AF-R045 | Appeal-cover runtime N+1 media queries | Completed | SCOPED_VERIFIED |
| 35 | AF-R046 | Seed/master-content/category import N+1 operations | Implemented | NOT_FULLY_REVERIFIED |
| 36 | AF-R047 | Missing per-route bundle analysis | Partial | NOT_FULLY_REVERIFIED |
| 37 | AF-R048 | Current throttled-mobile LCP/TBT/TTI acceptance | Not started | NOT_FULLY_REVERIFIED |
| 38 | AF-R049 | Unproven Companion/motion hydration bottleneck | Partial | NOT_FULLY_REVERIFIED |
| 39 | AF-R050 | Lenis activates after native keyboard handoff | Implemented | NOT_FULLY_REVERIFIED |
| 40 | AF-R051 | Outdated browser/polyfill target | Implemented | NOT_FULLY_REVERIFIED |
| 41 | AF-R052 | Remaining raw image elements | Partial | NOT_FULLY_REVERIFIED |
| 42 | AF-R053 | Oversized WebP assets/mobile variants | Partial | NOT_FULLY_REVERIFIED |
| 43 | AF-R054 | Hero preload/priority/sizes consistency | Partial | NOT_FULLY_REVERIFIED |
| 44 | AF-R055 | Missing image formats/responsive caching pipeline | Implemented | NOT_FULLY_REVERIFIED |
| 45 | AF-R056 | Missing ingestion blur/LQIP placeholders | Partial | NOT_FULLY_REVERIFIED |
| 46 | AF-R057 | Too many stylesheets loaded globally; Route styles are not fully isolated | Partial | NOT_FULLY_REVERIFIED |
| 47 | AF-R059 | Missing governed cascade layers | Not started | NOT_FULLY_REVERIFIED |
| 48 | AF-R060 | Stacked duplicate donation stylesheet revisions; Appended reconciliation/override stylesheets | Partial | NOT_FULLY_REVERIFIED |
| 49 | AF-R061 | Hard-coded colors outside canonical tokens | Partial | NOT_FULLY_REVERIFIED |
| 50 | AF-R062 | Excessive important declarations | Not started | NOT_FULLY_REVERIFIED |
| 51 | AF-R063 | Competing button/card/section/media systems | Partial | NOT_FULLY_REVERIFIED |
| 52 | AF-R065 | Missing Prettier formatting and check gate | Partial | NOT_FULLY_REVERIFIED |
| 53 | AF-R066 | Incomplete Stylelint design-token/duplicate-selector governance | Partial | NOT_FULLY_REVERIFIED |
| 54 | AF-R067 | Global CSS <=60KB target not achieved | Partial | NOT_FULLY_REVERIFIED |
| 55 | AF-R068 | Unused CSS <10% on key routes unverified | Not started | NOT_FULLY_REVERIFIED |
| 56 | AF-R069 | Strict accessibility/import-cycle lint coverage gaps | Partial | NOT_FULLY_REVERIFIED |
| 57 | AF-R070 | Gallery branch apparently absent from main | Implemented | NOT_FULLY_REVERIFIED |
| 58 | AF-R071 | Missing route skeletons | Partial | NOT_FULLY_REVERIFIED |
| 59 | AF-R072 | Homepage description exceeds target length | Partial | SOURCE_END_STATE_OPEN |
| 60 | AF-R073 | Missing NGO/WebSite/alternateName/social/appeal action schema | Completed | SCOPED_VERIFIED |
| 61 | AF-R074 | Missing verified registry link/entity enrichment | Partial | NOT_FULLY_REVERIFIED |
| 62 | AF-R075 | Missing llms.txt | Completed | SCOPED_VERIFIED |
| 63 | AF-R076 | Cloudflare email-protection broken link | Partial | NOT_FULLY_REVERIFIED |
| 64 | AF-R077 | Missing real-user Web Vitals attribution | Partial | NOT_FULLY_REVERIFIED |
| 65 | AF-R078 | Dated audit documents not archived | Not started | NOT_FULLY_REVERIFIED |
| 66 | AF-R079 | Excess remote branches / branch hygiene | Not started | NOT_FULLY_REVERIFIED |
| 67 | AF-R080 | Rich-results and entity-schema live acceptance | Not started | NOT_FULLY_REVERIFIED |
| 68 | AF-R081 | Complete truthful build/type/performance release gates | Partial | NOT_FULLY_REVERIFIED |
| 69 | AF-R082 | Preview noindex/redirect and current search-index acceptance | Partial | NOT_FULLY_REVERIFIED |
| 70 | AF-R083 | Donate landing page in-page flow and amount presets | Implemented | NOT_FULLY_REVERIFIED |
| 71 | AF-R084 | Expanded donation intentions beyond current supported set | Partial | NOT_FULLY_REVERIFIED |
| 72 | AF-R085 | Monthly recurring donations | Partial | NOT_FULLY_REVERIFIED |
| 73 | AF-R086 | Persistent Donate CTA across all pages | Implemented | NOT_FULLY_REVERIFIED |
| 74 | AF-R087 | Persistent verified-impact trust bar | Partial | NOT_FULLY_REVERIFIED |
| 75 | AF-R088 | Zakat calculator with reviewed rules/data | Partial | NOT_FULLY_REVERIFIED |
| 76 | AF-R089 | Hijri/event countdown expansion | Partial | NOT_FULLY_REVERIFIED |
| 77 | AF-R090 | Qurbani live sponsorship tiers/counter | Not started | NOT_FULLY_REVERIFIED |
| 78 | AF-R091 | Consent-based Shukr donor wall | Partial | NOT_FULLY_REVERIFIED |
| 79 | AF-R092 | Seasonal campaign goal/progress features | Partial | NOT_FULLY_REVERIFIED |
| 80 | AF-R093 | Wasiyyah/legacy-giving page | Partial | NOT_FULLY_REVERIFIED |
| 81 | AF-R094 | Islamic charity education content pipeline | Partial | NOT_FULLY_REVERIFIED |
| 82 | AF-R095 | Live transparency/financial breakdown dashboard | Partial | NOT_FULLY_REVERIFIED |
| 83 | AF-N01 | Duplicate asset entries within one import batch | Implemented | NOT_FULLY_REVERIFIED |
| 84 | AF-N02 | Bulk category updates omit updatedAt | Implemented | NOT_FULLY_REVERIFIED |
| 85 | AF-N03 | Confirmation accepts a different returned payment identity | Implemented | NOT_FULLY_REVERIFIED |
| 86 | AF-N04 | Malformed provider payment reaches reconciliation | Implemented | NOT_FULLY_REVERIFIED |
| 87 | AF-N05 | Invalid provider order ID reaches donation persistence | Implemented | NOT_FULLY_REVERIFIED |
| 88 | AF-N06 | Malformed failed-payment identity reaches persistence | Implemented | NOT_FULLY_REVERIFIED |
| 89 | AF-N07 | Older failure overwrites newer authorization | Implemented | NOT_FULLY_REVERIFIED |
| 90 | AF-N08 | Multibyte job credential crashes timing-safe comparison | Completed | PRIOR_CLOSURE_PRESERVED |
| 91 | AF-N09 | Gallery publish HTTP500 exposes raw exception text | Completed | PRIOR_CLOSURE_PRESERVED |
| 92 | AF-N10 | Cron repeatedly builds website without DATABASE_URL | Completed | PRIOR_CLOSURE_PRESERVED |
| 93 | AF-N11 | Scrypt work-factor tests exercise malformed fixtures | Implemented | NOT_FULLY_REVERIFIED |
| 94 | AF-N12 | Private-record tests mock critical security helpers | Implemented | NOT_FULLY_REVERIFIED |
| 95 | AF-N13 | Development-tool braces stack-exhaustion advisory | Not started | NOT_FULLY_REVERIFIED |
| 96 | AF-N14 | Destination stream closed early errors | Partial | NOT_FULLY_REVERIFIED |
| 97 | AF-N15 | Public helpers bypassed readiness-only public/private bucket separation | Completed | SCOPED_VERIFIED |
| 98 | AF-N16 | Invalid public delivery URL could be rejected after S3 upload; credentials/query/fragments accepted | Completed | SCOPED_VERIFIED |
| 99 | AF-N17 | Public media publication database lookup escaped the route error handler | Completed | PRIOR_CLOSURE_PRESERVED |
| 100 | AF-N18 | Public object reads were unbounded and did not reject truncated bodies | Completed | SCOPED_VERIFIED |
| 101 | AF-N21 | Generated artwork bypassed the prebuild-only image weight check | Implemented | NOT_FULLY_REVERIFIED |
| 102 | AF-N22 | One-year optimizer floor overrides managed media short source-cache policy | Partial | NOT_FULLY_REVERIFIED |
| 103 | AF-N23 | Malformed private record JSON and prototype-derived labels reach client rendering | Implemented | NOT_FULLY_REVERIFIED |
| 104 | AF-N24 | Late acknowledgement JSON completion updates disposed effect state | Implemented | NOT_FULLY_REVERIFIED |
| 105 | AF-N19 | Origin guard trusts unconfigured Host or malformed origin | Implemented | NOT_FULLY_REVERIFIED |
| 106 | AF-N20 | Gallery selection follows array index and loses modal cleanup on collection change | Implemented | NOT_FULLY_REVERIFIED |
| 107 | AF-FUNDS | Approved fund registry and exactly-one donation designation | Partial | NOT_FULLY_REVERIFIED |
| 108 | AF-ALLOCATION | Purpose-restricted disbursement/allocation ledger and maker-checker approval | Partial | NOT_FULLY_REVERIFIED |
| 109 | AF-DONOR | Donor identity, history, preferences, expiring receipts and data-rights requests | Partial | NOT_FULLY_REVERIFIED |
| 110 | AF-RECEIPTS | PDF/download and secure recovery for normal donation acknowledgements | Partial | NOT_FULLY_REVERIFIED |
| 111 | AF-TAX | Separate reviewed finance export and statutory 10BD/10BE workflow | Not started | NOT_FULLY_REVERIFIED |
| 112 | AF-SETTLEMENT | Provider-bank settlement and direct-transfer exception reconciliation | Partial | NOT_FULLY_REVERIFIED |
| 113 | AF-QR | Reviewed offline campaign/masjid QR attribution network | Partial | NOT_FULLY_REVERIFIED |
| 114 | AF-SPONSOR | Anonymous Taleem and aid-unit inventory/reservation sponsorship | Partial | NOT_FULLY_REVERIFIED |
| 115 | AF-LOCAL | Service-zone assignment, urgency and reviewer SLA metrics | Partial | NOT_FULLY_REVERIFIED |
| 116 | AF-REFERRAL | Verified partner referrals and scope-limited private attestations | Not started | NOT_FULLY_REVERIFIED |
| 117 | AF-VOLUNTEER | Consented volunteer/partner application and operations | Partial | NOT_FULLY_REVERIFIED |
| 118 | AF-MILESTONES | Separate private/public reviewed and revocable case milestones | Partial | NOT_FULLY_REVERIFIED |
| 119 | AF-ATTESTATION | Private donor verification and aggregate tamper-evident report attestation | Not started | NOT_FULLY_REVERIFIED |
| 120 | AF-UNIT-COST | Cost-per-kit trend reporting from approved year/unit costs | Partial | NOT_FULLY_REVERIFIED |
| 121 | AF-BATCH-TRACK | Donor receipt-to-approved distribution batch status reporting | Not started | NOT_FULLY_REVERIFIED |
| 122 | AF-DRIVE-SPONSOR | Sponsor approved locality drive with private post-event report | Not started | NOT_FULLY_REVERIFIED |
| 123 | AF-GIVING-PLANNER | Separate Ramadan/Friday/Dhul-Hijjah reminders from provider mandates | Partial | NOT_FULLY_REVERIFIED |
| 124 | AF-FAMILY-JAR | Family pooled Sadaqah participation and group report | Not started | NOT_FULLY_REVERIFIED |
| 125 | AF-ZAKAT-LOCK | Timed charity retention of collected Zakat until Ramadan | Superseded | NOT_FULLY_REVERIFIED |
| 126 | AF-LOCALES | Reviewed Urdu/Telugu critical journeys; optional Hindi; RTL/hreflang parity | Not started | NOT_FULLY_REVERIFIED |
| 127 | AF-FUNNEL | Privacy-safe server-confirmed donation funnel and acquisition reporting | Partial | NOT_FULLY_REVERIFIED |
| 128 | AF-CONSENT | Purpose/channel consent, subject requests, retention and incident governance | Partial | NOT_FULLY_REVERIFIED |
| 129 | AF-WHATSAPP | WABA template notifications, signed webhooks and opted-in channels | Not started | NOT_FULLY_REVERIFIED |
| 130 | AF-CRM | Optional email stewardship, suppression and reviewed content workflow | Partial | NOT_FULLY_REVERIFIED |
| 131 | AF-CSR | Reviewed corporate partnership/pledge page and proposal PDF | Partial | NOT_FULLY_REVERIFIED |
| 132 | AF-FEEDBACK | Voluntary testimonials/reviews and separate complaint handling | Partial | NOT_FULLY_REVERIFIED |
| 133 | AF-SOCIAL | Owned social profiles, canonical safe cards and content approval | Partial | NOT_FULLY_REVERIFIED |
| 134 | AF-GBP | Eligible Google Business Profile with private home/address safeguards | Partial | NOT_FULLY_REVERIFIED |
| 135 | AF-DARPAN | Current NGO Darpan record/entity/registry link consistency | Partial | NOT_FULLY_REVERIFIED |
| 136 | AF-LISTINGS | GuideStar/Candid, IndiaZakat, Give.do, Ketto/Milaap reviewed eligibility | Not started | NOT_FULLY_REVERIFIED |
| 137 | AF-NONPROFITS | Google for Nonprofits/Ad Grants eligibility and validator verification | Not started | NOT_FULLY_REVERIFIED |
| 138 | AF-CRYPTO | Foreign/crypto donation activation via Giving Block | Not applicable | NOT_FULLY_REVERIFIED |
| 139 | AF-BING | Bing/IndexNow ownership and publish/update/removal discovery | Partial | NOT_FULLY_REVERIFIED |
| 140 | AF-EDITORIAL | Source-reviewed local SEO pillars and partner/internal link strategy | Partial | NOT_FULLY_REVERIFIED |
| 141 | AF-PRESS | Approved institutional/press outreach and national expansion evidence | Not started | NOT_FULLY_REVERIFIED |
| 142 | AF-FIDYA | Reviewed Fidya/Kaffarah/Aqiqah/Waqf giving policies and destinations | Not started | NOT_FULLY_REVERIFIED |
| 143 | AF-FAQ | Accurate FAQ structured data for real verification questions | Implemented | NOT_FULLY_REVERIFIED |
| 144 | AF-FACTS | Conflicting Eid2025 totals and Qurbani2025/2026 year/quantity claims | Partial | NOT_FULLY_REVERIFIED |
| 145 | AF-ACK-TYPES | Uncertain/malformed donation order/confirm response and disposed callback duplicate-risk | Implemented | NOT_FULLY_REVERIFIED |
| 146 | AF-INTAKE-UNCERTAIN | Uncertain assistance save/cleanup can encourage duplicate request retry | Implemented | NOT_FULLY_REVERIFIED |
| 147 | AF-FUNDING-MATH | Malformed/expired/near-goal fundraising states mislead eligibility/progress/refund reopening | Implemented | NOT_FULLY_REVERIFIED |
| 148 | AF-PROMOTION | Highly sensitive identities enter public promotion or stale withdrawal caches | Implemented | NOT_FULLY_REVERIFIED |
| 149 | AF-FIXTURE | Browser acceptance portfolio fixture omits required nullable preview projection | Implemented | NOT_FULLY_REVERIFIED |

## Verified live public-surface checks and explicit exclusions

Fresh public reads on 15 November covered the homepage, About, Donate, Request Assistance, Our Work, Stories, Faith & Reflections, Contact, How We Verify, Appeals, /llms.txt, and operational version/readiness. These prove rendered presence and specific copy, not every real provider flow. 
- **AF-R083 remains Implemented:** Donate page source includes `AppealLandingCheckout` and donation amount presets. A short extractor output does not prove a missing in-page checkout; full interaction/provider acceptance remains separate.
- **AF-FAQ remains Implemented:** visible FAQ and FAQPage JSON-LD tests match, but 80G pending-vs-provisional wording still needs qualified signed reconciliation before declaring all answers factually accepted.
- **AF-R032 remains Implemented:** the callback marker fix exists, but an independently evidenced execution of the dedicated cancellation-race test has not been established for this pass.
- **AF-R042/R048/R080 stay open:** no physical assistive-tech, throttled field CWV or Google rich-result acceptance is certified.
- **Financial and privacy holds persist:** no live transaction/notification/cron, secret rotation, production migration, public-face publication or new tax certificate. #684/#845 remain review-gated, #446 Railway IaC remains operationally held.
- **Previously withdrawn PR #934** soft-404 route streaming is not shipped. PR #939's true-404 regression is merged, but no skipped check is treated as a pass.

## Next actionable verification batch

Audit remaining Implemented entries one by one, beginning AF-R041 (amount input), AF-R046 (seed import N+1), AF-N01/AF-N02 (bulk mutation guarantees), AF-N20 (gallery ID+modal cleanup), AF-R051/R055/R070 (browser/media/gallery), and AF-R086 (persistent CTA). For every row, preserve exact source, tests, deployed SHA, live observations and remaining manual/provider gates. Fix AF-R072's overlong metadata through a bounded, reviewed source PR. Never inflate the canonical 149 denominator.

