# Amaana Foundation — current verified state

**21 November 2026 IST.** GitHub source, CI, Railway deployment and independently retrieved public runtime are distinct boundaries. One writer: `CLAUDE_CODE_ACTIVE` (owner directive of 21 November continuing the 17 November handoff); independent read-only review permitted. PR numbers, SHAs and counts below are a snapshot: verify against live Git/PR state before use.

| Boundary | Verified state |
|---|---|
| Protected main | `17c73c14764afe9295a1e807b6ef94c3123a5382` (#1083 seasonal fixed-price fund campaigns) when this was written; later merges are listed in `docs/AI_ACTIVE_WORK.md` |
| Main CI | Red on three consecutive merges (#1082, #1078, #1083; run `44521205739` latest). Only `launch-review-capture.spec.mjs` failed, only `/impact` and `/donate`: a test-synchronisation defect (it read `main h1` at `domcontentloaded` and sampled the h1-free streamed fallback). PR CI never runs that spec (`visual` is set only for main pushes and manual releases). Fix: #1085. Green evidence: manual full-release run `44805878435` on the fix head, 1842 passed, all 16 impact/donate captures once each, no retries |
| Deployed state | Railway website deployment `1f953335-a499-4bed-8367-11d68db8ec58` SUCCESS for `17c73c14`; worker service deployments SKIPPED by watch rules, nothing activated. Public `/api/health/version` returned `17c73c14…` (`main`, `production`), `/api/health/ready` returned `ready` |
| Fund giving | **Closed.** `FUND_GIVING_ENABLED` off: public `/give` and `/funds` return a true HTTP 404. Built, not activated: fund registry and Zakat policies, fund-aware Razorpay order and bank/UPI transfer, admin spending ledger, `/give`, public `/funds` ledger, seasonal campaigns |
| Open PRs | #1085 launch-review readiness fix plus stale loading-guard fix; #1081 fund-giving browser acceptance (found and fixed a real 6.17:1 non-Zakat badge contrast failure); #1084 fund PostgreSQL invariants; #1086 receipt fee and campaign lines. Held and untouched: #684 UPI QR fallback, #845 staging-marker privacy |
| Original 149 accounting | Recounted 21 Nov from `docs/mission-control/149-item-status-2026-11-15.csv`: 149 unique IDs, 54 Completed / 12 Implemented / 64 Partial / 17 Not started / 1 Superseded / 1 Not applicable; 93 actionable. No whole-item promotion from bounded subscopes. AF-R090 stays Not started: #1083 is a mechanism, but approved prices, year and religious unit rules are still missing |

**Activation blockers for fund giving (owner decisions, none enabled):**
1. **AF-FUNDING-MATH.** For a fee-covered donation the Razorpay webhook records a full refund as `refundedAmount = gift + fee`, but the CHECK `Donation_refundedAmount_lte_amount_check` (migration `20260917090000`) caps it at the gift, so the real UPDATE would be refused. Mocked unit tests cannot see it. Not live today (fee cover is only on `/give`). Proposed fix is an additive relaxing migration (`refundedAmount <= amount + feeContributionAmount`); needs scoped owner approval for the schema and webhook-adjacent change.
2. Receipt accuracy for fee-covered and campaign gifts: addressed in #1086 (source only until merged and deployed).
3. Rate approval and unit rules for Taleem and seasonal prices (below).

**Taleem sponsorship:** owner directive recovered (Phase 2a pricing engine and baseline catalogue merged in #1071, `BASELINE_PENDING_APPROVAL`, checkout off). Section 22 authorises development, local and staging work; live price change, live Razorpay flow, recurring mandate and verified inventory need explicit approval. Persisting programme, units, months and rate version needs an additive schema decision not yet taken. Nothing is publicly displayed or collectable.

**Next executable task:** merge the open task PRs after their exact-head gates, then Taleem scope decisions; no forced deployment and no unapproved live financial, schema, RBAC, checkout CSP, cron, notification or infrastructure operation.

**Locks:** domestic INR only, no FCRA; 12A/12AB wording provisional, 80G evidence conflict unresolved; all identifiable public beneficiary/donor faces require reviewed redaction and EXIF/GPS removal. Preserve `public/brand/amaana-mark.svg`, blue `#466FAA`, gold `#E0B318`, cream identity, responsive keyboard/focus/reduced-motion behavior.
