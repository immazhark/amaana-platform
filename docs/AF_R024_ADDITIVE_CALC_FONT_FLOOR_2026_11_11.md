# AF-R024 — Same-unit additive CSS calc font-size audit

**Date:** 11 November 2026 IST. **Writer:** CHATGPT_ACTIVE, one implementation writer.  
**Scope:** native CSS font-floor auditor and synthetic test only. No application CSS or client runtime changes.

## Reproduced behavior and test-first evidence

The existing `scripts/public-font-floor.mjs` already folds constant `calc()` products and quotients following merged PR #765. However, its fallback measures each literal operand of `calc(.5rem + .25rem)` and `calc(20px - 4px)`, incorrectly reporting those **safe final values** as sub-12px. Conversely, `calc(12px - 13px)` has two operands individually at or above 12px but a **negative** final result, and can evade the operand-only audit.

Synthetic test-first head `a36ddc6565439c9aaa1929474338628e864289f4`, hosted CI run `43032624326`, fast job `130563380233`: **RED** at `Guard public CSS minimum type size`, specifically `same-unit CSS calc additions and subtractions use the computed final font-size` (`ERR_ASSERTION`, safe-value array comparison). This verifies that the original behavior does not satisfy the new regression.

## Minimal correction

Commit `9b3b3c9a725b921fbc690bd8626af5e81a1da1d6` adds a direct `calc(<length> +|- <length>)` parser only when the two literal length units match (`px` with `px`, or `rem` with `rem`). It folds the resulting numeric value, then reuses the existing 12px / 0.75rem thresholds and non-finite number rejection. It leaves mixed units, nested expressions, variables, viewport units, multiplication/division, shorthands, clamp behavior, comments, and icon-only zero handling unchanged.

Positive fixtures: `calc(.5rem + .25rem)`, `calc(20px - 4px)`, `calc(11px + 2px)`, `calc(1rem - .125rem)`. Rejected fixtures: `calc(.5rem + .2rem)`, `calc(16px - 5px)`, `calc(12px - 13px)`.

## Release boundary

- Branch `fix/public-font-floor-additive-calc-20261111` originally based on protected `main` SHA `531877cad4a6c7f04c7472720ed409a91f3b55aa`. The independent AF-R025 browser-geometry PR #766 may merge while this source-only PR runs. Reconcile conflicting coordination records if needed; preserve verified source history.
- A fresh full **exact-head** GREEN CI run on the corrected candidate, independent review, separate ready-state promotion and SHA-guarded merge are mandatory. RED is not acceptance.
- This sub-scope is not a rendered-typography WCAG audit, a fix for actual tiny public copy, or complete AF-R024 closure. Historical 149 backlog classifications remain unchanged.
- No payments, credential/secret handling, legal/tax content, donor data, identifiable media, CSS, Prisma schema, provider integrations or live Railway configuration changed. PR #684 remains held for independent payee/routing verification and separately scoped activation approval.

Rollback: revert the isolated parser, tests and evidence if fresh CI or later layout findings contradict the arithmetic contract. Do not weaken the existing minimum thresholds.
