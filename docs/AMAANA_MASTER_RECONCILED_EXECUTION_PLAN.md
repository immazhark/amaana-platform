# Amaana Master Reconciled Execution Plan — War-Footing Revision

**Reconciled:** 2026-10-20 IST  
**Scope:** 149 historical entries reconciled into one current master index; no inferred closure.  
**Binding directives:** [Owner audit and elite-engineering directive](./AMAANA_ENGINEERING_DIRECTIVES_2026-10-20.md); `AGENTS.md`; `docs/AI_CONTINUITY_PROTOCOL.md`; `docs/CURRENT_SOURCE_RECONCILIATION_2026-09-15.md`.  
**Historical source:** `docs/AMAANA_MASTER_RECONCILED_EXECUTION_PLAN.md` on preserved **old** branch `fix/direct-transfer-feedback-20261013` (2026-10-17 snapshot); the old branch is **read-only historical evidence**, NOT current `main`.  
**Truth precedence:** Live `main` source + current PR/actual Railway release > older docs/PR assertions. User-confirmed legal/campaign evidence remains controlling until explicitly reconciled.

## 1. Immediately observed release and execution state

- Production source: `main` at **`83a8824103a1018d54a448b6202bf343447e9de0`**; Railway production web deployment `e4cef20b-fd53-4c01-82fe-ab81c6144dc6` reported **SUCCESS** for that exact SHA (2026-10-19T22:29Z). This is verified deployment metadata, **not proof of all live journeys**.
- PR **[#375](https://github.com/immazhark/amaana-platform/pull/375)** open (MEDIUM; exact head `088edc7651425caacd083e82f6b15010c3c97414`): owner-requested removal of the **three placeholder skeleton cards** when opening Impact/Our Work. Keep the Amaana branded logo-and-dots loader and actual image lazy loading. **Source committed; not merged/deployed.** Merge requires new explicit owner `merge it` approval.
- PR **[#374](https://github.com/immazhark/amaana-platform/pull/374)** **DRAFT** (MEDIUM; head `132be62ba62ea7143936b6642b5f01aa5a96b526`): reviewed alternate-language publication helper. Does not ship untranslated or unreviewed Urdu/Telugu pages.
- PR **[#373](https://github.com/immazhark/amaana-platform/pull/373)** merged and deployed at main SHA above: approved-media archive paging + bounded gallery/public image optimization. Source improvement against **AF-R052**; does **not** close the entire item.
- Railway notification worker **#264** remains a separate blocked production service: existing staged fix `45c0bc6c-46db-4ed8-82cb-3a8f02dfb483` is NOT deployed. Repo worker `ops/notification-cron/railway.json:11` specifies **every five minutes**; staged Railway schedule is intentionally **annual/paused**. Do not apply or enable without a separate owner-approved rollout.
- **Immediate contract change:** automatic guarded merge instructions predating this revision are withdrawn. Every PR now requires the owner to explicitly approve the specific merge and required checks must pass; do not push directly to `main`.

## 2. Canonical historical totals — not a claim of current production completion

| Classification from the 2026-10-17 snapshot | Items | What can currently be claimed |
|---|---:|---|
| Implemented (historical code classification) | **60** | Not equivalent to current `main`, live verification or closed |
| Partial | **61** | Some may have newer code; reevaluate individually |
| Not started | **26** | All have an explicit work package in section 5 |
| Superseded | **1** | AF-ZAKAT-LOCK; do not revive |
| Not applicable | **1** | AF-CRYPTO; not FCRA-registered; foreign giving remains prohibited |
| **Total** | **149** | **Zero new closure claims from documentation-only reconciliation** |

Count source: old 149-row execution register. Stage names reflect that older source; new code, merge and production evidence must be overlaid item-by-item with `IMPLEMENTED_SOURCE / TESTED / MERGED / DEPLOYED / LIVE_VERIFIED / BLOCKED`. Record test hashes and source paths for completion; do not advance counts for a bare PR or prototype.

## 3. Bounded audit findings — gaps first, not a fabricated full-repository audit

| Severity | Source evidence | Finding | Safe next action |
|---|---|---|---|
| **HIGH / operational** | `ops/notification-cron/railway.json:11`; Railway staged config for worker #264 | Desired 5-minute cron schedule conflicts with intentionally paused production; current worker deployment failed | Reconcile scheduling precedence, obtain explicit authorization, test isolated worker; do not activate automatically |
| **HIGH / legal decision** | New owner audit directive vs `src/app/compliance/page.tsx:10,38` and `docs/canonical-factual-locks-2026-09-15.md` | New directive says 80G pending, existing evidence says provisional Form 10AC approval; the app already disables 80G deduction certificates | Verify signed approval and current CA advice; no false final approval or tax-certificate claims |
| **HIGH / privacy review** | Owner's stricter 2026-10-20 instruction; currently public galleries use prior consent/privacy gates | New requirement to blur **all identifiable donor and beneficiary faces** is not proved complete for deployed imagery; named medical/financial cases need owner anonymization decision | Inventory/public media review first; hold new unredacted publications; propose approved corrections without leaking private cases |
| **MEDIUM / UX** | `src/components/navigation-progress.tsx:6-7,63-64` on current live `main` | Routes can render three transient fake skeleton cards over page; owner rejects that UX | Finish PR #375 as owner-approved release; preserve branded loader |
| **MEDIUM / frontend maintainability** | `src/app/experience-finish.css:55-65` and other `!important` rules | Cascading override/specificity debt increases visual regression risk | Scoped CSS measurements and incremental removal (AF-R059, R062) |
| **MEDIUM / source of truth** | `docs/AI_ACTIVE_WORK.md:1-3`; old register absent on main before this PR | Top active-work entry still describes already-merged #373 as pending, and 149-row register lived only on old branch | Add this new master to main via approved PR; update ownership/handoff state |
| **UNVERIFIED, never PASS by assumption** | No attached real-device/third-party scanner results in this reconciliation | Field CWV, manual TalkBack/VoiceOver, production payment smoke, SSL Labs/ZAP, restore drill, public face scan and live SEO validators | Assign bounded evidence tasks; use explicit external/owner gates |

**Audit coverage limitation:** This is a scoped, source-grounded and connector-grounded reconciliation. It is **not** a completed line-by-line full Git-history security audit, asset face scan, real-device test, SSL/TLS validator run, penetration test or external/legal certification. Mark those requirements `UNVERIFIED`, not `PASS`.

## 4. War-footing operating model and priorities

**Hard capacity rule:** **one repo mutation owner** and at most **one primary runtime PR in active implementation**, with review-only/draft scoped PRs retained. Parallelize evidence capture, UX analysis and policy prep—not uncoordinated repository code writes. Execute small fully finished batches, stop carrying half-complete features, and ship in evidence-backed slices.

- **Wave 0 / release and safety:** Get owner approval to merge user-priority #375 once requirements pass; verify exact `main` + Railway release and visually confirm Impact/Our Work loader. Keep #374 draft until translation approval. Stop automatic merges immediately. Inventory new face-blurring exposure and reconcile 80G instructions without changing public claims.
- **Wave 1 / P0 controlled source:** R013 admin edge, R015 analytics CSP, R018 HSTS/subdomain, TAX reviewed statutory export. Read-only threat model and test contract now; secure changes need owner written plans/approvals.
- **Wave 2 / P1 meaningful code:** R048 measured mobile LCP/TBT/INP, N13/N14 reproducible stream/tool faults, LOCALES complete approved routes, R090 Qurbani sponsorship, FIDYA giving, WHATSAPP consent/webhooks. Ship only unlocked work; never invent religious/cost/eligibility rules.
- **Wave 3 / P2 maintainability and trust:** R059/R062/R068 CSS modernization and evidence, R076 email, R080 schema, R078/R079 repository cleanup with retention approvals, scoped partner/reporting and verified listing research.
- **Cross-cutting:** First-principles algorithms, ASD-STE100 comments, clean TypeScript, consistent card/hero/call-to-action systems, WCAG 2.2 AA, measured field/lab CWV, privacy by construction. Each change receives a focused negative/positive test and rollback instruction, not gratuitous CI infrastructure rework.

### Definition of a finished work package

`Reproduced defect / agreed spec → test-first source change → type/a11y/performance verification relevant to scope → PR risk/rollback evidence → explicit owner merge approval → protected merge → exact release verification → register evidence + closure decision`. **Unverified external conditions remain blocked rather than called fixed**. Owner sign-off is a real gate, but does not prevent preparing other independent source-safe packages.

## 5. All 26 not-started items — exact actionable work queue

Each action is **prepared for execution**, not a representation that its code is already implemented. A source-backed active PR may move its work state without altering the old 149-row baseline. Owner/external dependencies are explicit.

| ID | P | Risk | Workstream | Next concrete engineering action | Approval or evidence gate |
|---|---|---|---|---|---|
| AF-R013 | P0 | HIGH | W2 security | Define Cloudflare Access/WAF admin rule with explicit deny/allowed-origin tests; do not cut off admins | Owner approves admin identities, Cloudflare privileges and recovery path |
| AF-R015 | P0 | HIGH | W2 security | Reproduce injected beacon CSP violation; propose policy-compatible analytics disabling or explicit policy exception | Owner chooses analytics and approves CSP change |
| AF-R018 | P0 | HIGH | W2 security | Inventory every current subdomain and TLS status; evaluate HSTS preload/subdomain impact | Domain inventory and explicit owner approval before preload |
| AF-TAX | P0 | HIGH | W1 finances | Specify segregated reviewed 10BD/10BE exports with independent tax-certificate issuance lock | Current CA sign-off, tax-document authority, finance access approval |
| AF-FIDYA | P1 | HIGH | W7 giving | Prepare UI/server giving-policy contract but keep categories disabled until validated | Religious rulings, per-unit prices, legal/fund allocation approval |
| AF-LOCALES | P1 | MEDIUM | W6 localization | Extend draft PR #374 reviewed-translation publication gates into actual Urdu/Telugu routes and RTL form behavior | Approved translations, legal/error-copy review and canonical/hreflang parity |
| AF-N13 | P1 | MEDIUM | W5 reliability | Reproduce development braces/stack-exhaustion on pinned packages and isolate the source fault | Exact failing request or tool invocation |
| AF-N14 | P1 | MEDIUM | W5 reliability | Reproduce early-closed destination stream, identify cancellation/cleanup bug and add regression | Complete event/error reproduction and safe isolation |
| AF-R048 | P1 | MEDIUM | W5 performance | Profile Home, Our Work, Impact and Donate on throttled Indian 4G Android; fix measured LCP/INP/CLS source cause | Real device/lab traces and per-route measurements |
| AF-R090 | P1 | HIGH | W7 giving | Design privacy-safe reviewed Qurbani sponsorship inventory, tier contract and monotonic counter | Approved unit costs, campaign validity, religious and allocation review |
| AF-WHATSAPP | P1 | HIGH | W8 messaging | Draft opted-in WhatsApp template workflow, signed inbound webhook and unsubscribe boundaries | Verified WABA provider, templates, explicit consent and security approval |
| AF-ATTESTATION | P2 | HIGH | W8 reporting | Design tamper-evident aggregate report hash plus private donor verification without exposing identities | Reviewed public aggregates and retention/access design |
| AF-BATCH-TRACK | P2 | HIGH | W8 reporting | Design donor receipt-to-approved distribution batch report without case-person exposure | Donor consent and allocation/data model authority |
| AF-DRIVE-SPONSOR | P2 | HIGH | W8 sponsorship | Prototype verified-locality sponsorship flow and private post-drive report | Approved zone, amount, inventory, fund policy |
| AF-FAMILY-JAR | P2 | HIGH | W7 giving | Design pooled domestic INR pledge intent and audited member consent, no unapproved collections | Payment review, no cross-user data leakage, fund allocation decisions |
| AF-LISTINGS | P2 | LOW | W8 external | Prepare evidence pack and directory eligibility matrix; do not claim listings until external confirmation | Actual platform review/approval |
| AF-NONPROFITS | P2 | LOW | W8 external | Document eligibility and request verification for Google Nonprofits/Ad Grants | Google verification and nonprofit documentation |
| AF-PRESS | P2 | LOW | W8 external | Prepare reviewed impact/media kit without revealing private beneficiaries or exaggerating reach | Trustee-approved press claims and redacted photos |
| AF-R059 | P2 | MEDIUM | W5 CSS | Plan progressive governed cascade layers; migrate an isolated component family without selector regressions | Visual/diff approval and measured cascade parity |
| AF-R062 | P2 | MEDIUM | W5 CSS | Remove proved unnecessary !important rules incrementally in approved component families | Rendered-state comparisons, reduced-motion and contrast checks |
| AF-R068 | P2 | LOW | W5 CSS | Capture route-specific CSS coverage and prune verified unused selectors only | Mobile/desktop route coverage trace |
| AF-R076 | P2 | LOW | W6 links | Inspect rendered email anchors with Cloudflare obfuscation; fix actual broken public contact hrefs | Reproduced affected URL and domain behavior |
| AF-R078 | P2 | LOW | W5 hygiene | Archive obsolete dated audit documents only after tracing live inbound references | Owner-reviewed retention and backlink map |
| AF-R079 | P2 | LOW | W5 hygiene | Inventory merged/orphan branches and propose deletion candidates; do not delete branches without approval | Owner approves each target branch |
| AF-R080 | P2 | LOW | W6 SEO | Validate actual live NGO/Breadcrumb/Article schema, fix specific invalid entity edges | Rich Results testing and public index evidence |
| AF-REFERRAL | P2 | HIGH | W8 referrals | Specify scoped, revocable partner referral attestations; no case browsing or approval power | RBAC/privacy data-flow and partner vetting approval |

**Gate categories:** LOW documentation/source cleanup can be proposed without pre-approval; MEDIUM components/routes require plan; HIGH payment/RBAC/data/CSP/security changes require explicit owner written approval before code. All merges require explicit per-PR authorization regardless of risk. `AF-LOCALES` has draft-source progress in #374 but the complete feature remains unverified. `AF-R048` must use measured device traces, not guessed Lighthouse scores. The externally governed listing/nonprofit/press proposals remain research/approval work until actual provider eligibility is verified.

## 6. New owner directive crosswalk — do not silently inflate 149

The 2026-10-20 directive adds stricter independent verification across eight areas. Link them to existing records where possible; add new unique issues only after cross-register duplicate review.

| Incoming control | Existing targets | New evidence or owner decision |
|---|---|---|
| Privacy/redaction, named medical anonymity, EXIF/GPS | AF-CONSENT, AF-PROMOTION, AF-R052, AF-FACTS | Inventory all published faces and named aid disclosures; owner privacy/redaction policy is now strict |
| No FCRA/foreign donations, 80G tax-certificate lock | AF-FUNDS, AF-TAX, AF-RECEIPTS, AF-CONSENT | CA reconcile Form 10AC position; never accept foreign contributions or issue unapproved tax deduction documents |
| CSP, WAF, MFA, secrets, upload safety, ASVS | AF-R012–R018, AF-R005–R009, AF-N15–N19 | Actual auth/payment boundary tests, edge settings and policy-owner approvals |
| LCP/INP/CLS, image weight, JS, 4G Android | AF-R043–R056, AF-R048, AF-R077 | Five-run Lighthouse median, field p75, route payload; preserve actual aggregate JS/CSS budgets |
| WCAG 2.2 AA and zoom/screen-reader | AF-R019, AF-R024–R042, AF-R071 | Real keyboard/TalkBack/VoiceOver/400%-zoom evidence |
| SEO/structured data/OG/crawl | AF-R072–R082, AF-BING, AF-DARPAN | Real external validators, canonical/redirect/robots parity |
| Backups, load, email deliverability, uptime | AF-N10, AF-N13–N14, AF-SETTLEMENT, AF-CRM | Restore drill, peak-test evidence, SPF/DKIM/DMARC, rollback |
| Donation modes, refunds, idempotency, recurring | AF-N03–N07, AF-R083–R095, AF-SETTLEMENT, AF-ACK-TYPES | Isolated test results and explicit approval for real provider activity |

## 7. Complete 149-row historical index (source snapshot, not live certification)

The entries below are copied in compact form from the preserved 2026-10-17 execution register. **Historical classification is not the current source/deployment state.** Notes for live exceptions identify only facts inspected on 2026-10-20.

| ID | Priority | W | Item / known scope | Historical implementation | Verified newer state / next action |
|---|---|---|---|---|---|
| AF-R001 | P0 | W2 | Next.js vulnerable release | Implemented | REVALIDATE; historical snapshot only |
| AF-R002 | P0 | W2 | Sharp/librsvg vulnerable release | Implemented | REVALIDATE; historical snapshot only |
| AF-R003 | P0 | W2 | source-map-js vulnerable release | Implemented | REVALIDATE; historical snapshot only |
| AF-R004 | P0 | W2 | Storage module lacks explicit server-only boundary | Implemented | REVALIDATE; historical snapshot only |
| AF-R005 | P0 | W2 | Public-prefixed media credential names | Partial | REVALIDATE; historical snapshot only |
| AF-R006 | P0 | W2 | Incomplete dedicated media credentials silently fall back | Implemented | REVALIDATE; historical snapshot only |
| AF-R007 | P0 | W2 | Client-bundle secret scanner misses names or literal values | Implemented | REVALIDATE; historical snapshot only |
| AF-R008 | P0 | W2 | JSON-LD input lacks runtime shape validation | Implemented | REVALIDATE; historical snapshot only |
| AF-R009 | P0 | W2 | JSON-LD serializer lacks full sensitive-character escaping | Implemented | REVALIDATE; historical snapshot only |
| AF-R010 | P0 | W2 | Raw innerHTML assignments in test fixtures | Implemented | REVALIDATE; historical snapshot only |
| AF-R011 | P0 | W2 | Dynamic new Function execution in audit harness | Implemented | REVALIDATE; historical snapshot only |
| AF-R012 | P0 | W2 | Complete anonymous admin/API access audit | Partial | REVALIDATE; historical snapshot only |
| AF-R013 | P0 | W2 | Admin edge Access/WAF/allow-list requirement | Not started | REVALIDATE; historical snapshot only |
| AF-R014 | P0 | W2 | CSP unsafe-inline script allowance | Partial | REVALIDATE; historical snapshot only |
| AF-R015 | P0 | W2 | Cloudflare analytics beacon CSP violation | Not started | REVALIDATE; historical snapshot only |
| AF-R016 | P0 | W2 | Overbroad CSP img-src https allowance | Implemented | REVALIDATE; historical snapshot only |
| AF-R017 | P0 | W2 | CSP report-only rollout and enforced-payment acceptance | Partial | REVALIDATE; historical snapshot only |
| AF-R018 | P0 | W2 | HSTS preload/subdomain HTTPS review | Not started | REVALIDATE; historical snapshot only |
| AF-R019 | P1 | W4 | Governance/muted/gold text contrast outside corrected surfaces; Policy labels/aside contrast tokens; Captions and appeal text contrast; Impact/Contact/initiative supporting-text contrast; Dark admin-sidebar eyebrow contrast; Remaining gold-on-light text contrast | Partial | REVALIDATE; historical snapshot only |
| AF-R024 | P1 | W4 | Sub-12px text declarations | Partial | REVALIDATE; historical snapshot only |
| AF-R025 | P1 | W4 | Overly tight multiline heading line heights | Partial | REVALIDATE; historical snapshot only |
| AF-R027 | P1 | W4 | Assistance step errors lack linked inline messages | Implemented | REVALIDATE; historical snapshot only |
| AF-R028 | P1 | W4 | Assistance focus precedes error DOM commit | Implemented | REVALIDATE; historical snapshot only |
| AF-R029 | P1 | W4 | Donation native validation lacks durable inline errors | Implemented | REVALIDATE; historical snapshot only |
| AF-R030 | P1 | W4 | Donation server-rejected fields do not receive focus | Implemented | REVALIDATE; historical snapshot only |
| AF-R031 | P1 | W4 | Donation error handling steals focus during correction | Implemented | REVALIDATE; historical snapshot only |
| AF-R032 | P1 | W4 | Cancelled RAF suppresses donation error focus | Implemented | REVALIDATE; historical snapshot only |
| AF-R033 | P1 | W4 | Invalid giving-intent radio group is not focused | Implemented | REVALIDATE; historical snapshot only |
| AF-R034 | P1 | W4 | Contact social links fail visible-label-in-name matching; Public-media link accessible name mismatch; Gallery Enlarge accessible name mismatch; Appeal/reflection card accessible action mismatch; Impact tile accessible action mismatch; Participation-card accessible action mismatch; Story archive accessible action mismatch | Implemented | REVALIDATE; historical snapshot only |
| AF-R041 | P1 | W4 | Amount fields use number controls instead of decimal input UX | Implemented | REVALIDATE; historical snapshot only |
| AF-R042 | P1 | W4 | Real screen-reader/keyboard/200%-zoom acceptance | Partial | REVALIDATE; historical snapshot only |
| AF-R043 | P1 | W5 | Homepage always-dynamic rendering / avoidable TTFB | Implemented | REVALIDATE; historical snapshot only |
| AF-R044 | P1 | W5 | Footer cumulative layout shift | Implemented | REVALIDATE; historical snapshot only |
| AF-R045 | P1 | W5 | Appeal-cover runtime N+1 media queries | Implemented | REVALIDATE; historical snapshot only |
| AF-R046 | P1 | W5 | Seed/master-content/category import N+1 operations | Implemented | REVALIDATE; historical snapshot only |
| AF-R047 | P1 | W5 | Missing per-route bundle analysis | Partial | REVALIDATE; historical snapshot only |
| AF-R048 | P1 | W5 | Current throttled-mobile LCP/TBT/TTI acceptance | Not started | REVALIDATE; historical snapshot only |
| AF-R049 | P1 | W5 | Unproven Companion/motion hydration bottleneck | Partial | REVALIDATE; historical snapshot only |
| AF-R050 | P1 | W5 | Lenis activates after native keyboard handoff | Implemented | REVALIDATE; historical snapshot only |
| AF-R051 | P1 | W5 | Outdated browser/polyfill target | Implemented | REVALIDATE; historical snapshot only |
| AF-R052 | P1 | W5 | Remaining raw image elements | Partial | PARTIAL: #373 merged/live; remaining raw-image scope unverified |
| AF-R053 | P1 | W5 | Oversized WebP assets/mobile variants | Partial | REVALIDATE; historical snapshot only |
| AF-R054 | P1 | W5 | Hero preload/priority/sizes consistency | Partial | REVALIDATE; historical snapshot only |
| AF-R055 | P1 | W5 | Missing image formats/responsive caching pipeline | Implemented | REVALIDATE; historical snapshot only |
| AF-R056 | P1 | W5 | Missing ingestion blur/LQIP placeholders | Partial | REVALIDATE; historical snapshot only |
| AF-R057 | P2 | W5 | Too many stylesheets loaded globally; Route styles are not fully isolated | Partial | REVALIDATE; historical snapshot only |
| AF-R059 | P2 | W5 | Missing governed cascade layers | Not started | REVALIDATE; historical snapshot only |
| AF-R060 | P2 | W5 | Stacked duplicate donation stylesheet revisions; Appended reconciliation/override stylesheets | Partial | REVALIDATE; historical snapshot only |
| AF-R061 | P2 | W5 | Hard-coded colors outside canonical tokens | Partial | REVALIDATE; historical snapshot only |
| AF-R062 | P2 | W5 | Excessive important declarations | Not started | REVALIDATE; historical snapshot only |
| AF-R063 | P2 | W5 | Competing button/card/section/media systems | Partial | REVALIDATE; historical snapshot only |
| AF-R065 | P2 | W5 | Missing Prettier formatting and check gate | Partial | REVALIDATE; historical snapshot only |
| AF-R066 | P2 | W5 | Incomplete Stylelint design-token/duplicate-selector governance | Partial | REVALIDATE; historical snapshot only |
| AF-R067 | P2 | W5 | Global CSS <=60KB target not achieved | Partial | REVALIDATE; historical snapshot only |
| AF-R068 | P2 | W5 | Unused CSS <10% on key routes unverified | Not started | REVALIDATE; historical snapshot only |
| AF-R069 | P2 | W5 | Strict accessibility/import-cycle lint coverage gaps | Partial | REVALIDATE; historical snapshot only |
| AF-R070 | P2 | W6 | Gallery branch apparently absent from main | Implemented | REVALIDATE; historical snapshot only |
| AF-R071 | P2 | W6 | Missing route skeletons | Partial | CHANGED: #375 source hotfix; not live/owner-approved |
| AF-R072 | P2 | W6 | Homepage description exceeds target length | Implemented | REVALIDATE; historical snapshot only |
| AF-R073 | P2 | W6 | Missing NGO/WebSite/alternateName/social/appeal action schema | Implemented | REVALIDATE; historical snapshot only |
| AF-R074 | P2 | W6 | Missing verified registry link/entity enrichment | Partial | REVALIDATE; historical snapshot only |
| AF-R075 | P2 | W6 | Missing llms.txt | Implemented | REVALIDATE; historical snapshot only |
| AF-R076 | P2 | W6 | Cloudflare email-protection broken link | Not started | REVALIDATE; historical snapshot only |
| AF-R077 | P2 | W6 | Missing real-user Web Vitals attribution | Partial | REVALIDATE; historical snapshot only |
| AF-R078 | P2 | W5 | Dated audit documents not archived | Not started | REVALIDATE; historical snapshot only |
| AF-R079 | P2 | W5 | Excess remote branches / branch hygiene | Not started | REVALIDATE; historical snapshot only |
| AF-R080 | P2 | W6 | Rich-results and entity-schema live acceptance | Not started | REVALIDATE; historical snapshot only |
| AF-R081 | P2 | W5 | Complete truthful build/type/performance release gates | Partial | REVALIDATE; historical snapshot only |
| AF-R082 | P2 | W6 | Preview noindex/redirect and current search-index acceptance | Partial | REVALIDATE; historical snapshot only |
| AF-R083 | P1 | W7 | Donate landing page in-page flow and amount presets | Implemented | REVALIDATE; historical snapshot only |
| AF-R084 | P1 | W7 | Expanded donation intentions beyond current supported set | Partial | REVALIDATE; historical snapshot only |
| AF-R085 | P1 | W7 | Monthly recurring donations | Partial | REVALIDATE; historical snapshot only |
| AF-R086 | P1 | W7 | Persistent Donate CTA across all pages | Implemented | REVALIDATE; historical snapshot only |
| AF-R087 | P1 | W7 | Persistent verified-impact trust bar | Partial | REVALIDATE; historical snapshot only |
| AF-R088 | P1 | W7 | Zakat calculator with reviewed rules/data | Partial | REVALIDATE; historical snapshot only |
| AF-R089 | P1 | W7 | Hijri/event countdown expansion | Partial | REVALIDATE; historical snapshot only |
| AF-R090 | P1 | W7 | Qurbani live sponsorship tiers/counter | Not started | REVALIDATE; historical snapshot only |
| AF-R091 | P1 | W7 | Consent-based Shukr donor wall | Partial | REVALIDATE; historical snapshot only |
| AF-R092 | P1 | W7 | Seasonal campaign goal/progress features | Partial | REVALIDATE; historical snapshot only |
| AF-R093 | P1 | W7 | Wasiyyah/legacy-giving page | Partial | REVALIDATE; historical snapshot only |
| AF-R094 | P1 | W7 | Islamic charity education content pipeline | Partial | REVALIDATE; historical snapshot only |
| AF-R095 | P1 | W7 | Live transparency/financial breakdown dashboard | Partial | REVALIDATE; historical snapshot only |
| AF-N01 | P1 | W5 | Duplicate asset entries within one import batch | Implemented | REVALIDATE; historical snapshot only |
| AF-N02 | P1 | W5 | Bulk category updates omit updatedAt | Implemented | REVALIDATE; historical snapshot only |
| AF-N03 | P0 | W1 | Confirmation accepts a different returned payment identity | Implemented | REVALIDATE; historical snapshot only |
| AF-N04 | P0 | W1 | Malformed provider payment reaches reconciliation | Implemented | REVALIDATE; historical snapshot only |
| AF-N05 | P0 | W1 | Invalid provider order ID reaches donation persistence | Implemented | REVALIDATE; historical snapshot only |
| AF-N06 | P0 | W1 | Malformed failed-payment identity reaches persistence | Implemented | REVALIDATE; historical snapshot only |
| AF-N07 | P0 | W1 | Older failure overwrites newer authorization | Implemented | REVALIDATE; historical snapshot only |
| AF-N08 | P0 | W2 | Multibyte job credential crashes timing-safe comparison | Implemented | REVALIDATE; historical snapshot only |
| AF-N09 | P1 | W2 | Gallery publish HTTP500 exposes raw exception text | Implemented | REVALIDATE; historical snapshot only |
| AF-N10 | P1 | W5 | Cron repeatedly builds website without DATABASE_URL | Implemented | OPERATIONS BLOCKED: Railway worker #264 failed; staged change not applied |
| AF-N11 | P1 | W2 | Scrypt work-factor tests exercise malformed fixtures | Implemented | REVALIDATE; historical snapshot only |
| AF-N12 | P1 | W2 | Private-record tests mock critical security helpers | Implemented | REVALIDATE; historical snapshot only |
| AF-N13 | P1 | W5 | Development-tool braces stack-exhaustion advisory | Not started | REVALIDATE; historical snapshot only |
| AF-N14 | P1 | W5 | Destination stream closed early errors | Not started | REVALIDATE; historical snapshot only |
| AF-N15 | P0 | W2 | Public helpers bypassed readiness-only public/private bucket separation | Implemented | REVALIDATE; historical snapshot only |
| AF-N16 | P0 | W2 | Invalid public delivery URL could be rejected after S3 upload; credentials/query/fragments accepted | Implemented | REVALIDATE; historical snapshot only |
| AF-N17 | P0 | W2 | Public media publication database lookup escaped the route error handler | Implemented | REVALIDATE; historical snapshot only |
| AF-N18 | P0 | W2 | Public object reads were unbounded and did not reject truncated bodies | Implemented | REVALIDATE; historical snapshot only |
| AF-N21 | P1 | W5 | Generated artwork bypassed the prebuild-only image weight check | Implemented | REVALIDATE; historical snapshot only |
| AF-N22 | P1 | W5 | One-year optimizer floor overrides managed media short source-cache policy | Partial | REVALIDATE; historical snapshot only |
| AF-N23 | P0 | W2 | Malformed private record JSON and prototype-derived labels reach client rendering | Implemented | REVALIDATE; historical snapshot only |
| AF-N24 | P1 | W5 | Late acknowledgement JSON completion updates disposed effect state | Implemented | REVALIDATE; historical snapshot only |
| AF-N19 | P0 | W2 | Origin guard trusts unconfigured Host or malformed origin | Implemented | REVALIDATE; historical snapshot only |
| AF-N20 | P1 | W4 | Gallery selection follows array index and loses modal cleanup on collection change | Implemented | REVALIDATE; historical snapshot only |
| AF-FUNDS | P1 | W1 | Approved fund registry and exactly-one donation designation | Partial | REVALIDATE; historical snapshot only |
| AF-ALLOCATION | P1 | W1 | Purpose-restricted disbursement/allocation ledger and maker-checker approval | Partial | REVALIDATE; historical snapshot only |
| AF-DONOR | P1 | W7 | Donor identity, history, preferences, expiring receipts and data-rights requests | Partial | REVALIDATE; historical snapshot only |
| AF-RECEIPTS | P1 | W1 | PDF/download and secure recovery for normal donation acknowledgements | Partial | REVALIDATE; historical snapshot only |
| AF-TAX | P0 | W1 | Separate reviewed finance export and statutory 10BD/10BE workflow | Not started | REVALIDATE; historical snapshot only |
| AF-SETTLEMENT | P1 | W1 | Provider-bank settlement and direct-transfer exception reconciliation | Partial | REVALIDATE; historical snapshot only |
| AF-QR | P1 | W8 | Reviewed offline campaign/masjid QR attribution network | Partial | REVALIDATE; historical snapshot only |
| AF-SPONSOR | P1 | W7 | Anonymous Taleem and aid-unit inventory/reservation sponsorship | Partial | REVALIDATE; historical snapshot only |
| AF-LOCAL | P1 | W3 | Service-zone assignment, urgency and reviewer SLA metrics | Partial | REVALIDATE; historical snapshot only |
| AF-REFERRAL | P2 | W8 | Verified partner referrals and scope-limited private attestations | Not started | REVALIDATE; historical snapshot only |
| AF-VOLUNTEER | P1 | W8 | Consented volunteer/partner application and operations | Partial | REVALIDATE; historical snapshot only |
| AF-MILESTONES | P1 | W3 | Separate private/public reviewed and revocable case milestones | Partial | REVALIDATE; historical snapshot only |
| AF-ATTESTATION | P2 | W8 | Private donor verification and aggregate tamper-evident report attestation | Not started | REVALIDATE; historical snapshot only |
| AF-UNIT-COST | P2 | W8 | Cost-per-kit trend reporting from approved year/unit costs | Partial | REVALIDATE; historical snapshot only |
| AF-BATCH-TRACK | P2 | W8 | Donor receipt-to-approved distribution batch status reporting | Not started | REVALIDATE; historical snapshot only |
| AF-DRIVE-SPONSOR | P2 | W8 | Sponsor approved locality drive with private post-event report | Not started | REVALIDATE; historical snapshot only |
| AF-GIVING-PLANNER | P2 | W7 | Separate Ramadan/Friday/Dhul-Hijjah reminders from provider mandates | Partial | REVALIDATE; historical snapshot only |
| AF-FAMILY-JAR | P2 | W7 | Family pooled Sadaqah participation and group report | Not started | REVALIDATE; historical snapshot only |
| AF-ZAKAT-LOCK | P0 | W7 | Timed charity retention of collected Zakat until Ramadan | Superseded | REVALIDATE; historical snapshot only |
| AF-LOCALES | P1 | W6 | Reviewed Urdu/Telugu critical journeys; optional Hindi; RTL/hreflang parity | Not started | STARTED: #374 draft helper only; localization not live |
| AF-FUNNEL | P1 | W5 | Privacy-safe server-confirmed donation funnel and acquisition reporting | Partial | REVALIDATE; historical snapshot only |
| AF-CONSENT | P0 | W2 | Purpose/channel consent, subject requests, retention and incident governance | Partial | REVALIDATE; historical snapshot only |
| AF-WHATSAPP | P1 | W8 | WABA template notifications, signed webhooks and opted-in channels | Not started | REVALIDATE; historical snapshot only |
| AF-CRM | P1 | W8 | Optional email stewardship, suppression and reviewed content workflow | Partial | REVALIDATE; historical snapshot only |
| AF-CSR | P1 | W8 | Reviewed corporate partnership/pledge page and proposal PDF | Partial | REVALIDATE; historical snapshot only |
| AF-FEEDBACK | P1 | W8 | Voluntary testimonials/reviews and separate complaint handling | Partial | REVALIDATE; historical snapshot only |
| AF-SOCIAL | P1 | W8 | Owned social profiles, canonical safe cards and content approval | Partial | REVALIDATE; historical snapshot only |
| AF-GBP | P1 | W8 | Eligible Google Business Profile with private home/address safeguards | Partial | REVALIDATE; historical snapshot only |
| AF-DARPAN | P1 | W6 | Current NGO Darpan record/entity/registry link consistency | Partial | REVALIDATE; historical snapshot only |
| AF-LISTINGS | P2 | W8 | GuideStar/Candid, IndiaZakat, Give.do, Ketto/Milaap reviewed eligibility | Not started | REVALIDATE; historical snapshot only |
| AF-NONPROFITS | P2 | W8 | Google for Nonprofits/Ad Grants eligibility and validator verification | Not started | REVALIDATE; historical snapshot only |
| AF-CRYPTO | P0 | W8 | Foreign/crypto donation activation via Giving Block | Not applicable | REVALIDATE; historical snapshot only |
| AF-BING | P1 | W6 | Bing/IndexNow ownership and publish/update/removal discovery | Partial | REVALIDATE; historical snapshot only |
| AF-EDITORIAL | P1 | W6 | Source-reviewed local SEO pillars and partner/internal link strategy | Partial | REVALIDATE; historical snapshot only |
| AF-PRESS | P2 | W8 | Approved institutional/press outreach and national expansion evidence | Not started | REVALIDATE; historical snapshot only |
| AF-FIDYA | P1 | W7 | Reviewed Fidya/Kaffarah/Aqiqah/Waqf giving policies and destinations | Not started | REVALIDATE; historical snapshot only |
| AF-FAQ | P2 | W6 | Accurate FAQ structured data for real verification questions | Implemented | REVALIDATE; historical snapshot only |
| AF-FACTS | P0 | W6 | Conflicting Eid2025 totals and Qurbani2025/2026 year/quantity claims | Partial | REVALIDATE; historical snapshot only |
| AF-ACK-TYPES | P0 | W1 | Uncertain/malformed donation order/confirm response and disposed callback duplicate-risk | Implemented | REVALIDATE; historical snapshot only |
| AF-INTAKE-UNCERTAIN | P0 | W3 | Uncertain assistance save/cleanup can encourage duplicate request retry | Implemented | REVALIDATE; historical snapshot only |
| AF-FUNDING-MATH | P0 | W1 | Malformed/expired/near-goal fundraising states mislead eligibility/progress/refund reopening | Implemented | REVALIDATE; historical snapshot only |
| AF-PROMOTION | P0 | W2 | Highly sensitive identities enter public promotion or stale withdrawal caches | Implemented | REVALIDATE; historical snapshot only |
| AF-FIXTURE | P0 | W5 | Browser acceptance portfolio fixture omits required nullable preview projection | Implemented | REVALIDATE; historical snapshot only |

## 8. Decisions and next three executable actions

1. **Owner review of PR #375** (MEDIUM): approve with **"merge it"** after required checks; then verify logo/dots remains and no three-card placeholders on Impact/Our Work at mobile and desktop. No approval → preserve the ready PR and continue other independent analysis.
2. **HIGH-risk policy decisions:** reconcile signed provisional 80G evidence versus the new pending claim, confirm current redaction/anonymity standard for existing public medical/financial case imagery, authorize explicit scope for admin-edge/CSP work. No legal/security change before approval.
3. **Source-first implementation:** prepare the R048 mobile evidence and N13/N14 reproduction; finish the #374 reviewed-locales integration only with approved translations, then attack the next unlocked P1/P2 item with tests. Separately reconcile worker #264 scheduling without activating it.

**No destructive migrations, live donation tests, asset re-publication, repo setting changes, branch deletion or automatic PR merge are authorized by this document.** This is a committed, reviewable plan to drive execution rather than a release or closure certificate.
