# Amaana Platform — Active Implementation State

> This file is the current repo-implementation lock and handoff summary. Keep it short and current.

## State

**CHATGPT_ACTIVE**

## Active implementation owner

ChatGPT

## Integration branch

`phase-public-site-rebuild`

## Current integration checkpoint

- PR #7 repaired the pre-existing lint gate and recalibrated the measured CSS budget; squash-merged as `69c3b0636cfaebabc311475b5a0dc83386a8680a`.
- PR #6 added the Codex ↔ ChatGPT single-writer continuity protocol; squash-merged as `fd6476710b0a99b6a83997e3c823f9f8d94b6ee0`.
- PR #8 locked the corrected Winter/newborn facts with regression protection; squash-merged as `2a7a4cd0bb454fb0d8e8380188bab6647b03672e` after full green CI.
- PR #9 reconciled official brand/media/governance source state; squash-merged as `bcc7246a8c9a90d02f76991ac980747647f41df9` after full green CI.

## Current implementation task

Harden the active appeal → donation lifecycle so a fully funded or expired appeal cannot continue accepting designated donations through a direct checkout URL, while preserving completed/funded appeals as public accountability records.

## Current task branch / PR

- Branch: `fix/appeal-target-closure`
- Base SHA: `bcc7246a8c9a90d02f76991ac980747647f41df9`
- PR: not opened yet at this checkpoint

## Problem found during source-level journey audit

The appeals index hid records once `amountRaised >= goalAmount`, but donation-page and order-creation logic only checked `status === PUBLISHED`. Because capture reconciliation incremented `amountRaised` without changing the appeal to `FUNDED`, a direct `/donate/[slug]` path could continue accepting a designated donation after the target had already been reached. Appeals with an elapsed `closesAt` could also remain directly donatable if an admin had not manually changed status.

## Implemented on current task branch

- Added shared fundraising-state helpers in `src/lib/appeals.ts`:
  - `isAppealOpenForDonations`
  - `shouldMarkAppealFunded`
  - shared amount conversion handling Prisma Decimal-like values.
- Updated `/appeals` to use the same eligibility rule as checkout instead of a separate amount-only filter.
- Updated `getDonationPageData` to fail closed when a PUBLISHED appeal is at/above target or its close time has passed.
- Updated `/api/donations/order` to re-check target/close eligibility immediately before creating a Razorpay order.
- Updated capture reconciliation so the first captured payment that takes a PUBLISHED appeal to or above target moves it to `FUNDED` within the same transaction.
- Existing in-flight orders remain reconcilable; the change blocks new checkout creation once target closure is known rather than pretending payment races cannot occur.
- Added `src/lib/appeals.test.ts` covering published/open, at-target, over-target, closed/funded/paused, future/past close dates, Decimal-like values and funded transition threshold logic.

## Exact next action

1. Open a focused PR for `fix/appeal-target-closure`.
2. Run full CI.
3. If green, merge into `phase-public-site-rebuild`.
4. Continue the source-level donor/assistance journey audit from the new integration head, then move into provider/browser E2E release gates.

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
