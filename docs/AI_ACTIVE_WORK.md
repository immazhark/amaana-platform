# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

## Active implementation owner
ChatGPT — continuing launch-hardening without parallel repository writers.

## Integration checkpoint
- Integration branch: `phase-public-site-rebuild`
- Verified integration head: `b1e1f733b8aa71da2fba29b77ca515bb3ddee63f`
- PR #50 `Unify page hero hierarchy across public site` is merged.
- Post-merge integration CI run `35042092753` passed the complete workflow.
- Railway preview deployment `c8d951c6-8df2-41ba-b40e-a2c762b5e74a` is SUCCESS on exact integration SHA `b1e1f733b8aa71da2fba29b77ca515bb3ddee63f`.
- No open PRs existed when this task branch was started.

## Current task branch
- Branch: `test/browser-e2e-accessibility`
- Base: `b1e1f733b8aa71da2fba29b77ca515bb3ddee63f`
- Purpose: add durable browser-level responsive/accessibility coverage for representative public page families after the shared hierarchy/header work.

## Latest completed implementation
PR #50 introduced the shared `PageHero` hierarchy across Level 1, Level 2, Trust & Policies, and purpose-led public pages while preserving approved media/fallback behavior. Superseded hero CSS was consolidated rather than weakening the existing bundle budget.

The final PR and post-merge CI both passed media/privacy validation, factual locks, Prisma validation, lint, typecheck, unit coverage, production build, unchanged JS/CSS bundle budgets, and server smoke checks. Railway preview is healthy on the merge SHA.

## Current implementation scope
1. Add browser E2E/accessibility acceptance using Playwright + axe without modifying production runtime dependencies.
2. Cover representative public page families with automated accessibility checks.
3. Add viewport acceptance at 1440, 1024, 768, 430, 390 and 360px with horizontal-overflow guards.
4. Exercise keyboard focus/navigation and reduced-motion behavior.
5. Keep rendered human visual review explicitly open; automation does not substitute for screenshot/pixel/assistive-technology acceptance.

## Remaining launch-hardening priorities
1. Complete real rendered UX/UI acceptance at 1440, 1024, 768, 430, 390 and 360px, plus 200% zoom, keyboard-only, reduced motion, mobile navigation, Islamic companion and Back-to-Top overlap checks.
2. Land and maintain durable browser E2E/accessibility coverage.
3. Continue performance hardening, especially measured CSS consolidation and image/client-delivery optimization without redesigning the approved visual system.
4. Complete donation journey and assistance journey E2E/operational acceptance.
5. Complete editorial/CTA/terminology consistency and SEO/social/canonical/schema QA.
6. Complete human public-media privacy/consent/provenance review and protected-storage audit.
7. Complete admin operational simulation, external compliance/payment closures, launch rehearsal and production cutover.

## Current acceptance constraints
- Source/automation checks must not be described as pixel-level or assistive-technology browser verification.
- Do not attempt a real donation or financial transaction without explicit user authorization.
- Do not introduce private beneficiary evidence or restricted media into public fixtures.
- Do not weaken bundle budgets merely to accommodate redundant CSS.
- Do not merge to `main` or perform production cutover without the user-approved launch step.

## Factual and release locks
Read `docs/CURRENT_SOURCE_RECONCILIATION_2026-09-15.md` and `docs/canonical-factual-locks-2026-09-15.md`. Newborn ₹107,520; Winter 234 kits/234 beneficiaries; Taleem 25 combined. Canonical taxonomy contains exactly five categories. Main/production promotion remains gated.

## Do-not-touch without explicit need
- Current Amaana colour direction / premium visual language
- Canonical five-category taxonomy
- Private beneficiary evidence, media consent gates and retention controls
- Donation/payment/refund lifecycle except for focused verified defects
- Compliance claims awaiting CA/legal/payment confirmation
