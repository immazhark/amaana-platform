# Amaana Platform — Active Implementation State

> This file is the current repo-implementation lock and handoff summary. Keep it short and current.

## State

**CHATGPT_ACTIVE**

## Active implementation owner

ChatGPT

## Integration branch

`phase-public-site-rebuild`

## Current integration checkpoint

- PR #17 aligned assistance/privacy/donation/refund/terms notices with the generated governance masters; squash-merged as `ac5d14c08bef0b70e3b8467c19fb384aa767cef9` after full green CI and successful Railway deployment.
- PR #18 aligned SEO metadata, structured breadcrumbs, sensitive-case indexing and redirect governance; squash-merged as `b8271d1c1d5adae2972266371ea7377a3cd865a4` after full green CI and successful Railway deployment.
- PR #19 added a fail-closed media consent/provenance/privacy publication gate and structured review audit records; squash-merged as `069c80a07620e41abb4642288e90e9abcec03cbb` after full green CI. Railway deployment is in progress.

## Current implementation task

Implement an auditable private-evidence retention/deletion workflow from the generated Data Retention & Access Control Policy without inventing statutory retention periods that still require CA/legal/safeguarding confirmation.

## Current task branch / PR

- Branch: `feat/retention-review-workflow`
- Base SHA: `069c80a07620e41abb4642288e90e9abcec03cbb`
- PR: to be opened after CI-ready checkpoint

## Document-led requirements

- Retain only for operational, verification, accounting/audit, compliance, safeguarding, dispute or institutional-history need.
- Closed beneficiary cases should periodically review whether raw evidence is still necessary.
- Deletion of sensitive evidence must be authorised and logged.
- Legal/audit/investigation/safeguarding holds suspend normal deletion.
- Exact statutory periods must not be invented before professional confirmation.
- Private-file links remain short-lived and access-controlled; public completion pages may remain even if raw verification proof is later removed.

## Implemented on current task branch

- Added `/admin/retention`, restricted to users with `assistance.approve`.
- Lists current private assistance documents with request/appeal status and prior retention/hold history.
- Supports `Retain and review later`, `Place hold`, `Release hold`, and `Permanently delete raw evidence` decisions.
- Every decision requires a reason and is recorded in `AuditEvent`; optional future review dates are internal metadata only, not claimed legal deadlines.
- Deletion is blocked while a legal/audit/safeguarding hold is active.
- Deletion is blocked while the request or linked appeal remains active; it becomes technically eligible only after request closure/rejection or linked appeal closure.
- Physical private-storage deletion is performed before deleting the corresponding database record, prioritising removal of sensitive bytes if persistence cleanup later fails.
- Deleted-document audit records preserve only the operational deletion record and basic file metadata, not the document contents.
- Added an authorised Retention review navigation entry; ordinary assistance viewers do not see it.

## Exact next action

1. Open focused PR for `feat/retention-review-workflow`.
2. Run complete CI and repair any Prisma/type/lint/build regression.
3. Merge only when fully green and verify Railway.
4. Then move into staging/browser acceptance journeys using the generated Launch Content & Trust QA checklist: assistance, payment, no-active-appeal, completed appeal, privacy, mobile, accessibility, SEO and broken-link paths.
5. Any browser-discovered defect becomes a focused repair PR; do not restart design.

## Repository areas currently sensitive

- private assistance records and raw verification files
- retention/legal-hold/deletion audit trail
- media consent/provenance/privacy review
- sensitive-case search/social metadata
- donation/payment/refund lifecycle
- public policy/compliance copy awaiting professional review where noted
- current visual/colour direction — do not redesign without explicit user request

## Locked facts relevant to implementation

- Winter Drive 2025–26: **234 Winter Kits distributed to 234 beneficiaries**.
- 8-day-old newborn case: **₹107,520**.
- Qurbani 2025: **15 animals; 150+ families**.
- Qurbani 2026: **28 sheep; 350 boxes; 350+ families; ~380 kg handled overall**.
- Eid Gift Kits 2026: **710**.
- Taleem Nazira + Hifdh: **25 students combined** as of Sep 2026.
- 80G remains **provisional**; 12A/12AB remains pending CA confirmation in public copy.
- Amaana is not FCRA-registered; public fundraising remains domestic only.

## Handoff instruction

When the user switches repo implementation back to Codex, ChatGPT must stop repo writes, update this file to `HANDOFF_PENDING`, append the transition to `AI_HANDOFF_LEDGER.md`, and leave the exact current branch/PR/SHA/CI/next-action summary.

When Codex limits are exhausted again, ChatGPT must inspect GitHub first and continue from the recorded boundary rather than recreating work.
