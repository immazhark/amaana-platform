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
| R-019 | Governance/muted/gold text contrast outside corrected surfaces | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-05 | Some replacements exist; all remaining selectors and light-background gold require closure. |
| R-020 | Policy labels/aside contrast tokens | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-05; #223 | Existing accessible semantic tokens applied and ratio tests added. |
| R-021 | Captions and appeal text contrast | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-05; #222 | Targeted accessible ink replacements implemented. |
| R-022 | Impact/Contact/initiative supporting-text contrast | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-05; #230 | Three affected surfaces switched to accessible meta ink. |
| R-023 | Dark admin-sidebar eyebrow contrast | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-05; #239 | Separate foreground tokens for light content and dark sidebar. |
| R-024 | Sub-12px text declarations | Open | 19 Companion fixed-pixel font declarations converted to equivalent rem values; enlarged-text browser and source-guard tests added | New fix candidate; cross-browser acceptance pending | AM-05 | Remaining public styles and production verification not closed. |
| R-025 | Overly tight multiline heading line heights | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-25 | Earlier typography improvements exist; all flagged declarations not closed. |
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
| R-053 | Oversized WebP assets/mobile variants | Open | No completed rollout | No verified new fix | AM-10 | Complete <=150KB mobile-delivery cleanup not evidenced. |
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
| R-075 | Missing llms.txt | Open | No completed rollout | No verified new fix | AM-27 | Not implemented; optional convention, not a proven critical defect. |
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
| N-13 | Development-tool braces advisory | Open | No completed rollout | No verified new fix | PR #215 review record | Unresolved dev dependency advisory; production-only/pruned-runtime audits clean. |
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
| N-16 | Invalid public delivery URL could be rejected after an S3 upload; credentials/query/fragments accepted | Validate before persistence and share safe-base policy with readiness | Five unsafe configurations reproduced; corrected probes pass | Parked candidate; not deployed |
| N-17 | Public media publication database lookup escaped the route error handler | Guard lookup and return empty no-store 503, Retry-After and noindex headers on failure | Real-handler probe failed on baseline; corrected probe passes before S3 access | Parked candidate; not deployed |

Combined local actual-module/handler probes: 14/14 pass with only inert external transports and persistence adapters. Add 14 hosted Vitest cases (13 storage, one route); local TypeScript syntax parsed, but Vitest dependencies unavailable. Hosted candidate lint/typecheck/unit/build/browser checks remain required. No live storage, deletion, upload or production configuration inspection occurred; no claim that production private records were exposed.
