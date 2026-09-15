# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

## Active implementation owner
ChatGPT — continuing launch-hardening after the visual-consistency merge.

## Integration checkpoint
- Integration branch: `phase-public-site-rebuild`
- Current integration head: `a3a864e0141da39ce0d225f33eb131e7e51b69b1`
- PR #42 (`Standardize visual media and top-banner geometry`) is merged.
- PR #42 CI completed successfully, including public-media validation, factual locks, Prisma validation, lint, typecheck, 121+ unit tests, production build, CSS/JS bundle budgets and post-build smoke checks.
- Railway staging deployment `672089e4-386e-42f8-bf25-36c5a49e3f18` is confirmed SUCCESS for integration commit `a3a864e0141da39ce0d225f33eb131e7e51b69b1`.

## Current task branch
- Branch: `fix/sitemap-sensitive-appeals`
- Base: `a3a864e0141da39ce0d225f33eb131e7e51b69b1`
- Purpose: close the remaining search-discovery privacy gap so highly sensitive assistance-linked appeals are never promoted through the XML sitemap.

## Visual-system rules now merged
- Public interior top banners use one desktop/tablet height language and content-led mobile geometry.
- Longer banner copy adapts through typography/line wrapping rather than pushing elements outside the banner.
- Shared containment rules prevent text, buttons and media from escaping their columns.
- Work/cause/initiative lists have predictable visual slots; approved real Amaana media remains preferred over placeholders.
- Specific programme/initiative/appeal detail pages use left-copy/right-visual hero geometry.
- Back-to-top is visually icon-only with an accessible name.
- Obsolete legacy v2 homepage CSS was pruned instead of weakening the production bundle budget.

## Current privacy hardening
- `src/app/sitemap.ts` now reads the linked assistance verification confidentiality level for public appeals.
- `HIGHLY_SENSITIVE` appeals remain directly reachable only where public accountability rules permit, but are excluded from search-discovery sitemap output.
- Standard, confidential and non-assistance-linked public appeals remain sitemap-eligible.
- A dedicated unit-tested helper enforces this search-discovery boundary.

## Next actions
1. Run CI for the sitemap privacy branch and repair any regression.
2. Merge only when all gates are green.
3. Verify the privacy-hardening Railway deployment after merge.
4. Continue the launch-hardening queue without waiting for user prompts unless a decision or external confirmation is required.

## Remaining launch-hardening queue
1. Performance remediation: continue consolidating global CSS, image delivery, hydration/network work and caching.
2. Add durable browser E2E + accessibility coverage when a browser-capable execution surface is available.
3. Donation journey E2E and production-gateway readiness checks.
4. Assistance journey E2E including upload/status/admin lifecycle.
5. Full public editorial/grammar/CTA consistency pass.
6. Final SEO/social-sharing/canonical/schema audit.
7. Public-media storage/privacy audit: only intentionally public-safe assets may remain directly addressable under `/public`.
8. Admin operational simulation from intake through closure/retention.
9. External compliance/business closures and production launch rehearsal.

## Current acceptance constraints
- Browser-level pixel/geometry inspection requires an actual browser-capable execution surface. Source/static checks and Railway/API acceptance can continue here; browser-only visual assertions must not be claimed without rendered verification.
- No real donation is to be attempted without explicit user authorization.
- No private beneficiary data or restricted media may be introduced into public fixtures.

## Factual and release locks
Read `docs/CURRENT_SOURCE_RECONCILIATION_2026-09-15.md` and `docs/canonical-factual-locks-2026-09-15.md`. Newborn ₹107,520; Winter 234 kits/234 beneficiaries with phase subsets; Taleem 25 combined. Canonical taxonomy contains exactly five categories. Main/production promotion remains gated.

## Do-not-touch without explicit need
- Current Amaana colour direction / premium visual language
- Canonical five-category taxonomy
- Private beneficiary evidence, media consent gates and retention controls
- Donation/payment/refund lifecycle except for focused verified defects
- Compliance claims still awaiting CA/legal/payment confirmation
