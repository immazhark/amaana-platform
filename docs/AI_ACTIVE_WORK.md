# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

## Active implementation owner
ChatGPT — continuing launch-hardening without parallel repo writers.

## Integration checkpoint
- Integration branch: `phase-public-site-rebuild`
- Current integration head: `16e34fc9cad3315d536608cddaa27628894e4183`
- PR #42 visual/media/banner consistency is merged and deployed successfully on Railway (`672089e4-386e-42f8-bf25-36c5a49e3f18`).
- PR #43 sitemap privacy hardening is merged after full green CI. Its Railway deployment `7e595cf3-5c71-4b7a-b4e5-6a4bcde65d62` must be confirmed SUCCESS before claiming deployed.

## Current task branch
- Branch: `fix/private-assistance-response-headers`
- Base: `16e34fc9cad3315d536608cddaa27628894e4183`
- Purpose: harden private assistance API responses against caching, referrer leakage and search/archive discovery.

## Current implementation
- Assistance submission responses now send `Cache-Control: no-store, private`, `Referrer-Policy: no-referrer`, and `X-Robots-Tag: noindex, nofollow, noarchive`.
- Private assistance status responses use the same privacy headers.
- The retired legacy query-token endpoint now also sends explicit robots/archive exclusion.
- Existing same-origin, token verification, rate limits and private-document behavior are unchanged.

## Next actions
1. Open PR and run full CI for this focused privacy hardening.
2. Merge only when all gates are green and verify Railway staging.
3. Continue with donation/assistance lifecycle acceptance, performance, editorial, SEO/schema, public-media storage/privacy, admin simulation and launch rehearsal.

## Current acceptance constraints
- Do not claim browser-level pixel verification without a browser-capable execution surface.
- Do not attempt a real donation without explicit user authorization.
- Do not introduce private beneficiary data or restricted media into public fixtures.

## Factual and release locks
Read `docs/CURRENT_SOURCE_RECONCILIATION_2026-09-15.md` and `docs/canonical-factual-locks-2026-09-15.md`. Newborn ₹107,520; Winter 234 kits/234 beneficiaries; Taleem 25 combined. Canonical taxonomy contains exactly five categories. Main/production promotion remains gated.

## Do-not-touch without explicit need
- Current Amaana colour direction / premium visual language
- Canonical five-category taxonomy
- Private beneficiary evidence, media consent gates and retention controls
- Donation/payment/refund lifecycle except for focused verified defects
- Compliance claims awaiting CA/legal/payment confirmation
