# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

## Active implementation owner
ChatGPT — continuing launch-hardening without parallel repository writers.

## Integration checkpoint
- Integration branch: `phase-public-site-rebuild`
- Verified integration head: `edffc6a325d91a99b36f13405c30c17d458e8c0c`
- PR #51 `Add browser E2E and accessibility acceptance` is merged.
- Post-merge integration CI run `35043945986` / CI #601 passed the complete workflow, including Playwright + axe browser acceptance.
- Railway preview deployment `e5003cef-1046-4921-a9aa-c2e55fd362c7` is SUCCESS on exact integration SHA `edffc6a325d91a99b36f13405c30c17d458e8c0c`.

## Current task branch
- Branch: `perf/public-delivery-hardening`
- Base: `edffc6a325d91a99b36f13405c30c17d458e8c0c`
- Purpose: continue launch performance hardening by reducing unnecessary root-global CSS delivery, measuring route CSS payloads, and improving responsive image delivery without redesigning the approved visual system.

## Latest completed implementation
PR #51 added durable browser-level responsive/accessibility acceptance using Playwright + axe without changing production runtime dependencies. The suite covers representative public page families, WCAG A/AA serious/critical axe checks, six viewport widths (1440, 1024, 768, 430, 390 and 360px), horizontal-overflow guards, desktop keyboard order, mobile navigation focus/Escape restoration, reduced motion and floating companion/Back-to-Top overlap.

The browser gate also drove real accessibility fixes before merge: shared PageHero ARIA misuse was removed, sponsorship small-text contrast was corrected, navigation semantics were tightened, and all 53 browser checks passed in the final PR run. Post-merge CI and Railway are healthy on the exact merge SHA.

## Current implementation scope
1. Measure and reduce root-global stylesheet delivery, starting with layers identified in `docs/POST_PR41_LAUNCH_AUDIT_2026-09-16.md`.
2. Move route-specific visual CSS out of the root layout where safe, beginning with homepage-only media polish.
3. Add a deterministic browser/build regression check for CSS delivered by representative routes so future iterations cannot silently re-globalize route-only styles.
4. Tighten responsive `sizes` hints for high-traffic local media surfaces so Next.js selects more appropriate image widths.
5. Preserve existing visual hierarchy, accessibility behavior, factual locks and current bundle ceilings; do not raise budgets to hide regressions.

## Remaining launch-hardening priorities
1. Complete real rendered UX/UI acceptance at 1440, 1024, 768, 430, 390 and 360px, plus 200% zoom and assistive-technology/manual visual review. Automated browser checks are now durable but do not replace human rendered acceptance.
2. Continue performance hardening, especially measured CSS consolidation and image/client-delivery optimization without redesigning the approved visual system.
3. Complete donation journey and assistance journey E2E/operational acceptance.
4. Complete editorial/CTA/terminology consistency and SEO/social/canonical/schema QA.
5. Complete human public-media privacy/consent/provenance review and protected-storage audit.
6. Complete admin operational simulation, external compliance/payment closures, launch rehearsal and production cutover.

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
