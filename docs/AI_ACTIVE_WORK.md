# Amaana Platform — Active Implementation State

> This file is the current repo-implementation lock and handoff summary. Keep it short and current.

## State

**CHATGPT_ACTIVE**

## Active implementation owner

ChatGPT

## Integration branch

`phase-public-site-rebuild`

## Current implementation task

Resolve the factual-lock correction PR, then continue the current factual/content correction queue against the actual development branch.

## Current task branch / PR

- Branch: `fix/canonical-factual-locks-2026-09-15`
- PR: #5 — `Lock corrected Winter and newborn canonical facts`
- PR base: `phase-public-site-rebuild`
- PR head at last check: `ac7ae66b4694edd5d4772b991fe5dc008e12a39b`

## Completed in current ChatGPT implementation session

- Corrected the canonical newborn case amount to **₹107,520**.
- Corrected Winter Drive 2025–26 to **234 Winter Kits distributed to 234 beneficiaries**.
- Preserved Phase 1 `96 madrasa students` and Phase 2 `101 Winter Kits` as sub-measures only.
- Opened PR #5 against the integration branch.
- Inspected CI for PR #5.

## Current CI state

PR #5 CI is **failing at lint**, after campaign/media tests, archive filters, daily companion tests, Prisma generation and Prisma validation all passed.

Observed lint failures:

- `scripts/verify-master-content.cjs`: six `@typescript-eslint/no-require-imports` errors.
- `src/app/not-found.tsx`: one `react/no-unescaped-entities` error.

These failures are outside the two files changed by PR #5 and appear to be pre-existing on the integration branch; incoming agent must verify base-branch status before classifying definitively.

## Exact next action

1. Determine whether the two lint failures reproduce on `phase-public-site-rebuild` unchanged.
2. If pre-existing, create/continue a narrow lint-repair task without mixing unrelated redesign/content changes.
3. Get PR #5 to a understood/green merge state and merge only when safe.
4. Continue the remaining correction queue from the current branch state, not from old planning assumptions.

## Repository areas currently sensitive

- `prisma/master-programmes.json`
- `prisma/apply-master-content.mjs`
- public programme/media provenance data
- canonical governance/compliance copy
- current visual/colour direction (do not redesign without explicit request)

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

When the user switches repo implementation back to Codex, ChatGPT must stop repo writes, update this file to `HANDOFF_PENDING`, append the transition to `AI_HANDOFF_LEDGER.md`, and provide Codex the current branch/PR/SHA/CI/next-action summary.

When Codex limits are exhausted again, ChatGPT should first inspect GitHub for changes made since this record, then update this file before resuming.
