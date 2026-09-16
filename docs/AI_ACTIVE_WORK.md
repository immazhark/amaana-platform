# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

## Active implementation owner
ChatGPT — continuing launch-hardening without parallel repository writers.

## Integration checkpoint
- Integration branch: `phase-public-site-rebuild`
- Verified integration head before the current PR: `edffc6a325d91a99b36f13405c30c17d458e8c0c`
- PR #51 `Add browser E2E and accessibility acceptance` is merged.
- Post-merge integration CI run `35043945986` / CI #601 passed the complete workflow, including Playwright + axe browser acceptance.
- Railway preview deployment `e5003cef-1046-4921-a9aa-c2e55fd362c7` is SUCCESS on exact integration SHA `edffc6a325d91a99b36f13405c30c17d458e8c0c`.

## Current task branch
- Branch: `perf/public-delivery-hardening`
- Base: `edffc6a325d91a99b36f13405c30c17d458e8c0c`
- PR: #52 `Reduce public CSS and image delivery overhead`
- Latest measured implementation head before this handoff update: `7d512321e89cec276c7f12d4ccd0f0a375d5e077`
- CI #606 / run `35045147690` passed the complete workflow on that implementation head.

## Latest completed implementation
The public-delivery hardening slice reduces unnecessary global CSS delivery without redesigning Amaana's approved visual system or changing production dependencies.

Measured results from CI #606:
- Root-global stylesheet layers reduced from 19 before this hardening pass to 17.
- Root-global source CSS is now 95,332 bytes.
- Homepage documentary and hero-media styling is route-scoped instead of being imported by the root layout.
- `/about` browser-delivered CSS fell from 103,560 bytes in the first route measurement to 100,784 bytes after the final scoping pass.
- Homepage browser-delivered CSS is 97,639 bytes across two stylesheets.
- Built static JavaScript remains 669,104 bytes against the unchanged 819,200-byte ceiling.
- Built static CSS is 277,284 bytes against the unchanged 278,528-byte ceiling, slightly below the pre-performance integration measurement.
- Responsive image `sizes` hints were tightened for homepage hero and documentary field images.
- CI now contains a root-CSS architecture guard and a real-browser route-CSS isolation test.
- The homepage joined the accessibility/responsive acceptance matrix.
- All 61 Chromium acceptance tests passed, including route CSS isolation, serious/critical axe checks, six viewport widths, keyboard navigation, mobile focus restoration, reduced motion and floating-control overlap.

No factual, taxonomy, payment, private-media, compliance, package-lock or production dependency changes were made in this slice.

## Next implementation scope after PR #52 integration
1. Add durable donation-journey browser acceptance without initiating any real payment or external financial transaction.
2. Add durable assistance-request journey acceptance using mocked/safe API boundaries so no real beneficiary request or private evidence is created in the shared environment.
3. Cover validation, consent/privacy messaging, expected success transitions, safe failure/cancellation behavior and status/acknowledgement routing where supported by the current product implementation.
4. Preserve all existing security, publication, payment and privacy boundaries; do not weaken server-side validation merely to simplify tests.
5. Keep the journey suite in the existing isolated Playwright CI workspace unless a production dependency is genuinely required.

## Remaining launch-hardening priorities
1. Complete real rendered UX/UI acceptance at 1440, 1024, 768, 430, 390 and 360px, plus 200% zoom and assistive-technology/manual visual review. Automated browser checks are durable but do not replace human rendered acceptance.
2. Continue performance hardening where measurement identifies meaningful client-delivery wins; avoid speculative churn.
3. Complete donation journey and assistance journey E2E/operational acceptance.
4. Complete editorial/CTA/terminology consistency and SEO/social/canonical/schema QA.
5. Complete human public-media privacy/consent/provenance review and protected-storage audit.
6. Complete admin operational simulation, external compliance/payment closures, launch rehearsal and production cutover.

## Current acceptance constraints
- Source/automation checks must not be described as pixel-level or assistive-technology browser verification.
- Do not attempt a real donation or financial transaction without explicit user authorization.
- Do not submit real beneficiary assistance data or introduce private beneficiary evidence into public/browser fixtures.
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
