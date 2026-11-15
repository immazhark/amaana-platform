# Amaana Foundation — current source and release state

**Checkpoint:** 15 November 2026 IST. Verify GitHub, Railway and public endpoints on each new work session. This file records current decisions; dated history lives in Git, PR checks and the handoff ledger.

## Source and deployment boundaries

| Boundary | Last verified evidence |
|---|---|
| Protected GitHub integration trunk | `main` at `4b2f8640a8ede388d041f87a4bd5f30c21ded9c0` (docs-only #978 merge) |
| Last successful application deployment | Railway website `3748f777-dd1c-45ee-b8ba-1767bb06f5d6`, source `820578baef7103304394bcaa034eec9371bba4d7` |
| Independent public runtime identity | Fresh `/api/health/version` returned branch `main`, environment `production`, commit `820578baef7103304394bcaa034eec9371bba4d7`; `/api/health/ready` returned `ready` |
| Docs-only source vs runtime | Railway marked #978 `SKIPPED`; do not force a website rollout to align unrelated source commits |
| Current implementation owner | `CHATGPT_ACTIVE`, one implementation writer, branch and PR details in [AI_ACTIVE_WORK](./AI_ACTIVE_WORK.md) |

These public health checks prove version identity and readiness only, not live payments, field Web Vitals, accessibility certification or legal/beneficiary acceptance.

## Active implementation and release queue

- **PR #980 — AF-R079 repository hygiene (draft, unmerged):** guarded short-lived branch retirement; verified first 20 historical branch candidates; operational instruction correction; elimination of duplicate historical current-state content and seven superseded unreferenced audit notes. No deletions of GitHub branches are claimed before post-merge execution. Exact-head CI and separate promotion remain required.
- **PRs #974, #975, #977, #979:** isolated CSS audit, structured-data audit and INR formatter corrections. Full selected tests and ready-state promotion must complete independently.
- **PRs #684 and #845:** finance/privacy scope held pending separately reviewed account/payment or production-eligibility approvals; no speculative activation.
- **Historical integration:** `phase-public-site-rebuild` is behind protected `main` with zero ahead on the inspected comparison. Preserve it until retention evidence and dependencies are reconciled.

## Original 149-item register

**35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable = 149.** Scope-limited fixes, documentation retirement and test coverage do not promote whole backlog items. [Canonical register](./mission-control/149-item-status-2026-11-15.csv) and [active queue](./mission-control/active-backlog-2026-11-15.csv) hold individual acceptance gaps.

## Standing safeguards

Domestic INR donations only; no FCRA. Maintain the unresolved 80G pending/provisional conflict and provisional 12A/12AB wording without issuing statutory certificates. Private beneficiary or donor faces require reviewed redaction and metadata removal. Do not touch real donor records, secrets, live payments/refunds, schema migrations, notifications or Railway infrastructure without a separately scoped plan/approval. Preserve the official blue/gold brand and existing application stack.

## Next executable action

Complete #980's **current exact-head** required checks; promote only when green and no unresolved review threads, then run separate ready-state verification and protected expected-head SHA merge. Verify whether guarded retirement actually removes the first eligible refs, inventory the post-cleanup count, and classify the rest from live evidence. Keep the historical ledger, Git commits and PRs for inspection instead of appending another long checkpoint here.

