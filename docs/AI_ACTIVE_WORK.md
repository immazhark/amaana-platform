# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

## Active implementation owner
ChatGPT — user-directed takeover after Codex limit exhaustion on 16 September 2026.

## Integration checkpoint
- Branch: `phase-public-site-rebuild`
- Latest merged checkpoint before this task: `6e2d5d6406ecb30b4257a9abf4c3c18560e23ab1` (PR #26).
- PR #23 responsive acceptance fixes are merged and Railway-verified.
- PR #24 stale legacy Cause reconciliation passed full CI, merged as `a8ec8b2c887bb7537c3999591d599a34ea319bed`, and Railway deployed successfully. The preview startup ran canonical reconciliation even though the content version was already current.
- PR #25 production/staging Razorpay mode guard passed full CI, merged as `32695d0b19a3730b86366a8382e9ed41f251e0df`, and Railway deployed successfully.
- PR #26 sitemap legacy-initiative exclusion passed full CI and merged as `6e2d5d6406ecb30b4257a9abf4c3c18560e23ab1`; Railway verification follows the normal deployment queue.

## What Codex completed before exhaustion
- Rendered responsive acceptance sweep across 21 priority public routes at 1440, 1024, 768, 430, 390 and 360px (126 combinations).
- Fixed Islamic companion launcher overlap, desktop/tablet navigation crowding, mobile-menu scrolling and 44px mobile reminder/touch targets.
- Added shared layout regression tests and `docs/RESPONSIVE_ACCEPTANCE_2026-09-16.md`.

## ChatGPT work after takeover
- Resolved the six-cause `/our-work` runtime discrepancy at its write-side root: known legacy Cause relations are now reconciled and obsolete Cause rows archived on every preview master-content run, even when the master version marker is already current.
- Verified the reconciliation deploy reached Railway successfully and canonical content startup completed without pending migrations.
- Hardened payment environment safety so staging requires Razorpay test mode while production requires Razorpay live mode. This is a technical fail-closed guard only; it does not assert KYC/live-account launch readiness.
- Removed known redirected legacy initiative URLs from sitemap generation.
- Audited homepage fundraising and found a separate donor-journey mismatch: the `Current verified appeals` section could include FUNDED records. A focused fix is now in PR #27.

## Current task
Ensure the homepage shows only appeals that are actively eligible for fundraising: PUBLISHED, below target and within any configured fundraising window. Completed/funded appeals remain public accountability records but must not appear as current fundraising.

## Task branch / PR
- Branch: `fix/homepage-active-appeals-only`
- PR: #27
- Head before this documentation refresh: `ace20099f9bde3ccd0abd5e4596bb59765a518c5`

## Next actions
1. Complete PR #27 full CI and merge only when green.
2. Verify Railway deployment.
3. Continue generated launch-QA/user-journey acceptance in this order: privacy-sensitive route behavior, dead links/redirects/canonical surfaces, accessibility/keyboard/form behavior, faith-review safeguards, admin/security boundaries, then soft-launch readiness.
4. Keep payment/compliance claims conservative until external confirmations exist for Razorpay KYC/live credentials, receipt operations, refund process, 12A/12AB, Zakat handling and unrestricted giving.

## Factual and release locks
Read `docs/CURRENT_SOURCE_RECONCILIATION_2026-09-15.md` and `docs/canonical-factual-locks-2026-09-15.md`. Newborn ₹107,520; Winter 234 kits/234 beneficiaries with phase subsets; Taleem 25 combined. Canonical taxonomy contains exactly five categories. Main/production promotion remains gated.

## Do-not-touch without explicit need
- Current Amaana colour direction / premium visual language
- Canonical five-category taxonomy
- Private beneficiary evidence, media consent gates and retention controls
- Donation/payment/refund lifecycle except for focused verified defects
- Compliance claims still awaiting CA/legal/payment confirmation
