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
- Integration CI #463 passed the full verification pipeline after PR #7.
- PR #6 added the Codex ↔ ChatGPT single-writer continuity protocol; squash-merged as `fd6476710b0a99b6a83997e3c823f9f8d94b6ee0`.
- PR #8 locked the corrected Winter/newborn facts with structured regression protection; CI #466 passed the full pipeline and the PR was squash-merged as `2a7a4cd0bb454fb0d8e8380188bab6647b03672e`.
- Old PR #5 was closed without merge and is superseded by PR #8.

## Current implementation task

Reconcile stale durable project-state documentation so Codex/ChatGPT do not keep reopening already-resolved inputs or old factual errors.

## Current task branch / PR

- Branch: `docs/reconcile-current-project-state`
- Base SHA: `2a7a4cd0bb454fb0d8e8380188bab6647b03672e`
- PR: not opened yet at this checkpoint

## Implemented on current task branch

- Updated `AMAANA_BRAND_FOUNDATION.md` to recognize the supplied official SVG as source artwork and lock the verified colours:
  - Blue `#466FAA`
  - Gold `#E0B318`
- Preserved the user's instruction that this source verification must **not** trigger another palette redesign.
- Added `docs/CURRENT_SOURCE_RECONCILIATION_2026-09-15.md` to supersede stale older notes about:
  - brand ZIP extraction being a blocker;
  - missing programme/initiative media uploads;
  - governance spelling `Syed Iqba Ali` instead of `Syed Uqba Ali`;
  - stale Winter/newborn values.
- Updated `AGENTS.md` so every incoming implementation agent must read the reconciliation file before writing to the repo.

## Exact next action

1. Open a focused documentation/state-reconciliation PR.
2. Run CI and merge when green.
3. Continue the remaining correction/release queue from the latest integration head, prioritizing actual release gates rather than stale asset-collection work:
   - payment E2E;
   - assistance E2E;
   - responsive/browser QA;
   - accessibility verification;
   - production-like performance/CWV;
   - rendered SEO/crawl validation;
   - CA/legal confirmation inputs.

## Repository areas currently sensitive

- canonical programme/factual sources
- public programme/media provenance data
- governance/compliance copy
- donation/payment and assistance workflows
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
