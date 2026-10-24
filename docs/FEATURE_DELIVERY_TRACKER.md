# Feature delivery tracker

Checkpoint: 25 October 2026. This is the feature-level view; the 149-row master execution register remains the detailed acceptance authority. A working public feature is not automatically a closed audit item.

## Current release

- Production/main: `91b3631b0323b9b0ac97d8298024f16deadce406` (PR #430).
- Railway website deployment `a3faf244-9e39-461a-a3e0-ffdae0a4d32a`: SUCCESS.
- Fresh public version matched the SHA and `/api/health/ready` returned `ready`.
- Next candidate: existing PR #431, consolidated navigation + Companion response-resilience batch. Fresh combined 2,145 unit tests pass /15 skipped,13 calendar/prayer tests pass, TypeScript and scoped lint pass. Initial browser run failed one stale parent-section aria-current expectation; correction and fresh full acceptance required; not released.
- Register: **1 completed / 59 historically implemented / 61 partial / 26 not started / 1 superseded / 1 not applicable**. These are audit classifications, not feature completion percentages.

## Mission Control audit

[Comprehensive26/59/61 itemized audit](./AMAANA_MISSION_CONTROL_AUDIT_2026-10-25.md) records current source, remaining work, blockers, undocumented stall reasons and completion steps for all146 open historical classifications. The remaining3 rows are separately accounted for.

The partial-work audit identifies17 genuine implementation gaps,27 measured source/acceptance gaps and17 external/manual acceptance gaps. Companion response resilience is the next prepared source batch; missing legal/provider/device evidence remains explicit.

## Prepared audit-tool follow-up

AF-R010/R011: remove the visual fixture innerHTML assignment and replace the custom new Function content loader with ordinary imported TypeScript tests through the existing pinned runner. Local2148 units pass/15skip; standalone audit and intentional invalid-fixture rejection pass. Stacked behind431; not merged/closed. No public-runtime feature change.

## Feature view

| Feature | Delivered capability | Remaining acceptance or implementation | Next iteration |
|---|---|---|---|
| Public navigation and discovery | Public routes, interrupted-navigation recovery, capture-target safety, archive filters, campaign entry links, annual edition index | #431 exact-page/parent-section announcements; real mobile, keyboard, zoom and screen-reader evidence | 1: finish #431 protected acceptance and release; verify nested-page announcements |
| Programme and impact presentation | Programme overview/detail pages, approved historical totals, year carousels and annual links | Route-specific CSS/media measurements, full responsive and accessibility acceptance | 2: measure representative pages and fix the largest reproducible layout or payload defect |
| Donations and acknowledgements | Domestic INR Razorpay flow, reviewed server protections, ordinary acknowledgement handling | Approved operational transaction/refund/reconciliation acceptance; tax-status evidence conflict | Separate finance-approved batch; no real charge/refund merely to make a test pass |
| Assistance requests and case review | Guided intake, uncertain-save recovery, private evidence and reviewer workflows | End-to-end role/privacy acceptance, retention/consent lifecycle and case anonymization decisions | 3: bounded read-only authorization/privacy review; implement only approved findings |
| Security and reliability | Dependency patching, client secret boundary checks, isolated non-delivering worker build | Current admin/API evidence, CSP/provider compatibility, edge policy decisions, restore/load drills | 3: highest-severity reproducible finding with scoped approval where required |
| Accessibility | Released carousel, keyboard, focus and motion recovery; #431 source correction ready | Real assistive-device and 400% zoom acceptance; remaining contrast surfaces | 1–2: navigation semantics first, then measured contrast/zoom defect batch |
| Performance | Payload budgets retained; measured CSS reduction and gallery validation payload work | Representative throttled-mobile LCP/INP/CLS, per-route CSS coverage and image weights | 2: baseline first; preserve aggregate caps and report measured before/after |
| Evidence and public transparency | Verification FAQ, public evidence pathways, reviewed programme outputs | Current rendered/schema parity evidence; media privacy/provenance review | 2: verify current public evidence and close only fully evidenced narrow items |
| Localization | Draft reviewed-language foundation in PR #374 | Approved Urdu/Telugu legal/error copy, real routes, RTL and canonical/hreflang acceptance | Blocked on reviewed translations; reuse #374 |
| Notifications and stewardship | Worker build isolation and safe startup completed (AF-N10) | Delivery authorization, provider authentication, suppression/consent and operational verification | Blocked: #264 stays open; delivery remains disabled |
| Partnerships and future giving | Historical source for sponsorship/volunteering/feedback and partnership journeys | Reviewed operational follow-through; unit costs, policies, partner vetting and data scopes | After core reliability; no unapproved recurring, WhatsApp, tax or religious-policy activation |

## Next three iterations

1. **Navigation accessibility release.** Finish #431 exact-head full CI, separate ready-state promotion, guarded merge and matching live deployment. Accept only the corrected current-page semantics; AF-R042 remains partial until manual acceptance is complete.
2. **Companion reliability, then measured public-page quality.** Publish the tested malformed-live-update and missing-tomorrow-prayer response handling; verify exact-head browser/build/budget acceptance and release it. Capture representative Home, Our Work, Impact and Donate measurements; inspect current FAQ/schema and public links. Select the largest reproducible low-risk accessibility/performance defect. Ship a coherent tested batch, with before/after evidence and unchanged budgets. Real Indian Android evidence remains unverified until actually obtained.
3. **Private-journey reliability.** Review anonymous/admin API boundaries and assistance/consent acceptance read-only. Present a concrete plan for any auth, donor-data, payment or security change before modification. Legal, provider and device evidence remain explicit external gates.

Iteration order may change for a proven higher-severity defect. Estimates do not imply a delivery date or bypass missing owner/CA/provider evidence.

## Update contract

At every batch boundary, update this file with:

- feature advanced and concrete resulting behavior;
- candidate/head, tests and outstanding acceptance;
- merged and live SHA independently;
- exact master-row movement, including no change where appropriate;
- next three feature outcomes and their blockers.

Do not count PRs as completed features. Preserve historical classifications when only a sub-scope advances. Do not reopen crypto or delayed-Zakat retention. Do not describe paused notifications as restored delivery.
