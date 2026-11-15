# AF-R079 — read-only branch retention inventory

**Date:** 11 November 2026 IST  
**Scope:** local Git ancestry reporting and retained-history protection. No branch deletion.

## Evidence and meaning

- Connected GitHub branch-name search for `immazhark/amaana-platform` returned **784 unique branch names in 9 pages of 100** on 11 November 2026. This is a **name-only enumeration**; GitHub did not provide ancestry or retention approvals. The older handoff count (775 total, 539 contained, 236 unmatched) refers to an older source point and must not be asserted for current main.
- At the inspection checkpoint, protected `main` SHA was `e25987dd2223bfa459e15a1f9f0b4d99760237a9`. #684 was the only open PR and remains held for payment routing verification. Existing historical and financial-activation branches must not be deleted.
- `scripts/branch-retention-report.mjs` uses **only read-only local Git commands** (`rev-parse`, `for-each-ref`, `merge-base --is-ancestor`). It never fetches, pushes, resets, prunes, deletes or modifies repository refs. Without a complete non-shallow local `origin/main` and remote branch refs, it fails closed.
- This tool does **not** certify the local ref snapshot as a current or complete GitHub inventory. Even a branch whose tip is contained in main remains **review only**: live open-PR heads, current origin state, retention/legal requirements and per-branch owner decisions have not been checked.

## Controlled operator workflow

In an independently authorized, complete (non-shallow) local checkout with reviewed remote-tracking refs:

```sh
node --test scripts/test-branch-retention-report.mjs
node scripts/branch-retention-report.mjs
node scripts/branch-retention-report.mjs --json
```

The report groups:

- `PROTECT_MAIN`: current local main, never a deletion candidate
- `PROTECT_OPEN_PR`: only when an explicit verified PR-head list is provided to the pure classifier; the offline CLI **does not** obtain live PR status, so a zero count is **not** evidence that no PR heads exist
- `REVIEW_MERGED_PR_STATUS_UNVERIFIED`: contained in local main, but PR-head status and retention still unverified; **not** deletion-approved
- `PRESERVE_UNMERGED`: not contained in local main; preserve original history

Synthetic regression coverage creates temporary isolated Git repositories, checks merged/unmerged detection, asserts remote refs are unchanged after audit, and rejects missing main, duplicate refs, malformed SHAs and shallow ancestry. The new native test is run in the regular fast CI gate. Local test-first evidence: initial import failed RED before implementation; later four synthetic tests passed GREEN. CI and promotion evidence are recorded in the PR.

## Acceptance and limits

Implemented: bounded read-only local inventory script, native synthetic tests and CI wiring. This is **not** a deletion queue, exact full GitHub ancestry audit, branch retention policy change, or historical 149-item closure. Do not run `git branch -D`, `git push --delete` or GitHub branch deletion through this scope.

**Next guarded step:** review a complete non-shallow local ref snapshot and live open-PR mapping, then prepare a concrete per-branch retention recommendation for explicit owner review. No destructive operations were performed in this task. Rollback: revert script, test, workflow gate and coordination notes if needed; preserve branch history.

## 15 November 2026 — future merged-branch lifecycle policy

The earlier local `scripts/branch-retention-report.mjs` remains read-only and does **not** authorize deletion. The live connected GitHub name inventory returned **1,003** branches at this checkpoint. Name count alone does not prove merged ancestry, source preservation or deletion eligibility. The owner authorized a cleaner trunk-based lifecycle, with protected `main` and narrowly scoped short-lived task branches. An extra permanent staging Git branch is **not** required to create a staging environment.

### New-merge automation (separate from historical cleanup)

`.github/workflows/retire-merged-task-branch.yml` runs only on a merged same-repository PR into `main`, checks out current protected `main`, and invokes `scripts/retire-merged-branch.mjs`. The script refuses unmerged PRs, forks, PRs into other bases, unfamiliar branch prefixes, malformed names, protected refs, modified heads, open dependent PRs, explicit `retain-branch` labels, and merge commits that are not currently ancestors of `main`. It rechecks the original branch SHA directly before a single GitHub REST deletion; missing refs are treated as already retired. The script has no arbitrary branch CLI flags, and never works through names or dates alone. GitHub REST delete-ref has no atomic expected-SHA lease; the immediately preceding read reduces but cannot eliminate a concurrent-update race. Protect sensitive long-lived refs through GitHub branch rules and the explicit retention label.

**Allowed short-lived prefixes:** `fix/`, `feat/`, `perf/`, `test/`, `docs/`, `chore/`, `refactor/`, `ui/`, `polish/`, `content/`, `build/`, `ci/`, `qa/`. Historical, release, integration, infrastructure, operations and audit prefixes are never automatically retired. Automatic deletion after merge does not remove PR review history. Repository setting **Automatically delete head branches** should be checked by an authorized operator; if enabled, this workflow will observe the branch already gone and safely no-op.

### Historical backfill remains a separate verified operation

Historical branches are considered only through the **separate, pinned** `docs/mission-control/af-r079-approved-retirement-batch-20261115.json` manifest. Its first batch contains exactly twenty verified previously merged PR heads (#947, #948, #950–#955, #957–#960, #964, #966, #967, #969, and #970–#973); their exact branch SHAs and merge SHAs were checked against live GitHub main. The manifest-change `push` trigger runs `scripts/retire-approved-history.mjs`, which independently refetches each PR, verifies merged status/source/head/merge identity, and reuses the same protected-ref, dependent-PR, merge-ancestry and last-moment SHA guard as the future-merge path. Any mismatch preserves the ref. No other historical branch is authorized by this manifest. Before any historical deletion: pin live branch tip SHA, open PR heads, original and other associated PR state, merge-commit inclusion in current main, retention exceptions, unique/source commits, deployment/release refs and restoration path; recheck just before the action, and record the deletion manifest. A squash-merged PR head can be ahead of main even when its changes are present, so simple `merge-base` ancestry is insufficient. The old `phase-public-site-rebuild` integration and finance-held #684/#845 must remain protected.

**Release contract:** exact-head tests; ready-state verification; protected SHA-guarded merge; automated ordinary merged-head retirement if eligible; independent runtime/deployment SHA check. One PR per coherent change, not per test iteration. Work on an existing active PR head where the same scoped cause applies. No 149-item reclassification is implied by branch hygiene.
