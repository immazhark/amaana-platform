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
- PR #11 capped new designated donations to the appeal's current remaining need while preserving a normal ₹10 minimum and allowing an exact smaller final amount; squash-merged as `7f8eba057ddeec511bd4088cfece91a2e58d9eac` after full green CI.

## Current implementation task

Make the private donation acknowledgement accurately represent every payment lifecycle state instead of describing every non-captured record as merely "being verified."

## Current task branch / PR

- Branch: `fix/donation-acknowledgement-states`
- Base SHA: `7f8eba057ddeec511bd4088cfece91a2e58d9eac`
- PR: not opened yet at this checkpoint

## Problem found during continued donor-journey audit

The private acknowledgement page previously treated only `CAPTURED` as a special state. `FAILED`, `REFUNDED`, `AUTHORIZED`, and still-`CREATED` records all received the same "payment is being verified" message. That is inaccurate for a failed payment and materially misleading for a refunded donation. Partial refunds also remained invisible because a partially refunded donation keeps `CAPTURED` status while `refundedAmount` increases.

## Implemented on current task branch

- Added `getDonationAcknowledgementPresentation` in `src/lib/donations.ts` with explicit user-facing semantics for:
  - `CAPTURED`;
  - captured + partially refunded;
  - `REFUNDED` / fully refunded;
  - `FAILED`;
  - `AUTHORIZED`;
  - `CREATED` / fallback pending state.
- Updated the private acknowledgement query to include `refundedAmount` and `refundedAt`.
- Updated the acknowledgement page to show accurate headings/status copy, original amount, refunded amount when applicable, and a record date based on the most relevant lifecycle event.
- Reframed the printable sheet as a private transaction record so failed/refunded attempts are not presented as completed-donation receipts.
- Kept the existing noindex/no-referrer and token verification protections intact.
- Added regression tests covering captured, partial refund, full refund, failed, authorized and created states.

## Exact next action

1. Open a focused PR for `fix/donation-acknowledgement-states`.
2. Run full CI and repair any regression found.
3. Merge only when green.
4. Continue source-level payment/refund/assistance audit and then provider/browser E2E release gates.

## Repository areas currently sensitive

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
