# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

## Active implementation owner
ChatGPT — continuing the user-directed launch-hardening and visual-consistency pass after PR #41.

## Integration checkpoint
- Integration branch: `phase-public-site-rebuild`
- Current integration head: `1540c8dfa08c57e2fa6d986b9ff0b6c54680224b`
- PR #41 (`Reconcile public work and standardize cross-site UI`) is merged.
- Railway staging deployment for that commit is confirmed SUCCESS: deployment `129b1ee9-355c-4004-986a-bed821d769eb`.

## Current task branch
- Branch: `audit/post-pr41-launch-hardening`
- Base: `1540c8dfa08c57e2fa6d986b9ff0b6c54680224b`
- Purpose: complete the user-requested site-wide visual consistency pass before moving to Lighthouse/performance work.

## Current user-directed visual rules
- Wherever a cause, drive, initiative or work item appears in a list/grid/card/row, it must have a predictable thumbnail slot.
- Real approved Amaana media is preferred. If none is available, use a neutral branded placeholder; do not invent beneficiary imagery.
- Specific cause/drive/programme/appeal detail pages use a large left-copy/right-visual hero pattern. Empty visual columns are not allowed.
- Public interior top banners use one desktop/tablet height system. Longer copy must adapt through constrained typography/copy length rather than changing banner geometry or overflowing its container.
- Mobile banners become content-led so text and controls never clip.
- No text, button, image or grid child may render outside its container; no text/button or image/text overlaps.
- Back-to-top is icon-only visually, with an accessible name retained for assistive technology.

## Implemented on the current branch
- Added reusable `WorkVisualPlaceholder`.
- Added visual slots to homepage work rows, Our Work/Impact listings, programme-category grids, appeal cards, completed appeal outcomes and story cards.
- Initiative and programme detail heroes now always render a right-side approved image or branded placeholder.
- Appeal detail hero now uses the same left-copy/right-visual pattern; funding progress follows immediately below in a contained decision panel.
- Programme detail hero copy is concise; the full programme story is moved below the hero so banner geometry remains stable.
- Contact page now uses the shared interior hero system.
- Added `launch-hardening.css` for work thumbnails, hero media geometry, containment and the icon-only back-to-top treatment.
- Added temporary `banner-consistency.css` as the final QA override layer for identical desktop/tablet banner geometry across generic, Impact, Stories, Faith, campaign, appeals, assistance and Taleem hero families. This file should be consolidated after rendered acceptance rather than left as another permanent CSS layer.
- Added strict max-width/min-width/overflow-wrap protections for common content and action groups.

## Next actions for this pass
1. Run PR CI and repair type/lint/build/bundle/regression failures.
2. Inspect the PR diff for selector/markup regressions, especially responsive Impact/Appeal grids.
3. Merge only when all gates are green.
4. Verify Railway staging deployment for the merged commit.
5. User reviews the deployed visual system and assigns preferred real images per cause/drive/page.
6. Continue the remaining launch-hardening queue after user visual review.

## Remaining launch-hardening queue after this visual pass
1. Lighthouse/performance remediation: consolidate legacy/global CSS, optimize image delivery, hydration/network work and caching.
2. Add durable browser E2E + accessibility coverage.
3. Donation journey E2E and production-gateway readiness checks.
4. Assistance journey E2E including upload/status/admin lifecycle.
5. Full public editorial/grammar/CTA consistency pass.
6. Final SEO/social-sharing/canonical/schema audit.
7. Public-media storage/privacy audit: only intentionally public-safe assets may remain directly addressable under `/public`.
8. Admin operational simulation from intake through closure/retention.
9. External compliance/business closures and production launch rehearsal.

## Current acceptance constraints
- Browser-level pixel/geometry inspection requires an actual browser-capable execution surface. Source/static checks and Railway/API acceptance can continue here; any browser-only visual assertions must not be claimed without rendered verification.
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
