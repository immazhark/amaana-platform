# Amaana Platform — Active Implementation State

> This file is the current repo-implementation lock and handoff summary. Keep it short and current.

## State

**CHATGPT_ACTIVE**

## Active implementation owner

ChatGPT

## Integration branch

`phase-public-site-rebuild`

## Current integration checkpoint

- Integration head when this task branch was created: `fd6476710b0a99b6a83997e3c823f9f8d94b6ee0`.
- PR #7 (pre-existing lint + measured bundle-gate repair) was squash-merged as `69c3b0636cfaebabc311475b5a0dc83386a8680a`.
- Integration CI #463 passed media validation, reviewed-campaign tests, archive filters, daily-companion tests, Prisma generate/validate, lint, typecheck, coverage, production build, bundle budgets and post-build server smoke checks.
- PR #6 (Codex ↔ ChatGPT continuity protocol) was squash-merged as `fd6476710b0a99b6a83997e3c823f9f8d94b6ee0`.
- Old PR #5 was closed without merge because its base had become stale.

## Current implementation task

Lock the two user-confirmed factual corrections into the current implementation without disturbing the existing visual direction:

1. 8-day-old newborn medical-aid case = **₹107,520**.
2. Winter Drive 2025–26 = **234 Winter Kits distributed to 234 beneficiaries**.

Phase 1 `96 madrasa students` and Phase 2 `101 Winter Kits` remain supporting sub-measures only and must not be added to 234.

## Current task branch / PR

- Branch: `fix/canonical-factual-locks-v2`
- Base: `phase-public-site-rebuild`
- PR: **#8 — Lock corrected Winter and newborn facts on current rebuild**
- PR head at open: `e11ca94d363b980cf9c3247438684d4b1d36cbc5`
- CI: run **#465** currently executing at this checkpoint.

## Implemented on PR #8

- Added `prisma/canonical-factual-locks.json` as the structured correction layer.
- Updated `prisma/apply-master-content.mjs` so user-confirmed factual locks are applied even when the broader master content version is already seeded.
- Kept legacy Winter records aligned with the corrected overall metric while retaining phase figures as supporting context.
- Added `scripts/test-canonical-factual-locks.mjs`.
- Added the factual-lock test to CI.
- Added `docs/canonical-factual-locks-2026-09-15.md` documenting precedence over the older stale values still present in `prisma/master-programmes.json`.
- Updated the repo-native ChatGPT/Codex implementation ledger.

## Exact next action

1. Inspect CI #465.
2. If green, merge PR #8 into `phase-public-site-rebuild`.
3. Start a separate atomic cleanup branch for stale durable repo facts:
   - official logo/brand source is now available;
   - all available programme/initiative media and data images have been uploaded;
   - old governance typo `Syed Iqba Ali` should be corrected in durable logs.
4. Continue remaining factual/content correction queue against the current integration head.

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
- Older risk documentation still treats authentic media population/source completeness as missing uploads; the user has confirmed all available drive/initiative images and data images have now been uploaded. Publication/provider verification remains a separate issue.
- Some older implementation logs still contain `Syed Iqba Ali`; current public governance source correctly uses **Syed Uqba Ali**.

## Handoff instruction

When the user switches repo implementation back to Codex, ChatGPT must stop repo writes, update this file to `HANDOFF_PENDING`, append the transition to `AI_HANDOFF_LEDGER.md`, and provide Codex the current branch/PR/SHA/CI/next-action summary.

When Codex limits are exhausted again, ChatGPT should inspect GitHub first, reconcile any newer commits/PRs, update this file, then resume from the existing implementation boundary rather than recreating work.
