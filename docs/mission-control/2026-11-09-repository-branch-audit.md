# Repository branch and release audit — 9 November 2026 IST

This is a pinned ancestry inventory, not a repository-wide security or feature-completion certificate.

## Scope and evidence

All eight GitHub branch pages were enumerated and all 735 branch heads compared against protected main `9a97017200b6780a671f6186d30a22c1bf58d912`. Every comparison completed without an error. Machine-readable head SHAs and ahead/behind counts are in `2026-11-09-branch-ancestry.json`. Later-created branches and merges are outside this snapshot.

| Ancestry against pinned main | Branches | Meaning |
|---|---:|---|
| Behind, with zero unique commits | 505 | Ancestry-redundant; preservation and provider references still need filtering |
| Diverged | 228 | Unique commits remain; do not bulk-delete or bulk-merge |
| Ahead | 1 | Current owner-handoff branch at the snapshot |
| Identical | 1 | main |
| Total | 735 | All inspected |

## Preservation and cleanup boundary

No branch was deleted. The connected GitHub interface exposes no branch-ref deletion action, and shell Git could not authenticate to the available repository mirror. This is a capability boundary, not a request for repeat owner approval. Before deletion is executable, pin each current branch SHA again, exclude open-PR/provider/rollback/history dependencies and preserve its reachable commit history.

Keep `phase-public-site-rebuild`, historical `build/*` branches and recorded recovery/source branches. The preview provider still uses the historical integration branch. Keep every divergent WIP branch: one fund-ledger head retains 254 unique commits; a CWV WIP head retains one unique commit. Do not treat old source as current or merge schema/payment history wholesale. No new staging branch or history rewrite was introduced.

Ten recent ancestry-redundant candidates also have merged-PR evidence: the branches for #694, #695, #698 (three component heads), #701, #702, #703, #705 and #706. Candidate status is not deletion approval for a preserved reference; exact names and head SHAs are retained in the JSON inventory.

## Release consolidation completed

#709 (appeal staff names), #710 (assistance assignee name) and #711 (media-linked titles) were already implemented and fully tested. Their unchanged heads passed independent source review and separate ready-state checks, then merged with expected-head guards. Merges: `df2ed63e6430127dcb3a42f198776aac7642876b`, `95c57b39dc4fca725f54e3bdf49d40569cfb97f5`, `2e0603e489b2ed708214a85f3e005d5a7a47d0dd`. Railway deployment `3a6cbb9e-3a98-4079-96da-de99c97e9129` succeeded for #711; independent fresh public version returned that exact main/production SHA and readiness returned ready. #712 ownership documentation merged separately as `d4a67cb359bba49d788a3cb19cb69b9fc3f4837d`; its deployment was correctly SKIPPED for unwatched paths.

The next source candidate, #713 at `1a070db8c3a3fe6db839f9953733a379cd2fd247`, limits donation-detail linked appeal/event reads. Two synthetic regressions fail against the old query and all 13 pass with the correction. The full restored source tree matches 1,096 Git blob hashes; 2,743 native tests pass, 20 isolated database cases are skipped locally, strict TypeScript and full ESLint/Stylelint pass. Hosted isolated database and production checks separately pass. Final browser acceptance, ready-state, merge and runtime must be established from fresh provider state; this pinned audit does not pre-certify them.

## Bounded security review

Read five public nonpayment routes: page-view analytics, Web Vitals, giving-reminder download, Islamic companion and live rail, plus related origin/rate/body-bound/public-content helpers and tests. No concrete exploitable defect was found in that source scope. No active scan, private record or live payment was used; other routes and deployed journeys are not certified by this review.

The owner-confirmed ₹5,00,000 target and supplied receiving bank/UPI details were reconciled in #684 metadata. That draft remains a separate financial release candidate. Preserve domestic INR, privacy/redaction, tax-status and dormant notification/infrastructure boundaries. The historical 149-item classifications are unchanged.
