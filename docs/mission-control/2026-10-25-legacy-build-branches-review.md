# AF-R079 — legacy `build/*` branch retention decision record

**Evidence date:** 25 October 2026 (IST)  
**Scope:** Nine historical `build/*` branches. **No deletion is authorized by this document.**  
**Baseline:** Protected GitHub `main` at `95bd57982b8b968f77cd095b2703edbf295dedd2`.  
**Related audit:** [Canonical 149-item Mission Control](../AMAANA_MISSION_CONTROL_AUDIT_2026-10-25.md). AF-R079 remains **Not Started** until a reviewed, actually executed and reconciled cleanup is evidenced.

## Verified inventory

GitHub's branch API returned nine non-protected `build/*` refs. For each, GitHub `compare_commits(base=branch, head=main)` returned `behind_by=0`: the branch tip is an ancestor of `main` and contains **zero commits absent from main**. GitHub's open-PR query filtered by each exact head name returned no open PR.

| Branch | Exact retained tip SHA | Main commits ahead | Branch-only commits | Open PRs |
| --- | --- | ---: | ---: | ---: |
| `build/admin-rbac-v1` | `d3633c37b2f19fc14db3d2558f5742c1dfa80ecf` | 3613 | 0 | 0 |
| `build/appeal-workflow-v1` | `f7aefa31ba76bf99472cee3a48ef91197e4e727a` | 3612 | 0 | 0 |
| `build/content-seo-v1` | `7199228ef5077a7c8fbcdbd7c1e9435f34a0bb86` | 3610 | 0 | 0 |
| `build/donations-razorpay-v1` | `2a29c5ae845bf6ae30034436ea8659818d8a629a` | 3611 | 0 | 0 |
| `build/foundation-v1` | `e11b38cef9839610d93fccec330ddfbac148a99b` | 3615 | 0 | 0 |
| `build/intake-backend-v1` | `d044ce7b650cee6c5c77ce14bb77ef79e0ef8311` | 3614 | 0 | 0 |
| `build/launch-readiness-v1` | `e7780fee041d6f88fb1373f5ce7ef88ec4568806` | 3609 | 0 | 0 |
| `build/low-cost-staging` | `c7628f78eaaaae1e328b32000273000c347f2ebd` | 3607 | 0 | 0 |
| `build/multi-method-donations` | `24da96c8c5ea126096a6609c3ead623a2b845ebd` | 1532 | 0 | 0 |

**Interpretation:** Merged ancestry and no open PR reduce the risk of archiving a branch name. Neither fact proves that release runbooks, deployments, operators, old tags, or recovery workflows do not reference it. Main being ahead by thousands of commits is not proof of safe deletion.

## Required acceptance before an exact branch-name cleanup

1. **Revalidate the baseline.** Get each current branch SHA and protected `main` SHA from GitHub. Abort if any branch moved. Re-run the ancestor comparison. Keep `main` and all protected refs outside the operation.
2. **Check references.** Search current and historical docs, release scripts, GitHub Actions workflows, Railway settings, tags and open/closed PR cross-references. A zero-hit code search is not conclusive for an external system.
3. **Confirm recoverability.** Preserve each exact tip in an immutable change record and confirm that GitHub can still retrieve it. Identify the operator restoration route and whether any independent archive/tag is required.
4. **Obtain the exact deletion list.** Require a second review of each branch, with exclusions for recovery, legal records, staging workflows, external automation, or unclear ownership.
5. **Delete with SHA protection if eventually authorized.** Re-read each tip immediately before deletion; abort that branch on a mismatch. Do not use wildcard or bulk pruning, and do not modify `main`. Re-run a fresh branch list after execution.
6. **Verify and reconcile.** Record success/failure for each ref, the restoration evidence, before/after counts, and any unexpected reference consumers. Only then revisit AF-R079 classification.

## Out-of-scope controls

No branch was deleted, renamed, rebased, or force-pushed for this review. No runtime code, CI requirement, Railway service, database, beneficiary or donor data, Razorpay configuration, refund, notification worker, or official foundation claim changed.

A previous read-only enumeration found 465 remote branches across all prefixes. That total is a snapshot, not a deletion target. The remaining 456 refs are **not classified for cleanup** by this decision record.
