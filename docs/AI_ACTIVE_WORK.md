# Amaana Platform — Active Implementation State

> This file is the current repo-implementation lock and handoff summary. Keep it short and current.

## State

**CHATGPT_ACTIVE**

## Active implementation owner

ChatGPT

## Integration branch

`phase-public-site-rebuild`

## Current integration checkpoint

- Integration head when this task branch was created: `fd6476710b0a99b6a83997e3c823f9f8d94b6ee0`
- PR #7 (pre-existing lint + measured bundle-gate repair) was squash-merged as `69c3b0636cfaebabc311475b5a0dc83386a8680a`.
- Integration CI #463 passed media validation, reviewed-campaign tests, archive filters, daily-companion tests, Prisma generate/validate, lint, typecheck, coverage, production build, bundle budgets and post-build server smoke checks.
- PR #6 (Codex ↔ ChatGPT continuity protocol) was squash-merged as `fd6476710b0a99b6a83997e3c823f9f8d94b6ee0`.
- Old PR #5 was closed without merge because its base had become stale; the factual corrections are being reapplied cleanly from the current integration head.

## Current implementation task

Lock the two user-confirmed factual corrections into the current implementation without disturbing the existing visual direction:

1. 8-day-old newborn medical-aid case = **₹107,520**.
2. Winter Drive 2025–26 = **234 Winter Kits distributed to 234 beneficiaries**.

Phase 1 `96 madrasa students` and Phase 2 `101 Winter Kits` remain supporting sub-measures only and must not be added to 234.

## Current task branch / PR

- Branch: `fix/canonical-factual-locks-v2`
- Base: `phase-public-site-rebuild`
- PR: not opened yet at this checkpoint

## Exact next action

1. Add a structured factual-lock source so confirmed corrections are not scattered as ad-hoc page edits.
2. Apply those locks during canonical-content migration even when the existing master content version has already been seeded.
3. Add regression verification for the locked values.
4. Open a focused PR, run CI and merge only when green.
5. Then continue stale-risk/document cleanup (official logo/brand source, completed media-upload status, old governance typo) as a separate atomic task.

## Repository areas currently sensitive

- `prisma/master-programmes.json`
- `prisma/apply-master-content.mjs`
- public programme/media provenance data
- canonical governance/compliance copy
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

## Known stale documentation/content to address after this atomic task

- Older repo documentation still describes official brand/logo extraction as blocked, but `public/brand/amaana-mark.svg` is present and contains the verified blue `#466FAA` and gold `#E0B318` fills.
- Older risk documentation still treats authentic media population/source completeness as missing uploads; the user has confirmed all available drive/initiative images and data images have now been uploaded to Codex/repo workflow. Publication/provider verification remains a separate issue.
- Some older implementation logs still contain `Syed Iqba Ali`; current public governance source correctly uses **Syed Uqba Ali**.

## Handoff instruction

When the user switches repo implementation back to Codex, ChatGPT must stop repo writes, update this file to `HANDOFF_PENDING`, append the transition to `AI_HANDOFF_LEDGER.md`, and provide Codex the current branch/PR/SHA/CI/next-action summary.

When Codex limits are exhausted again, ChatGPT should inspect GitHub first, reconcile any newer commits/PRs, update this file, then resume from the existing implementation boundary rather than recreating work.
