# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

## Active implementation owner
ChatGPT — continuing launch hardening with a single repository writer.

## Certified integration checkpoint
- Integration branch: `phase-public-site-rebuild`
- Certified integration SHA before the current launch-rehearsal branch: `6006b5eb917eded64598bf97e72983b9af67ce5c`
- PR #53 added mocked donation and assistance browser journeys without real payment or real beneficiary mutations.
- PR #54 added synthetic admin operational simulation and corrected the admin-sidebar contrast defect discovered by axe.
- PR #55 added conservative public-media review coverage and a fail-closed human-review readiness gate.
- Post-merge CI #625 / run `35050655143` passed the complete workflow, including all 74 Playwright browser checks, on `6006b5eb917eded64598bf97e72983b9af67ce5c`.
- Railway preview deployment `162f3690-936b-4fba-839e-c347bac927a9` is SUCCESS on the same exact SHA.

## Current task branch
- Branch: `hardening/launch-rehearsal-readiness`
- Base: `6006b5eb917eded64598bf97e72983b9af67ce5c`
- Goal: make rehearsal and production readiness evidence-based and fail closed without performing production cutover.

### Implemented on the current branch
- `docs/launch-readiness.json`: explicit technical, privacy, compliance, payment, recovery and cutover gates.
- `scripts/check-launch-readiness.mjs`: structural validation plus fail-closed `--rehearsal` and `--production` readiness decisions.
- `scripts/test-launch-readiness.mjs`: regression tests preventing unsupported statuses, duplicate gates or false VERIFIED states.
- `docs/LAUNCH_REHEARSAL_RUNBOOK.md`: staging rehearsal, backup evidence, rollback sequence, production cutover order and evidence-hygiene rules.
- Package commands: `launch:status`, `launch:rehearsal`, `launch:production`.
- Staging acceptance now requires `/api/health/ready` in addition to live health.
- CI validates the readiness register but intentionally does not require rehearsal/production gates to be green while real blockers remain.

## Current readiness state
### Rehearsal blockers
- Exact candidate staging runtime acceptance has not yet been recorded.
- Recoverable Neon/PostgreSQL backup/snapshot evidence has not yet been recorded.
- Staging rollback/redeploy rehearsal has not yet been executed and evidenced.

### Additional production blockers
- Manual rendered review including 200% zoom and human visual/accessibility judgement.
- Final editorial/CTA/terminology/amount-format and SEO/social/canonical/schema review.
- Human privacy/consent/provenance review of legacy directly addressable public media; automated register coverage is not approval.
- Dedicated `PUBLIC_MEDIA_*` upload/delivery configuration if admin public-media uploads are required operationally; current Railway variable names do not include those dedicated settings.
- CA confirmation of 12A/12AB status. Known 80G approval remains provisional Form 10AC dated 26-01-2026 for AY 2026–27 through AY 2028–29.
- Razorpay live/KYC readiness.
- Explicitly authorized controlled live donation test plus refund/acknowledgement/reconciliation operational verification.
- Cloudflare/DNS cutover and rollback plan.
- Deliberate production indexing decision after final SEO/privacy QA.
- Explicit approval before merging/promoting to `main` or performing production cutover.

## Durable acceptance already established
- Browser suite covers accessibility, responsive containment, keyboard/focus behavior, reduced motion, fixed-control overlap, public CSS delivery, mocked donation/assistance journeys and synthetic admin role/navigation behavior.
- Current browser matrix: 74 Chromium tests.
- Structural public-media validation includes full pixel decoding and path privacy boundaries.
- `docs/public-media-review-register.json` covers every current `public/media` path exactly once and deliberately leaves legacy assets pending human review unless evidence is recorded.
- Bundle ceilings remain unchanged; do not raise them to hide CSS or JS regressions.

## Acceptance constraints
- Automated browser/axe checks do not replace final manual visual/assistive-technology review.
- Do not initiate a real donation or external financial transaction without explicit authorization.
- Do not create real beneficiary requests/private evidence in browser fixtures or shared acceptance data.
- Do not infer consent from prior publication, filenames, cropping/blurring or provenance records.
- Do not mark external compliance/payment gates complete without evidence.
- Do not merge to `main`, change production DNS, enable production indexing or perform production cutover without explicit user approval.

## Factual and release locks
Read `docs/CURRENT_SOURCE_RECONCILIATION_2026-09-15.md` and `docs/canonical-factual-locks-2026-09-15.md` before content changes. Newborn medical aid = ₹107,520; Winter Drive = 234 kits / 234 beneficiaries; Taleem Nazira + Hifdh = 25 students combined as of September 2026; public taxonomy contains exactly five umbrella categories.

## Do-not-touch without explicit need
- Approved Amaana visual/brand direction.
- Canonical five-category taxonomy.
- Private beneficiary evidence, media-consent gates and retention controls.
- Donation/payment/refund lifecycle except focused verified defects or explicitly authorized acceptance.
- Compliance statements awaiting CA/legal/payment confirmation.
