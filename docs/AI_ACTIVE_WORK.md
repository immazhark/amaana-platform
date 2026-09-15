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
- PR #10 hardened appeal target/expiry closure across listing, detail, direct checkout, order creation and capture reconciliation; squash-merged as `df2ec8ed60c85ecf4402cea9080f6f3e31bb80f7` after CI #475 passed the complete pipeline.

## Current implementation task

Prevent a donor from intentionally submitting a single designated donation above the appeal's remaining need while preserving safe reconciliation for already-created payment orders.

## Current task branch / PR

- Branch: `fix/donation-remaining-cap`
- Base SHA: `df2ec8ed60c85ecf4402cea9080f6f3e31bb80f7`
- PR: not opened yet at this checkpoint

## Problem found during continued donor-journey audit

After PR #10, new checkout stops once an appeal is already at target. However, while an appeal is still below target, the order endpoint previously accepted any schema-valid donation up to ₹10,00,000 without comparing the requested amount with the appeal's remaining need. Example: if only ₹100 remains, a donor could request ₹50,000 and create a Razorpay order that materially exceeds the designated target.

## Implemented on current task branch

- Added `getRemainingAppealAmount` in `src/lib/appeals.ts`, reusing the shared Decimal/string/number amount handling.
- Updated `/api/donations/order` to reject a requested amount above the latest remaining need immediately before Razorpay order creation and return the current remaining amount.
- Updated `/donate/[slug]` to show the live remaining need and pass a transaction cap into the donation form.
- Updated `DonationForm` to set the browser-side amount maximum to the lower of the appeal's remaining need and the existing ₹10,00,000 per-transaction schema maximum.
- Added regression tests for exact remaining-need calculation and non-negative clamping.

## Important concurrency boundary

This change blocks deliberate over-target order creation using the current database state. Multiple donors can still create valid below-target orders concurrently before any one of them captures. Existing in-flight orders remain reconcilable by design. Eliminating all concurrent overfunding would require reservation/hold semantics or provider-aware capacity accounting and should be treated as a separate architectural decision rather than silently bolted onto checkout.

## Exact next action

1. Open a focused PR for `fix/donation-remaining-cap`.
2. Run full CI and repair any regression found.
3. Merge only when green.
4. Continue the source-level donation/assistance journey audit, then move into provider/browser E2E release gates.

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
