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
