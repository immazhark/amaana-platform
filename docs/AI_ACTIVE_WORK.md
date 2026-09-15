# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

## Active implementation owner
ChatGPT — user-directed takeover after Codex limit exhaustion on 16 September 2026.

## Integration checkpoint
- Branch: `phase-public-site-rebuild`
- HEAD: `52176da7a64f9ca4901210dd39eb081bed34f4b9`
- PR #23 (`Fix shared responsive navigation and companion overlap`) passed GitHub CI and was squash-merged by ChatGPT after takeover.
- Railway deployment for `52176da7...` is currently building; prior PR #22 deployment is verified SUCCESS.

## What Codex completed before exhaustion
- Performed a rendered responsive acceptance sweep across 21 priority public routes at 1440, 1024, 768, 430, 390 and 360px (126 combinations).
- Found and fixed persistent Islamic companion launcher overlap by keeping launchers in document flow.
- Fixed desktop/tablet navigation crowding by switching the whole navigation before labels collide, preserving the desktop hamburger hidden state and making the open mobile menu internally scrollable.
- Restored 44px mobile reminder/touch targets.
- Added three shared layout regression tests and `docs/RESPONSIVE_ACCEPTANCE_2026-09-16.md`.
- Local lint, TypeScript, existing tests and new regressions passed; GitHub CI for PR #23 subsequently completed successfully.

## Current implementation task
Resolve the runtime `/our-work` taxonomy discrepancy Codex recorded during rendered QA: the page still reported six cause areas, including a legacy Medical & Financial Aid category, even though the canonical taxonomy contains exactly five categories.

## Task branch
`fix/canonical-cause-runtime-reconciliation`

## Root cause under review
`prisma/apply-master-content.mjs` performs legacy-category migration only during a full master-content seed. Once the content-version marker matches, the function returns early after factual locks, so any stale published legacy Cause rows can survive indefinitely. The public `/our-work` query currently accepts every published cause rather than fail-closing to the five canonical slugs.

## Planned fix
1. Make legacy-category reconciliation idempotent and run it even when the master-content version is already current.
2. Add a public read-side canonical cause allowlist so stale/legacy rows cannot reappear on `/our-work` while database reconciliation catches up.
3. Add regression coverage protecting the five-category public taxonomy.
4. Run full CI, merge only when green, then verify Railway and rendered `/our-work`.
5. Continue launch-readiness acceptance from the generated QA/user-journey documents: payments, privacy-sensitive routes, accessibility/keyboard, dead links/redirects, faith review safeguards and admin/security boundaries.

## Factual and release locks
Read `docs/CURRENT_SOURCE_RECONCILIATION_2026-09-15.md` and `docs/canonical-factual-locks-2026-09-15.md`. Newborn ₹107,520; Winter 234 kits/234 beneficiaries with phase subsets; Taleem 25 combined. No factual or payment-readiness expansion without verified evidence. Main/production promotion remains gated.

## Do-not-touch without explicit need
- Current Amaana colour direction / premium visual language
- Canonical five-category taxonomy
- Private beneficiary evidence, media consent gates and retention controls
- Donation/payment/refund lifecycle except for focused verified defects
- Compliance claims still awaiting CA/legal/payment confirmation
