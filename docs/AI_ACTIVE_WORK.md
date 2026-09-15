# Amaana Platform — Active Implementation State

> This file is the current repo-implementation lock and handoff summary. Keep it short and current.

## State

**CHATGPT_ACTIVE**

## Active implementation owner

ChatGPT

## Integration branch

`phase-public-site-rebuild`

## Current integration checkpoint

- PR #8 locked the corrected Winter/newborn facts with regression protection; squash-merged as `2a7a4cd0bb454fb0d8e8380188bab6647b03672e` after full green CI.
- PR #9 reconciled official brand/media/governance source state; squash-merged as `bcc7246a8c9a90d02f76991ac980747647f41df9` after full green CI.
- PR #10 hardened appeal target/expiry closure; squash-merged as `df2ec8ed60c85ecf4402cea9080f6f3e31bb80f7` after full green CI.
- PR #11 capped new designated donations to the current remaining need; squash-merged as `7f8eba057ddeec511bd4088cfece91a2e58d9eac` after full green CI.
- PR #12 corrected private acknowledgement semantics for captured, pending, failed and refunded payment states; squash-merged as `dd5bddf8960ca2b5f638103b4ad8d82deab6a2d5` after full green CI.

## Current implementation task

Harden the private assistance admin workflow so state transitions and assignments cannot bypass the intended request → approval → appeal conversion process through direct server-action invocation.

## Current task branch / PR

- Branch: `fix/assistance-admin-workflow-guards`
- Base SHA: `dd5bddf8960ca2b5f638103b4ad8d82deab6a2d5`
- PR: not opened yet at this checkpoint

## Problems found during assistance-workflow audit

- `CONVERTED_TO_APPEAL` was offered as a normal manually selectable assistance status even though conversion is supposed to be performed atomically by the dedicated appeal-creation workflow.
- A converted request could subsequently be moved away from the linked-appeal state through the generic review action.
- `convertToAppeal` required `appeal.create` but did not independently require access/update permission for the private assistance request it consumes.
- The assignment action trusted the posted user id; the UI offered only eligible reviewers, but direct invocation could attempt to assign the request to a user who cannot access assistance records.
- The admin textarea had a 10,000-character limit only in the browser, not in the server action.

## Implemented on current task branch

- Added centralized manual assistance statuses and `isManualAssistanceStatusAllowed` in `src/lib/assistance.ts`.
- Reserved `CONVERTED_TO_APPEAL` for the linked conversion workflow rather than manual status selection.
- Made a linked/converted request status immutable through generic review while still allowing internal-note updates.
- Added server-side internal-note length enforcement.
- Added server-side assignee eligibility validation requiring an active user with `assistance.view` permission.
- Required both private assistance access/update permissions in addition to `appeal.create` before converting an approved request into a draft appeal.
- Added a status-update notification inside the conversion transaction so the applicant-facing tracked status and notification lifecycle stay aligned.
- Updated the admin UI to show converted status as workflow-owned and remove it from ordinary manual transitions.
- Added regression tests for manual/converted status boundaries.

## Exact next action

1. Open a focused PR for `fix/assistance-admin-workflow-guards`.
2. Run full CI and repair any regression found.
3. Merge only when green.
4. Continue source-level assistance/privacy/admin audit, then provider/browser E2E release gates.

## Repository areas currently sensitive

- private assistance records/documents and appeal conversion
- donation/payment reconciliation and appeal lifecycle
- canonical programme/factual sources
- public programme/media provenance data
- governance/compliance copy
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
